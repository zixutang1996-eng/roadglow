import * as maplibregl from '/web/node_modules/maplibre-gl/dist/maplibre-gl.mjs';
const q=new URLSearchParams(location.search), V=q.get('v'), scr=q.get('scr');
document.body.className=`${V} s-${scr}`;
document.body.style.setProperty('--paperimg',`url(paper_${V}.png)`);
const P={A:{ink:'#3b3733',land:'rgba(80,72,62,.07)',park:'rgba(70,80,60,.12)',water:'#4a4844',wa:.55,bld:'rgba(60,56,52,.22)',minor:'#7a7268',major:'#3b3733',mw:'#2a2724',lbl:'#2b2723',halo:'rgba(239,231,212,.85)',route:'#3d5f86'},
 B:{ink:'#1b1815',land:'rgba(40,32,24,.10)',park:'rgba(40,46,30,.16)',water:'#22201d',wa:.72,bld:'rgba(30,26,22,.34)',minor:'#5a5047',major:'#1f1c19',mw:'#141210',lbl:'#141210',halo:'rgba(232,220,192,.9)',route:'#2e5a8c'},
 C:{ink:'#d8cfbc',land:'rgba(220,210,190,.04)',park:'rgba(170,185,150,.07)',water:'#cfc6b2',wa:.22,bld:'rgba(215,205,185,.13)',minor:'#7d766b',major:'#bdb4a2',mw:'#e2d9c6',lbl:'#e4dac6',halo:'rgba(28,26,23,.9)',route:'#d2563b'}}[V];
const W=(a,b,c,d)=>['interpolate',['exponential',1.6],['zoom'],10,a,13,b,16,c,18,d];
const cls=(...c)=>['match',['get','class'],c,true,false];
const name=['coalesce',['get','name:zh'],['get','name:zh-Hans'],['get','name']];
const L=[{id:'bg',type:'background',paint:{'background-color':'#000','background-opacity':0}},
 {id:'landuse',type:'fill',source:'v','source-layer':'landuse',paint:{'fill-color':P.land}},
 {id:'park',type:'fill',source:'v','source-layer':'park',paint:{'fill-color':P.park}},
 {id:'wood',type:'fill',source:'v','source-layer':'landcover',filter:cls('wood','grass'),paint:{'fill-color':P.park}},
 // brush river: wide faint wash + body + dark core edge
 {id:'water-wash',type:'line',source:'v','source-layer':'water',paint:{'line-color':P.water,'line-opacity':P.wa*.35,'line-width':W(3,6,12,20),'line-blur':W(2,4,8,12)}},
 {id:'water',type:'fill',source:'v','source-layer':'water',paint:{'fill-color':P.water,'fill-opacity':P.wa}},
 {id:'water-edge',type:'line',source:'v','source-layer':'water',paint:{'line-color':P.water,'line-opacity':Math.min(1,P.wa+.25),'line-width':W(1,1.6,2.6,3.5)}},
 {id:'waterway',type:'line',source:'v','source-layer':'waterway',layout:{'line-cap':'round'},paint:{'line-color':P.water,'line-opacity':P.wa+.15,'line-width':W(1.5,3,6,10)}},
 {id:'bld',type:'fill',source:'v','source-layer':'building',minzoom:13.5,paint:{'fill-color':P.bld}}];
