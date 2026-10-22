// Overlap check: every visible icon (svg/.i/.uic/img/::before glyph boxes are not reachable, so svg + .i + img) vs every visible text run.
// Text boxes come from Range rects of text nodes; reports pairs whose rectangles intersect by > 1px in both axes, and text clipped by its own box.
(() => {
  const vis = el => { const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const roots = [...document.querySelectorAll('#top,#panel,#drawer.open,#layersPop,#navBanner,#navFoot,#toast,#controls,#areaPill')].filter(vis);
  const icons = [], texts = [], out = [];
  for (const root of roots) {
    for (const el of root.querySelectorAll('svg,img,.i,.uic')) if (vis(el) && !el.closest('svg svg')) icons.push(el);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { if (!n.textContent.trim() || !n.parentElement || !vis(n.parentElement) || n.parentElement.closest('svg,.i,style')) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (r.width > 1) texts.push({ r, t: n.textContent.trim().slice(0, 24), el: n.parentElement }); }
  }
  const clipR = (el, r) => { let x = { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (s.overflow !== 'visible' || s.overflowX !== 'visible' || s.overflowY !== 'visible') { const q = p.getBoundingClientRect(); x = { left: Math.max(x.left, q.left), top: Math.max(x.top, q.top), right: Math.min(x.right, q.right), bottom: Math.min(x.bottom, q.bottom) }; } } return x.right - x.left > 1 && x.bottom - x.top > 1 ? x : null; };
  const onTop = (el, r) => { const h = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2); return h && (h === el || el.contains(h) || h.contains(el)); };
  const T2 = texts.map(t => ({ ...t, r: clipR(t.el, t.r) })).filter(t => t.r && onTop(t.el, t.r)); texts.length = 0; texts.push(...T2);
  const I2 = icons.filter(ic => { const r = clipR(ic, ic.getBoundingClientRect()); return r && onTop(ic, r); }); icons.length = 0; icons.push(...I2);
  const ix = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  const name = el => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')) + (el.closest('[id]') ? ' in #' + el.closest('[id]').id : '');
  for (const ic of icons) { const a = ic.getBoundingClientRect(); for (const t of texts) if (!ic.contains(t.el) && ix(a, t.r)) out.push({ kind: 'icon×text', icon: name(ic), text: t.t }); }
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) { const A = texts[i], B = texts[j]; if (A.el !== B.el && !A.el.contains(B.el) && !B.el.contains(A.el) && ix(A.r, B.r)) out.push({ kind: 'text×text', a: A.t, b: B.t }); }
  return out.slice(0, 60);
})()
