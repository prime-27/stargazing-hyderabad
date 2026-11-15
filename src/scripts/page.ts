// @ts-nocheck
import { contact, showers as SHOWERS } from "../data/site";
const WHATSAPP = contact.whatsapp;
/* ---- Moon phase (mean synodic month from a reference new moon) ---- */
const SYN = 29.530588853, DAY = 864e5;
const REF = Date.UTC(2000, 0, 6, 18, 14);
const ageAt = d => (((d - REF) / DAY) % SYN + SYN) % SYN;
const illum = d => (1 - Math.cos(2 * Math.PI * ageAt(d) / SYN)) / 2;
const nextAge = (from, target) => new Date(from.getTime() + (((target - ageAt(from)) % SYN + SYN) % SYN) * DAY);
const fmt = (d, o) => d.toLocaleDateString("en-IN", Object.assign({ timeZone: "Asia/Kolkata" }, o));
function phaseName(d) {
  const a = ageAt(d);
  if (a < 1.5 || a > SYN - 1.5) return "New moon";
  if (a < 6.4) return "Waxing crescent";
  if (a < 8.4) return "First quarter";
  if (a < 13.8) return "Waxing gibbous";
  if (a < 15.8) return "Full moon";
  if (a < 21.1) return "Waning gibbous";
  if (a < 23.1) return "Last quarter";
  return "Waning crescent";
}
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
document.getElementById("moonNow").textContent = `${Math.round(illum(now) * 100)}% · ${phaseName(now)}`;
document.getElementById("nextNew").textContent = fmt(nextAge(now, 0), { day: "numeric", month: "short" });

/* ---- Meteor showers (peak night) ---- */
const showers = SHOWERS.map(s => ({ ...s, date: new Date(s.date + "T00:00:00") }));
const upcomingShower = showers.find(s => s.date >= today);
document.getElementById("nextShower").textContent = upcomingShower ? `${upcomingShower.name} · ${fmt(upcomingShower.date, { day: "numeric", month: "short" })}` : "—";

/* ---- Bortle scale ---- */
const bortleColors = ["#070b18","#0b1124","#111a35","#1b2546","#2a3253","#3e3f5a","#57505d","#73625d","#8f765c"];
const scale = document.getElementById("scale");
bortleColors.forEach((c, i) => {
  const n = i + 1, el = document.createElement("div");
  el.style.background = c;
  if (n === 3 || n === 4) el.style.boxShadow = "inset 0 0 0 2px var(--red)";
  if (n === 8) el.style.boxShadow = "inset 0 0 0 2px var(--muted)";
  el.innerHTML = n + (n === 3 ? '<span class="tag" style="color:var(--red)">Camps</span>' : n === 8 ? '<span class="tag" style="color:var(--muted);left:auto;right:0">Hyderabad</span>' : "");
  scale.appendChild(el);
});

/* ---- Recommended nights: first-quarter Moon nights, new-moon weekends, meteor peaks ---- */
function satNear(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()), day = x.getDay();
  x.setDate(x.getDate() + (day <= 3 ? -(day + 1) : 6 - day));
  return x;
}
const events = [];
let fq = nextAge(now, 7.4), nm = nextAge(now, 0);
for (let i = 0; i < 3; i++) {
  events.push({ date: new Date(fq.getFullYear(), fq.getMonth(), fq.getDate()), kind: "Moon night", title: "Moon & planet night", text: "Half-lit Moon: craters and mountains are sharpest along the shadow line. Great for schools and first-timers." });
  const s = satNear(nm);
  if (s >= today) events.push({ date: s, kind: "Dark night", title: "New-moon dark night", text: "No moonlight. Best for star clusters, nebulae and dark-sky camps away from the city." });
  fq = new Date(fq.getTime() + SYN * DAY); nm = new Date(nm.getTime() + SYN * DAY);
}
showers.forEach(s => { if (s.date >= today) events.push({ date: s.date, kind: "Meteor shower", title: `${s.name} meteor shower`, text: s.text }); });
events.sort((a, b) => a.date - b.date);

const list = document.getElementById("nightsList");
events.slice(0, 7).forEach(e => {
  const row = document.createElement("div");
  row.className = "night";
  const iso = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}-${String(e.date.getDate()).padStart(2, "0")}`;
  row.innerHTML = `
    <time datetime="${iso}"><b>${e.date.getDate()}</b>${fmt(e.date, { month: "short", weekday: "short" })}</time>
    <div><h3>${e.title}</h3><p>${e.text}</p></div>
    <span class="moon">${moonIcon(e.date)} ${Math.round(illum(new Date(e.date.getTime() + 15 * 36e5)) * 100)}% moon</span>
    <a class="btn btn-ghost btn-sm" href="#book" data-date="${iso}" data-who="${e.kind === "Meteor shower" ? "Meteor shower camp" : ""}">Pick this night</a>`;
  list.appendChild(row);
});

function moonIcon(d) {
  const a = ageAt(new Date(d.getTime() + 15 * 36e5)) / SYN, r = 8, k = Math.cos(2 * Math.PI * a) * r;
  const waxing = a < 0.5;
  const path = `M9 1 A8 8 0 0 ${waxing ? 1 : 0} 9 17 A${Math.abs(k)} 8 0 0 ${(k > 0) === waxing ? 0 : 1} 9 1Z`;
  return `<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="#1b2546" stroke="#24305a"/><path d="${path}" fill="#cfe0ff"/></svg>`;
}

/* ---- Hide offers after their end date ---- */
document.querySelectorAll("[data-until]").forEach(el => {
  if (now > new Date(el.dataset.until + "T23:59:59+05:30")) el.hidden = true;
});

/* ---- Buttons that prefill the form ---- */
document.addEventListener("click", e => {
  const a = e.target.closest("[data-who],[data-date]");
  if (!a) return;
  if (a.dataset.who) document.getElementById("f-who").value = a.dataset.who;
  if (a.dataset.date) document.getElementById("f-date").value = a.dataset.date;
});

/* ---- Booking form → WhatsApp ---- */
document.getElementById("bookForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target, name = f.name.value.trim();
  if (!name) { f.name.focus(); f.name.style.borderColor = "var(--red)"; return; }
  const d = f.date.value ? fmt(new Date(f.date.value + "T12:00:00"), { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "Flexible";
  const lines = [
    "Hi Beyond The Sky! I'd like to request a stargazing session.",
    `For: ${f.who.value}`,
    `Name: ${name}`,
    f.org.value.trim() && `School / venue / area: ${f.org.value.trim()}`,
    `People: about ${f.people.value}`,
    `Date: ${d}`,
    f.note.value.trim() && `Note: ${f.note.value.trim()}`
  ].filter(Boolean);
  const text = lines.join("\n");
  document.getElementById("msg").textContent = text;
  document.getElementById("waLink").href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  document.getElementById("result").hidden = false;
});