const road=(id,f,c,w,op=1)=>L.push({id,type:'line',source:'v','source-layer':'transportation',filter:f,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':c,'line-opacity':op,'line-width':W(...w)}});
road('minor',cls('minor','service','tertiary'),P.minor,[.2,.5,1.6,4],.45);
road('major-w',cls('primary','secondary','trunk'),P.major,[2,4,10,22],.12);
road('major',cls('primary','secondary','trunk'),P.major,[.7,1.6,4.2,9]);
road('mw-w',cls('motorway'),P.mw,[3,6,13,26],.14);
road('mw',cls('motorway'),P.mw,[1,2.4,5.5,12]);
L.push({id:'rail',type:'line',source:'v','source-layer':'transportation',filter:cls('rail'),paint:{'line-color':P.minor,'line-width':1,'line-dasharray':[4,3]}});
L.push({id:'route-w',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':P.route,'line-opacity':.25,'line-width':20,'line-blur':4}});
L.push({id:'route',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':P.route,'line-width':8,'line-opacity':.92}});
const t=(id,sl,f,size,ex={})=>L.push({id,type:'symbol',source:'v','source-layer':sl,filter:f,layout:{'text-field':name,'text-font':['IM FELL English Regular'],'text-size':size,'text-max-width':8,...ex.l},paint:{'text-color':ex.c||P.lbl,'text-halo-color':P.halo,'text-halo-width':1.6}});
t('wname','water_name',true,14,{l:{'text-letter-spacing':.3}});
t('rname','transportation_name',true,11.5,{l:{'symbol-placement':'line'}});
t('neigh','place',cls('neighbourhood','suburb','quarter'),12.5,{l:{'text-letter-spacing':.15}});
t('city','place',cls('city','town'),20,{l:{'text-letter-spacing':.3}});
const nav=scr==='nav';
const R=await (await fetch('route.json')).json(), geo=R.routes[0].geometry, g=geo.coordinates;
const map=new maplibregl.Map({container:'map',attributionControl:false,localIdeographFontFamily:'Noto Serif CJK SC',fadeDuration:0,pixelRatio:2,
 style:{version:8,glyphs:location.origin+'/web/public/glyphs/{fontstack}/{range}.pbf',sources:{v:{type:'vector',url:'https://tiles.openfreemap.org/planet'},route:{type:'geojson',data:{type:'FeatureCollection',features:[]}}},layers:L},
 center:scr==='place'?[-113.512,53.528]:[-113.4985,53.5395],zoom:13.4});
map.on('load',()=>{
 if(nav||scr==='place')map.getSource('route').setData({type:'Feature',geometry:geo});
 const A=g[0],B=g[g.length-1];
 if(scr==='place')map.fitBounds([[Math.min(A[0],B[0]),Math.min(A[1],B[1])],[Math.max(A[0],B[0]),Math.max(A[1],B[1])]],{padding:{top:140,bottom:480,left:50,right:80},duration:0});
 if(nav){const k=6,p=g[k],Q=g[k+3];const br=Math.atan2((Q[0]-p[0])*Math.cos(p[1]*Math.PI/180),Q[1]-p[1])*180/Math.PI;map.jumpTo({center:p,bearing:br,zoom:16.4,pitch:50,padding:{top:430,bottom:0}});}
 map.once('idle',()=>{const pos=(s,ll)=>{const e=document.querySelector(s);if(e){const p=map.project(ll);e.style.left=p.x+'px';e.style.top=p.y+'px';}};
  if(scr==='place'){pos('.me',A);pos('.pin',B);} if(nav)pos('.cart',map.getCenter());
  setTimeout(()=>window._ready=1,400);});});
// ---------- UI ----------
const ic=d=>`<svg class="ic" viewBox="0 0 24 24">${d}</svg>`;
const I={search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>',menu:'<path d="M4 7c5-1 11 1 16 0M4 12c5-1 11 1 16 0M4 17c4-1 7 0 10 0"/>',mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
 home:'<path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5"/>',food:'<path d="M5 3v8a3 3 0 0 0 6 0V3M8 3v18M17 3c-2 2-2 7 0 9v9"/>',tea:'<path d="M4 9h12v5a6 6 0 0 1-12 0zM16 10h2a2.5 2.5 0 0 1 0 5h-2M8 3c-1 2 1 3 0 5M12 3c-1 2 1 3 0 5"/>',fuel:'<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h14M15 9h2l2 2v7a1.5 1.5 0 0 1-3 0v-3h-1"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',pin:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
 loc:'<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',layers:'<path d="M12 3 2.5 8 12 13l9.5-5z"/><path d="M2.5 13 12 18l9.5-5"/>',
 x:'<path d="M6 6c4 4 8 8 12 12M18 6C14 10 10 14 6 18"/>',star:'<path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7z"/>',share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6"/>',
 list:'<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
 upd:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',brush:'<path d="M4 20c3 0 5-1.5 5-4a2.5 2.5 0 0 0-5 0c0 2-1 3-1 4zM10 14 20 4"/>',vol:'<path d="M4 9h4l5-4v14l-5-4H4zM16 9c1.5 1.5 1.5 4.5 0 6M18.5 6.5c3 3 3 8 0 11"/>',dir:'<path d="M12 2.5 21.5 12 12 21.5 2.5 12z"/><path d="M9 14v-3h5M12 8.5l2.5 2.5L12 13.5"/>'};
// brush border around a panel: A thin wash, B heavy, C pale
const brd=(w,h)=>{ if(V==='A')return ''; const sw=V==='B'?4.2:1.6, o=5;
 const r=`M${o+6} ${o+1} C${w*.3} ${o-1},${w*.7} ${o+2},${w+o-4} ${o} M${w+o} ${o+5} C${w+o+1} ${h*.4},${w+o-1} ${h*.7},${w+o} ${h+o-6} M${w+o-3} ${h+o} C${w*.6} ${h+o+1},${w*.3} ${h+o-1},${o+4} ${h+o} M${o} ${h+o-4} C${o-1} ${h*.6},${o+1} ${h*.3},${o+1} ${o+7}`;
 return `<svg class="brd" viewBox="0 0 ${w+10} ${h+10}" width="${w+10}" height="${h+10}"><path d="${r}" stroke-width="${sw}" stroke-linecap="round" opacity="${V==='B'?.9:.55}"/>${V==='B'?`<path d="${r}" stroke-width="1.2" transform="translate(2 2)" opacity=".35"/>`:''}</svg>`;};
const stroke=(op=1)=>`<svg class="stroke" viewBox="0 0 400 10" preserveAspectRatio="none"><path d="M2 6 C80 3,160 7,240 5 S360 4,398 5" stroke="var(--ink)" stroke-width="${V==='B'?3.2:1.8}" fill="none" stroke-linecap="round" opacity="${(V==='C'?.4:.55)*op}" filter="url(#rough)"/></svg>`;
const seal=(txt,s=30,fs)=>`<span class="seal" style="width:${txt.length==3?s*.7:s}px;height:${txt.length==3?s*1.4:s}px;font-size:${fs||s*.42}px;${txt.length>2?'writing-mode:vertical-rl;':''}">${txt}</span>`;
const mtn=(st)=>`<div class="mtn" style="background-image:url(mtn_${V}.png);${st}"></div>`;
const status=`<div class="status"><span>23:44</span><span>5G ▮▮▮ 86%</span></div>`;
const sb=(w=433)=>`<div class="panel search">${brd(w,56)}${ic(I.menu)}<span class="ph">${{A:'寻 地 点',B:'欲往何处',C:'夜行何处'}[V]}</span>${ic(I.mic)}${seal('行路',30)}</div>`;
const chips=`<div class="chips">${[['home','家'],['food','美食'],['tea','茶馆'],['fuel','加油'],['star','收藏']].map(([k,t])=>`<div class="chip"><span class="dot"><svg viewBox="0 0 24 24">${I[k]}</svg></span>${t}</div>`).join('')}</div>`;
const fabs=(b=150)=>`<div class="fab ink" style="right:16px;bottom:${b+70}px">${ic(I.layers)}</div><div class="fab ${V==='A'?'ink':'red'}" style="right:16px;bottom:${b}px">${ic(I.loc)}</div>`;
const mtns=mtn('left:-120px;bottom:-40px;width:480px;height:220px;opacity:.75')+mtn('right:-160px;top:150px;width:420px;height:190px;opacity:.35;transform:scaleX(-1)');
const me=`<div class="me" style="left:236px;top:560px"></div>`;
const scale=`<div class="scale">— 五百米 —</div>`;
let ui='';
if(scr==='map') ui=status+mtns+sb()+chips+me+fabs()+scale+(V!=='A'?`<div style="position:absolute;left:20px;bottom:70px">${seal('山河',40)}</div>`:'');
if(scr==='search'){const H=[['clock','长城文化茶社','杰斯珀大道 10220',1],['clock','老街面馆','惠特大道 8215',0],['pin','北岸河谷公园','河谷步道',1],['clock','中央图书馆','丘吉尔广场',0],['pin','惠特大道市集','82 街',0]];
 ui=status+chips+`<div class="scrim"></div>`+`<div class="panel drop">${mtn('left:-60px;right:-60px;bottom:-30px;height:200px;opacity:.28;background-size:cover')}${brd(433,560)}
 <div class="sec">${seal('往',26)}<span>往昔行迹</span><span style="margin-left:auto;font:13px 'Noto Serif CJK SC';color:var(--ink2)">清除</span></div>${stroke()}
 ${H.map(([k,a,b,h],i)=>`<div class="row"><span class="dot" style="width:36px;height:36px"><svg viewBox="0 0 24 24" style="width:18px;height:18px">${I[k]}</svg></span><div class="grow"><div class="t">${a}</div><div class="s">${b}</div></div>${h?`<svg class="heart" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>`:''}</div>${i<H.length-1?stroke(.6):''}`).join('')}
 <div class="sec" style="margin-top:6px">${seal('类',26)}<span>常寻</span></div>${stroke()}<div style="display:flex;gap:10px;padding:10px 20px;flex-wrap:wrap">${['美食','茶馆','客栈','药铺','加油','驿站'].map(x=>`<span class="btn">${x}</span>`).join('')}</div></div>`+`<div class="panel search" style="z-index:2">${brd(433,56)}${ic(I.x)}<span style="flex:1">茶</span>${ic(I.mic)}${seal('行路',30)}</div>`.replace('class="panel search"','class="panel search" ');}
if(scr==='drawer'){const M=[['star','收藏之地'],['list','行程清单'],['clock','往昔行迹'],['brush','皮肤与语音包'],['layers','地图风格'],['gear','设置'],['upd','检查更新']];
 ui=status+sb()+chips+me+`<div class="scrim"></div><div class="panel drawer">${brd(322,984)}${mtn('left:-80px;right:-80px;bottom:0;height:260px;opacity:.55;background-size:cover')}
 <div class="brand">RoadGlow ${seal('画不成',36,13)}</div><div class="bsub">世间无限丹青手</div>${stroke()}
 ${M.map(([k,t],i)=>`<div class="mi">${ic(I[k])}<span>${t}</span>${i===4?`<span style="margin-left:auto;font-size:12px;color:var(--red)">画不成</span>`:''}</div>${i===2||i===4?stroke(.7):''}`).join('')}
 <div style="position:absolute;bottom:34px;left:0;right:0;text-align:center;font-family:'Ma Shan Zheng';font-size:22px;color:var(--ink2)">一片伤心画不成</div>
 <div style="position:absolute;bottom:80px;right:28px">${seal('一片伤心',44,15)}</div></div>`;}
const cart=`<svg class="cart" viewBox="0 0 76 96" style="transform:scale(1.45);filter:url(#rough2) drop-shadow(0 4px 4px rgba(0,0,0,.35))">
 <g fill="var(--ink)" stroke="none">
 <!-- horse (top, pointing up) -->
 <path d="M38 2c3 0 5 3 5 7l-1 6c3 2 5 6 5 11l-1 8h-16l-1-8c0-5 2-9 5-11l-1-6c0-4 2-7 5-7z"/>
 <path d="M34 6l-3-3M42 6l3-3" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>
 <path d="M38 33c-1 4 0 7 0 9" stroke="var(--ink)" stroke-width="2.5"/>
 <!-- shafts -->
 <path d="M28 30l-2 18M48 30l2 18" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/>
 <!-- carriage body with canopy -->
 <path d="M20 46h36l2 6v28c0 4-3 6-6 6H24c-3 0-6-2-6-6V52z" opacity=".92"/>
 <path d="M16 50c7-5 37-5 44 0" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>
 <!-- wheels -->
 <rect x="11" y="56" width="6" height="22" rx="3"/><rect x="59" y="56" width="6" height="22" rx="3"/>
 </g>
 <path d="M26 58h24M26 66h24M26 74h24" stroke="var(--panel)" stroke-width="1.4" opacity=".55"/>
 <circle cx="38" cy="66" r="4.5" fill="var(--red)"/></svg>`;
if(scr==='nav'){const turn=`<svg class="turn" viewBox="0 0 48 48" style="filter:url(#rough)"><path d="M16 42V24a6 6 0 0 1 6-6h14"/><path d="M30 10l8 8-8 8"/></svg>`;
 ui=status+cart+`<div class="panel banner">${brd(437,118)}${turn}<div><div class="dist">三百米</div><div class="road">右转入 杰斯珀大道</div></div><div style="margin-left:auto;align-self:flex-start;margin-top:14px">${seal('右',30)}</div></div>
 <div class="panel" style="top:172px;left:12px;padding:8px 14px;font-size:14px;border-radius:18px">${brd(150,36)}随后 左转 · 一百米</div>
 ${mtn('left:-60px;right:-60px;top:-30px;height:170px;opacity:.0')}
 <div class="fab red" style="right:16px;bottom:250px">${ic(I.vol)}</div><div class="fab ${V==='A'?'ink':'red'}" style="right:16px;bottom:180px">${ic(I.search)}</div>
 <div class="fab ink" style="left:16px;bottom:180px;font-family:'Ma Shan Zheng';font-size:22px;flex-direction:column;line-height:1">40<span style="font:10px 'Noto Sans CJK SC'">公里/时</span></div>
 <div class="panel navcard">${brd(437,112)}<div><div class="eta">十二分</div><div class="etas">四点一公里 · 午夜 零点零二 到</div></div><span class="end">结束</span></div>`;}
if(scr==='place'){ui=status+sb()+`<div class="me"></div><div class="pin" style="position:absolute;margin:-42px 0 0 -16px">${seal('此',32)}</div>
 <div class="panel place">${brd(437,430)}<div style="height:150px;border-radius:14px 14px 0 0;overflow:hidden;position:relative">${mtn('inset:-10px -40px 0 -40px;background-size:cover;opacity:.9')}<div style="position:absolute;right:16px;top:14px;width:40px;height:40px;border-radius:50%;background:var(--panel);display:flex;align-items:center;justify-content:center;box-shadow:var(--sh)">${ic(I.x)}</div></div>
 <div style="padding:14px 22px;display:flex;gap:16px"><div style="flex:1"><div style="font-family:'Ma Shan Zheng';font-size:38px;line-height:1.1">长城文化茶社</div><div style="font-size:13px;color:var(--ink2);margin-top:6px">茶馆 · 杰斯珀大道 10220 · 四点一公里</div><div style="font-size:13px;margin-top:6px"><span style="color:var(--red)">营业中</span> · 至 二十二时</div></div>${seal('一片伤心',52,18)}</div>${stroke()}
 <div style="display:flex;gap:10px;padding:14px 22px"><span class="btn p">${ic(I.dir).replace('class="ic"','class="ic" style="stroke:#f6ead6;width:18px"')}启程</span><span class="btn">${ic(I.star).replace('class="ic"','class="ic" style="width:18px"')}收藏</span><span class="btn">${ic(I.share).replace('class="ic"','class="ic" style="width:18px"')}分享</span></div>
 <div style="padding:2px 22px;font-size:14px;color:var(--ink2);line-height:1.7">「 临河老茶社，楼上可望河谷。 」</div></div>`;}
if(scr==='scroll'){ui=status+`<div class="scrim"></div><div class="panel scroll" style="border-radius:2px">${mtn('left:0;right:0;bottom:0;height:260px;background-size:cover;opacity:.8')}<div class="rod" style="top:-10px"></div><div class="rod" style="bottom:-10px"></div>
 <div style="position:absolute;right:28px;top:36px" class="vt">长城茶社</div><div style="position:absolute;right:104px;top:44px">${seal('行路',40)}</div>
 <div style="position:absolute;right:104px;top:110px;writing-mode:vertical-rl;font-size:15px;line-height:2;color:var(--ink2);height:470px">杰斯珀大道一〇二二〇号　茶馆　营业至二十二时　距此四点一公里</div>
 <div style="position:absolute;left:24px;top:40px;width:180px;font-size:14px;line-height:1.9">临河老茶社，楼上可望河谷。<br>${seal('一片伤心',48,16)}</div>
 <div style="position:absolute;left:24px;bottom:250px;display:flex;gap:10px"><span class="btn p">启程</span><span class="btn">收藏</span></div></div>`;}
document.getElementById('ui').innerHTML=ui;
