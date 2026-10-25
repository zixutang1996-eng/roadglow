// v0.9.13 overflow checker (injected): visible UI elements that (a) leave the screen, (b) stick out of their card/panel horizontally, (c) have clipped text without ellipsis/scroll.
(() => {
  const W = innerWidth, H = innerHeight, bad = [], roots = ['#top', '#panel', '#drawer', '#layersPop', '#suggest', '#navBanner', '#navFoot', '#controls', '#toast', '#chips', '#areaPill', '.modal', '.sheet'];
  const visible = e => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 0.5 && r.height > 0.5; };
  const hidden = e => { for (let a = e; a; a = a.parentElement) if (a.classList?.contains('hidden') || getComputedStyle(a).display === 'none') return true; return false; };
  const scroller = e => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX + cs.overflowY)) return a; } return null; };
  const nm = e => (e.id ? '#' + e.id : e.tagName.toLowerCase()) + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ` "${(e.innerText || '').trim().slice(0, 24)}"`;
  for (const rs of roots) for (const root of document.querySelectorAll(rs)) { if (hidden(root) || !visible(root)) continue; const rr = root.getBoundingClientRect();
    if (rr.left < -1 || rr.right > W + 1 || rr.top < -1 || rr.bottom > H + 1) bad.push(['offscreen', nm(root), [rr.left, rr.top, rr.right, rr.bottom].map(Math.round)]);
    for (const e of root.querySelectorAll('*')) { if (!visible(e) || e.closest('.maplibregl-canvas,canvas,svg *')) continue; const r = e.getBoundingClientRect(), sc = scroller(e);
      const box = sc ? sc.getBoundingClientRect() : rr; const inScrollY = sc && /(auto|scroll)/.test(getComputedStyle(sc).overflowY);
      if (r.right > box.right + 1.5 || r.left < box.left - 1.5) { if (!(sc && /(auto|scroll)/.test(getComputedStyle(sc).overflowX))) bad.push(['x-overflow', nm(e), Math.round(r.left - box.left), Math.round(r.right - box.right), sc ? nm(sc) : rs]); }
      if (!inScrollY && !sc && (r.bottom > H + 1 || r.top < -1)) bad.push(['offscreen-y', nm(e)]);
      const cs = getComputedStyle(e); if (e.children.length === 0 && e.textContent.trim() && e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && cs.textOverflow !== 'ellipsis' && !/(auto|scroll)/.test(cs.overflowX) && cs.display !== 'inline') bad.push(['text-clip', nm(e), e.scrollWidth, e.clientWidth]);
    } }
  const seen = new Set(); return bad.filter(b => { const k = b.slice(0, 2).join('|'); return !seen.has(k) && seen.add(k); }).slice(0, 40);
})()
