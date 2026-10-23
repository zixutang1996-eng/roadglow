import * as maplibregl from '/web/node_modules/maplibre-gl/dist/maplibre-gl.mjs';
const q=new URLSearchParams(location.search),D=q.get('d')||'A',M=q.get('m')||'d',scr=q.get('scr')||'map',EN=q.get('lang')==='en';
const K=D+M, dark=M==='d';
const R=await (await fetch('/screenshots/mockups/ink/src4/route.json')).json();const g=R.routes[0].geometry.coordinates;
// ---------------- art helpers (all static SVG; in the real pack these get baked to PNG/WebP) ----------------
let uid=0;
function sun(cx,cy,r,cols,n=6,cut=.45){const id='s'+(uid++);let st=cols.map((c,i)=>`<stop offset="${i/(cols.length-1)}" stop-color="${c}"/>`).join('');
 let m='';for(let i=0;i<n;i++){const y=cy-r*cut+ (r*(1+cut))*(i/n)**.9;const h=1.2+i*1.15*r/60;m+=`<rect x="${cx-r}" y="${y}" width="${2*r}" height="${h}" fill="#000"/>`;}
 return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${st}</linearGradient><mask id="m${id}"><rect x="${cx-r}" y="${cy-r}" width="${2*r}" height="${2*r}" fill="#fff"/>${m}</mask></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})" mask="url(#m${id})"/>`;}
function grid(y0,w,h,c,op=1,sw=1.2,nx=14,ny=8){let s='';for(let i=-nx;i<=nx;i++){s+=`<line x1="${w/2+i*6}" y1="${y0}" x2="${w/2+i*w/nx*1.6}" y2="${y0+h}"/>`;}
 for(let j=1;j<=ny;j++){const y=y0+h*(j/ny)**2.2;s+=`<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`;}return `<g stroke="${c}" stroke-width="${sw}" opacity="${op}">${s}</g>`;}
function wire(w,base,amp,c,fill,seed=3,sw=1.2){const pts=[];const N=16;for(let i=0;i<=N;i++){const x=i*w/N;const y=base-amp*Math.abs(Math.sin(i*1.7+seed))*(0.4+0.6*Math.abs(Math.sin(i*.5+seed*2)));pts.push([x,y]);}
 let s=`<polygon points="0,${base} ${pts.map(p=>p.join(',')).join(' ')} ${w},${base}" fill="${fill}" stroke="${c}" stroke-width="${sw*1.4}" stroke-linejoin="round"/>`;
 for(let i=1;i<N;i++){const[x,y]=pts[i];s+=`<line x1="${x}" y1="${y}" x2="${x+(i%2?-12:12)}" y2="${base}" stroke="${c}" stroke-width="${sw*.6}" opacity=".7"/>`;s+=`<line x1="${x}" y1="${y}" x2="${(pts[i+1][0]+x)/2}" y2="${(base+y)/2+6}" stroke="${c}" stroke-width="${sw*.5}" opacity=".5"/>`;}return s;}
function palm(x,y,s,c){return `<g transform="translate(${x},${y}) scale(${s})" fill="${c}"><path d="M-2 0 C0 -40 4 -70 10 -96 L14 -95 C9 -70 5 -40 4 0Z"/>
<path d="M12 -96 C-6 -108 -26 -104 -40 -88 C-24 -98 -8 -98 10 -92Z"/><path d="M12 -96 C30 -110 50 -106 62 -90 C46 -100 30 -98 14 -92Z"/>
<path d="M12 -97 C4 -118 -14 -126 -30 -122 C-12 -118 0 -108 10 -94Z"/><path d="M13 -97 C24 -120 42 -124 56 -116 C38 -116 26 -106 15 -94Z"/>
<path d="M12 -96 C2 -100 -12 -90 -20 -70 C-8 -86 2 -92 12 -92Z"/><path d="M13 -96 C26 -98 38 -86 42 -66 C32 -84 22 -90 13 -92Z"/></g>`;}
function car(x,y,s,body,light,glass){return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-46 0 L-46 -14 C-46 -20 -40 -22 -34 -23 L-24 -38 C-22 -41 -18 -42 -14 -42 L14 -42 C18 -42 22 -41 24 -38 L34 -23 C40 -22 46 -20 46 -14 L46 0Z" fill="${body}"/>
<path d="M-20 -36 L20 -36 L28 -24 L-28 -24Z" fill="${glass}"/><rect x="-42" y="-17" width="18" height="5" rx="1" fill="${light}"/><rect x="24" y="-17" width="18" height="5" rx="1" fill="${light}"/><rect x="-14" y="-13" width="28" height="5" fill="${glass}" opacity=".7"/>
<rect x="-42" y="0" width="14" height="6" fill="#111"/><rect x="28" y="0" width="14" height="6" fill="#111"/></g>`;}
function tri(cx,cy,r,c,sw=4,f='none'){const p=[0,1,2].map(k=>{const a=-Math.PI/2+k*2*Math.PI/3;return (cx+r*Math.cos(a)).toFixed(1)+','+(cy+r*Math.sin(a)).toFixed(1)}).join(' ');return `<polygon points="${p}" fill="${f}" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"/>`;}
function stars(w,h,n,c,seed=1){let s='';let r=seed;const rnd=()=>(r=(r*9301+49297)%233280)/233280;for(let i=0;i<n;i++)s+=`<circle cx="${(rnd()*w).toFixed(1)}" cy="${(rnd()*h).toFixed(1)}" r="${(rnd()*1.1+.3).toFixed(2)}" fill="${c}" opacity="${(rnd()*.6+.4).toFixed(2)}"/>`;return s;}
function chrome(id,dk){return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dk?'#eaf6ff':'#ffffff'}"/><stop offset=".45" stop-color="${dk?'#7fb6e6':'#8fb4d6'}"/><stop offset=".5" stop-color="${dk?'#1c2a52':'#2a3560'}"/><stop offset=".62" stop-color="${dk?'#c86ad8':'#d77ac8'}"/><stop offset="1" stop-color="${dk?'#fff2d8':'#ffe9c8'}"/></linearGradient>`;}
const svg=(w,h,inner,st='')=>`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="display:block;${st}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
// ---------------- icons ----------------
const I={search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>',menu:'<path d="M4 6.5h16M4 12h11M4 17.5h16"/>',mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
food:'<path d="M6 3v7a2.5 2.5 0 0 0 5 0V3M8.5 3v18M17 3c-2.2 2-2.2 7 0 9v9"/>',cafe:'<path d="M4 9h12v4a6 6 0 0 1-12 0zM16 10h2a2.5 2.5 0 0 1 0 5h-2M8 3v3M12 3v3"/>',fuel:'<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h14M7 7h6M15 9h2l2 2v7a1.5 1.5 0 0 1-3 0v-3h-1"/>',
park:'<path d="M12 3 6 12h3l-4 6h14l-4-6h3z"/><path d="M12 18v3"/>',layers:'<path d="M12 3 2.5 8 12 13l9.5-5z"/><path d="M2.5 13 12 18l9.5-5"/>',loc:'<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',route:'<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
palette:'<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.6-1-2.6 1-1.4 2-1.4h2a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',upd:'<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
share:'<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4"/>',phone:'<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',go:'<path d="M12 2 20 21 12 16.5 4 21z"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',bm:'<path d="M6 3h12v18l-6-4-6 4z"/>',vol:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'};
const ic=(k,st='')=>`<svg class="ic" viewBox="0 0 24 24" style="${st}"><g class="g">${I[k]}</g>${I[k]}</svg>`;
// ---------------- themes ----------------
const T={
// A — Sunset Grid
Ad:{v:{'--bg':'#1a0b2e','--tx':'#ffe9f4','--tx2':'#d6a6d9','--acc':'#ff4fb8','--acc2':'#ffb347','--ic':'#ffd3ec','--glow':'#ff4fb8','--head':'Audiowide','--stat':'#ffd3ec',
 '--pbg':'linear-gradient(180deg,#2c1250 0%,#1d0b36 100%)','--pbd':'2px solid #ff4fb8','--prad':'18px','--psh':'0 0 0 1px #ff9a3c55, 0 0 18px #ff4fb866, 0 10px 24px #0008',
 '--cbg':'#241046','--cbd':'1.5px solid #ff8ad0','--crad':'18px','--ctx':'#ffe2f2','--csh':'0 0 8px #ff4fb855',
 '--fbg':'#241046','--fbd':'2px solid #ffb347','--frad':'50%','--fsh':'0 0 10px #ffb34766','--fon':'linear-gradient(180deg,#ffd447,#ff4fb8)','--fonic':'#2a0c3e',
 '--plb':'#ffe2f2','--phalo':'#1a0b2e','--scrim':'#0d0418aa','--dbg':'#1d0b36','--dbd':'2px solid #ff4fb8','--mon':'linear-gradient(90deg,#ff4fb855,transparent)','--monx':'#fff','--mbr':'10px','--mbx':'#2f1458','--div':'linear-gradient(90deg,#ffd447,#ff4fb8,#7a3cff)',
 '--srad':'24px 24px 0 0','--brad':'14px','--b1bg':'linear-gradient(180deg,#ffd447,#ff7a59 55%,#ff4fb8)','--b1bd':'none','--b1tx':'#2a0c3e','--b1sh':'0 0 14px #ff4fb888','--b2bg':'#2a1250','--b2bd':'1.5px solid #ff8ad0','--b2tx':'#ffd3ec','--ibd':'1px solid #ff4fb833',
 '--stbg':'linear-gradient(180deg,#ff3d6e,#c4005a)','--sttx':'#fff','--stbd':'2px solid #ffd447','--strad':'14px','--stsh':'0 0 14px #ff3d6e99'},
 P:{bg:'#1a0b2e',land:'#22103d',park:'#1f2a4a',water:'#0f1d55',wedge:'#3fd0ff',bld:'#2e1652',minor:'#5a2f7e',major:'#ff4fb8',mw:'#ffb347',lbl:'#ffd3ec',halo:'#1a0b2e',route:'#3ff3ff',rglow:'#3ff3ff'}},
Al:{v:{'--bg':'#ffe6d6','--tx':'#3a1450','--tx2':'#8a4f86','--acc':'#ff4f9a','--acc2':'#ff8a3c','--ic':'#5a1d6e','--glow':'#ff8ac0','--go':'.28','--head':'Audiowide','--stat':'#5a1d6e',
 '--pbg':'linear-gradient(180deg,#fff6ee 0%,#ffe3ec 100%)','--pbd':'2px solid #ff6fae','--prad':'18px','--psh':'0 4px 0 #ffb08a, 0 10px 22px #a0306a33',
 '--cbg':'#fff3f6','--cbd':'1.5px solid #ff9cc6','--crad':'18px','--ctx':'#5a1d6e','--csh':'0 2px 0 #ffc4a0',
 '--fbg':'#fff6ee','--fbd':'2px solid #ff8a3c','--frad':'50%','--fsh':'0 3px 0 #ffb08a','--fon':'linear-gradient(180deg,#ffc93c,#ff4f9a)','--fonic':'#fff',
 '--plb':'#4a1660','--phalo':'#fff3ea','--scrim':'#5a1d6e55','--dbg':'#fff4ef','--dbd':'2px solid #ff6fae','--mon':'linear-gradient(90deg,#ff9cc655,transparent)','--monx':'#3a1450','--mbr':'10px','--mbx':'#ffe0ea','--div':'linear-gradient(90deg,#ffc93c,#ff4f9a,#9a5cff)',
 '--srad':'24px 24px 0 0','--brad':'14px','--b1bg':'linear-gradient(180deg,#ffc93c,#ff7a59 55%,#ff4f9a)','--b1bd':'none','--b1tx':'#fff','--b1sh':'0 3px 0 #c43a7a','--b2bg':'#fff','--b2bd':'1.5px solid #ff9cc6','--b2tx':'#5a1d6e','--ibd':'1px solid #ff6fae33',
 '--stbg':'linear-gradient(180deg,#ff4f6e,#d6125a)','--sttx':'#fff','--stbd':'2px solid #ffc93c','--strad':'14px','--stsh':'0 3px 0 #8a0a3a'},
 P:{bg:'#fde4da',land:'#fbd9d6',park:'#f4d2e6',water:'#b9c8ff',wedge:'#7a8cff',bld:'#f2c6cf',minor:'#f0b6c6',major:'#ff7aa8',mw:'#ff9a3c',lbl:'#5a1d6e',halo:'#fff3ea',route:'#7a3cff',rglow:'#b48cff'}},
// B — Chrome & Neon Poster
Bd:{v:{'--bg':'#070a1c','--tx':'#eaf4ff','--tx2':'#93a6d6','--acc':'#2ef2ff','--acc2':'#ff2fa0','--ic':'#cfe6ff','--glow':'#2ef2ff','--go':'.3','--head':'Kaushan','--hls':'0','--body':'Righteous','--stat':'#cfe6ff',
 '--pbg':'linear-gradient(180deg,#121a3e,#0a0f26)','--pbd':'2px solid #2ef2ff','--prad':'6px','--psh':'inset 0 1px 0 #ffffff40, 4px 4px 0 #ff2fa0, 0 0 16px #2ef2ff55',
 '--cbg':'#0e1533','--cbd':'1.5px solid #ff2fa0','--crad':'4px','--ctx':'#eaf4ff','--csh':'2px 2px 0 #2ef2ff',
 '--fbg':'linear-gradient(180deg,#e9f3ff,#8fb0d8 48%,#2a3a6a 52%,#c9d8ef)','--fbd':'2px solid #fff','--frad':'8px','--fsh':'3px 3px 0 #ff2fa0','--fon':'linear-gradient(180deg,#ff8fd0,#ff2fa0)','--fonic':'#fff',
 '--plb':'#eaf4ff','--phalo':'#070a1c','--scrim':'#03051099','--dbg':'#0a0f26','--dbd':'3px solid #2ef2ff','--mon':'linear-gradient(90deg,#ff2fa044,transparent)','--monx':'#fff','--mbr':'4px','--mbx':'#151f48','--div':'linear-gradient(90deg,#2ef2ff,#ff2fa0)',
 '--srad':'8px 8px 0 0','--brad':'6px','--b1bg':'linear-gradient(180deg,#ffffff,#9cc0e8 46%,#24335e 50%,#d58ad6 75%,#ffe7c8)','--b1bd':'1.5px solid #fff','--b1tx':'#0a0f26','--b1sh':'3px 3px 0 #ff2fa0','--b2bg':'#0e1533','--b2bd':'1.5px solid #2ef2ff','--b2tx':'#cfe6ff','--ibd':'1px solid #2ef2ff33',
 '--stbg':'#ff2fa0','--sttx':'#fff','--stbd':'2px solid #fff','--strad':'6px','--stsh':'4px 4px 0 #2ef2ff'},
 P:{bg:'#070a1c',land:'#0b1030',park:'#0c1f30',water:'#060f3a',wedge:'#2ef2ff',bld:'#151c48',minor:'#28356e',major:'#2ef2ff',mw:'#ff2fa0',lbl:'#cfe6ff',halo:'#070a1c',route:'#ff2fa0',rglow:'#ff2fa0'}},
Bl:{v:{'--bg':'#eef4ff','--tx':'#141a3e','--tx2':'#5a6698','--acc':'#ff2f8a','--acc2':'#00b8d8','--ic':'#1a2350','--glow':'#7fe7ff','--go':'.35','--head':'Kaushan','--hls':'0','--body':'Righteous','--stat':'#1a2350',
 '--pbg':'linear-gradient(180deg,#ffffff,#e8f0ff)','--pbd':'2px solid #141a3e','--prad':'6px','--psh':'4px 4px 0 #ff2f8a','--cbg':'#fff','--cbd':'1.5px solid #141a3e','--crad':'4px','--ctx':'#141a3e','--csh':'2px 2px 0 #00c8e8',
 '--fbg':'linear-gradient(180deg,#ffffff,#b7cbe6 48%,#3a4a7a 52%,#dfe8f6)','--fbd':'2px solid #141a3e','--frad':'8px','--fsh':'3px 3px 0 #ff2f8a','--fon':'linear-gradient(180deg,#ff8fc0,#ff2f8a)','--fonic':'#fff',
 '--plb':'#141a3e','--phalo':'#ffffff','--scrim':'#141a3e66','--dbg':'#f6f9ff','--dbd':'3px solid #141a3e','--mon':'linear-gradient(90deg,#00c8e833,transparent)','--monx':'#141a3e','--mbr':'4px','--mbx':'#e2ebff','--div':'linear-gradient(90deg,#00c8e8,#ff2f8a)',
 '--srad':'8px 8px 0 0','--brad':'6px','--b1bg':'linear-gradient(180deg,#ffffff,#9cc0e8 46%,#24335e 50%,#d58ad6 75%,#ffe7c8)','--b1bd':'2px solid #141a3e','--b1tx':'#0a0f26','--b1sh':'3px 3px 0 #ff2f8a','--b2bg':'#fff','--b2bd':'1.5px solid #141a3e','--b2tx':'#141a3e','--ibd':'1px solid #141a3e22',
 '--stbg':'#ff2f8a','--sttx':'#fff','--stbd':'2px solid #141a3e','--strad':'6px','--stsh':'4px 4px 0 #141a3e'},
 P:{bg:'#eef4ff',land:'#e6eefc',park:'#d8f0ee',water:'#9fdcf0',wedge:'#00a8d0',bld:'#d6e0f6',minor:'#c2cde8',major:'#7f8fc8',mw:'#ff6fb0',lbl:'#141a3e',halo:'#ffffff',route:'#ff2f8a',rglow:'#ff9fcc'}},
// C — Outrun Night Drive (palms, car)
Cd:{v:{'--bg':'#0b0820','--tx':'#fff1e0','--tx2':'#e0a080','--acc':'#ff7a1a','--acc2':'#19e3d6','--ic':'#ffd9b8','--glow':'#ff7a1a','--go':'.3','--head':'Orbitron','--hls':'.08em','--stat':'#ffd9b8',
 '--pbg':'linear-gradient(180deg,#1c0f3a 0%,#140a2c 70%,#2a0f2e 100%)','--pbd':'none','--prad':'14px','--psh':'inset 0 -3px 0 #ff7a1a, inset 0 0 0 1.5px #ff7a1a66, 0 12px 26px #000a',
 '--cbg':'#1a0e34','--cbd':'1.5px solid #19e3d6','--crad':'10px','--ctx':'#dffcf8','--csh':'none',
 '--fbg':'#1a0e34','--fbd':'1.5px solid #ff7a1a','--frad':'12px','--fsh':'0 4px 0 #0007','--fon':'linear-gradient(180deg,#ffb347,#ff3d6e)','--fonic':'#1a0e34',
 '--plb':'#ffe8d0','--phalo':'#0b0820','--scrim':'#05030faa','--dbg':'#140a2c','--dbd':'none','--mon':'linear-gradient(90deg,#ff7a1a40,transparent)','--monx':'#fff','--mbr':'10px','--mbx':'#241446','--div':'repeating-linear-gradient(90deg,#ff7a1a 0 18px,transparent 18px 28px)','--divh':'3px',
 '--srad':'20px 20px 0 0','--brad':'12px','--b1bg':'linear-gradient(180deg,#ffb347,#ff5a3c 60%,#e0206e)','--b1bd':'none','--b1tx':'#fff','--b1sh':'0 4px 0 #6a0a3a','--b2bg':'#241446','--b2bd':'1.5px solid #19e3d6','--b2tx':'#dffcf8','--ibd':'1px solid #ff7a1a33',
 '--stbg':'linear-gradient(180deg,#ff3d6e,#a8004a)','--sttx':'#fff','--stbd':'none','--strad':'12px','--stsh':'0 4px 0 #4a0020'},
 P:{bg:'#0b0820',land:'#120c2c',park:'#0e2430',water:'#071a3a',wedge:'#19e3d6',bld:'#1c1240',minor:'#3a2860',major:'#ff7a1a',mw:'#ff3d6e',lbl:'#ffd9b8',halo:'#0b0820',route:'#19e3d6',rglow:'#19e3d6'}},
Cl:{v:{'--bg':'#e9fbff','--tx':'#1d1446','--tx2':'#6a5a8e','--acc':'#ff5a3c','--acc2':'#00b8b0','--ic':'#2a1d5e','--glow':'#ffb08a','--go':'.3','--head':'Orbitron','--hls':'.08em','--stat':'#2a1d5e',
 '--pbg':'linear-gradient(180deg,#ffffff 0%,#fff3ea 100%)','--pbd':'none','--prad':'14px','--psh':'inset 0 -3px 0 #ff5a3c, inset 0 0 0 1.5px #ff8a5c66, 0 10px 22px #2a1d5e30',
 '--cbg':'#fff','--cbd':'1.5px solid #00b8b0','--crad':'10px','--ctx':'#1d1446','--csh':'none',
 '--fbg':'#fff','--fbd':'1.5px solid #ff7a4a','--frad':'12px','--fsh':'0 3px 0 #2a1d5e22','--fon':'linear-gradient(180deg,#ffb347,#ff3d6e)','--fonic':'#fff',
 '--plb':'#1d1446','--phalo':'#ffffff','--scrim':'#1d144655','--dbg':'#fffaf5','--dbd':'none','--mon':'linear-gradient(90deg,#ff8a5c33,transparent)','--monx':'#1d1446','--mbr':'10px','--mbx':'#e6f8f7','--div':'repeating-linear-gradient(90deg,#ff7a4a 0 18px,transparent 18px 28px)','--divh':'3px',
 '--srad':'20px 20px 0 0','--brad':'12px','--b1bg':'linear-gradient(180deg,#ffb347,#ff5a3c 60%,#e0206e)','--b1bd':'none','--b1tx':'#fff','--b1sh':'0 3px 0 #a02050','--b2bg':'#fff','--b2bd':'1.5px solid #00b8b0','--b2tx':'#1d1446','--ibd':'1px solid #ff7a4a33',
 '--stbg':'linear-gradient(180deg,#ff3d6e,#c8004e)','--sttx':'#fff','--stbd':'none','--strad':'12px','--stsh':'0 3px 0 #6a0028'},
 P:{bg:'#eafaff',land:'#e2f6f8',park:'#c8f0dc',water:'#7fd8f0',wedge:'#00a0c8',bld:'#f6e2dc',minor:'#f2cdbf',major:'#ff9a6a',mw:'#ff5a7a',lbl:'#2a1d5e',halo:'#ffffff',route:'#7a3cff',rglow:'#c0a0ff'}},
// D — Vapor Wireframe Minimal
Dd:{v:{'--bg':'#000','--tx':'#e8fbff','--tx2':'#7fa8b8','--acc':'#00f0ff','--acc2':'#ff2bd6','--ic':'#00f0ff','--glow':'#00f0ff','--go':'.22','--icw':'1.6','--head':'Monoton','--hls':'.06em','--stat':'#9fefff',
 '--pbg':'#04050cf2','--pbd':'1px solid #00f0ff','--prad':'2px','--psh':'0 0 0 4px #04050c, 0 0 0 5px #ff2bd655','--cbg':'#04050c','--cbd':'1px solid #ff2bd6','--crad':'2px','--ctx':'#ffd6f6','--csh':'none',
 '--fbg':'#04050c','--fbd':'1px solid #00f0ff','--frad':'2px','--fsh':'none','--fon':'#00f0ff','--fonic':'#000',
 '--plb':'#bff8ff','--phalo':'#000','--scrim':'#000b','--dbg':'#04050c','--dbd':'1px solid #00f0ff','--mon':'transparent','--monx':'#ff2bd6','--mbr':'2px','--mbx':'transparent','--div':'#00f0ff55','--divh':'1px',
 '--srad':'2px 2px 0 0','--brad':'2px','--b1bg':'#00f0ff','--b1bd':'1px solid #00f0ff','--b1tx':'#000','--b1sh':'none','--b2bg':'transparent','--b2bd':'1px solid #ff2bd6','--b2tx':'#ffd6f6','--ibd':'1px solid #00f0ff22',
 '--stbg':'transparent','--sttx':'#ff2b5e','--stbd':'1.5px solid #ff2b5e','--strad':'2px','--stsh':'inset 0 0 0 3px #000, inset 0 0 0 4px #ff2b5e55',
 '--fx':'linear-gradient(transparent 62%,#ff2bd608 80%,#ff2bd614)'},
 P:{bg:'#000000',land:'#020308',park:'#02100f',water:'#000a14',wedge:'#00f0ff',bld:'#060814',minor:'#0d3a48',major:'#00c8e0',mw:'#ff2bd6',lbl:'#9fefff',halo:'#000',route:'#ff2bd6',rglow:'#ff2bd6',wire:1}},
Dl:{v:{'--bg':'#f4f0ff','--tx':'#1a1040','--tx2':'#6a64a0','--acc':'#d016b0','--acc2':'#0098b8','--ic':'#5a20c8','--glow':'#e0b0ff','--go':'.0','--icw':'1.6','--head':'Monoton','--hls':'.06em','--stat':'#3a1a90',
 '--pbg':'#fbf9fff2','--pbd':'1px solid #5a20c8','--prad':'2px','--psh':'0 0 0 4px #fbf9ff, 0 0 0 5px #d016b066','--cbg':'#fbf9ff','--cbd':'1px solid #d016b0','--crad':'2px','--ctx':'#3a1a70','--csh':'none',
 '--fbg':'#fbf9ff','--fbd':'1px solid #5a20c8','--frad':'2px','--fsh':'none','--fon':'#5a20c8','--fonic':'#fff',
 '--plb':'#2a1060','--phalo':'#fbf9ff','--scrim':'#1a104055','--dbg':'#fbf9ff','--dbd':'1px solid #5a20c8','--mon':'transparent','--monx':'#d016b0','--mbr':'2px','--mbx':'transparent','--div':'#5a20c844','--divh':'1px',
 '--srad':'2px 2px 0 0','--brad':'2px','--b1bg':'#5a20c8','--b1bd':'1px solid #5a20c8','--b1tx':'#fff','--b1sh':'none','--b2bg':'transparent','--b2bd':'1px solid #d016b0','--b2tx':'#3a1a70','--ibd':'1px solid #5a20c822',
 '--stbg':'transparent','--sttx':'#e0104e','--stbd':'1.5px solid #e0104e','--strad':'2px','--stsh':'inset 0 0 0 3px #fbf9ff, inset 0 0 0 4px #e0104e55'},
 P:{bg:'#f4f0ff',land:'#efeafc',park:'#e2f4f4',water:'#d4ecff',wedge:'#7a9cff',bld:'#e6def8',minor:'#d8ccf2',major:'#a088e0',mw:'#e060c8',lbl:'#3a1a90',halo:'#fbf9ff',route:'#d016b0',rglow:'#f0a0e0',wire:1}}};
const TH=T[K];for(const[k,v]of Object.entries(TH.v))document.documentElement.style.setProperty(k,v);
const P=TH.P,V=TH.v;
// ---------------- map ----------------
const Wd=(a,b,c,d)=>['interpolate',['exponential',1.6],['zoom'],10,a,13,b,16,c,18,d];
const cls=(...c)=>['match',['get','class'],c,true,false];
const name=EN?['coalesce',['get','name:en'],['get','name']]:['coalesce',['get','name:zh'],['get','name']];
const L=[{id:'bg',type:'background',paint:{'background-color':P.bg}},{id:'landuse',type:'fill',source:'v','source-layer':'landuse',paint:{'fill-color':P.land}},
{id:'park',type:'fill',source:'v','source-layer':'park',paint:{'fill-color':P.park}},{id:'wood',type:'fill',source:'v','source-layer':'landcover',filter:cls('wood','grass'),paint:{'fill-color':P.park}},
{id:'water',type:'fill',source:'v','source-layer':'water',paint:{'fill-color':P.water}},{id:'water-edge',type:'line',source:'v','source-layer':'water',paint:{'line-color':P.wedge,'line-width':Wd(.6,1,1.6,2.2),'line-opacity':.8}},
{id:'waterway',type:'line',source:'v','source-layer':'waterway',paint:{'line-color':P.wedge,'line-width':Wd(1,2,4,6),'line-opacity':.6}},
{id:'bld',type:'fill',source:'v','source-layer':'building',minzoom:13.5,paint:{'fill-color':P.bld,'fill-outline-color':P.wire?P.minor:P.bld}}];
const road=(id,f,c,w,op=1,blur=0)=>L.push({id,type:'line',source:'v','source-layer':'transportation',filter:f,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':c,'line-opacity':op,'line-width':Wd(...w),'line-blur':blur}});
road('minor',cls('minor','service','tertiary'),P.minor,[.4,.8,2.4,5],.9);
road('major-g',cls('primary','secondary','trunk'),P.major,[2,4,9,16],dark?.22:.18,4);
road('major',cls('primary','secondary','trunk'),P.major,[.7,1.4,3.2,6]);
road('mw-g',cls('motorway'),P.mw,[3,6,12,20],dark?.3:.2,5);road('mw',cls('motorway'),P.mw,[1,2,4.5,8]);
L.push({id:'route-g',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':P.rglow,'line-opacity':dark?.4:.45,'line-width':22,'line-blur':8}});
L.push({id:'route',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':P.route,'line-width':7}});
L.push({id:'route-c',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fff','line-width':1.6,'line-opacity':dark?.75:.6}});
const lbl=(id,sl,f,size,ex={})=>L.push({id,type:'symbol',source:'v','source-layer':sl,filter:f,layout:{'text-field':name,'text-font':['Rajdhani SemiBold'],'text-size':size,'text-max-width':8,...ex},paint:{'text-color':P.lbl,'text-halo-color':P.halo,'text-halo-width':1.6}});
lbl('road-l','transportation_name',cls('primary','secondary','trunk','motorway'),12,{'symbol-placement':'line'});lbl('place','place',true,14,{'text-transform':'uppercase','text-letter-spacing':.15});
const nav=scr==='nav';
const map=new maplibregl.Map({container:'map',attributionControl:false,localIdeographFontFamily:'Noto Sans CJK SC',fadeDuration:0,pixelRatio:2,interactive:false,
 style:{version:8,glyphs:location.origin+'/web/public/glyphs/{fontstack}/{range}.pbf',sources:{v:{type:'vector',url:'https://tiles.openfreemap.org/planet'},route:{type:'geojson',data:{type:'FeatureCollection',features:[]}}},layers:L},
 center:scr==='place'?[-113.512,53.528]:[-113.4985,53.5395],zoom:13.4});
map.on('load',()=>{if(nav||scr==='place')map.getSource('route').setData({type:'Feature',geometry:R.routes[0].geometry});
 const A=g[0],B=g[g.length-1];
 if(scr==='place')map.fitBounds([[Math.min(A[0],B[0]),Math.min(A[1],B[1])],[Math.max(A[0],B[0]),Math.max(A[1],B[1])]],{padding:{top:150,bottom:470,left:50,right:80},duration:0});
 if(nav){const k=6,p=g[k],Q=g[k+3];const br=Math.atan2((Q[0]-p[0])*Math.cos(p[1]*Math.PI/180),Q[1]-p[1])*180/Math.PI;map.jumpTo({center:p,bearing:br,zoom:16.4,pitch:55,padding:{top:420,bottom:0}});}
 map.once('idle',()=>{const pos=(s,ll)=>{const e=document.querySelector(s);if(e){const p=map.project(ll);e.style.left=p.x+'px';e.style.top=p.y+'px';}};
  if(scr==='place'){pos('#me',A);pos('#pin',B);} if(nav)pos('#me',map.getCenter());setTimeout(()=>window._ready=1,500);});});
// ---------------- per-direction pieces ----------------
const t=(zh,en)=>EN?en:zh;
const acc=V['--acc'],acc2=V['--acc2'];
function meMarker(){ // original "me" puck per direction
 if(D==='A')return svg(64,64,`<circle cx="32" cy="32" r="26" fill="${acc}" opacity=".18"/>${sun(32,32,15,['#ffe14a','#ff8a3c','#ff3d9a'],4,.1)}<circle cx="32" cy="32" r="16" fill="none" stroke="#fff" stroke-width="2.5"/><path d="M32 6l6 9h-12z" fill="#fff"/>`);
 if(D==='B')return svg(64,64,`<defs>${chrome('cm',dark)}</defs><circle cx="32" cy="34" r="24" fill="${acc}" opacity=".16"/>${tri(32,36,20,dark?'#fff':'#141a3e',3,'url(#cm)')}${tri(32,36,27,acc2,2)}`);
 if(D==='C')return svg(64,64,`<ellipse cx="32" cy="40" rx="22" ry="12" fill="${acc2}" opacity=".25"/>${car(32,46,.48,dark?'#ff3d6e':'#ff5a3c','#ffe14a',dark?'#19e3d6':'#2a1d5e')}`);
 return svg(64,64,`<circle cx="32" cy="32" r="22" fill="none" stroke="${acc}" stroke-width="1" opacity=".6"/><circle cx="32" cy="32" r="13" fill="none" stroke="${acc}" stroke-width="1"/><path d="M32 16 42 42 32 36 22 42z" fill="${dark?'#000':'#fff'}" stroke="${acc2}" stroke-width="1.6" stroke-linejoin="round"/>`);}
function poiIcon(k){ const sz=34;
 if(D==='A')return `<div style="width:${sz}px;height:${sz}px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#ffd447,#ff7a59 55%,#ff4fb8);box-shadow:0 0 0 2px ${dark?'#1a0b2e':'#fff'},0 0 10px ${acc}">${ic(k,'width:18px;height:18px;stroke:#2a0c3e;--go:0')}</div>`;
 if(D==='B')return `<div style="width:38px;height:36px;position:relative;display:grid;place-items:end center">${svg(38,36,tri(19,22,17,dark?'#2ef2ff':'#141a3e',2.4,dark?'#0a0f26':'#fff'),'position:absolute;inset:0')}${ic(k,`position:relative;width:15px;height:15px;margin-bottom:5px;stroke:${acc2};--go:0`)}</div>`;
 if(D==='C')return `<div style="width:${sz}px;height:${sz}px;border-radius:9px;display:grid;place-items:center;background:${dark?'#1a0e34':'#fff'};border:2px solid ${acc};box-shadow:0 3px 0 ${acc2}">${ic(k,`width:18px;height:18px;stroke:${dark?'#ffd9b8':'#2a1d5e'};--go:0`)}</div>`;
 return `<div style="width:30px;height:30px;margin:6px 0 5px;transform:rotate(45deg);display:grid;place-items:center;background:${dark?'#000':'#fbf9ff'};border:1px solid ${acc2}">${ic(k,`transform:rotate(-45deg);width:16px;height:16px;stroke:${acc2};--go:0`)}</div>`;}
function compass(){ const N=EN?'N':'北';
 if(D==='A')return svg(30,30,`<circle cx="15" cy="15" r="12" fill="none" stroke="${V['--ic']}" stroke-width="1.5"/><path d="M15 3 19 15h-8z" fill="${acc}"/><path d="M15 27 11 15h8z" fill="${acc2}" opacity=".7"/>`);
 if(D==='B')return svg(30,30,`<path d="M15 2 22 26 15 21 8 26z" fill="${acc2}" stroke="#141a3e" stroke-width="1.2"/>`);
 if(D==='C')return svg(30,30,`<circle cx="15" cy="15" r="12" fill="none" stroke="${acc2}" stroke-width="1.5" stroke-dasharray="3 2.3"/><path d="M15 4 19.5 17 15 14.5 10.5 17z" fill="${acc}"/>`);
 return svg(30,30,`<circle cx="15" cy="15" r="12" fill="none" stroke="${acc}" stroke-width="1"/><path d="M15 3v24M3 15h24" stroke="${acc}" stroke-width=".6" opacity=".5"/><path d="M15 4 19 16 15 13.5 11 16z" fill="none" stroke="${acc2}" stroke-width="1.4" stroke-linejoin="round"/>`);}
function drawerArt(w,h){ // original illustration per direction
 if(D==='A'){const sky=dark?['#1a0b2e','#5a1670','#ff4fb8']:['#ffd9c2','#ffb0c8','#ff8ab0'];return svg(w,h,`<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">${sky.map((c,i)=>`<stop offset="${i/2}" stop-color="${c}"/>`).join('')}</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#sk)"/>${dark?stars(w,h*.5,40,'#fff'):''}
 ${sun(w/2,h*.62,62,['#ffe14a','#ff9a3c','#ff3d9a'],7)}${wire(w,h*.72,46,dark?'#3fd0ff':'#7a3cff',dark?'#1a0b2e':'#ffc4d8',2,1.1)}<rect y="${h*.72}" width="${w}" height="${h*.28}" fill="${dark?'#1a0b2e':'#ffd2e0'}"/>${grid(h*.72,w,h*.28,dark?'#ff4fb8':'#c43a9a',.9,1.1)}`);}
 if(D==='B'){return svg(w,h,`<defs>${chrome('cg',dark)}<linearGradient id="bk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dark?'#070a1c':'#dfeaff'}"/><stop offset="1" stop-color="${dark?'#1a0f3a':'#fbe0f0'}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#bk)"/>${dark?stars(w,h,50,'#bfe8ff',4):''}
 ${tri(w/2,h*.6,88,acc,5)}${tri(w/2,h*.6,74,acc2,2)}${sun(w/2,h*.66,44,['#ffe14a','#ff7a59','#ff2fa0'],5)}${wire(w,h*.86,30,dark?'#2ef2ff':'#141a3e',dark?'#070a1c':'#eef4ff',7,1)}${palm(w*.18,h*.98,.95,dark?'#000':'#141a3e')}${palm(w*.86,h*.98,.75,dark?'#000':'#141a3e')}`);}
 if(D==='C'){const sky=dark?['#0b0820','#3a0f4e','#ff5a3c']:['#7fe0ff','#ffd0e0','#ffb07a'];return svg(w,h,`<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">${sky.map((c,i)=>`<stop offset="${i/2}" stop-color="${c}"/>`).join('')}</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#sk)"/>${dark?stars(w,h*.45,30,'#fff',7):''}
 ${sun(w*.5,h*.66,56,dark?['#ffe14a','#ff7a1a','#ff3d6e']:['#fff5a0','#ffb347','#ff5a7a'],6)}<rect y="${h*.7}" width="${w}" height="${h*.3}" fill="${dark?'#140a2c':'#3a2a6e'}"/>
 <polygon points="${w*.47},${h*.7} ${w*.53},${h*.7} ${w*.86},${h} ${w*.14},${h}" fill="${dark?'#1c1240':'#4a3a80'}"/><path d="M${w*.5} ${h*.72}V${h}" stroke="#ffe14a" stroke-width="2" stroke-dasharray="8 7"/>
 <path d="M${w*.47} ${h*.7} L${w*.14} ${h}M${w*.53} ${h*.7} L${w*.86} ${h}" stroke="${acc2}" stroke-width="2"/>${palm(w*.12,h*.95,1,'#0b0820')}${palm(w*.92,h*.97,1.1,'#0b0820')}${palm(w*.3,h*.78,.45,'#0b0820')}${palm(w*.72,h*.79,.5,'#0b0820')}${car(w*.5,h*.97,.9,'#ff3d6e','#ffe14a','#19e3d6')}`);}
 return svg(w,h,`<rect width="${w}" height="${h}" fill="${dark?'#000':'#f4f0ff'}"/>${dark?stars(w,h*.5,30,'#9fefff',9):''}${sun(w/2,h*.58,40,dark?['#ff2bd6','#7a2bff']:['#ff8ae0','#a070ff'],6)}${wire(w,h*.66,40,acc,dark?'#000':'#f4f0ff',5,1)}<rect y="${h*.66}" width="${w}" height="${h*.34}" fill="${dark?'#000':'#f4f0ff'}"/>${grid(h*.66,w,h*.34,acc,.8,.8,16,9)}`);}
function drawerFoot(w,h){ if(D==='A')return svg(w,h,`<rect width="${w}" height="${h}" fill="${dark?'#1a0b2e':'#ffe9e6'}"/>${grid(0,w,h,dark?'#ff4fb8':'#ff8ab8',.55,1)}`);
 if(D==='B')return svg(w,h,`<defs>${chrome('cf',dark)}</defs><text x="${w/2}" y="${h*.55}" text-anchor="middle" font-family="Kaushan" font-size="40" fill="url(#cf)" stroke="${dark?'#fff':'#141a3e'}" stroke-width=".8" transform="rotate(-6 ${w/2} ${h/2})">Stay Bright</text><path d="M${w*.2} ${h*.72}H${w*.8}" stroke="${acc2}" stroke-width="3"/>`);
 if(D==='C')return svg(w,h,`<rect width="${w}" height="${h}" fill="${dark?'#140a2c':'#fff3ea'}"/>${palm(30,h,.9,dark?'#24164a':'#ffd2bf')}${palm(w-30,h,1.05,dark?'#24164a':'#ffd2bf')}<path d="M0 ${h-14}H${w}" stroke="${acc}" stroke-width="2"/><path d="M0 ${h-8}H${w}" stroke="${acc2}" stroke-width="2"/>`);
 return svg(w,h,`${grid(10,w,h-10,acc,.35,.7,18,8)}`);}
// ---------------- UI ----------------
const status=`<div class="status"><span>9:41</span><span>5G ▮▮▮ 86%</span></div>`;
const fabs=(top)=>`<div class="fab" style="top:${top}px">${compass()}</div><div class="fab" style="top:${top+56}px">${ic('layers')}</div><div class="fab on" style="top:${top+112}px">${ic('loc')}</div>`;
const sbar=()=>`<div class="panel sbar">${ic('menu')}<span class="ph t">${t(D==='C'?'今晚开往哪里？':D==='D'?'搜索地点':'想去哪儿？','Where to tonight?')}</span>${ic('mic')}</div>`;
const chips=()=>`<div class="chips">${[['food','美食','Food'],['cafe','咖啡','Coffee'],['fuel','加油','Fuel'],['park','公园','Parks']].map(([k,a,b])=>`<span class="chip">${ic(k)}<span class="t">${t(a,b)}</span></span>`).join('')}</div>`;
const poi=(k,x,y,zh,en)=>`<div class="poi" style="left:${x}px;top:${y}px">${poiIcon(k)}<span class="lb t">${t(zh,en)}</span></div>`;
const head=(s,sz)=>`<span class="h t" style="font-size:${sz}px">${s}</span>`;
let ui='';
if(scr==='map'){ui=status+sbar()+chips()+poi('cafe',96,330,'霓虹咖啡','Neon Café')+poi('food',262,420,'午夜食堂','Midnight Diner')+poi('fuel',120,640,'海湾加油站','Bayside Fuel')+poi('park',300,250,'棕榈公园','Palm Park')
 +`<div class="me" id="me" style="left:214px;top:540px">${meMarker()}</div>`+fabs(690)+`<div class="scale"><span>500 m</span><i></i></div>`;}
if(scr==='drawer'){const items=[['star','收藏地点','Saved places'],['route','我的行程','Trips'],['clock','最近去过','Recent'],['palette','皮肤与语音','Skins & voices'],['layers','地图样式','Map style'],['gear','设置','Settings'],['upd','检查更新','Check for updates']];
 const title=D==='B'?`<span class="h t" style="font-size:38px;background:linear-gradient(180deg,#fff,#9cc0e8 46%,#24335e 50%,#d58ad6 75%,#ffe7c8);-webkit-background-clip:text;color:transparent;-webkit-text-stroke:.6px ${dark?'#fff':'#141a3e'}">RoadGlow</span>`:head('RoadGlow',D==='D'?30:28);
 ui=status+sbar()+chips()+`<div class="scrim"></div><div class="drawer"><div class="art">${drawerArt(318,206)}</div><div class="ttl" style="color:${D==='A'||D==='D'?acc:V['--tx']}">${title}</div><div class="sub t">${t(['霓虹落日 · 一路向西','铬光与霓虹','夜色公路 · 开往海边','线框夜城'][D.charCodeAt(0)-65],['Neon sunset, heading west','Chrome & neon','Night drive to the coast','Wireframe night city'][D.charCodeAt(0)-65])}</div><div class="div"></div>
 ${items.map(([k,a,b],i)=>`<div class="mi ${i===3?'on':''}"><span class="bx">${ic(k)}</span><span class="t">${t(a,b)}</span></div>`).join('')}<div class="foot">${drawerFoot(318,150)}</div></div>`;}
if(scr==='place'){ui=status+sbar()+`<div class="me" id="me" style="left:0;top:0">${meMarker()}</div><div class="poi" id="pin" style="left:0;top:0">${poiIcon('food')}</div>`+fabs(290)
 +`<div class="panel sheet"><div class="grab"></div>${head(t('午夜食堂','Midnight Diner'),D==='D'?22:25)}<div class="ps t">${t('美式餐厅 · 营业至凌晨 2:00 · 2.4 公里','American diner · Open till 2 AM · 2.4 km')}</div>
 <div class="row" style="margin-top:8px;font-size:14px;gap:6px"><span style="color:${acc2}">★★★★☆</span><span class="t">4.6</span><span class="t" style="color:var(--tx2)">${t('(328 条评价)','(328 reviews)')}</span></div>
 <div class="btns"><span class="btn p">${ic('route')}<span class="t">${t('路线','Directions')}</span></span><span class="btn">${ic('go')}<span class="t">${t('出发','Start')}</span></span><span class="btn" style="flex:.55">${ic('bm')}</span><span class="btn" style="flex:.55">${ic('share')}</span></div>
 <div class="info">${ic('clock')}<span class="t">${t('今日 17:00 – 次日 02:00','Today 5 PM – 2 AM')}</span></div><div class="info">${ic('phone')}<span class="t">+1 780 555 0188</span></div><div class="info">${ic('globe')}<span class="t">midnightdiner.example</span></div></div>`;}
if(scr==='nav'){const arrow=svg(62,62,`<path d="M18 56V30a8 8 0 0 1 8-8h18" stroke="${D==='D'?acc:acc2}" stroke-width="${D==='D'?3:6}" fill="none" stroke-linecap="round" opacity=".35" transform="translate(0,0)" style="filter:none"/><path d="M18 56V30a8 8 0 0 1 8-8h18" stroke="${D==='D'?acc:dark?'#fff':V['--tx']}" stroke-width="${D==='D'?2:4.5}" fill="none" stroke-linecap="round"/><path d="M38 12l10 10-10 10" stroke="${D==='D'?acc:dark?'#fff':V['--tx']}" stroke-width="${D==='D'?2:4.5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
 ui=status+`<div class="me" id="me" style="left:206px;top:640px">${meMarker()}</div>`+`<div class="panel navtop">${arrow}<div style="min-width:0;flex:1"><div class="d h t">300 m</div><div class="st t">${t('右转进入 杰斯珀大道','Turn right onto Jasper Ave')}</div></div></div>
 <div class="panel lanes"><span class="t" style="color:var(--tx2)">${t('然后','Then')}</span>${ic('go','width:18px;height:18px;transform:rotate(-30deg)')}<span class="t">${t('靠左','Keep left')}</span></div>`+fabs(360).replace(/top:(\d+)px/g,(m,a)=>`top:${+a}px`)
 +`<div class="fab" style="top:528px">${ic('vol')}</div><div class="panel navbot"><div style="flex:1;min-width:0"><div class="eta h t">21:58</div><div class="s2 t">${t('12 分钟 · 4.8 公里','12 min · 4.8 km')}</div></div><span class="stop">${ic('x')}<span class="t">${t('结束导航','End')}</span></span></div>`;}
document.getElementById('ui').innerHTML=ui+`<div class="tag">${D}${dark?' dark':' light'} · ${scr}</div>`;
// overlap check: text spans vs icons/other text
window._overlap=()=>{const els=[...document.querySelectorAll('#ui .t, #ui svg.ic, .fab, .poi > div:first-child')];const r=els.map(e=>e.getBoundingClientRect());const hits=[];
 for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){if(els[i].contains(els[j])||els[j].contains(els[i]))continue;const a=r[i],b=r[j];const ox=Math.min(a.right,b.right)-Math.max(a.left,b.left),oy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(ox>1&&oy>1&&a.width&&b.width)hits.push((els[i].textContent||els[i].className.baseVal||els[i].className).toString().slice(0,20)+' × '+(els[j].textContent||els[j].className.baseVal||els[j].className).toString().slice(0,20));}
 const of=[...document.querySelectorAll('#ui .t')].filter(e=>e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflow!=='visible').map(e=>'overflow:'+e.textContent);return hits.concat(of);};
