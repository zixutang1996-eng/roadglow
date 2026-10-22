// Turn-by-turn navigation with Google-Maps-like follow mode (lazy-loaded).
import { t, tz, fmtDist, fmtDur, instruction, lang } from './i18n.js';
import { haversine, distToLine } from './services.js';
import { Marker } from 'maplibre-gl';
import { phrase, say } from './voice.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const bearingOf = (a, b) => { const r = Math.PI / 180, y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r), x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r); return (Math.atan2(y, x) / r + 360) % 360; };
const angDiff = (a, b) => ((b - a + 540) % 360) - 180;
// v0.9.7 'inkui' pack layout helpers (classical distance / time words; only used when <html class="fx-inkui">)
const INK = () => document.documentElement.classList.contains('fx-inkui');
const CN = n => { const d = '〇一二三四五六七八九'; n = Math.round(n); if (n <= 10) return n === 10 ? '十' : d[n]; if (n < 20) return '十' + d[n % 10]; if (n < 100) return d[Math.floor(n / 10)] + '十' + (n % 10 ? d[n % 10] : ''); if (n < 1000 && n % 100 === 0) return d[n / 100] + '百'; if (n < 1000) return d[Math.floor(n / 100)] + '百' + (n % 100 >= 10 ? CN(n % 100) : n % 100 ? '零' + d[n % 10] : ''); return String(n); };
const zDist = m => m < 750 ? CN(Math.max(10, Math.round(m / 1.5 / (m < 150 ? 10 : 50)) * (m < 150 ? 10 : 50))) + '步' : CN(Math.max(1, Math.round(m / 500))) + '里';
const SHI = '子丑寅卯辰巳午未申酉戌亥', KE = ['初刻', '一刻', '二刻', '三刻'];
const zClock = d => SHI[Math.floor(((d.getHours() + 1) % 24) / 2)] + '时' + KE[Math.floor(d.getMinutes() / 15)];
const zEta = s => s < 420 ? '片刻可至' : s < 1350 ? '约一刻钟可至' : s < 3600 ? `约${CN(Math.round(s / 900))}刻钟可至` : `约${CN(Math.max(1, Math.round(s / 7200)))}个时辰可至`;
const turnZ = s => s.type === 'arrive' ? '至' : s.modifier?.includes('left') ? '左' : s.modifier?.includes('right') ? '右' : s.modifier === 'uturn' ? '返' : '直';
const AR = { 左: 'M17 21V11.5Q17 7 12.5 7H5.5M9.5 3 5 7l4.5 4', 右: 'M7 21V11.5Q7 7 11.5 7h7M14.5 3 19 7l-4.5 4', 直: 'M12 21V4M7.5 8.5 12 4l4.5 4.5', 返: 'M8 21V9.5a4.5 4.5 0 0 1 9 0V14M13 10.5l4 4 4-4', 至: 'M6 21V3.5h11l-2.5 3.6L17 11H6' };
const inkArrow = s => `<svg class="ika" viewBox="0 0 24 24" aria-hidden="true"><path d="${AR[turnZ(s)]}"/></svg>`;

