// Turn-by-turn navigation with Google-Maps-like follow mode (lazy-loaded).
import { t, fmtDist, fmtDur, instruction, lang } from './i18n.js';
import { haversine, distToLine } from './services.js';

const $ = s => document.querySelector(s);
const bearingOf = (a, b) => { const r = Math.PI / 180, y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r), x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r); return (Math.atan2(y, x) / r + 360) % 360; };
const angDiff = (a, b) => ((b - a + 540) % 360) - 180;

export function startNavigation({ map, S, setMe, makePuck, reroute, drawRoutes, onEnd }) {
  let route = S.routes[S.routeIdx], step = 1, spoken = new Set(), off = 0, rerouting = false;
  let follow = true, headingUp = true, smBearing = map.getBearing(), lastPos = null;
  const st = { active: true };
  const sim = new URLSearchParams(location.search).has('sim') || !navigator.geolocation;
  const puck = makePuck(S.me || { lat: route.geometry.coordinates[0][1], lng: route.geometry.coordinates[0][0] });
  puck.getElement().classList.add('nav');

  const banner = $('#navBanner'); banner.classList.remove('hidden');
  const foot = document.createElement('div'); foot.id = 'navFoot'; foot.className = 'card'; document.body.appendChild(foot);
  const rc = document.createElement('button'); rc.id = 'recenter'; rc.className = 'btn hidden'; rc.textContent = lang === 'zh' ? '◎ 重新居中' : '◎ Re-centre'; document.body.appendChild(rc);
  rc.onclick = () => { follow = true; rc.classList.add('hidden'); if (lastPos) camera(lastPos, 600); };

  const speak = s => { try { const u = new SpeechSynthesisUtterance(s); u.lang = lang === 'zh' ? 'zh-CN' : 'en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {} };
  // Any user gesture exits follow mode
  const userMove = e => { if (e.originalEvent && follow) { follow = false; rc.classList.remove('hidden'); } };
  for (const ev of ['dragstart', 'rotatestart', 'pitchstart', 'zoomstart']) map.on(ev, userMove);

  function camera(p, duration = 1000) {
    const remainingToTurn = haversine(p, route.steps[Math.min(step, route.steps.length - 1)].loc);
    const spd = Math.max(0, p.speed || 0);
    let zoom = 18 - Math.min(2.5, spd / 12); if (remainingToTurn < 250) zoom = Math.max(zoom, 17.5);
    const h = map.getContainer().clientHeight;
    map.easeTo({ center: [p.lng, p.lat], bearing: headingUp ? smBearing : 0, pitch: headingUp ? 55 : 0, zoom,
      padding: { top: h * 0.42, bottom: 90, left: 0, right: 0 }, duration, easing: x => x });
  }

  function onPos(p) {
    if (!st.active) return;
    if (lastPos && haversine(lastPos, p) > 1.5) { const brg = p.heading ?? bearingOf(lastPos, p); smBearing = (smBearing + angDiff(smBearing, brg) * 0.35 + 360) % 360; }
    else if (p.heading != null) smBearing = (smBearing + angDiff(smBearing, p.heading) * 0.35 + 360) % 360;
    lastPos = p; setMe(p); puck.setRotation(smBearing);
    if (follow) camera(p);
    // progress
    const d = distToLine(p, route.geometry.coordinates);
    if (d > 40 + Math.min(60, p.acc || 10)) { if (++off >= 3 && !rerouting) doReroute(p); } else off = 0;
    while (step < route.steps.length - 1 && haversine(p, route.steps[step].loc) < 18) step++;
    const s = route.steps[step], toNext = haversine(p, s.loc);
    let rem = toNext; for (let i = step; i < route.steps.length; i++) rem += route.steps[i].distance;
    const eta = rem / Math.max(route.distance / route.duration, 1);
    banner.innerHTML = `<div class="ar">${arrowOf(s)}</div><div><div class="dd">${fmtDist(toNext)}</div><div class="tx">${instruction(s)}</div></div>`;
    const at = new Date(Date.now() + eta * 1000).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-CA', { hour: 'numeric', minute: '2-digit' });
    foot.innerHTML = `<div class="eta"><b>${fmtDur(eta)}</b><div style="font-size:13px;color:var(--muted)">${fmtDist(rem)} · ${at}</div></div>
      <button class="ctl" id="hdgBtn" title="${t('compass')}">${headingUp ? '⬆' : 'N'}</button><button class="btn red" id="endBtn">${t('nav_end')}</button>`;
    foot.querySelector('#endBtn').onclick = end; foot.querySelector('#hdgBtn').onclick = toggleHeading;
    if (s.type === 'arrive' && toNext < 25) { speak(t('arrive')); return end(); }
    for (const th of [800, 200, 40]) {
      const k = step + '@' + th;
      if (toNext <= th && !spoken.has(k)) { [800, 200, 40].filter(x => x >= th).forEach(x => spoken.add(step + '@' + x));
        speak(th === 40 ? instruction(s) : (lang === 'zh' ? `${fmtDist(toNext)}后，${instruction(s)}` : `In ${fmtDist(toNext)}, ${instruction(s)}`)); break; }
    }
  }
  async function doReroute(p) {
    rerouting = true; speak(t('reroute'));
    try { route = await reroute(p); S.routes = [route]; S.routeIdx = 0; drawRoutes(); step = 1; spoken.clear(); if (simState) simState.coords = route.geometry.coordinates; } catch {}
    off = 0; rerouting = false;
  }
  function toggleHeading() { headingUp = !headingUp; follow = true; rc.classList.add('hidden'); if (lastPos) camera(lastPos, 700); }

  // GPS source: real watchPosition or simulated route replay
  let watchId = null, simTimer = null, simState = null;
  if (sim) {
    simState = { coords: route.geometry.coordinates, i: 0, frac: 0 };
    const speed = S.travel === 'walk' ? 4 : 14; // m/s (walk sped up ~3x)
    simTimer = setInterval(() => {
      let left = speed, c = simState.coords;
      while (left > 0 && simState.i < c.length - 1) {
        const a = { lng: c[simState.i][0], lat: c[simState.i][1] }, b = { lng: c[simState.i + 1][0], lat: c[simState.i + 1][1] };
        const seg = haversine(a, b) * (1 - simState.frac);
        if (seg > left) { simState.frac += left / haversine(a, b); left = 0; } else { left -= seg; simState.i++; simState.frac = 0; }
      }
      const i = Math.min(simState.i, c.length - 2), a = c[i], b = c[i + 1], f = simState.frac;
      onPos({ lng: a[0] + (b[0] - a[0]) * f, lat: a[1] + (b[1] - a[1]) * f, speed, heading: bearingOf({ lng: a[0], lat: a[1] }, { lng: b[0], lat: b[1] }), acc: 5 });
    }, 1000);
  } else {
    watchId = navigator.geolocation.watchPosition(g => onPos({ lat: g.coords.latitude, lng: g.coords.longitude, speed: g.coords.speed, heading: g.coords.heading, acc: g.coords.accuracy }),
      () => {}, { enableHighAccuracy: true, maximumAge: 1000 });
    try { navigator.wakeLock?.request('screen').then(l => st.lock = l); } catch {}
  }
  speak(instruction(route.steps[0]));

  function end() {
    st.active = false; clearInterval(simTimer); if (watchId != null) navigator.geolocation.clearWatch(watchId); st.lock?.release?.();
    for (const ev of ['dragstart', 'rotatestart', 'pitchstart', 'zoomstart']) map.off(ev, userMove);
    banner.classList.add('hidden'); foot.remove(); rc.remove(); puck.getElement().classList.remove('nav'); puck.setRotation(0);
    map.easeTo({ pitch: 0, bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
    onEnd();
  }
  st.end = end; st.toggleHeading = toggleHeading;
  return st;
}
const arrowOf = s => s.type === 'arrive' ? '⚑' : s.modifier.includes('left') ? '⬅' : s.modifier.includes('right') ? '➡' : s.modifier === 'uturn' ? '⮌' : '⬆';
