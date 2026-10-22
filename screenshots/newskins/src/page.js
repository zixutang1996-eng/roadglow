import {OPS} from './ops.js';
import * as maplibregl from '/web/node_modules/maplibre-gl/dist/maplibre-gl.mjs';
import {style} from './style.js';
const q=new URLSearchParams(location.search), skin=q.get('skin'), mode=q.get('mode'), scr=q.get('scr'), key=skin+'_'+mode;
document.body.className=`${skin} ${mode} s-${scr}`;
const R=await (await fetch('route.json')).json(), geo=R.routes[0].geometry;
const st=style(key,scr==='nav'); st.glyphs=location.origin+st.glyphs;
const nav=scr==='nav';
const map=new maplibregl.Map({container:'map',style:st,attributionControl:false,localIdeographFontFamily:'Noto Sans CJK SC',
 center:nav?[-113.4965,53.5412]:scr==='place'?[-113.512,53.528]:[-113.4985,53.5395],zoom:nav?15.6:scr==='place'?13.6:13.4,pitch:nav?52:0,bearing:nav?-12:0,fadeDuration:0,pixelRatio:2});
window._map=map;
const C={space:{light:['#d8462b','#1f1f1f'],dark:['#e9e6dc','#000']},nord:{light:['#34312b','#f4f1e8'],dark:['#e8e2d0','#0f1113']},tac:{dark:['#d7ff3a','#000'],light:['#e0571f','#1a1c15']}}[skin][mode];
map.on('load',()=>{ if(nav||scr==='place'){map.getSource('route').setData({type:'Feature',geometry:geo});
 map.setPaintProperty('route','line-color',C[0]);map.setPaintProperty('route-case','line-color',C[1]);map.setPaintProperty('route-case','line-opacity',.55);
 if(skin==='tac')map.setPaintProperty('route','line-dasharray',[1.2,.8]);}
 const g=geo.coordinates,A=g[0],B=g[g.length-1];
 if(scr==='place'){map.fitBounds([[Math.min(A[0],B[0]),Math.min(A[1],B[1])],[Math.max(A[0],B[0]),Math.max(A[1],B[1])]],{padding:{top:200,bottom:470,left:50,right:80},duration:0});}
 if(nav){const k=6,P=g[k],Q=g[k+3];const br=Math.atan2((Q[0]-P[0])*Math.cos(P[1]*Math.PI/180),Q[1]-P[1])*180/Math.PI;map.jumpTo({center:P,bearing:br,zoom:16.3,pitch:55,padding:{top:420,bottom:0}});}
 map.once('idle',()=>{const pos=(sel,ll)=>{const e=document.querySelector(sel);if(e){const p=map.project(ll);e.style.left=p.x+'px';e.style.top=p.y+'px';}};
  if(scr==='place'){pos('.me',A);pos('.pin',B);} else if(nav){pos('.arrow',map.getCenter());document.querySelector('.me')?.remove();}
  setTimeout(()=>window._ready=1,300);});});
