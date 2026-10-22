import * as maplibregl from '/web/node_modules/maplibre-gl/dist/maplibre-gl.mjs';
const q=new URLSearchParams(location.search), V=q.get('v')||'A', scr=q.get('scr');
document.body.className=`${V} s-${scr}`;
document.body.style.setProperty('--paperimg',`url(paper_${V}.png)`);
const PADS=await (await fetch('a/pads.json')).json();
const P={A:{land:'rgba(80,72,62,.07)',park:'rgba(70,80,60,.12)',water:'#4a4844',wa:.55,bld:'rgba(60,56,52,.22)',minor:'#7a7268',major:'#3b3733',mw:'#2a2724',lbl:'#2b2723',halo:'rgba(239,231,212,.85)',route:'#2b2724'},
 C:{land:'rgba(220,210,190,.04)',park:'rgba(170,185,150,.07)',water:'#cfc6b2',wa:.22,bld:'rgba(215,205,185,.13)',minor:'#7d766b',major:'#bdb4a2',mw:'#e2d9c6',lbl:'#e4dac6',halo:'rgba(28,26,23,.9)',route:'#e0d6c2'}}[V];
const W=(a,b,c,d)=>['interpolate',['exponential',1.6],['zoom'],10,a,13,b,16,c,18,d];
const cls=(...c)=>['match',['get','class'],c,true,false];
const name=['coalesce',['get','name:zh'],['get','name:zh-Hans'],['get','name']];
const L=[{id:'bg',type:'background',paint:{'background-color':'#000','background-opacity':0}},
 {id:'landuse',type:'fill',source:'v','source-layer':'landuse',paint:{'fill-color':P.land}},
 {id:'park',type:'fill',source:'v','source-layer':'park',paint:{'fill-color':P.park}},
 {id:'wood',type:'fill',source:'v','source-layer':'landcover',filter:cls('wood','grass'),paint:{'fill-color':P.park}},
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
L.push({id:'route-w',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':P.route,'line-opacity':.22,'line-width':26,'line-blur':6}});
L.push({id:'route',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':P.route,'line-width':11,'line-opacity':.9}});
0&&L.push({id:'route-dry',type:'line',source:'route',layout:{'line-cap':'butt','line-join':'round'},paint:{'line-color':V==='C'?'#24211e':'#f1e9d6','line-width':1.2,'line-opacity':.5,'line-offset':2.5,'line-dasharray':[6,3,14,4]}});
const t=(id,sl,f,size,ex={})=>L.push({id,type:'symbol',source:'v','source-layer':sl,filter:f,layout:{'text-field':name,'text-font':['IM FELL English Regular'],'text-size':size,'text-max-width':8,...ex.l},paint:{'text-color':P.lbl,'text-halo-color':P.halo,'text-halo-width':1.6}});
t('wname','water_name',true,14,{l:{'text-letter-spacing':.3}});
t('rname','transportation_name',true,11.5,{l:{'symbol-placement':'line'}});
t('neigh','place',cls('neighbourhood','suburb','quarter'),12.5,{l:{'text-letter-spacing':.15}});
const nav=scr==='nav';
const R=await (await fetch('route.json')).json(), g=R.routes[0].geometry.coordinates;
const map=new maplibregl.Map({container:'map',attributionControl:false,localIdeographFontFamily:'Noto Serif CJK SC',fadeDuration:0,pixelRatio:2,
 style:{version:8,glyphs:location.origin+'/web/public/glyphs/{fontstack}/{range}.pbf',sources:{v:{type:'vector',url:'https://tiles.openfreemap.org/planet'},route:{type:'geojson',data:{type:'FeatureCollection',features:[]}}},layers:L},
 center:scr==='place'?[-113.512,53.528]:[-113.4985,53.5395],zoom:13.4});
map.on('load',()=>{
 if(nav||scr==='place')map.getSource('route').setData({type:'Feature',geometry:R.routes[0].geometry});
 const A=g[0],B=g[g.length-1];
 if(scr==='place')map.fitBounds([[Math.min(A[0],B[0]),Math.min(A[1],B[1])],[Math.max(A[0],B[0]),Math.max(A[1],B[1])]],{padding:{top:140,bottom:500,left:50,right:80},duration:0});
 if(nav){const k=6,p=g[k],Q=g[k+3];const br=Math.atan2((Q[0]-p[0])*Math.cos(p[1]*Math.PI/180),Q[1]-p[1])*180/Math.PI;map.jumpTo({center:p,bearing:br,zoom:16.4,pitch:50,padding:{top:430,bottom:0}});}
 map.once('idle',()=>{const pos=(s,ll)=>{const e=document.querySelector(s);if(e){const p=map.project(ll);e.style.left=p.x+'px';e.style.top=p.y+'px';}};
  if(scr==='place'){pos('.me',A);pos('.pin',B);} if(nav)pos('.horse',map.getCenter());
  setTimeout(()=>window._ready=1,400);});});
// ---------- helpers ----------
const ic=(d,st='')=>`<svg class="ic" viewBox="0 0 24 24" style="${st}">${d}</svg>`;
const I={search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>',menu:'<path d="M4 7c5-1.4 11 .8 16-.4M4 12.5c5-1 11 .6 16-.2M4 18c4-1 7 0 10-.3"/>',mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
 home:'<path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5"/>',food:'<path d="M5 3v8a3 3 0 0 0 6 0V3M8 3v18M17 3c-2 2-2 7 0 9v9"/>',tea:'<path d="M4 9h12v5a6 6 0 0 1-12 0zM16 10h2a2.5 2.5 0 0 1 0 5h-2M8 3c-1 2 1 3 0 5M12 3c-1 2 1 3 0 5"/>',fuel:'<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h14M15 9h2l2 2v7a1.5 1.5 0 0 1-3 0v-3h-1"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',pin:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
 loc:'<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',layers:'<path d="M12 3 2.5 8 12 13l9.5-5z"/><path d="M2.5 13 12 18l9.5-5"/>',
 x:'<path d="M6 6c4 4 8 8 12 12M18 6C14 10 10 14 6 18"/>',star:'<path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7z"/>',share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6"/>',
 list:'<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
 upd:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',brush:'<path d="M4 20c3 0 5-1.5 5-4a2.5 2.5 0 0 0-5 0c0 2-1 3-1 4zM10 14 20 4"/>',vol:'<path d="M4 9h4l5-4v14l-5-4H4zM16 9c1.5 1.5 1.5 4.5 0 6M18.5 6.5c3 3 3 8 0 11"/>',
 heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',compass:'<path d="M12 3l3 9-3 9-3-9z"/>'};
// blob: css box (x,y,w,h) positioned with image padding
const bl=(n,st,w,h,inner='',cls='')=>{const k=n.replace('$',V),p=PADS[k];return `<div class="bl ${cls}" style="${st};width:${w+2*p}px;height:${h+2*p}px;margin:-${p}px;background-image:url(a/${k}.png)"><div class="in" style="left:${p}px;top:${p}px;width:${w}px;height:${h}px">${inner}</div></div>`;};
let dk=0;const dv=(o=1)=>`<span class="div" style="background-image:url(a/${V==='C'?'divC'+(dk++%2):'div'+(dk++%4)}.png);opacity:${.9*o}"></span>`;
const dot=(k,red)=>{const n=(red?'dotr_':'dot_')+V,p=PADS[n];return `<span class="dotb" style="background-image:url(a/${n}.png);background-size:${38+2*p}px;background-position:center">${ic(I[k]).replace('class="ic"','class="ic" style="stroke:'+(V==='C'&&!red?'#24211e':'#f6ead6')+'"')}</span>`;};
const seal=(txt,s=30,fs)=>`<span class="seal" style="width:${txt.length==3?s*.7:s}px;height:${txt.length==3?s*1.4:s}px;font-size:${fs||s*.42}px;${txt.length>2?'writing-mode:vertical-rl;':''}">${txt}</span>`;
const mtn=(st)=>`<div class="mtn" style="background-image:url(mtn_${V}.png);${st}"></div>`;
const scroll=(st,inner,key,w,h)=>`<div class="scroll" style="${st};width:${w}px;height:${h}px"><img src="a/scroll_${key}_${V}.png" style="position:absolute;left:-18px;top:-13px;width:${w+36}px;height:${h+26}px"><div style="position:absolute;inset:28px 14px;overflow:hidden">${inner}</div></div>`;
const status=`<div class="status"><span>23:44</span><span>5G ▮▮▮ 86%</span></div>`;
const sbar=(txt,lead=I.menu,col='var(--ink2)')=>bl('search_$','left:14px;top:46px',433,60,`<div style="display:flex;align-items:center;gap:12px;padding:0 20px;width:100%">${ic(lead)}<span class="ss" style="flex:1;font-size:23px;color:${col}">${txt}</span>${ic(I.mic)}${seal('行路',30)}</div>`);
const chipD=[['home','归家','s'],['food','食肆','m'],['tea','茶寮','m'],['fuel','添油','m'],['star','珍藏','m']];
const chips=(y=118)=>`<div style="position:absolute;top:${y}px;left:16px;display:flex;gap:12px">${chipD.map(([k,t,s])=>`<div style="position:relative;width:${s=='s'?64:86}px;height:38px">${bl(`chip_$_${s}`,'left:0;top:0',s=='s'?64:86,38,`<div style="display:flex;align-items:center;gap:6px;padding-left:7px;font-size:15px">${dot2(k)}${t}</div>`)}</div>`).join('')}</div>`;
function dot2(k){const n='dots_'+V,p=PADS[n];return `<span class="dotb" style="width:24px;height:24px;background-image:url(a/${n}.png);background-size:${26+2*p}px;background-position:center">${ic(I[k],'width:14px;height:14px;stroke:'+(V==='C'?'#24211e':'#f6ead6'))}</span>`;}
const fab=(k,x,y,red)=>bl(red?'fabr_$':'fab_$',`${x};top:${y}px`,58,58,`<div style="width:100%;display:flex;justify-content:center">${ic(I[k],red?'stroke:#f6ead6':'')}</div>`);
// POI blobs on map
const poi=(k,x,y,lab)=>`<div style="position:absolute;left:${x}px;top:${y}px;display:flex;align-items:center;gap:4px">${dot2(k)}<span class="ss" style="font-size:15px;color:var(--pt);text-shadow:0 0 3px var(--panel),0 0 3px var(--panel)">${lab}</span></div>`;
const me=(x,y)=>`<div class="me" style="position:absolute;left:${x}px;top:${y}px;width:46px;height:46px;margin:-23px">${horse(46,true)}</div>`;
// --------- ink horse (top-down, head up) ----------
function horse(sz){const H=`<path d="M50 2c3 0 4.5 2 4.5 6l.5 14c0 3 1 5 3 8l4 6c5 2 9 6 9.5 12 .5 5-1.5 10-2 14 0 6 2 12 2 20 0 12-8 22-21.5 22S28.5 94 28.5 82c0-8 2-14 2-20-.5-4-2.5-9-2-14 .5-6 4.5-10 9.5-12l4-6c2-3 3-5 3-8l.5-14c0-4 1.5-6 4.5-6z"/>
<path d="M38 44l-7-5M62 44l7-5M33 88l-5 7M67 88l5 7" stroke-width="3.5" stroke-linecap="round"/>
<path d="M46.5 6l-2.5-6M53.5 6l2.5-6" stroke-width="2.6" stroke-linecap="round"/>
<path d="M50 102c-4 10-7 16-14 24M50 102c0 9 2 17 0 26M50 102c4 9 8 14 14 20" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
const pale=V==='C'?'#1c1a18':'#f6efdc', ink=V==='C'?'#ece3cf':'#1d1a17';
return `<svg viewBox="-12 -10 124 162" width="${sz}" height="${sz*1.3}" style="overflow:visible;filter:drop-shadow(0 4px 4px rgba(0,0,0,.35))">
<ellipse cx="50" cy="64" rx="40" ry="62" fill="${pale}" opacity=".3" filter="url(#rough2)"/>
<g fill="${pale}" stroke="${pale}" stroke-width="9" stroke-linejoin="round">${H}</g>
<g fill="${ink}" stroke="${ink}" filter="url(#rough2)">${H}</g>
<path d="M50 10c-1.5 6 1.5 10-.5 16s2 10-.5 16" stroke="${pale}" stroke-width="2.2" fill="none" opacity=".7" stroke-linecap="round"/>
<path d="M50 60c-6 0-9 4-9 9.5s3.5 9 9 9 9-3.5 9-9-3-9.5-9-9.5z" fill="var(--red)" stroke="${pale}" stroke-width="2"/></svg>`;}
// --------- 横刀立马 rider (side view, faces right) ----------
const rider=`<svg viewBox="0 0 330 230" width="300" height="209" style="overflow:visible">
<g fill="var(--ink)" stroke="var(--ink)" stroke-linecap="round" stroke-linejoin="round" filter="url(#inkr)">
<path d="M20 205c70-9 170-8 300-3" stroke-width="8" fill="none" opacity=".22"/><path d="M60 210c50-3 90-2 140 0" stroke-width="3" fill="none" opacity=".35"/>
<path stroke="none" d="M100 118C98 100 115 92 140 94C165 96 190 96 205 88C215 70 228 52 242 44L245 33L251 43C258 48 266 58 274 72C277 78 272 82 266 79L252 74C246 84 240 96 236 112C232 128 222 136 205 138C180 142 145 142 125 138C110 135 101 128 100 118Z"/>
<path d="M226 128C232 140 240 146 242 156L236 170" stroke-width="8" fill="none"/>
<path d="M210 134C208 150 208 170 211 196" stroke-width="8" fill="none"/><path d="M211 196l7 2" stroke-width="5"/>
<path d="M132 134C128 150 124 168 128 196" stroke-width="9" fill="none"/><path d="M128 196l7 2" stroke-width="5"/>
<path d="M112 126C110 146 112 158 102 172C100 180 103 188 104 196" stroke-width="8" fill="none"/><path d="M104 196l7 2" stroke-width="5"/>
<path d="M102 104C84 102 72 110 62 128M102 108C88 112 80 122 76 138M104 102C86 94 72 98 60 108" stroke-width="4.5" fill="none" opacity=".85"/>
<path d="M240 48C232 56 224 66 214 80M236 52C226 58 218 70 206 84M244 46C236 52 230 64 222 72" stroke-width="3" fill="none" opacity=".8"/>
<path d="M170 92C176 104 186 112 188 118L186 138" stroke-width="7" fill="none"/>
<path stroke="none" d="M162 94C160 80 162 66 168 56C172 52 180 52 182 58C184 70 182 84 180 96Z"/>
<circle cx="176" cy="44" r="7.5" stroke="none"/><path d="M172 36C168 26 172 18 180 14" stroke="var(--red)" stroke-width="3" fill="none"/>
<path stroke="none" opacity=".72" d="M166 60C146 66 124 64 104 56C92 52 82 54 72 60C88 58 98 66 112 74C130 84 150 82 166 76Z"/>
<path d="M178 64C186 72 190 78 196 82" stroke-width="5" fill="none"/>
<path d="M78 152C150 112 230 64 310 16" stroke-width="3.4" fill="none"/>
<path stroke="none" d="M306 18l20-12-7 19z"/><path d="M300 22c-3 9-10 14-19 16M302 20c-7 6-12 12-13 20" stroke="var(--red)" stroke-width="3" fill="none"/>
</g></svg>`;
let ui='';
const head=(t)=>`<div class="sec">${t}</div>`;
if(scr==='map') ui=status+mtn('left:-120px;bottom:-40px;width:480px;height:220px;opacity:.75')+mtn('right:-160px;top:170px;width:420px;height:190px;opacity:.3;transform:scaleX(-1)')+sbar('欲往何处')+chips()
 +poi('tea',90,330,'长城茶社')+poi('food',250,430,'老街面馆')+poi('fuel',120,690,'城南油坊')+me(236,560)
 +fab('layers','right:16px',700)+fab('loc','right:16px',780,1)+`<div style="position:absolute;left:20px;bottom:30px" class="ss"><span style="font-size:15px;color:var(--ink2)">一里</span>${dv()}</div>`;
if(scr==='search'){const H=[['heart','长城文化茶社','已入珍藏','营业中 · 戌时方歇',1],['clock','老街面馆','惠特大道 8215','已打烊 · 明日辰时开门'],['pin','北岸河谷公园','河谷步道',''],['clock','中央图书馆','丘吉尔广场','营业中 · 亥时方歇'],['pin','惠特大道市集','八十二街','']];
 ui=status+`<div class="scrim"></div>`+scroll('left:18px;top:128px',`<div style="position:absolute;inset:0;overflow:hidden">${mtn('left:-60px;right:-60px;bottom:-20px;height:260px;opacity:.35;background-size:cover')}${mtn('right:-140px;top:60px;width:360px;height:160px;opacity:.18')}</div><div style="position:relative;padding-top:16px">
 ${head('近日行迹<span style="margin-left:auto;font:14px Noto Serif CJK SC;color:var(--ink2)">拂去</span>')}${dv()}
 ${H.map(([k,a,b,o,red],i)=>`<div class="row">${dot(k,red)}<div style="flex:1"><div class="t ss" style="font-size:21px">${a}</div><div class="s">${b}</div>${o?`<div class="o">${o}</div>`:''}</div></div>${dv(.85)}`).join('')}
 ${head('常寻之所')}<div style="display:flex;gap:6px 14px;padding:12px 26px;flex-wrap:wrap">${['食肆','茶寮','客栈','药铺','驿站','添油'].map(x=>`<div style="position:relative;width:70px;height:34px">${bl('tag_$','left:0;top:0',70,34,`<div style="width:100%;text-align:center;font-size:15px">${x}</div>`)}</div>`).join('')}</div></div>`,'search',425,856)
 +sbar('茶',I.x,'var(--pt)');}
if(scr==='drawer'){const M=[['star','珍藏之地'],['list','行程录'],['clock','近日行迹'],['brush','皮相与声腔'],['layers','舆图风格'],['gear','诸般设置'],['upd','寻新版']];
 ui=status+sbar('欲往何处')+chips()+`<div class="scrim"></div>`+scroll('top:44px;left:18px',`<div style="position:absolute;inset:0;overflow:hidden">${mtn('left:-90px;right:-90px;bottom:0;height:230px;opacity:.4;background-size:cover')}</div><div style="position:relative;padding-top:20px">
 <div style="display:flex;align-items:center;gap:12px;padding:0 26px"><span class="ss" style="font-size:40px">画不成</span>${seal('丹青',34)}</div><div style="padding:2px 28px 6px;font-size:12px;color:var(--ink2);letter-spacing:.3em">世间无限丹青手</div>${dv()}
 ${M.map(([k,t],i)=>`<div class="mi">${ic(I[k])}<span>${t}</span>${i===4?`<span class="ss" style="margin-left:auto;font-size:15px;color:var(--red)">水墨</span>`:''}</div>${i===2||i===4?dv(.8):''}`).join('')}</div>
 <img src="a/general_${V}.png" style="position:absolute;left:2px;bottom:8px;width:286px">
 <div class="ss" style="position:absolute;right:16px;top:600px;writing-mode:vertical-rl;font-size:20px;color:var(--ink2)">一片伤心画不成</div>
 <div style="position:absolute;right:18px;top:556px">${seal('子龙',30)}</div>`,'drawer',318,950);}
if(scr==='nav'){const turn=`<svg viewBox="0 0 48 48" width="58" height="58" style="flex:none;filter:url(#rough)"><path d="M16 42V24a6 6 0 0 1 6-6h14" stroke="var(--pt)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M30 10l8 8-8 8" stroke="var(--pt)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 ui=status+`<div class="horse" style="position:absolute;width:88px;height:114px;margin:-70px 0 0 -44px">${horse(88)}</div>`
 +bl('banner_$','left:12px;top:44px',437,124,`<div style="display:flex;align-items:center;gap:14px;padding:0 22px;width:100%">${turn}<div style="flex:1"><div class="ss" style="font-size:22px;color:var(--ink2)">前行三百步</div><div class="ss" style="font-size:31px;line-height:1.15">右折入 杰斯珀大道</div></div><div style="align-self:flex-start;margin-top:14px">${seal('右',30)}</div></div>`)
 +bl('then_$','left:12px;top:186px',176,44,`<div class="ss" style="padding-left:18px;font-size:18px">再行百步 左折 ↰</div>`)
 +fab('compass','right:16px',560,1)+fab('search','right:16px',636)+fab('vol','right:16px',712)
 +bl('speed_$','left:16px;top:780px',64,64,`<div style="width:100%;text-align:center;line-height:1"><div class="ss" style="font-size:28px">四十</div><div style="font-size:10px;color:var(--ink2)">里每时</div></div>`)
 +bl('navcard_$','left:12px;top:884px',437,116,`<div style="display:flex;align-items:center;gap:14px;padding:0 24px;width:100%"><div style="flex:1"><div class="ss" style="font-size:31px;color:var(--red)">约一刻钟可至</div><div style="font-size:14px;color:var(--ink2)">尚余八里 · 子时初刻抵达</div></div>${bl('stop_$','position:relative;left:0;top:0',104,52,`<div class="ss" style="width:100%;text-align:center;font-size:27px;color:#f6ead6">罢行</div>`)}</div>`);}
if(scr==='place'){ui=status+sbar('长城文化茶社',I.x,'var(--pt)')+`<div class="me" style="position:absolute;width:40px;height:40px;margin:-20px">${horse(40,true)}</div><div class="pin" style="position:absolute;margin:-40px 0 0 -17px">${dot2('pin')}</div>`
 +scroll('left:24px;bottom:34px',`<div style="position:absolute;inset:0;overflow:hidden">${mtn('left:-40px;right:-40px;top:-10px;height:170px;background-size:cover;opacity:.8')}</div><div style="position:absolute;right:14px;top:16px">${fab('x','position:relative;right:0',0)}</div>
 <div style="position:relative;padding:122px 18px 0;display:flex;gap:14px"><div style="flex:1"><div class="ss" style="font-size:38px;line-height:1.1">长城文化茶社</div><div style="font-size:13px;color:var(--ink2);margin-top:6px">茶寮 · 杰斯珀大道一〇二二〇号 · 距此八里</div><div style="font-size:13px;margin-top:4px"><span style="color:var(--red)">正迎客</span> · 戌时方歇</div></div>${seal('一片伤心',50,17)}</div>${dv()}
 <div style="position:relative;display:flex;gap:14px;padding:12px 22px">${bl('btnr_$','position:relative;left:0;top:0',96,40,`<div class="ss" style="width:100%;text-align:center;font-size:21px;color:#f6ead6">启程</div>`)}${bl('btn_$','position:relative;left:0;top:0',84,40,`<div class="ss" style="width:100%;text-align:center;font-size:21px">珍藏</div>`)}${bl('btn_$','position:relative;left:0;top:0',84,40,`<div class="ss" style="width:100%;text-align:center;font-size:21px">相赠</div>`)}</div>
 <div style="position:relative;padding:4px 24px;font-size:14px;color:var(--ink2);line-height:1.7">「 临河老茶社，凭栏可望河谷。 」</div>`,'place',413,440);}
if(scr==='skinswitch'){const S=[['画不成','水墨 · 昼',1],['画不成','水墨 · 夜'],['霓虹城','霓虹 · 昼夜'],['边塞墨','西部皮革 · 昼夜']];
 ui=status+sbar('欲往何处')+chips()+fab('layers','right:16px',700)+fab('loc','right:16px',780,1)+`<div class="scrim"></div>`
 +scroll('right:24px;top:250px',`<div style="position:absolute;inset:0;overflow:hidden">${mtn('left:-60px;right:-60px;bottom:0;height:170px;opacity:.3;background-size:cover')}</div><div style="position:relative;padding-top:18px">${head('易换皮相<span style="margin-left:auto">'+fab('x','position:relative;right:0',0)+'</span>')}${dv()}
 ${S.map(([a,b,on])=>`<div class="row">${dot(on?'brush':'layers',on)}<div style="flex:1"><div class="ss" style="font-size:22px">${a}</div><div class="s">${b}</div></div>${on?seal('用',26):''}</div>${dv(.8)}`).join('')}
 <div class="ss" style="padding:10px 24px;font-size:18px;color:var(--ink2)">另觅皮相与声腔 ›</div></div>`,'skin',300,520);}
if(scr==='marker'){ui=`<div style="position:absolute;inset:0;background:var(--panel) var(--paperimg)"></div><div style="position:absolute;left:30px;top:200px;width:180px;height:540px;background:#1d1a17;border-radius:90px"></div><div style="position:absolute;left:20px;top:260px">${horse(200)}</div><div style="position:absolute;left:250px;top:300px;width:180px;height:540px;background:#1c1a18"><div style="position:absolute;left:66px;top:0;width:48px;height:540px;background:#e0d6c2"></div><div style="position:absolute;left:66px;top:60px">${horse(48)}</div><div style="position:absolute;left:10px;top:200px">${horse(160)}</div></div>`;}
document.getElementById('ui').innerHTML=ui;
