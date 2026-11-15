// @ts-nocheck
/* ---- Sky engine: page-wide stars with depth, shooting stars, touch constellations, real Orion / Taurus / Pleiades ---- */
(() => {
  const c = document.getElementById("sky"), ctx = c.getContext("2d");
  const hero = document.querySelector(".hero");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;
  let w = 0, h = 0, pointer = null, meteors = [], nextMeteor = performance.now() + 1200;

  // Background stars, stored in 0..1 screen units so resizes don't reshuffle them
  const field = Array.from({ length: Math.min(900, Math.round(innerWidth * innerHeight / 1700)) }, () => {
    let nx = Math.random(), ny = Math.random();
    if (Math.random() < 0.4) { const t = Math.random(); nx = t; ny = 0.85 - 0.7 * t + (Math.random() - 0.5) * 0.28; }
    return { nx, ny, z: 0.04 + Math.random() ** 2 * 0.3, r: Math.random() ** 3 * 1.6 + 0.25,
             a: Math.random() * 0.7 + 0.3, tw: Math.random() * TAU, sp: Math.random() * 0.02 + 0.004, x: 0, y: 0 };
  });

  // Real stars: right ascension (hours), declination (degrees), magnitude
  const REAL = [
    { n: "Betelgeuse", ra: 5.919, dec: 7.41, mag: 0.5, col: "#ffb98f", label: "Betelgeuse · Ardra", left: true },
    { n: "Rigel", ra: 5.242, dec: -8.20, mag: 0.1, col: "#cfe0ff", label: "Rigel" },
    { n: "Bellatrix", ra: 5.419, dec: 6.35, mag: 1.6 },
    { n: "Saiph", ra: 5.796, dec: -9.67, mag: 2.1 },
    { n: "Alnitak", ra: 5.679, dec: -1.94, mag: 1.8 },
    { n: "Alnilam", ra: 5.604, dec: -1.20, mag: 1.7 },
    { n: "Mintaka", ra: 5.533, dec: -0.30, mag: 2.2 },
    { n: "Meissa", ra: 5.585, dec: 9.93, mag: 3.4, label: "Mrigashira" },
    { n: "Aldebaran", ra: 4.599, dec: 16.51, mag: 0.9, col: "#ffc99c", label: "Aldebaran · Rohini" },
    { n: "Alcyone", ra: 3.791, dec: 24.11, mag: 2.9, label: "Pleiades · Krittika", left: true },
    { n: "Atlas", ra: 3.819, dec: 24.05, mag: 3.6 },
    { n: "Electra", ra: 3.747, dec: 24.11, mag: 3.7 },
    { n: "Maia", ra: 3.763, dec: 24.37, mag: 3.9 },
    { n: "Merope", ra: 3.772, dec: 23.95, mag: 4.2 },
    { n: "Taygeta", ra: 3.754, dec: 24.47, mag: 4.3 },
    { n: "Pleione", ra: 3.819, dec: 24.14, mag: 5.0 }
  ];
  const S = Object.fromEntries(REAL.map(s => [s.n, s]));
  const LINES = [["Meissa","Betelgeuse"],["Meissa","Bellatrix"],["Betelgeuse","Alnitak"],["Bellatrix","Mintaka"],
                 ["Mintaka","Alnilam"],["Alnilam","Alnitak"],["Alnitak","Saiph"],["Mintaka","Rigel"]];
  const COS0 = Math.cos(7.5 * Math.PI / 180);
  // Facing south: east is on the left, so higher RA goes left
  const project = s => [-(s.ra - 4.75) * 15 * COS0, -(s.dec - 7.5)];

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(t) {
    const sy = scrollY, heroH = hero.offsetHeight, heroTop = hero.offsetTop;
    const fade = 1 - Math.min(1, sy / heroH) * 0.55;   // full sky in the hero, dimmer behind content
    const par = still ? 0 : 1;
    ctx.clearRect(0, 0, w, h);

    // Milky Way glow
    ctx.save(); ctx.globalAlpha = fade;
    ctx.translate(w / 2, h / 2 - sy * 0.05 * par); ctx.rotate(-Math.atan2(h * 0.7, w));
    ctx.fillStyle = "rgba(160,170,235,0.05)"; ctx.fillRect(-w * 1.5, -h * 0.12, w * 3, h * 0.24);
    ctx.fillStyle = "rgba(160,170,235,0.04)"; ctx.fillRect(-w * 1.5, -h * 0.05, w * 3, h * 0.1);
    ctx.restore();

    // Field stars: each drifts at its own depth when scrolling
    for (const s of field) {
      if (!still) s.tw += s.sp;
      s.x = s.nx * w;
      s.y = (((s.ny * h - sy * s.z * par) % h) + h) % h;
      ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(s.tw)) * fade;
      ctx.fillStyle = s.r > 1.2 ? "#fff3e0" : "#dfe8ff";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    }

    // Real constellations in the hero
    const wide = w >= 900;
    const scale = Math.min((wide ? w * 0.27 : w * 0.8) / 33, heroH * 0.75 / 34);
    const cx = (wide ? w * 0.79 : w * 0.5) + 1.2 * scale;
    const cy = heroTop + heroH * 0.5 - sy * (still ? 1 : 0.7);
    const cA = (wide ? 1 : 0.38) * fade;
    let showReal = cy + 20 * scale > 0 && cy - 20 * scale < h;
    if (showReal) {
      for (const s of REAL) { const [x, y] = project(s); s.x = cx + x * scale; s.y = cy + y * scale; }
      ctx.globalAlpha = 0.45 * cA; ctx.strokeStyle = "#ef5b4c"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (const [a, b] of LINES) { ctx.moveTo(S[a].x, S[a].y); ctx.lineTo(S[b].x, S[b].y); }
      ctx.stroke();
      for (const s of REAL) {
        const r = Math.max(0.9, 3.4 - s.mag * 0.6);
        ctx.globalAlpha = cA * (still ? 1 : 0.82 + 0.18 * Math.sin(t / 650 + s.ra * 11));
        ctx.fillStyle = s.col || "#eef3ff";
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = r * 4;
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, TAU); ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = "#98a3c3"; ctx.globalAlpha = 0.9 * cA;
      if (wide) for (const s of REAL) if (s.label) {
        ctx.textAlign = s.left ? "right" : "left";
        ctx.fillText(s.label, s.x + (s.left ? -10 : 10), s.y + 4);
      }
      ctx.textAlign = "left"; ctx.fillStyle = "#ef5b4c"; ctx.globalAlpha = 0.75 * cA;
      if (wide) ctx.fillText("ORION", S.Alnilam.x + 16, S.Alnilam.y + 22);
    }

    // Touch / mouse: join nearby stars into a constellation
    if (pointer) {
      const pa = pointer.touch ? Math.min(1, Math.max(0, 1 - (t - pointer.t - 700) / 700)) : 1;
      if (pa <= 0 && !still) pointer = null;
      else {
        const R = 160, L = 95, near = [];
        const consider = s => { const d = Math.hypot(s.x - pointer.x, s.y - pointer.y); if (d < R) near.push([s, d]); };
        field.forEach(consider);
        if (showReal) REAL.forEach(consider);
        ctx.strokeStyle = "#cfe0ff"; ctx.lineWidth = 0.8;
        for (let i = 0; i < near.length; i++) for (let j = i + 1; j < near.length; j++) {
          const [a, da] = near[i], [b, db] = near[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < L) {
            ctx.globalAlpha = (1 - d / L) * (1 - Math.max(da, db) / R) * 0.75 * pa;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
    }

    // Shooting stars
    if (!still) {
      if (t > nextMeteor) {
        const ang = Math.PI * (0.76 + Math.random() * 0.12), v = 9 + Math.random() * 6;
        meteors.push({ x: w * (0.3 + Math.random() * 0.8), y: h * Math.random() * 0.45, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
                       life: 0, max: 40 + Math.random() * 30, len: 110 + Math.random() * 130 });
        nextMeteor = t + 2500 + Math.random() * 5000;
      }
      meteors = meteors.filter(m => m.life < m.max);
      ctx.lineCap = "round";
      for (const m of meteors) {
        m.x += m.vx; m.y += m.vy; m.life++;
        const sp = Math.hypot(m.vx, m.vy), tx = m.x - m.vx / sp * m.len, ty = m.y - m.vy / sp * m.len;
        const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
        g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(0.15, "rgba(207,224,255,0.5)"); g.addColorStop(1, "rgba(207,224,255,0)");
        ctx.globalAlpha = Math.sin(Math.PI * m.life / m.max) * fade;
        ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  const setPointer = (x, y, touch) => { pointer = { x, y, touch, t: performance.now() }; if (still) draw(performance.now()); };
  addEventListener("pointermove", e => setPointer(e.clientX, e.clientY, e.pointerType !== "mouse"), { passive: true });
  addEventListener("touchstart", e => setPointer(e.touches[0].clientX, e.touches[0].clientY, true), { passive: true });
  addEventListener("touchmove", e => setPointer(e.touches[0].clientX, e.touches[0].clientY, true), { passive: true });
  document.addEventListener("mouseleave", () => { pointer = null; if (still) draw(0); });
  addEventListener("resize", () => { size(); if (still) draw(0); });

  size();
  if (still) { draw(0); addEventListener("scroll", () => draw(0), { passive: true }); }
  else { const loop = t => { draw(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
})();
