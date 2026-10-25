import { solve } from '../src/island.js';
let f=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)f++;};
const fr={l:8,t:40,r:392,b:820}, w=48,h=240;
const ov=(p,o)=>p.x<o.right&&p.x+w>o.left&&p.y<o.bottom&&p.y+h>o.top;
let p=solve({x:330,y:150},w,h,[],fr); ok(p.x===330&&p.y===150,'free spot kept');
p=solve({x:999,y:-50},w,h,[],fr); ok(p.x===fr.r-w&&p.y===fr.t,'clamped to safe frame');
const card={left:0,top:0,right:400,bottom:300}; p=solve({x:330,y:150},w,h,[card],fr); ok(!ov(p,card)&&p.y+h<=fr.b,'avoids nav card '+JSON.stringify(p));
const big={left:0,top:0,right:400,bottom:500},foot={left:0,top:720,right:400,bottom:840}; p=solve({x:330,y:150},w,h,[big,foot],fr); const H=p.h||h, ov2=o=>p.x<o.right&&p.x+w>o.left&&p.y<o.bottom&&p.y+H>o.top; ok(!ov2(big)&&!ov2(foot)&&H>=56,'avoids card x1.5 + footer '+JSON.stringify(p));
process.exit(f?1:0);