// ---------- SVG bits ----------
const I={
 search:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>',
 menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
 layers:'<svg viewBox="0 0 24 24"><path d="M12 3 2.5 8 12 13l9.5-5z"/><path d="M2.5 12.5 12 17.5l9.5-5M2.5 16.5 12 21.5l9.5-5"/></svg>',
 loc:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
 compass:'<svg viewBox="0 0 24 24"><path d="M12 3l3 9-3 9-3-9z"/><path class="f" d="M12 3l3 9H9z"/></svg>',
 x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
 dir:'<svg viewBox="0 0 24 24"><path d="M12 2.5 21.5 12 12 21.5 2.5 12z"/><path d="M9 14v-3h5M12 8.5l2.5 2.5L12 13.5"/></svg>',
 star:'<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7z"/></svg>',
 share:'<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6"/></svg>',
 phone:'<svg viewBox="0 0 24 24"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
 clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>',
 pin:'<svg viewBox="0 0 24 24"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
 right:'<svg viewBox="0 0 48 48"><path d="M16 42V24a6 6 0 0 1 6-6h14"/><path d="M30 10l8 8-8 8"/></svg>',
 mic:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
 home:'<svg viewBox="0 0 24 24"><path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5"/></svg>',
 list:'<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
 globe:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/></svg>',
 tool:'<svg viewBox="0 0 24 24"><path d="M14.5 5.5a4 4 0 0 0 5 5L11 19a2.1 2.1 0 0 1-3-3l8.5-8.5"/></svg>',
 gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>',
 upd:'<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
 brush:'<svg viewBox="0 0 24 24"><path d="M4 20c3 0 5-1.5 5-4a2.5 2.5 0 0 0-5 0c0 2-1 3-1 4zM10 14 20 4"/></svg>',
};
const T={ // per-skin text
 space:{brand:'ROADGLOW',sub:'NAV · SYS 01',coord:'53.5444°N  113.4909°W',search:'搜索地点或地址'},
 nord:{brand:'RoadGlow',sub:'地图 · 行旅',coord:'',search:'搜索地点'},
 tac:{brand:'ROADGLOW',sub:'OPS // GRID 12U',coord:'12U VE 331 357',search:'搜索目标 / 地址'},
}[skin];
// ornaments
const capL='<svg class="cap" viewBox="0 0 26 22"><path d="M24 2 L6 11 L24 20"/><path d="M17 5.5 L10 11 L17 16.5 L22 11 Z"/><path d="M1 11 H8"/><path d="M13 3 L19 8 M13 19 L19 14"/></svg>';
const capR=capL.replace('class="cap"','class="cap r"');
const tbar=(t,cls='')=>`<div class="tbar ${cls}">${capL}<i class="tl"></i>${t?`<span>${t}</span><i class="tl"></i>`:''}${capR}</div>`;
const ecg=(w,h=20,seed=1)=>{let d=`M0 ${h/2}`,x=0;const r=i=>Math.abs(Math.sin(i*12.9898+seed)*43758.5453)%1;
 for(let i=0;x<w*0.4;i++){x+=4;const a=(r(i)*0.8+0.2)*h*0.32*(x/(w*.4));d+=` L${x} ${h/2-a} L${x+2} ${h/2+a}`;x+=2;}
 d+=` L${x+=6} ${h/2} L${x+=4} ${h/2-2} L${x+=4} ${h/2} L${x+=3} ${h/2+3} L${x+=4} 1 L${x+=4} ${h-1} L${x+=3} ${h/2} L${x+=8} ${h/2-3} L${x+=6} ${h/2}`;
 for(let i=0;x<w-4;i++){x+=4;const a=(r(i+50)*0.8+0.2)*h*0.3*Math.max(0,1-(x-w*.55)/(w*.45));d+=` L${x} ${h/2-a} L${x+2} ${h/2+a}`;x+=2;}
 return `<svg class="ecg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d} L${w} ${h/2}"/></svg>`;};
