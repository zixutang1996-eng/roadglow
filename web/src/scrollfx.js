// v0.9.6 "scroll window" animation hook, enabled by a skin pack (skin.fx: ["scroll"] → <html class="fx-scroll">).
// The pack CSS owns the look; this module only (1) measures a window once when it opens (--rh, one layout read, before the
// first animated frame) and (2) keeps a closing window visible for the roll-back animation, then really hides it.
// All animated properties are transform / opacity / clip-path (compositor), never layout.
const TARGETS = ['#panel', '#suggest', '#layersPop', '#toast'];
const DUR = 340;
const enabled = () => document.documentElement.classList.contains('fx-scroll') && !matchMedia('(prefers-reduced-motion: reduce)').matches;
function done(el, cls, fn) { let t; const end = e => { if (e && e.target !== el) return; clearTimeout(t); el.removeEventListener('animationend', end); el.classList.remove(cls); fn?.(); }; el.addEventListener('animationend', end); t = setTimeout(end, DUR + 120); }
function unroll(el) { el.classList.remove('rg-rollup'); el.style.setProperty('--rh', el.offsetHeight + 'px'); el.classList.add('rg-unroll'); done(el, 'rg-unroll'); }
function rollup(el) {
  el._rgClosing = true; el.style.setProperty('--rh', el.offsetHeight + 'px'); el.classList.remove('rg-unroll');
  el.classList.remove('hidden'); el.classList.add('rg-rollup'); el.setAttribute('aria-hidden', 'true');
  done(el, 'rg-rollup', () => { if (el._rgClosing) { el._rgClosing = false; el._rgMute = true; el.classList.add('hidden'); el.removeAttribute('aria-hidden'); } });
}
export function initScrollFx() {
  const mo = new MutationObserver(recs => {
    const muted = new Set();
    for (const r of recs) {
      const el = r.target.closest ? (TARGETS.some(s => r.target.matches(s)) ? r.target : r.target.closest(TARGETS.join(','))) : null; if (!el) continue;
      if (r.type === 'childList') { if (el._rgClosing && el.id === 'suggest') { el._rgClosing = false; el.classList.remove('rg-rollup'); el.removeAttribute('aria-hidden'); } continue; } // re-opened with new content while rolling up
      if (r.target !== el || r.attributeName !== 'class') continue;
      if (el._rgMute) { muted.add(el); continue; }
      const was = (r.oldValue || '').split(/\s+/).includes('hidden'), now = el.classList.contains('hidden');
      if (was === now || !enabled()) continue;
      if (was && !now && !el._rgClosing) unroll(el); else if (!was && now) rollup(el);
    }
    for (const el of muted) el._rgMute = false;
  });
  for (const s of TARGETS) { const el = document.querySelector(s); if (el) mo.observe(el, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, childList: true }); }
}
/** The app re-opened a window that is still rolling up (e.g. a new place card): cancel the close and unroll again. */
export function fxReopen(el) { if (!el || !el._rgClosing) return; el._rgClosing = false; el.classList.remove('rg-rollup'); el.removeAttribute('aria-hidden'); if (enabled()) unroll(el); }
