// v0.9.7 "scroll window" animation hook, enabled by a skin pack (skin.fx: ["scroll"] → <html class="fx-scroll">).
// The pack CSS owns the look; this module only (1) measures a window when it opens (--rh, one layout read before the first
// animated frame) and (2) keeps a closing window painted for the roll-back animation while it is already logically hidden
// (.hidden stays on, so app state, the back button and hit-testing are always truthful).
// State machine per window: idle → opening → idle, idle → closing → idle; a reversal mid-way starts the opposite animation
// at the mirrored progress (negative delay), so rapid toggles never jump, flicker or leave a window stuck.
// Animated properties are transform / opacity / clip-path only (via the registered --rgcut length).
const TARGETS = ['#panel', '#suggest', '#toast'];
const DUR = { open: 320, close: 280 };
const enabled = () => document.documentElement.classList.contains('fx-scroll') && !matchMedia('(prefers-reduced-motion: reduce)').matches;
const NAMES = { open: /^(rg-unroll|rg-tin)$/, close: /^(rg-rollup|rg-tin)$/ };
function clear(el) {
  const a = el._rg; if (!a) return 0;
  clearTimeout(a.t); el.removeEventListener('animationend', a.end); el.classList.remove('rg-unroll', 'rg-rollup');
  el.style.removeProperty('animation-delay'); if (a.kind === 'close') el.style.removeProperty('display');
  el._rg = null; return Math.min(1, (performance.now() - a.t0) / DUR[a.kind]);
}
function run(el, kind) {
  const prev = el._rg, p = prev ? clear(el) : 1; // progress of an interrupted animation (1 = none running)
  if (!enabled()) return;
  if (kind === 'close') { el.style.setProperty('display', el._rgDisp || 'block', 'important'); el.setAttribute('aria-hidden', 'true'); } else el.removeAttribute('aria-hidden');
  el.style.setProperty('--rh', el.offsetHeight + 'px');
  const skip = prev ? (1 - p) * DUR[kind] : 0; if (skip > 0) el.style.setProperty('animation-delay', -Math.round(skip) + 'ms');
  const cls = kind === 'open' ? 'rg-unroll' : 'rg-rollup', t0 = performance.now() - skip;
  const end = e => { if (e && (e.target !== el || e.pseudoElement || !NAMES[kind].test(e.animationName))) return; if (el._rg?.end === end) { clear(el); if (kind === 'close') el.removeAttribute('aria-hidden'); } };
  el._rg = { kind, end, t0, t: setTimeout(end, DUR[kind] - skip + 150) };
  el.addEventListener('animationend', end); el.classList.add(cls);
}
export function initScrollFx() {
  const mo = new MutationObserver(recs => {
    const first = new Map(); // coalesce: compare the state before the first change with the state now
    for (const r of recs) if (r.attributeName === 'class' && !first.has(r.target)) first.set(r.target, (r.oldValue || '').split(/\s+/).includes('hidden'));
    for (const [el, was] of first) {
      const now = el.classList.contains('hidden');
      if (!now) { const d = getComputedStyle(el).display; if (d && d !== 'none') el._rgDisp = d; }
      if (was === now) continue;
      if (!enabled()) { clear(el); continue; }
      run(el, now ? 'close' : 'open');
    }
  });
  for (const s of TARGETS) { const el = document.querySelector(s); if (el) mo.observe(el, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }); }
  // rotation / resize while a window is rolling: re-measure so the rod stays on the paper edge
  addEventListener('resize', () => { for (const s of TARGETS) { const el = document.querySelector(s); if (el?._rg) el.style.setProperty('--rh', el.offsetHeight + 'px'); } }, { passive: true });
}
/** Kept for callers: re-opening a window that is still rolling up is handled by the observer (class change). */
export function fxReopen() {}