const reticle='<svg class="ret" viewBox="0 0 64 64"><circle cx="32" cy="32" r="17"/><path d="M32 7v9M32 48v9M7 32h9M48 32h9M32 25v3M32 36v3M25 32h3M36 32h3"/><circle class="dot" cx="32" cy="32" r="1.8"/><path class="hd" d="M28.5 4 L32 0.5 L35.5 4"/></svg>';
const operator=OPS.A3;
const stripes='<i class="stripes"><b></b><b></b><b></b><b></b></i>';
const knot=w=>`<svg class="knot" viewBox="0 0 ${w} 14" preserveAspectRatio="none"><path d="M0 7H${w/2-22}M${w/2+22} 7H${w}"/><g transform="translate(${w/2} 7)"><path d="M-14 0l7-6 7 6-7 6z M0 0l7-6 7 6-7 6z"/><path d="M-21 0l3.5-3 3.5 3-3.5 3zM14 0l3.5-3 3.5 3-3.5 3z"/></g></svg>`;
const div={space:'<div class="dv"><span>— —</span></div>',nord:'<div class="dv">'+knot(400)+'</div>',tac:'<div class="dv">'+ecg(290,18,3)+'</div>'}[skin];
const SEC=t=>skin==='nord'?tbar(t,'sec2'):`<div class="sec">${t}</div>`;
const emblem={
 space:`<svg class="emb" viewBox="0 0 200 110"><g fill="none" stroke="currentColor" stroke-width="1"><ellipse cx="100" cy="55" rx="88" ry="22" transform="rotate(-12 100 55)" opacity=".55"/><ellipse cx="100" cy="55" rx="60" ry="15" transform="rotate(-12 100 55)" opacity=".8"/><circle cx="100" cy="55" r="16"/><path d="M84 55h32" opacity=".5"/></g><circle cx="158" cy="38" r="3.2" fill="currentColor"/><circle cx="46" cy="70" r="1.8" fill="currentColor" opacity=".7"/><text x="100" y="106" text-anchor="middle" font-family="IBM Plex Mono" font-size="8" letter-spacing="3" fill="currentColor" opacity=".6">RG-01 · ORBITAL NAV</text></svg>`,
 nord:`<svg class="emb" viewBox="0 0 200 110"><g fill="none" stroke="currentColor" stroke-width="1.3"><path d="M100 8 L112 55 L100 102 L88 55Z"/><path d="M53 55 L100 43 L147 55 L100 67Z"/><circle cx="100" cy="55" r="26" opacity=".6"/><circle cx="100" cy="55" r="33" opacity=".35"/><path d="M76 31l48 48M124 31l-48 48" opacity=".35"/></g><path d="M100 8 L112 55 L100 55Z M53 55 L100 43 L100 55Z" fill="currentColor" opacity=".55"/></svg>`,
 tac0:`<svg class="emb" viewBox="0 0 200 110"><g fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="100" cy="50" r="28" opacity=".7"/><circle cx="100" cy="50" r="3"/><path d="M100 14v18M100 68v18M64 50h18M118 50h18"/><path d="M70 22h-8v8M130 22h8v8M70 78h-8v-8M130 78h8v-8"/></g><text x="100" y="104" text-anchor="middle" font-family="Barlow Condensed" font-weight="600" font-size="11" letter-spacing="4" fill="currentColor" opacity=".7">OPERATOR · RG-01</text></svg>`,
}[skin]; const EMB=skin==='tac'?operator:emblem;
const X=`<button class="xb">${I.x}</button>`;
const status=`<div class="sb"><span>21:11</span><span class="sbr">5G ▮▮▮ 86%</span></div>`;
const searchbar=(active)=>`<div class="search card ${active?'on':''}"><span class="ic">${active?I.search:I.menu}</span><span class="ph ${active?'typed':''}">${active?'咖啡<i class="caret"></i>':T.search}</span>${active?X:`<span class="ic">${I.mic}</span>`}</div>`;
const strip=`<div class="strip card">${[I.layers,I.compass,I.loc].map(s=>`<button class="ic">${s}</button>`).join('<i class="sep"></i>')}</div>`;
const fab=`<button class="fab">${I.dir}</button>`;
const hud=skin==='tac'?`<div class="hudc"><span>${T.coord}</span><span>ALT 668M · Z13</span></div><div class="gridlbl">${'ABCDEFG'.split('').map(c=>`<b>${c}</b>`).join('')}</div><div class="gridlblv">${[1,2,3,4,5,6,7,8].map(c=>`<b>${c}</b>`).join('')}</div>`:skin==='space'?`<div class="hudc"><span>${T.coord}</span><span>ALT 668 M</span></div>`:'';
const me=skin==='tac'?`<div class="me ret-w">${reticle}</div>`:`<div class="me"><i></i></div>`;
let ui='';
if(scr==='map') ui=status+searchbar()+strip+fab+hud+me+`<div class="scale"><i></i><span>500 m</span></div>`;
if(scr==='drawer'){
 const it=(ic,t,s,b)=>`<div class="di"><span class="ic">${ic}</span><span class="dt">${t}${s?`<em>${s}</em>`:''}</span>${b?`<span class="badge">${b}</span>`:''}</div>`;
 ui=status+searchbar()+strip+me+`<div class="scrim"></div><div class="drawer card">
 <div class="dh"><div><div class="brand">${T.brand}</div><div class="bsub">${T.sub}</div></div>${X}</div>${skin==='space'?stripes:''}${skin==='tac'?'<div class="hecg">'+ecg(220,22,7)+'<span>SIG ▲ 98 BPM</span></div>':''}
 ${SEC("我的")}${it(I.home,'我的地点','家 · 公司')}${it(I.star,'收藏列表','3 个列表')}${it(I.clock,'历史记录')}
 ${skin==='nord'?'':div}${SEC("发现")}${it(I.globe,'探索周边')}${it(I.tool,'工具','离线地图 · 测距')}
 ${skin==='nord'?'':div}${SEC("设置")}${it(I.brush,'地图风格',{space:'深空',nord:'北境',tac:'战术'}[skin])}${it(I.gear,'设置')}${it(I.upd,'检查更新','v0.9.4','新')}
 <div class="embw">${EMB}</div></div>`;}