export function startNavigation({ map, S, setMe, makePuck, reroute, drawRoutes, onEnd }) {
  let route = S.routes[S.routeIdx], step = 1, spoken = new Set(), off = 0, rerouting = false, lastSwitch = Date.now(), lastCheck = Date.now(), etaNow = route.duration;
  let follow = true, headingUp = true, smBearing = map.getBearing(), lastPos = null;
  const st = { active: true };
  const sim = new URLSearchParams(location.search).has('sim') || !navigator.geolocation;
  const puck = makePuck(S.me || { lat: route.geometry.coordinates[0][1], lng: route.geometry.coordinates[0][0] });
  puck.getElement().classList.add('nav');
  document.body.classList.add('navon'); const b3 = v => { try { if (map.getLayer('bld3d')) map.setLayoutProperty('bld3d', 'visibility', v); } catch {} }; b3('visible'); const onSd = () => document.body.classList.contains('navon') && b3('visible'); map.on('style.load', onSd);

  const banner = $('#navBanner'); banner.classList.remove('hidden'); banner.classList.add('objective');
  // original quest-objective destination marker
  const endC = route.geometry.coordinates[route.geometry.coordinates.length - 1];
  const dm = document.createElement('div'); dm.className = 'objmark'; dm.innerHTML = document.body.classList.contains('west')
    ? `<svg width="54" height="54" viewBox="0 0 40 40"><defs><filter id="dr"><feTurbulence type="fractalNoise" baseFrequency="1" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1.4"/></filter></defs><g filter="url(#dr)" fill="none" stroke="#20150b" stroke-linecap="round"><circle cx="20" cy="20" r="16" stroke-width="2" fill="rgba(246,236,214,.75)"/><circle cx="20" cy="20" r="12.5" stroke-width=".9" opacity=".7"/><path d="M12 12 28 28M28 12 12 28" stroke="#7c2e22" stroke-width="3.6"/></g></svg>`
    : `<svg width="54" height="54" viewBox="0 0 40 40" style="overflow:visible"><circle cx="20" cy="20" r="17" fill="none" stroke="#4fd6e8" stroke-width="1" opacity=".7"/><path d="M20 4 31 20 20 36 9 20Z" fill="#e0457a" stroke="#ffd25a" stroke-width="1.8"/><path d="M20 12 25.5 20 20 28 14.5 20Z" fill="#ffd25a"/></svg>`;
  const destMarker = new Marker({ element: dm }).setLngLat(endC).addTo(map);
  const foot = document.createElement('div'); foot.id = 'navFoot'; foot.className = 'card'; (document.querySelector('.navw') || document.body).appendChild(foot);
  // static buttons (never re-rendered, so taps can't be lost to the 1 Hz refresh)
  banner.innerHTML = `<button id="navX" title="${t('nav_end')}">✕</button><div id="navBody"></div>`; const navBody = banner.querySelector('#navBody');
  foot.innerHTML = `<div class="eta"></div><button class="ctl" id="hdgBtn" title="${t('compass')}">⬆</button><button class="btn red" id="endBtn"><span class="stopg" aria-hidden="true"></span>${t('nav_end')}</button>`;
  const footEta = foot.querySelector('.eta'), hdgBtn = foot.querySelector('#hdgBtn');
  const then = document.createElement('div'); then.id = 'inkThen'; then.className = 'hidden'; const spd = document.createElement('div'); spd.id = 'inkSpd'; spd.className = 'hidden';
  if (INK()) { banner.after(then); (document.querySelector('.navw') || document.body).appendChild(spd); }
  foot.querySelector('#endBtn').onclick = () => end(); banner.querySelector('#navX').onclick = () => end(); hdgBtn.onclick = () => toggleHeading();
  const rc = document.createElement('button'); rc.id = 'recenter'; rc.className = 'btn hidden'; rc.textContent = lang === 'zh' ? tz('recenter', '◎ 重新居中') : '◎ Re-centre'; document.body.appendChild(rc);
  rc.onclick = () => { follow = true; rc.classList.add('hidden'); if (lastPos) camera(lastPos, 600); };

  const speak = say; st.spoken = [];
  const sayEv = (ev, o) => { const x = phrase(ev, o); st.spoken.push(x); speak(x); };
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
    if (!st.active) return; st.gpsLostSaid = 0;
    if (lastPos && haversine(lastPos, p) > 1.5) { const brg = p.heading ?? bearingOf(lastPos, p); smBearing = (smBearing + angDiff(smBearing, brg) * 0.35 + 360) % 360; }
    else if (p.heading != null) smBearing = (smBearing + angDiff(smBearing, p.heading) * 0.35 + 360) % 360;
    lastPos = p; setMe(p); puck.setRotation(smBearing);
    if (follow) camera(p);
    // progress
    const d = distToLine(p, route.geometry.coordinates);
    if (d > 30 + Math.min(20, p.acc || 10)) { if (++off >= 2 && !rerouting) doReroute(p); } else off = 0;
    if (!rerouting && Date.now() - lastCheck > 150000) { lastCheck = Date.now(); checkBetter(p); }
    while (step < route.steps.length - 1 && haversine(p, route.steps[step].loc) < 18) step++;
    const s = route.steps[step], toNext = haversine(p, s.loc);
    let rem = toNext; for (let i = step; i < route.steps.length; i++) rem += route.steps[i].distance;
    const eta = rem / Math.max(route.distance / route.duration, 1); etaNow = eta;
    const at = new Date(Date.now() + eta * 1000).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-CA', { hour: 'numeric', minute: '2-digit' });
    const dn = S.dest?.gps ? (lang === 'zh' ? '我的位置' : 'my location') : (S.dest?.name || (lang === 'zh' ? '目的地' : 'destination'));
    if (INK()) {
      const zh = lang === 'zh', nx = route.steps[step + 1], d2 = nx ? haversine(s.loc, nx.loc) : 0, sp = Math.max(0, p.speed || 0);
      navBody.innerHTML = `<div class="ikn">${inkArrow(s)}<div class="ikn-t"><div class="ikd">${zh ? '前行' + zDist(toNext) : fmtDist(toNext)}</div><div class="ikx">${instruction(s)}</div></div><i class="ikseal">${zh ? turnZ(s) : { 左: 'L', 右: 'R', 直: '↑', 返: 'U', 至: '⚑' }[turnZ(s)]}</i></div>`;
      if (nx && nx.type !== 'arrive' && turnZ(nx) !== '直') { then.innerHTML = zh ? `再行${zDist(d2)} ${turnZ(nx)}折 ${inkArrow(nx)}` : `Then ${turnZ(nx) === '左' ? 'left' : turnZ(nx) === '右' ? 'right' : 'U-turn'} in ${fmtDist(d2)} ${inkArrow(nx)}`; then.classList.remove('hidden'); } else then.classList.add('hidden');
      footEta.innerHTML = `<b>${zh ? zEta(eta) : fmtDur(eta)}</b><div class="iks">${zh ? `尚余${zDist(rem)} · ${zClock(new Date(Date.now() + eta * 1000))}抵达` : `${fmtDist(rem)} left · arrive ${at}`}</div>`;
      spd.innerHTML = zh ? `<b>${CN(Math.round(sp * 3.6 * 2))}</b><small>里每时</small>` : `<b>${Math.round(sp * 3.6)}</b><small>km/h</small>`; spd.classList.remove('hidden');
      hdgBtn.textContent = headingUp ? '⬆' : 'N';
    } else {
    navBody.innerHTML = `<div class="objk">${lang === 'zh' ? '当前目标' : 'OBJECTIVE'}</div>
      <div class="objrow"><div class="ar">${arrowOf(s)}</div><div><div class="dd">${fmtDist(toNext)}</div><div class="tx">${instruction(s)}</div></div></div>
      <div class="objsub">${lang === 'zh' ? `${tz('nav_go', '前往')} ${esc(dn)} · ${tz('nav_rem', '还剩')} ${fmtDist(rem)} · ${at} ${tz('nav_at', '到达')}` : `Go to ${esc(dn)} · ${fmtDist(rem)} left · arrive ${at}`}</div>`;
    footEta.innerHTML = `<b>${tz('eta_fmt', '{d}').replace('{d}', fmtDur(eta))}</b><div style="font-size:13px;color:var(--muted)">${fmtDist(rem)} · ${at}</div>`; hdgBtn.textContent = headingUp ? '⬆' : 'N';
    }
    if (s.type === 'arrive' && toNext < 25) { sayEv('arrive'); return end(); }
    for (const th of [800, 200, 40]) {
      const k = step + '@' + th;
      if (toNext <= th && !spoken.has(k)) { [800, 200, 40].filter(x => x >= th).forEach(x => spoken.add(step + '@' + x));
        sayEv('step', { st: s, dist: th === 40 ? 0 : toNext }); break; }
    }
  }
  async function doReroute(p) {
    rerouting = true; sayEv('reroute');
    try { route = (await reroute(p))[0]; lastSwitch = Date.now(); S.routes = [route]; S.routeIdx = 0; drawRoutes(); step = 1; spoken.clear(); if (simState) { simState.coords = route.geometry.coordinates; simState.i = 0; simState.frac = 0; } } catch {}
    off = 0; rerouting = false;
  }
  // Periodic re-evaluation from the current position; switch only if clearly better (anti-flapping).
  async function checkBetter(p) {
    try {
      const best = (await reroute(p))[0];
      const gain = etaNow - best.duration;
      if (gain > Math.max(60, etaNow * 0.1) && Date.now() - lastSwitch > 120000 && st.active) {
        route = best; S.routes = [route]; S.routeIdx = 0; drawRoutes(); step = 1; spoken.clear(); lastSwitch = Date.now();
        if (simState) { simState.coords = route.geometry.coordinates; simState.i = 0; simState.frac = 0; }
        sayEv('better', { min: Math.round(gain / 60) });
      }
    } catch {}
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
    watchId = navigator.geolocation.watchPosition(g => onPos({ lat: g.coords.latitude, lng: g.coords.longitude, speed: g.coords.speed, heading: g.coords.heading ?? S.compassHdg ?? null, acc: g.coords.accuracy }),
      () => { if (!st.gpsLostSaid) { st.gpsLostSaid = 1; sayEv('gpslost'); } }, { enableHighAccuracy: true, maximumAge: 1000 });
  }
  sayEv('step', { st: route.steps[0] });

  function end() {
    st.active = false; document.body.classList.remove('navon'); b3('none'); map.off('style.load', onSd); clearInterval(simTimer); if (watchId != null) navigator.geolocation.clearWatch(watchId); st.lock?.release?.();
    for (const ev of ['dragstart', 'rotatestart', 'pitchstart', 'zoomstart']) map.off(ev, userMove);
    banner.classList.add('hidden'); banner.classList.remove('objective'); destMarker.remove(); foot.remove(); then.remove(); spd.remove(); rc.remove(); puck.getElement().classList.remove('nav'); puck.setRotation(0);
    map.easeTo({ pitch: 0, bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
    onEnd();
  }
  st.end = end; st.toggleHeading = toggleHeading; st.checkBetter = () => lastPos && checkBetter(lastPos); st.inject = p => onPos(p); st.gpsLost = () => sayEv('gpslost'); st.route = () => route; st._force = () => { lastSwitch = 0; };
  return st;
}
const arrowOf = s => s.type === 'arrive' ? '⚑' : s.modifier.includes('left') ? '⬅' : s.modifier.includes('right') ? '➡' : s.modifier === 'uturn' ? '⮌' : '⬆';
