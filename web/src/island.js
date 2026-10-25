// v0.9.13 right-side quick-button island (#controls): long-press ~1 s then drag to move; position persisted; auto-avoids the nav card,
// nav footer, place panel and search bar whenever they appear or resize (ResizeObserver/MutationObserver). Shared phone UI → every skin/pack.
const KEY = 'ctlPos', HOLD = 900, PAD = 8;
const vv = () => ({ w: innerWidth, h: innerHeight });
let PR; const inset = n => { if (!PR) { PR = document.createElement('div'); PR.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:var(--sat,0px) var(--sar,0px) var(--sab,0px) var(--sal,0px)'; document.body.appendChild(PR); }
  const cs = getComputedStyle(PR); return parseFloat(cs[{ '--sat': 'paddingTop', '--sar': 'paddingRight', '--sab': 'paddingBottom', '--sal': 'paddingLeft' }[n]]) || 0; };
const vis = el => { if (!el) return null; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.classList.contains('hidden')) return null; const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 ? r : null; };
const hit = (a, b) => a.left < b.right + PAD && a.right > b.left - PAD && a.top < b.bottom + PAD && a.bottom > b.top - PAD;
/** pure: pick a free spot for box (w×h) near the wanted top-left (x,y) avoiding obstacle rects, inside the safe frame. Exported for tests. */
export function solve(want, w, h, obs, fr) {
  const clamp = (x, y) => ({ x: Math.min(Math.max(x, fr.l), fr.r - w), y: Math.min(Math.max(y, fr.t), fr.b - h) });
  const ok = p => !obs.some(o => hit({ left: p.x, top: p.y, right: p.x + w, bottom: p.y + h }, o));
  let p = clamp(want.x, want.y); if (ok(p)) return p;
  const cand = []; for (const x of [p.x, fr.r - w, fr.l]) { cand.push(clamp(x, p.y)); for (const o of obs) { cand.push(clamp(x, o.bottom + PAD + 1), clamp(x, o.top - PAD - 1 - h)); } }
  const good = cand.filter(ok).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)); if (good[0]) return good[0];
  // nothing fits at full height (e.g. nav card x1.5 + footer): take the tallest free vertical gap in a column and shrink (#controls scrolls)
  let best = null; for (const x of [p.x, fr.r - w, fr.l]) { const col = obs.filter(o => x < o.right + PAD && x + w > o.left - PAD).map(o => [o.top - PAD, o.bottom + PAD]).sort((a, b) => a[0] - b[0]);
    let y0 = fr.t; for (const [t, b] of [...col, [fr.b, fr.b]]) { const gh = Math.min(t, fr.b) - y0 - 1; if (gh > 0 && (!best || gh > best.h + 0.5)) best = { x, y: y0 + 1, h: gh }; y0 = Math.max(y0, b); } }
  return best && best.h >= 56 ? best : p;
}
export function initIsland(store, toast) {
  const el = document.getElementById('controls'); if (!el || el._isl) return; el._isl = 1;
  const ro = new ResizeObserver(() => later()), mo = new MutationObserver(ms => { if (ms.some(m => !el.contains(m.target))) later(); });
  let saved = store.get(KEY, null), dragging = false, moved = false, timer = 0, sx = 0, sy = 0, ox = 0, oy = 0, raf = 0;
  const frame = () => { const { w, h } = vv(); return { l: 6 + inset('--sal'), t: 6 + inset('--sat'), r: w - 6 - inset('--sar'), b: h - 6 - inset('--sab') }; };
  const obstacles = () => ['#navBanner', '#navFoot', '#top', '#panel', '#layersPop', '#areaPill'].map(s => vis(document.querySelector(s))).filter(Boolean);
  const setXY = p => { el.style.setProperty('left', p.x + 'px', 'important'); el.style.setProperty('top', p.y + 'px', 'important'); el.style.setProperty('right', 'auto', 'important'); el.style.setProperty('bottom', 'auto', 'important'); };
  const clear = () => ['left', 'top', 'right', 'bottom'].forEach(k => el.style.removeProperty(k));
  const seen = new WeakSet(); function place() { raf = 0; if (dragging) return; for (const s of ['#navBanner', '#navFoot', '#panel']) { const n = document.querySelector(s); if (n && !seen.has(n)) { seen.add(n); ro.observe(n); } } const r = vis(el); if (!r) return; const fr = frame();
    let want; if (saved) want = { x: saved.fx * fr.r - r.width / 2, y: saved.fy * fr.b - r.height / 2 }; else { clear(); const r0 = el.getBoundingClientRect(); want = { x: r0.left, y: r0.top }; }
    const p = solve(want, r.width, r.height, obstacles(), fr); if (p.h) el.style.setProperty('max-height', p.h + 'px', 'important'); else el.style.removeProperty('max-height'); if (saved || p.h || Math.abs(p.x - want.x) > 1 || Math.abs(p.y - want.y) > 1) setXY(p); else clear(); }
  const later = () => { if (!raf) raf = requestAnimationFrame(place); };
  const down = e => { if (e.button > 0) return; sx = e.clientX; sy = e.clientY; moved = false; clearTimeout(timer);
    timer = setTimeout(() => { const r = el.getBoundingClientRect(); dragging = true; ox = sx - r.left; oy = sy - r.top; el.classList.add('isl-drag'); navigator.vibrate?.(30); try { el.setPointerCapture(e.pointerId); } catch { } }, HOLD); };
  const move = e => { if (!dragging) { if (Math.hypot(e.clientX - sx, e.clientY - sy) > 10) clearTimeout(timer); return; } e.preventDefault(); moved = true; const r = el.getBoundingClientRect(), fr = frame();
    setXY({ x: Math.min(Math.max(e.clientX - ox, fr.l), fr.r - r.width), y: Math.min(Math.max(e.clientY - oy, fr.t), fr.b - r.height) }); };
  const up = () => { clearTimeout(timer); if (!dragging) return; dragging = false; el.classList.remove('isl-drag'); const r = el.getBoundingClientRect(), fr = frame();
    saved = { fx: (r.left + r.width / 2) / fr.r, fy: (r.top + r.height / 2) / fr.b }; store.set(KEY, saved); later(); };
  el.addEventListener('pointerdown', down); addEventListener('pointermove', move, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  el.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  el.addEventListener('contextmenu', e => e.preventDefault());
  for (const s of ['#navBanner', '#navFoot', '#top', '#panel', '#layersPop']) { const n = document.querySelector(s); if (n) { ro.observe(n); mo.observe(n, { attributes: true, attributeFilter: ['class', 'style'] }); } }
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true }); addEventListener('resize', later); addEventListener('orientationchange', later); later();
  return { place: later, reset: () => { saved = null; store.set(KEY, null); later(); } };
}