if(scr==='search'){
 const r=(ic,t,s,d)=>`<div class="ri"><span class="ic">${ic}</span><span class="dt">${t}<em>${s}</em></span><span class="dist">${d}</span></div>`;
 ui=status+searchbar(1)+me+`<div class="dd card">${skin==='nord'?tbar('搜 索','ttl'):''}<div class="chips">${['餐厅','咖啡','加油站','停车场','超市'].map((c,i)=>`<span class="chip ${i==1?'on':''}">${c}</span>`).join('')}</div>
 ${skin==='nord'?'':div.replace('dv','dv sm')}${SEC("结果")}
 ${r(I.pin,'Credo 咖啡','104 街 NW · 营业中','0.4 km')}${r(I.pin,'Transcend 咖啡','Jasper 大道 · 营业中','0.9 km')}${r(I.pin,'Little Brick 咖啡馆','Riverdale · 08:00 开门','2.1 km')}
 ${SEC("最近搜索")}${r(I.clock,'埃德蒙顿谷动物园','13315 Buena Vista Rd','4.5 km')}${r(I.clock,'省议会大厦','10800 97 Ave NW','1.3 km')}</div>`;}
if(scr==='place'){
 ui=status+searchbar()+strip+me+`<div class="pin"><i>${I.pin}</i></div><div class="pc card"><div class="grab"></div>
 ${skin==='nord'?tbar('地 点','ttl'):''}<div class="ph1"><div><div class="kick">${{space:'目的地 · DEST',nord:'地点',tac:'目标 // OBJ-01'}[skin]}</div><h2>埃德蒙顿谷动物园</h2><div class="meta">动物园 · <b>营业中</b> · 至 17:00</div></div>${X}</div>
 ${skin==='space'?stripes:''}
 <div class="stats"><div><b>4.5</b><em>公里</em></div><div><b>8</b><em>分钟</em></div><div><b>4.4★</b><em>评分</em></div></div>
 <div class="acts"><button class="pri">${I.dir}<span>路线</span></button><button>${I.star}<span>收藏</span></button><button>${I.share}<span>分享</span></button><button>${I.phone}<span>电话</span></button></div>
 ${div}<div class="addr"><span class="ic">${I.pin}</span>13315 Buena Vista Rd NW, Edmonton</div></div>`;}
if(scr==='style'){
 const sk=[['深空','space'],['北境','nord'],['战术','tac'],['霓虹城市','neon'],['边疆墨卷','west']];
 ui=status+searchbar()+strip+me+`<div class="scrim lite"></div><div class="sp card">${skin==='nord'?tbar('地图风格','ttl big'):''}<div class="dh"><div><div class="brand sm">地图风格</div><div class="bsub">${{space:'SKIN · SELECT',nord:'选择你的地图',tac:'LOADOUT // MAP'}[skin]}</div></div>${X}</div>
 <div class="skins">${sk.map(([n,k])=>`<div class="sw ${k===skin?'on':''}"><i class="th th-${k}"></i><span>${n}</span></div>`).join('')}</div>
 ${div}<div class="row"><span>外观</span><div class="seg"><b>自动</b><b class="${mode==='light'?'on':''}">浅色</b><b class="${mode==='dark'?'on':''}">深色</b></div></div>
 <div class="row"><span>卫星底图</span><i class="tog ${skin==='tac'?'on':''}"></i></div><div class="row"><span>3D 建筑</span><i class="tog on"></i></div></div>`;}
if(scr==='nav'){
 const cb=skin!=='space'?`<div class="cbar"><div class="cbt">${['NW','','N','','NE','','E','','SE'].map(c=>`<span class="${c.length==1?'card1':''}">${c||'·'}</span>`).join('')}</div><i class="mk"></i><i class="obj"></i></div>`:'';
 ui=status+cb+`<div class="nv card">${skin==='nord'?tbar('','navt'):''}${skin==='tac'?'<div class="necg">'+ecg(420,16,11)+'</div>':''}<span class="big">${I.right}</span><div><div class="nd">126<small> 米</small></div><div class="ns">右转进入 <b>99 Avenue NW</b></div></div></div>
 <div class="nv2 card"><span>然后</span>${I.right.replace('48 48','48 48" style="transform:scaleX(-1)')}<span>左转 · Bellamy Hill</span></div>
 <div class="spd card"><b>42</b><em>km/h</em></div>
 <div class="nb card"><div class="eta"><b>21:19</b><em>到达</em></div><div class="eta"><b>8</b><em>分钟</em></div><div class="eta"><b>4.3</b><em>公里</em></div><button class="end">结束</button></div><div class="arrow"><i></i></div>`;}
document.getElementById('ui').innerHTML=ui;
