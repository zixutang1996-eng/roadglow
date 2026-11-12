// Turn-by-turn navigation with Google-Maps-like follow mode (lazy-loaded).
import { t, tz, fmtDist, fmtDur, instruction, lang } from './i18n.js';
import { haversine, distToLine } from './services.js';
import { Marker } from 'maplibre-gl';
import { phrase, say } from './voice.js';
import { project, ahead, kindOf, roadArrow, lanesHtml } from './navgeo.js';

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
  let route = S.routes[S.routeIdx], step = 1, spoken = new Set(), off = 0, wrong = 0, rerouting = false, lastSwitch = Date.now(), lastCheck = Date.now(), etaNow = route.duration;
  let requestSeq = 0, pendingKind = null, retryAt = 0, failures = 0, lastFixTime = 0;
  let follow = true, headingUp = true, smBearing = map.getBearing(), lastPos = null;
  const st = { active: true };
  const sim = new URLSearchParams(location.search).has('sim') || !navigator.geolocation;
  const puck = makePuck(S.me || { lat: route.geometry.coordinates[0][1], lng: route.geometry.coordinates[0][0] });
  puck.getElement().classList.add('nav');
  document.body.classList.add('navon'); const b3 = v => { try { if (map.getLayer('bld3d')) map.setLayoutProperty('bld3d', 'visibility', v); } catch {} }; b3('visible');
  // the GPS accuracy circle is drawn at the raw 1 Hz fix; hide it while the smoothed arrow is shown
  const accV = v => { for (const id of ['acc', 'acc-line']) try { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v); } catch {} }; accV('none');
  const onSd = () => { if (document.body.classList.contains('navon')) { b3('visible'); accV('none'); } }; map.on('style.load', onSd);

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
  const status = document.createElement('div'); status.id = 'navStatus'; status.setAttribute?.('role', 'status');
  foot.appendChild(status);
  const setStatus = text => { status.textContent = text; };
  const unavailable = () => lang === 'zh' ? '路线服务暂不可用，正在重试；请勿继续依赖旧路线' : 'Routing unavailable; retrying. Do not rely on the old route.';
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
    camT = { zoom, pitch: headingUp ? 55 : 0 }; if (duration <= 700) { const h = map.getContainer().clientHeight; map.easeTo({ center: [(anim.cur || p).lng, (anim.cur || p).lat], bearing: headingUp ? (anim.shown ?? smBearing) : 0, ...camT, padding: { top: h * 0.42, bottom: 90, left: 0, right: 0 }, duration }); }
  }
  // v0.9.18 smooth follow (per display frame, follows the screen refresh rate, e.g. 120 Hz):
  // every GPS fix defines a short trajectory: the measured point moved forward by speed × time, capped at 0.7 s
  // (PRED_MAX). When the fix is on the route it moves ALONG the route geometry and is clamped at the next not-yet-reached
  // manoeuvre point, so the arrow can never be drawn past a junction you haven't reached. A new fix does not teleport the
  // arrow: the display cross-fades from the previous trajectory to the new one with a smoothstep weight, which keeps both
  // position and velocity continuous ("projective velocity blending"). To keep the motion at a constant rate between
  // ~1 Hz fixes without ever leading the latest fix by more than 0.7 s, the trajectory clock runs `lag` = interval − 0.7 s
  // behind arrival (≈0.3 s at 1 Hz). Heading eases along the shortest angle; camera, arrow and route trim update in the
  // same frame. Off-route / reroute / jump-over-150 m converge fast but still continuously; >1 km snaps.
  // Measured fixes (not this display state) still drive off-route detection and instruction progress.
  const PRED_MAX = 0.7, ML = 111320, rad = Math.PI / 180;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const meters = (a, b) => Math.hypot((b.lng - a.lng) * ML * Math.cos(a.lat * rad), (b.lat - a.lat) * ML);
  const offsetBy = (o, m, brg) => ({ lat: o.lat + (m * Math.cos(brg * rad)) / ML, lng: o.lng + (m * Math.sin(brg * rad)) / (ML * Math.cos(o.lat * rad)) });
  let camT = null, raf = 0, segHint = 0, lastFrame = 0, lastTrim = 0, gpsInterval = 1, gpsJitter = 0.03, lastArrival = 0;
  const anim = { cur: null, f: null, last: null, shown: null, brg: smBearing };
  function makeTraj(o) { // o: { at, B, v, brg, lag, predict, route?: { c, cum, along, limit, off } }
    const { at, B, v, lag, predict, route: R } = o;
    const pointAt = s => { // point + bearing at route distance s
      let lo = 0, hi = R.cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (R.cum[m] <= s) lo = m; else hi = m; }
      const L = R.cum[hi] - R.cum[lo], t = L ? (s - R.cum[lo]) / L : 0, a = R.c[lo], b = R.c[hi];
      return { lng: a[0] + (b[0] - a[0]) * t + R.off[0], lat: a[1] + (b[1] - a[1]) * t + R.off[1], brg: bearingOf({ lng: a[0], lat: a[1] }, { lng: b[0], lat: b[1] }) };
    };
    const f = (now, ext = 0) => {
      if (!predict) return { lng: B.lng, lat: B.lat, brg: o.brg };
      const dt = clamp((now - at) / 1000 - lag, -lag, PRED_MAX + ext);
      if (R) return pointAt(clamp(R.along + v * dt, Math.max(0, R.along - v * lag), Math.max(R.along, R.limit)));
      const q = offsetBy(B, v * dt, o.brg); q.brg = o.brg; return q;
    };
    f.info = o; return f;
  }
  function setTraj(traj, now) {
    anim.last = traj; const prev = anim.f;
    if (!prev || document.hidden) { anim.f = traj; return; }
    const d = meters(prev(now), traj(now));
    if (d > 1000) { anim.f = traj; return; }
    const T = (d > 150 ? 0.35 : clamp(gpsInterval * 0.9, 0.3, 0.9)) * 1000, t0 = now; let from = prev;
    const blend = (t, ext = 0) => {
      const u = (t - t0) / T; if (u >= 1 || !from) { from = null; return traj(t, ext); }
      const w = u <= 0 ? 0 : u * u * (3 - 2 * u), a = from(t, Math.max(ext, 2)), b = traj(t, ext);
      return { lng: a.lng + (b.lng - a.lng) * w, lat: a.lat + (b.lat - a.lat) * w, brg: b.brg };
    };
    anim.f = blend;
  }
  // hard limit on the drawn point: never more than 0.7 s × speed ahead of the newest measured fix
  function capLead(q) {
    const o = anim.last?.info; if (!o) return q;
    const max = o.predict ? o.v * PRED_MAX : 0, u = [Math.sin(o.brg * rad), Math.cos(o.brg * rad)];
    const dx = (q.lng - o.B.lng) * ML * Math.cos(o.B.lat * rad), dy = (q.lat - o.B.lat) * ML, ahead = dx * u[0] + dy * u[1];
    if (ahead <= max + 0.01) return q;
    const back = ahead - max; return { ...q, lng: q.lng - (back * u[0]) / (ML * Math.cos(o.B.lat * rad)), lat: q.lat - (back * u[1]) / ML };
  }
  function frame(ts) {
    raf = 0; if (!st.active || document.hidden) return; raf = requestAnimationFrame(frame);
    if (!anim.f) return;
    const now = ts ?? performance.now(), dtf = lastFrame ? clamp((now - lastFrame) / 1000, 0, 0.1) : 0; lastFrame = now;
    const q = capLead(anim.f(now)); anim.cur = { lng: q.lng, lat: q.lat };
    anim.shown = anim.shown == null ? q.brg : (anim.shown + angDiff(anim.shown, q.brg) * (1 - Math.exp(-dtf / 0.22)) + 360) % 360;
    if (follow && camT && !map.isMoving()) { const h = map.getContainer().clientHeight, z = map.getZoom(), pi = map.getPitch(), kz = 1 - Math.exp(-dtf / 0.8);
      map.jumpTo({ center: [anim.cur.lng, anim.cur.lat], bearing: headingUp ? anim.shown : 0, zoom: z + (camT.zoom - z) * kz, pitch: pi + (camT.pitch - pi) * kz, padding: { top: h * 0.42, bottom: 90, left: 0, right: 0 } }); }
    puck.setLngLat(anim.cur); puck.setRotation(anim.shown);
    if (now - lastTrim > 66) { lastTrim = now; trim(anim.cur); } // ~15 Hz; the line end stays under the arrow
  }
  const onVis = () => { if (document.hidden || !st.active) return; lastFrame = 0; if (anim.last) anim.f = anim.last; if (!raf) raf = requestAnimationFrame(frame); };
  document.addEventListener?.('visibilitychange', onVis);
  function trim(p) { // hide the already-driven part of the highlighted route
    const src = map.getSource('route'), c = route.geometry.coordinates; if (!src || c.length < 2) return;
    const pr = project(p, c, segHint); if (pr.d > 40) return; segHint = pr.i;
    src.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ahead(c, pr) } }] });
  }

  let carRoute = null;
  let progress = [];
  function indexSteps() {
    const c = route.geometry.coordinates, cum = [0];
    for (let i = 1; i < c.length; i++) cum.push(cum[i - 1] + haversine({ lng: c[i - 1][0], lat: c[i - 1][1] }, { lng: c[i][0], lat: c[i][1] }));
    // OSRM manoeuvres are geometry vertices; search forward to disambiguate loops.
    let lo = 0;
    progress = route.steps.map(s => {
      let at = lo, d = Infinity;
      for (let i = lo; i < c.length; i++) { const x = haversine(s.loc, { lng: c[i][0], lat: c[i][1] }); if (x < d) { d = x; at = i; } }
      lo = at; return cum[at];
    });
    return cum;
  }
  let cumulative = indexSteps();
  function onPos(p) {
    if (!st.active || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return;
    const time = p.timestamp ?? Date.now();
    // Android can deliver delayed/batched callbacks after resume. Never treat an
    // old fix as "now", or count duplicates as successive off-route evidence.
    if (!Number.isFinite(time) || Date.now() - time > 10000 || time > Date.now() + 2000 || time <= lastFixTime) return;
    const prevFixTime = lastFixTime; lastFixTime = time; st.gpsLostSaid = 0;
    const rawSpeed = Number.isFinite(p.speed) && p.speed >= 0 ? p.speed : null;
    p = { ...p, timestamp: time, heading: Number.isFinite(p.heading) && p.heading >= 0 ? p.heading : null, speed: Math.max(0, p.speed || 0) };
    const prev = lastPos, moved = prev ? haversine(prev, p) : 0;
    const course = p.heading ?? (moved > 3 ? bearingOf(prev, p) : null);
    if (course != null && (p.speed > 1 || moved > 3)) smBearing = (smBearing + angDiff(smBearing, course) * 0.35 + 360) % 360;
    lastPos = p;
    // Authoritative position = the measured fix (S.me); the drawn arrow is the smoothed display state.
    setMe(p);
    if (follow) camera(p);
    const c = route.geometry.coordinates, pr = project(p, c, 0, c.length);
    const acc = Number.isFinite(p.acc) ? p.acc : 15;
    const threshold = Math.max(18, Math.min(35, acc * 1.5));
    const a = c[pr.i], b = c[pr.i + 1];
    const backwards = a && b && course != null && (p.speed > 2 || moved > 5) && Math.abs(angDiff(course, bearingOf({ lng: a[0], lat: a[1] }, { lng: b[0], lat: b[1] }))) > 110;
    wrong = acc <= 50 && backwards ? wrong + 1 : 0;
    off = acc <= 50 && (pr.d > threshold || wrong >= 3) ? off + 1 : 0;
    if (acc > 50) setStatus(lang === 'zh' ? '定位精度不足，请确认实际道路' : 'Low GPS accuracy; confirm your road.');
    else if (!rerouting && !off) { failures = 0; retryAt = 0; setStatus(''); }
    else if (!failures && !rerouting) setStatus('');
    if (off >= 2 && Date.now() >= retryAt && (!rerouting || pendingKind === 'better')) doReroute(p);
    if (!rerouting && !off && Date.now() - lastCheck > 60000) { lastCheck = Date.now(); checkBetter(p); }
    const along = cumulative[pr.i] + (cumulative[pr.i + 1] - cumulative[pr.i]) * pr.t;
    // Do not announce a turn as passed merely because GPS is within 18 m of it.
    if (pr.d < threshold && wrong === 0) while (step < route.steps.length - 1 && along >= progress[step] + 5) step++;
    { // display trajectory for this fix
      const nowT = performance.now(); if (lastArrival) { const iv = (nowT - lastArrival) / 1000; if (iv > 0.1 && iv < 5) { gpsJitter = gpsJitter * 0.8 + Math.abs(iv - gpsInterval) * 0.2; gpsInterval = gpsInterval * 0.7 + iv * 0.3; } } lastArrival = nowT;
      const v = rawSpeed ?? (prev && prevFixTime && time > prevFixTime && moved < 100 ? moved / ((time - prevFixTime) / 1000) : 0);
      const predict = v >= 2 && acc <= 30 && Date.now() - time <= 2000 && course != null;
      const segB = a && b ? bearingOf({ lng: a[0], lat: a[1] }, { lng: b[0], lat: b[1] }) : null;
      let R = null;
      if (predict && pr.d < threshold && wrong === 0 && segB != null && Math.abs(angDiff(segB, smBearing)) < 45) {
        let limit = cumulative[cumulative.length - 1]; for (let i = step; i < progress.length; i++) if (progress[i] > along + 0.5) { limit = progress[i]; break; }
        R = { c, cum: cumulative, along, limit, off: [p.lng - pr.pt[0], p.lat - pr.pt[1]] };
      }
      setTraj(makeTraj({ at: nowT, B: { lng: p.lng, lat: p.lat }, v: Math.min(v, 70), brg: R ? segB : smBearing, lag: clamp(gpsInterval + 2 * gpsJitter + 0.02 - PRED_MAX, 0, 0.6), predict, route: R }), nowT);
      if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
    }
    const s = route.steps[step], toNext = haversine(p, s.loc);
    let rem = toNext; for (let i = step; i < route.steps.length; i++) rem += route.steps[i].distance;
    const eta = rem / Math.max(route.distance / route.duration, 1); etaNow = eta;
    const at = new Date(Date.now() + eta * 1000).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-CA', { hour: 'numeric', minute: '2-digit' });
    const dn = S.dest?.gps ? (lang === 'zh' ? '我的位置' : 'my location') : (S.dest?.name || (lang === 'zh' ? '目的地' : 'destination'));
    if (INK()) {
      const zh = lang === 'zh', nx = route.steps[step + 1], d2 = nx ? haversine(s.loc, nx.loc) : 0, sp = Math.max(0, p.speed || 0);
      navBody.innerHTML = `<div class="ikn">${inkArrow(s)}<div class="ikn-t"><div class="ikd">${zh ? '前行' + zDist(toNext) : fmtDist(toNext)}</div><div class="ikx">${instruction(s)}</div></div><i class="ikseal">${zh ? turnZ(s) : { 左: 'L', 右: 'R', 直: '↑', 返: 'U', 至: '⚑' }[turnZ(s)]}</i></div>${lanesHtml(s.lanes)}`;
      if (nx && nx.type !== 'arrive' && turnZ(nx) !== '直') { then.innerHTML = zh ? `再行${zDist(d2)} ${turnZ(nx)}折 ${inkArrow(nx)}` : `Then ${turnZ(nx) === '左' ? 'left' : turnZ(nx) === '右' ? 'right' : 'U-turn'} in ${fmtDist(d2)} ${inkArrow(nx)}`; then.classList.remove('hidden'); } else then.classList.add('hidden');
      footEta.innerHTML = `<b>${zh ? zEta(eta) : fmtDur(eta)}</b><div class="iks">${zh ? `尚余${zDist(rem)} · ${zClock(new Date(Date.now() + eta * 1000))}抵达` : `${fmtDist(rem)} left · arrive ${at}`}</div>`;
      spd.innerHTML = zh ? `<b>${CN(Math.round(sp * 3.6 * 2))}</b><small>里每时</small>` : `<b>${Math.round(sp * 3.6)}</b><small>km/h</small>`; spd.classList.remove('hidden');
      hdgBtn.textContent = headingUp ? '⬆' : 'N';
    } else {
    // v0.9.13 simplified card: road-paint arrow · distance to the manoeuvre · total remaining (no destination name) · lanes when OSRM has them
    navBody.innerHTML = `<div class="objrow nc13"><div class="ar">${roadArrow(kindOf(s))}</div><div class="ncm"><div class="dd">${fmtDist(toNext)}</div><div class="objsub">${lang === 'zh' ? `${tz('nav_rem', '全程还剩')} ${fmtDist(rem)}` : `${fmtDist(rem)} to go`}</div></div></div>${lanesHtml(s.lanes)}`;
    footEta.innerHTML = `<b>${tz('eta_fmt', '{d}').replace('{d}', fmtDur(eta))}</b><div style="font-size:13px;color:var(--muted)">${fmtDist(rem)} · ${at}</div>`; hdgBtn.textContent = headingUp ? '⬆' : 'N';
    }
    const newR = carRoute !== route; carRoute = route;
    window.__rgCar?.nav({ active: true, step: s, cue: instruction(s), toNext, rem, eta, dest: dn, p, bearing: smBearing, route: newR ? route.geometry.coordinates : null, force: newR });
    if (s.type === 'arrive' && toNext < 25) { sayEv('arrive'); return end(); }
    for (const th of [800, 200, 40]) {
      const k = step + '@' + th;
      if (toNext <= th && !spoken.has(k)) { [800, 200, 40].filter(x => x >= th).forEach(x => spoken.add(step + '@' + x));
        sayEv('step', { st: s, dist: th === 40 ? 0 : toNext }); break; }
    }
  }
  function installRoute(next) {
    route = next; S.routes = [route]; S.routeIdx = 0; step = 1;
    spoken.clear(); off = 0; wrong = 0; segHint = 0; cumulative = indexSteps();
    lastSwitch = Date.now(); lastCheck = Date.now(); failures = 0; retryAt = 0;
    drawRoutes(); setStatus('');
    if (simState) { simState.coords = route.geometry.coordinates; simState.i = 0; simState.frac = 0; }
  }
  async function requestRoute(p, kind) {
    const id = ++requestSeq; pendingKind = kind; rerouting = true;
    let timer;
    try {
      const routes = await Promise.race([Promise.resolve().then(() => reroute(p)), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('routing timeout')), 16000); })]);
      if (!st.active || id !== requestSeq) return;
      const valid = routes?.filter(r => r?.geometry?.coordinates?.length >= 2 && r.steps?.length >= 2 && Number.isFinite(r.duration) && Number.isFinite(r.distance));
      const best = valid?.reduce((a, b) => !a || b.duration < a.duration ? b : a, null);
      if (!best) throw new Error('no route');
      if (Date.now() - lastFixTime > 10000) throw new Error('GPS is stale');
      if (lastPos && haversine(p, lastPos) > 40 && distToLine(lastPos, best.geometry.coordinates) > 45) throw new Error('route origin is stale');
      if (kind === 'off') installRoute(best);
      else {
        const gain = etaNow - best.duration;
        if (gain > Math.max(60, etaNow * 0.1) && Date.now() - lastSwitch > 120000) { installRoute(best); sayEv('better', { min: Math.round(gain / 60) }); }
      }
    } catch (e) {
      if (st.active && id === requestSeq) {
        if (kind === 'off') { failures++; retryAt = Date.now() + Math.min(30000, 5000 * 2 ** Math.min(failures - 1, 3)); setStatus(unavailable()); }
      }
    } finally {
      clearTimeout(timer);
      if (id === requestSeq) { rerouting = false; pendingKind = null; }
    }
  }
  function doReroute(p) {
    setStatus(lang === 'zh' ? '正在重新规划路线…' : 'Recalculating route…'); sayEv('reroute');
    return requestRoute(p, 'off');
  }
  // No live traffic feed: this compares the routing service's estimated duration.
  function checkBetter(p) { if (!st.active || rerouting) return; return requestRoute(p, 'better'); }
  const online = () => { if (st.active && off >= 2 && lastPos && Date.now() - lastFixTime < 10000 && !rerouting) { retryAt = 0; doReroute(lastPos); } };
  window.addEventListener('online', online);
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
    watchId = navigator.geolocation.watchPosition(g => onPos({ lat: g.coords.latitude, lng: g.coords.longitude, speed: g.coords.speed, heading: g.coords.heading ?? null, acc: g.coords.accuracy, timestamp: g.timestamp }),
      () => { if (!st.gpsLostSaid) { st.gpsLostSaid = 1; sayEv('gpslost'); } }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  }
  sayEv('step', { st: route.steps[0] });

  function end() {
    st.active = false; ++requestSeq; window.removeEventListener('online', online); document.removeEventListener?.('visibilitychange', onVis); if (raf) cancelAnimationFrame(raf); raf = 0; document.body.classList.remove('navon'); b3('none'); accV('visible'); map.off('style.load', onSd); clearInterval(simTimer); if (watchId != null) navigator.geolocation.clearWatch(watchId); st.lock?.release?.();
    for (const ev of ['dragstart', 'rotatestart', 'pitchstart', 'zoomstart']) map.off(ev, userMove);
    banner.classList.add('hidden'); banner.classList.remove('objective'); destMarker.remove(); foot.remove(); then.remove(); spd.remove(); rc.remove(); puck.getElement().classList.remove('nav'); puck.setRotation(0);
    map.easeTo({ pitch: 0, bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
    window.__rgCar?.nav({ active: false, force: true, route: [] });
    onEnd();
  }
  st.end = end; st.toggleHeading = toggleHeading; st.checkBetter = () => lastPos && checkBetter(lastPos); st.inject = p => onPos(p); st.gpsLost = () => sayEv('gpslost'); st.route = () => route; st._force = () => { lastSwitch = 0; };
  return st;
}
const arrowOf = s => s.type === 'arrive' ? '⚑' : s.modifier.includes('left') ? '⬅' : s.modifier.includes('right') ? '➡' : s.modifier === 'uturn' ? '⮌' : '⬆';
