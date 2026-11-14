/* Stargazing Hyderabad: sky calculations and page behaviour.
   Sun and Moon positions use the low-precision formulas popularised by
   SunCalc (V. Agafonkin, BSD-2) and Meeus, accurate to a few minutes,
   which is plenty for planning a night out. */
(() => {
  'use strict';

  const LAT = 17.385, LNG = 78.4867;          // central Hyderabad
  const TZ = 'Asia/Kolkata', IST_MS = 330 * 60000;
  const HOUR = 3600000, DAY = 86400000;

  /* ---------- astronomy ---------- */
  const { PI, sin, cos, tan, asin, acos, atan2 } = Math;
  const rad = PI / 180, J1970 = 2440588, J2000 = 2451545, OBL = rad * 23.4397;

  const toDays = (date) => date.valueOf() / DAY - 0.5 + J1970 - J2000;
  const fromJulian = (j) => new Date((j + 0.5 - J1970) * DAY);
  const rightAscension = (l, b) => atan2(sin(l) * cos(OBL) - tan(b) * sin(OBL), cos(l));
  const declination = (l, b) => asin(sin(b) * cos(OBL) + cos(b) * sin(OBL) * sin(l));
  const siderealTime = (d, lw) => rad * (280.16 + 360.9856235 * d) - lw;
  const solarMeanAnomaly = (d) => rad * (357.5291 + 0.98560028 * d);
  const eclipticLongitude = (M) =>
    M + rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)) + rad * 102.9372 + PI;

  function sunCoords(d) {
    const L = eclipticLongitude(solarMeanAnomaly(d));
    return { dec: declination(L, 0), ra: rightAscension(L, 0) };
  }

  // Times when the Sun crosses the given altitudes (degrees) around the
  // solar noon nearest to `date`.
  const J0 = 0.0009;
  function sunTimes(date, angles) {
    const lw = rad * -LNG, phi = rad * LAT;
    const n = Math.round(toDays(date) - J0 - lw / (2 * PI));
    const ds = J0 + lw / (2 * PI) + n;
    const M = solarMeanAnomaly(ds), L = eclipticLongitude(M), dec = declination(L, 0);
    const transit = (x) => J2000 + x + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
    const noon = transit(ds);
    const out = {};
    for (const [name, h] of Object.entries(angles)) {
      const w = acos((sin(h * rad) - sin(phi) * sin(dec)) / (cos(phi) * cos(dec)));
      const set = transit(J0 + (w + lw) / (2 * PI) + n);
      out[name] = { rise: fromJulian(noon - (set - noon)), set: fromJulian(set) };
    }
    return out;
  }

  function moonCoords(d) {
    const L = rad * (218.316 + 13.176396 * d);
    const M = rad * (134.963 + 13.064993 * d);
    const F = rad * (93.272 + 13.22935 * d);
    const l = L + rad * 6.289 * sin(M);
    const b = rad * 5.128 * sin(F);
    return { ra: rightAscension(l, b), dec: declination(l, b), dist: 385001 - 20905 * cos(M) };
  }

  // Geocentric altitude of the Moon in degrees. The Moon counts as "up"
  // above +0.125°, which allows for parallax, refraction and its size.
  function moonAltitude(date) {
    const lw = rad * -LNG, phi = rad * LAT, d = toDays(date), c = moonCoords(d);
    const H = siderealTime(d, lw) - c.ra;
    return asin(sin(phi) * sin(c.dec) + cos(phi) * cos(c.dec) * cos(H)) / rad;
  }
  const MOON_UP = 0.125;

  // fraction: 0 (new) .. 1 (full); phase: 0 new, .25 first quarter, .5 full, .75 last quarter
  function moonIllumination(date) {
    const d = toDays(date), s = sunCoords(d), m = moonCoords(d), sdist = 149598000;
    const phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra));
    const inc = atan2(sdist * sin(phi), m.dist - sdist * cos(phi));
    const angle = atan2(cos(s.dec) * sin(s.ra - m.ra),
      sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
    return { fraction: (1 + cos(inc)) / 2, phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / PI };
  }

  /* ---------- IST date helpers ---------- */
  function istParts(t) {
    const s = new Date(t + IST_MS);
    return { y: s.getUTCFullYear(), m: s.getUTCMonth(), d: s.getUTCDate(), h: s.getUTCHours(), dow: s.getUTCDay() };
  }
  const istNoon = (y, m, d) => new Date(Date.UTC(y, m, d, 12) - IST_MS);

  // Everything about the night that starts on the evening of y-m-d (IST).
  function night(y, m, d) {
    const t1 = sunTimes(istNoon(y, m, d), { sun: -0.833, astro: -18 });
    const t2 = sunTimes(istNoon(y, m, d + 1), { astro: -18 });
    const sunset = t1.sun.set, dusk = t1.astro.set, dawn = t2.astro.rise;
    const start = dusk.getTime(), end = dawn.getTime();
    const illum = moonIllumination(new Date((start + end) / 2));

    let windows = [];
    if (illum.fraction < 0.05) {
      windows.push({ start, end });               // a hairline crescent doesn't matter
    } else {
      const step = 5 * 60000;
      let cur = null;
      for (let t = start; ; t += step) {
        const tt = Math.min(t, end);
        const dark = moonAltitude(new Date(tt)) <= MOON_UP;
        if (dark) { if (!cur) cur = { start: tt, end: tt }; cur.end = tt; }
        else if (cur) { windows.push(cur); cur = null; }
        if (tt >= end) break;
      }
      if (cur) windows.push(cur);
      windows = windows.filter((w) => w.end - w.start >= 15 * 60000);
    }
    const darkMs = windows.reduce((s, w) => s + (w.end - w.start), 0);
    return { sunset, dusk, dawn, illum, windows, darkMs, nightMs: end - start };
  }

  function nextNewMoons(from, count) {
    const found = [];
    const step = 6 * HOUR;
    let prev = moonIllumination(new Date(from)).phase;
    for (let t = from + step; found.length < count && t < from + 400 * DAY; t += step) {
      const ph = moonIllumination(new Date(t)).phase;
      if (prev > 0.8 && ph < 0.2) {
        let a = t - step, b = t;
        for (let i = 0; i < 20; i++) {
          const mid = (a + b) / 2;
          if (moonIllumination(new Date(mid)).phase > 0.5) a = mid; else b = mid;
        }
        found.push((a + b) / 2);
      }
      prev = ph;
    }
    return found;
  }

  /* ---------- formatting ---------- */
  const fmtTime = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ });
  const fmtDay = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });
  const fmtMonth = new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'UTC' });
  const time = (t) => fmtTime.format(t);
  function dur(ms) {
    const mins = Math.round(ms / 60000 / 5) * 5;
    const h = Math.floor(mins / 60), m = mins % 60;
    if (!h) return `${m} min`;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  const pct = (f) => `${Math.round(f * 100)}%`;
  const $ = (id) => document.getElementById(id);

  function phaseName(p) {
    if (p < 0.03 || p > 0.97) return 'New moon';
    if (p < 0.22) return 'Waxing crescent';
    if (p < 0.28) return 'First quarter';
    if (p < 0.47) return 'Waxing gibbous';
    if (p < 0.53) return 'Full moon';
    if (p < 0.72) return 'Waning gibbous';
    if (p < 0.78) return 'Last quarter';
    return 'Waning crescent';
  }

  function moonSVG(fraction, phase, label) {
    const waxing = phase < 0.5;
    const rx = (45 * Math.abs(1 - 2 * fraction)).toFixed(2);
    const limb = waxing ? 1 : 0;
    const term = fraction < 0.5 ? (waxing ? 0 : 1) : (waxing ? 1 : 0);
    let lit = '';
    if (fraction > 0.995) lit = '<circle class="moon-lit" cx="50" cy="50" r="45"/>';
    else if (fraction > 0.005) lit = `<path class="moon-lit" d="M50 5A45 45 0 0 ${limb} 50 95A${rx} 45 0 0 ${term} 50 5Z"/>`;
    return `<svg viewBox="0 0 100 100" role="img" aria-label="${label}"><circle class="moon-dark" cx="50" cy="50" r="45"/>${lit}</svg>`;
  }

  function rating(n) {
    if (n.darkMs >= n.nightMs - 10 * 60000) return { cls: 'good', label: 'Excellent' };
    if (n.darkMs >= 4 * HOUR) return { cls: 'good', label: 'Good' };
    if (n.darkMs >= 1.5 * HOUR) return { cls: 'fair', label: 'Fair' };
    return { cls: 'poor', label: 'Moonlit' };
  }

  function windowPhrase(n) {
    const near = (a, b) => Math.abs(a - b) < 10 * 60000;
    const w = n.windows.reduce((best, x) => (!best || x.end - x.start > best.end - best.start ? x : best), null);
    if (!w) return '';
    const fromDusk = near(w.start, n.dusk.getTime()), toDawn = near(w.end, n.dawn.getTime());
    if (fromDusk && toDawn) return 'No moonlight from nightfall to dawn. If it’s clear, go.';
    if (fromDusk) return `Dark from nightfall until the Moon rises around <strong>${time(w.end)}</strong>.`;
    if (toDawn) return `The Moon sets around <strong>${time(w.start)}</strong>. Dark from then until dawn.`;
    return `Dark between <strong>${time(w.start)}</strong> and <strong>${time(w.end)}</strong>.`;
  }

  /* ---------- render: tonight ---------- */
  function renderTonight(now) {
    const p = istParts(now);
    const n = night(p.y, p.m, p.h < 6 ? p.d - 1 : p.d);
    const { fraction, phase } = n.illum;

    $('moonArt').innerHTML = moonSVG(fraction, phase, `Moon ${pct(fraction)} lit`);
    $('moonPct').textContent = `${pct(fraction)} lit`;
    $('moonName').textContent = phaseName(phase);
    $('sunset').textContent = time(n.sunset);
    $('sunsetSub').textContent = `Fully dark ${dur(n.dusk - n.sunset)} later`;
    $('dusk').textContent = time(n.dusk);
    $('dawn').textContent = `Until dawn twilight starts at ${time(n.dawn)}`;

    if (n.windows.length) {
      $('darkHours').textContent = dur(n.darkMs);
      $('darkWindow').textContent = n.windows.map((w) => `${time(w.start)} – ${time(w.end)}`).join(' and ');
    } else {
      $('darkHours').textContent = 'None';
      $('darkWindow').textContent = 'The Moon is up all night';
    }

    const r = rating(n);
    const phrase = n.windows.length
      ? windowPhrase(n)
      : `The Moon is up all night (${pct(fraction)} lit). Great for the Moon and planets, not for faint stars or the Milky Way.`;
    $('verdict').innerHTML = `<span class="badge ${r.cls}">${r.label}</span>${phrase}`;
  }

  /* ---------- render: dark weekends ---------- */
  function renderNewMoons(now) {
    const list = $('newMoons');
    list.innerHTML = '';
    for (const nm of nextNewMoons(now, 3)) {
      const p = istParts(nm);
      const fwd = (6 - p.dow + 7) % 7;
      const shift = fwd <= 3 ? fwd : fwd - 7;           // nearest Saturday
      const n = night(p.y, p.m, p.d + shift);
      const li = document.createElement('li');
      li.innerHTML = `<span class="nm-sat">${fmtDay.format(istNoon(p.y, p.m, p.d + shift))}</span>` +
        `<span class="nm-date">New moon ${fmtDay.format(nm)} · ${dur(n.darkMs)} moon-free</span>`;
      list.appendChild(li);
    }
  }

  /* ---------- render: meteor showers ---------- */
  // Typical peak nights (the evening the peak night begins).
  const SHOWERS = [
    { name: 'Quadrantids', m: 0, d: 3, rate: 110, note: 'Short, sharp peak. Best in the hours before dawn.' },
    { name: 'Lyrids', m: 3, d: 22, rate: 18, note: 'Modest, with the odd bright fireball. Best before dawn.' },
    { name: 'Eta Aquariids', m: 4, d: 5, rate: 50, note: 'Debris from Halley’s Comet. Favours tropical skies like ours. Before dawn.' },
    { name: 'Perseids', m: 7, d: 12, rate: 100, note: 'Rich, but it falls in the monsoon. Clouds are the usual problem.' },
    { name: 'Orionids', m: 9, d: 21, rate: 20, note: 'Also from Halley’s Comet. Fast meteors after midnight.' },
    { name: 'Leonids', m: 10, d: 17, rate: 15, note: 'Very fast meteors. Best after midnight.' },
    { name: 'Geminids', m: 11, d: 13, rate: 150, note: 'The best shower of the year, in clear winter skies. Good from about 10 pm.' },
  ];

  function renderShowers(now) {
    const items = SHOWERS.map((s) => {
      const thisYear = istParts(now).y;
      let y = thisYear;
      // peak moment taken as 02:00 IST on the morning after the night begins
      let peak = Date.UTC(y, s.m, s.d + 1, 2) - IST_MS;
      if (peak < now - 12 * HOUR) { y += 1; peak = Date.UTC(y, s.m, s.d + 1, 2) - IST_MS; }
      return { ...s, y, peak, n: night(y, s.m, s.d) };
    }).sort((a, b) => a.peak - b.peak);

    const list = $('showers');
    list.innerHTML = '';
    items.forEach((s, i) => {
      const { fraction, phase } = s.n.illum;
      const mon = fmtMonth.format(Date.UTC(s.y, s.m, 1));
      const h = s.n.darkMs / HOUR;
      const cls = h >= 5 ? 'good' : h >= 2 ? 'fair' : 'poor';
      const moonWord = h >= 5 ? 'Little moonlight' : h >= 2 ? 'Some moonlight' : 'Bright Moon most of the night';
      const li = document.createElement('li');
      li.className = 'shower' + (i === 0 ? ' is-next' : '');
      li.innerHTML =
        `<div class="shower-moon">${moonSVG(fraction, phase, `Moon ${pct(fraction)} lit`)}</div>` +
        `<div><p class="shower-name">${s.name}${i === 0 ? '<span class="next-tag">Next</span>' : ''}</p>` +
        `<p class="shower-note">${s.note}</p></div>` +
        `<p class="shower-when">Night of ${s.d}–${s.d + 1} ${mon} ${s.y}<small>Up to ~${s.rate} an hour</small></p>` +
        `<p class="shower-moon-text"><span class="${cls}">${moonWord}</span>` +
        `<small>Moon ${pct(fraction)} lit · ${dur(s.n.darkMs)} moon-free</small></p>`;
      list.appendChild(li);
    });
  }

  /* ---------- starfield ---------- */
  function starfield(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { recolor() {} };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let stars = [], meteor = null, nextMeteor = 3000, w = 0, h = 0, rgb = '255,255,255', raf = 0, visible = true;

    function readColor() {
      rgb = getComputedStyle(document.documentElement).getPropertyValue('--star').trim() || '255,255,255';
    }
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 2400);
      stars = Array.from({ length: count }, () => {
        const big = Math.random() < 0.07;
        return {
          x: Math.random() * w,
          y: Math.random() * h * 1.05,
          r: big ? 1.1 + Math.random() * 0.9 : 0.3 + Math.random() * 0.7,
          a: 0.3 + Math.random() * 0.7,
          ph: Math.random() * PI * 2,
          sp: 0.5 + Math.random() * 1.5,
        };
      });
      draw(performance.now());
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      const still = reduce.matches;
      for (const s of stars) {
        const fade = 1 - Math.max(0, (s.y / h) - 0.55) * 1.6;     // stars fade into the city glow
        const tw = still ? 1 : 0.7 + 0.3 * sin(s.ph + (t / 1000) * s.sp);
        const a = s.a * tw * Math.max(fade, 0.08);
        ctx.fillStyle = `rgba(${rgb},${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, PI * 2); ctx.fill();
      }
      if (meteor && !still) {
        const k = (t - meteor.t0) / meteor.dur;
        if (k >= 1) meteor = null;
        else {
          const x = meteor.x + meteor.dx * k, y = meteor.y + meteor.dy * k;
          const g = ctx.createLinearGradient(x, y, x - meteor.dx * 0.25, y - meteor.dy * 0.25);
          g.addColorStop(0, `rgba(${rgb},${(0.9 * sin(PI * k)).toFixed(3)})`);
          g.addColorStop(1, `rgba(${rgb},0)`);
          ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - meteor.dx * 0.25, y - meteor.dy * 0.25); ctx.stroke();
        }
      }
    }
    function loop(t) {
      if (!meteor && t > nextMeteor) {
        const len = 180 + Math.random() * 220;
        const ang = (20 + Math.random() * 25) * rad;
        meteor = { x: Math.random() * w * 0.8 + w * 0.1, y: Math.random() * h * 0.35, dx: cos(ang) * len * (Math.random() < 0.5 ? -1 : 1), dy: sin(ang) * len, t0: t, dur: 700 + Math.random() * 500 };
        nextMeteor = t + 5000 + Math.random() * 9000;
      }
      draw(t);
      raf = requestAnimationFrame(loop);
    }
    function sync() {
      cancelAnimationFrame(raf);
      if (visible && !reduce.matches && !document.hidden) raf = requestAnimationFrame(loop);
      else draw(performance.now());
    }

    readColor();
    resize();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(canvas);
    }
    document.addEventListener('visibilitychange', sync);
    if (reduce.addEventListener) reduce.addEventListener('change', sync);
    sync();
    return { recolor() { readColor(); draw(performance.now()); } };
  }

  /* ---------- red-light mode ---------- */
  function setupRedToggle(sky) {
    const btn = $('redToggle');
    const meta = document.querySelector('meta[name="theme-color"]');
    const apply = (on) => {
      if (on) document.documentElement.dataset.mode = 'red';
      else delete document.documentElement.dataset.mode;
      btn.setAttribute('aria-pressed', String(on));
      if (meta) meta.setAttribute('content', on ? '#000000' : '#070a14');
      sky.recolor();
    };
    apply(document.documentElement.dataset.mode === 'red');
    btn.addEventListener('click', () => {
      const on = document.documentElement.dataset.mode !== 'red';
      apply(on);
      try { localStorage.setItem('sgh-red', on ? '1' : '0'); } catch (e) { /* storage unavailable */ }
    });
  }

  /* ---------- boot ---------- */
  function renderAll() {
    const now = Date.now();
    try { renderTonight(now); } catch (e) { $('verdict').textContent = 'Couldn’t calculate tonight’s sky in this browser.'; }
    try { renderNewMoons(now); } catch (e) { /* leave empty */ }
    try { renderShowers(now); } catch (e) { /* leave empty */ }
  }

  $('year').textContent = String(istParts(Date.now()).y);
  const sky = starfield($('sky'));
  setupRedToggle(sky);
  renderAll();
  setInterval(renderAll, 10 * 60000);                // keep "tonight" fresh if the tab stays open
})();
