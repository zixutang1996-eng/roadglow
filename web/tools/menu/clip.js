// v0.9.9 scroll audit: every visible overlay must either fit the viewport or scroll (overflow auto + overscroll contain),
// and its last item must be reachable by scrolling. Returns a list of problems ([] = pass).
(()=>{const out=[];const vis=e=>e&&!e.classList.contains('hidden')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 const sels=['#drawer.open','#panel','#layersPop','#suggest','.card.listpick','.card.pickbar'];
 for(const sel of sels){for(const el of document.querySelectorAll(sel)){if(!vis(el))continue;if(sel==='#drawer.open'&&el.classList.contains('closing'))continue;
  const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
  const sc=[el,...el.querySelectorAll('*')].find(x=>/(auto|scroll)/.test(getComputedStyle(x).overflowY)&&x.scrollHeight>x.clientHeight+2);
  const over=el.scrollHeight>el.clientHeight+2||r.bottom>innerHeight+1;
  if(over&&!sc&&!/(auto|scroll)/.test(cs.overflowY))out.push(sel+': content exceeds box/screen and nothing scrolls');
  if(r.bottom>innerHeight+2&&r.top<innerHeight)out.push(sel+': box extends below screen by '+Math.round(r.bottom-innerHeight)+'px');
  if(sc){if(getComputedStyle(sc).overscrollBehaviorY!=='contain')out.push(sel+': scroller lacks overscroll-behavior:contain');
   const st=sc.scrollTop;sc.scrollTop=1e6;const vr=sc.getBoundingClientRect(),lim=Math.min(vr.bottom,innerHeight);
   const last=[...sc.querySelectorAll('button,a,input,select,b,.di,.pkrow,label')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').pop();
   if(last){const lr=last.getBoundingClientRect();if(lr.bottom>lim+2)out.push(sel+': last item unreachable ('+Math.round(lr.bottom-lim)+'px hidden)');}
   sc.scrollTop=st;}}}
 return out;})()
