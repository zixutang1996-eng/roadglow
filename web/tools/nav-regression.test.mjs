// Deterministic execution of the real navigation module in a tiny DOM/map harness.
// No browser or device GPS; timers, GPS and HTTP responses are controlled fixtures.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as geo from '../src/navgeo.js';
const source = fs.readFileSync(process.env.NAV_SOURCE || new URL('../src/nav.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '').replace('export function startNavigation', 'function startNavigation') + '\nglobalThis.startNavigation = startNavigation;';
const haversine = (a,b) => Math.hypot((a.lng-b.lng)*111195*Math.cos(a.lat*Math.PI/180),(a.lat-b.lat)*111195);
const distToLine = (p,c) => geo.project(p,c,0,c.length).d;
const pt = (x,y,extra={}) => ({lng:x/111195,lat:y/111195,speed:15,heading:0,acc:5,...extra});
const route = (c=[[0,0],[0,100],[100,100]]) => ({geometry:{type:'LineString',coordinates:c.map(([x,y])=>[x/111195,y/111195])},distance:200,duration:20,steps:[{type:'depart',modifier:'',loc:pt(...c[0]),distance:100},{type:'turn',modifier:'right',loc:pt(...c[1]),distance:100},{type:'arrive',modifier:'',loc:pt(...c.at(-1)),distance:0}]});
function harness(r=route(), request=async()=>[route()]) {
  let now=1700000000000, raf=null, next=1, watch=null; const timers=new Map(), els=new Map(), events=new Map();
  const el=()=>({set id(v){this._id=v;els.set('#'+v,this);},get id(){return this._id;},classList:{add(){},remove(){},contains(){return false;}},style:{},innerHTML:'',textContent:'',appendChild(){},after(){},remove(){},querySelector(s){return get(s);}});
  const get=s=>{if(!els.has(s))els.set(s,el());return els.get(s);};
  const puck={p:null,setLngLat(p){this.p={...p};return this;},setRotation(){return this;},getElement:()=>get('puck')};
  const map={getBearing:()=>0,getLayer:()=>null,getContainer:()=>({clientHeight:844}),getZoom:()=>18,getPitch:()=>55,isMoving:()=>false,on(){},off(){},easeTo(){},jumpTo(){},getSource:()=>({setData(){}})};
  const S={routes:[r],routeIdx:0,travel:'drive',dest:{name:'B'},me:pt(0,0)}, calls=[];
  const ctx={...geo,haversine,distToLine,console,URLSearchParams,location:{search:''},navigator:{geolocation:{watchPosition:f=>(watch=f,1),clearWatch(){}}},document:{body:el(),documentElement:el(),querySelector:get,createElement:el},window:{addEventListener:(e,f)=>events.set(e,f),removeEventListener:e=>events.delete(e)},Date:class extends Date{static now(){return now;}},performance:{now:()=>now-1700000000000},requestAnimationFrame:f=>(raf=f,1),cancelAnimationFrame:()=>raf=null,setInterval:()=>0,clearInterval(){},setTimeout:(f,ms)=>{let id=next++;timers.set(id,{at:now+ms,f});return id;},clearTimeout:id=>timers.delete(id),Marker:class{setLngLat(){return this;}addTo(){return this;}remove(){}},t:k=>k,tz:(_,v)=>v,fmtDist:d=>`${Math.round(d)}m`,fmtDur:d=>`${d}s`,instruction:s=>s.type,lang:'en',phrase:e=>e,say(){}};
  vm.createContext(ctx);vm.runInContext(source,ctx);
  const st=ctx.startNavigation({map,S,setMe:p=>S.me=p,makePuck:()=>puck,reroute:p=>{calls.push(p);return request(p);},drawRoutes(){},onEnd(){}});
  const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
  const tick=async(ms=1000)=>{now+=ms;for(const[id,t]of [...timers])if(t.at<=now){timers.delete(id);t.f();} if(raf){const f=raf;raf=null;f(now-1700000000000);} await flush();};
  const fix=(p)=>st.inject({...p,timestamp:p.timestamp??now});
  return {st,S,puck,calls,fix,tick,flush,now:()=>now,gps:g=>watch(g),online:()=>events.get('online')?.(),el:get};
}
const tests=[]; const test=(n,f)=>tests.push([n,f]);
test('arrow never extrapolates beyond the last measured fix at a turn',async()=>{const h=harness();h.fix(pt(0,90,{speed:20}));await h.tick(1500);assert.ok(h.puck.p.lat<=pt(0,90).lat+1e-10,`arrow advanced ${(h.puck.p.lat-pt(0,90).lat)*111195}m`);});
test('missed turn on parallel road 25m away triggers recalculation',async()=>{const h=harness();for(let i=0;i<3;i++){h.fix(pt(20+i*15,125,{heading:90}));await h.tick();}assert.ok(h.calls.length>=1,'distance-only 35m threshold missed the parallel road');});
test('U-turn on the same route triggers recalculation',async()=>{const h=harness(route([[0,0],[0,600],[200,600]]));for(let i=0;i<4;i++){h.fix(pt(0,400-i*20,{heading:180}));await h.tick();}assert.ok(h.calls.length>=1,'distance to line is zero but travel is backwards');});
test('stale and out-of-order GPS cannot move navigation',async()=>{const h=harness();h.fix(pt(0,50));await h.tick();h.fix(pt(0,95,{timestamp:h.now()-20000}));await h.tick();assert.ok(h.puck.p.lat<pt(0,60).lat,'stale GPS was accepted');});
test('failed reroute is visible and retries after network recovery',async()=>{let n=0;const h=harness(route(),async()=>{if(++n===1)throw Error('offline');return[route([[40,150],[40,300],[100,300]])];});for(let i=0;i<2;i++){h.fix(pt(40,150+i*5));await h.tick();}assert.match(h.el('#navStatus').textContent,/retry|unavailable/i);await h.tick(6000);h.online();await h.flush();assert.ok(h.calls.length>=2,'no retry on online event');});
test('ending navigation ignores delayed route responses',async()=>{let resolve;const h=harness(route(),()=>new Promise(r=>resolve=r));for(let i=0;i<2;i++){h.fix(pt(80,180+i*5));await h.tick();}const r=h.st.route();h.st.end();resolve([route([[80,180],[80,300],[100,300]])]);await h.flush();assert.equal(h.st.route(),r,'late response changed ended session');});
test('turn instruction is not advanced 10m before the junction',async()=>{const h=harness();h.fix(pt(0,90));await h.tick();assert.match(h.el('#navBody').innerHTML,/10m/,'turn was skipped before reaching it');});
test('duplicate fixes do not count as two off-route observations',async()=>{const h=harness();const p=pt(70,160);h.fix(p);h.fix(p);await h.flush();assert.equal(h.calls.length,0);});
test('poor accuracy cannot trigger a reroute',async()=>{const h=harness();for(let i=0;i<4;i++){h.fix(pt(80,150+i*5,{acc:100}));await h.tick();}assert.equal(h.calls.length,0);});
test('timeout unlocks rerouting and fresh GPS retries successfully',async()=>{let n=0;const h=harness(route(),()=>++n===1?new Promise(()=>{}):Promise.resolve([route()]));for(let i=0;i<2;i++){h.fix(pt(70,160+i*5));await h.tick();}await h.tick(16000);assert.match(h.el('#navStatus').textContent,/unavailable/i);await h.tick(5000);h.fix(pt(70,175));await h.flush();assert.equal(h.calls.length,2);});
test('old periodic result cannot overwrite an off-route route',async()=>{let resolve;let n=0;const newer=route([[70,160],[70,300],[150,300]]);const h=harness({...route(),duration:1000},()=>++n===1?new Promise(r=>resolve=r):Promise.resolve([newer]));h.fix(pt(0,30));h.st._force();h.st.checkBetter();await h.tick();for(let i=0;i<2;i++){h.fix(pt(70,160+i*5));await h.tick();}assert.equal(h.st.route(),newer);resolve([{...route(),duration:1}]);await h.flush();assert.equal(h.st.route(),newer);});
test('failed reroutes are throttled, not requested every GPS callback',async()=>{const h=harness(route(),async()=>{throw Error('offline');});for(let i=0;i<5;i++){h.fix(pt(80,150+i*5));await h.tick();}assert.equal(h.calls.length,1);await h.tick(2000);h.fix(pt(80,180));await h.flush();assert.equal(h.calls.length,2);});
test('returning to route resets off-route evidence',async()=>{const h=harness();h.fix(pt(80,180));await h.tick();h.fix(pt(0,30));await h.tick();h.fix(pt(80,180));await h.tick();assert.equal(h.calls.length,0);});
test('arrow stays at measured raw GPS instead of snapping to parallel route',async()=>{const h=harness();h.fix(pt(12,60));await h.tick();assert.ok(Math.abs(h.puck.p.lng-pt(12,60).lng)<1e-12);assert.equal(h.S.me.acc,5);});
test('actual GPS callback carries timestamps rather than rejuvenating stale fixes',async()=>{const h=harness();const gps=(y,ts)=>h.gps({coords:{latitude:pt(0,y).lat,longitude:0,speed:10,heading:0,accuracy:5},timestamp:ts});gps(40,h.now());await h.tick();gps(90,h.now()-20000);await h.tick();assert.ok(h.puck.p.lat<pt(0,50).lat);});
test('empty route response preserves existing route and exposes retry status',async()=>{const h=harness(route(),async()=>[]);const r=h.st.route();for(let i=0;i<2;i++){h.fix(pt(80,180+i*5));await h.tick();}assert.equal(h.st.route(),r);assert.match(h.el('#navStatus').textContent,/retry|unavailable/i);});
test('pending reroute is single flight across many fresh GPS fixes',async()=>{const h=harness(route(),()=>new Promise(()=>{}));for(let i=0;i<8;i++){h.fix(pt(80,180+i*5));await h.tick();}assert.equal(h.calls.length,1);});
test('stopped GPS freezes arrow instead of predicting through junction',async()=>{const h=harness();h.fix(pt(0,90,{speed:27.8}));await h.tick(30000);assert.ok(h.puck.p.lat<=pt(0,90).lat+1e-10);});
test('return to the original route clears obsolete network-failure warning',async()=>{const h=harness(route(),async()=>{throw Error('offline');});for(let i=0;i<2;i++){h.fix(pt(80,180+i*5));await h.tick();}assert.match(h.el('#navStatus').textContent,/unavailable/i);h.fix(pt(0,50));await h.tick();assert.equal(h.el('#navStatus').textContent,'');});
test('recent but out-of-order GPS cannot rewind authoritative position',async()=>{const h=harness();h.fix(pt(0,30));await h.tick();h.fix(pt(0,60));await h.tick();h.fix(pt(0,20,{timestamp:h.now()-1500}));await h.tick();assert.equal(h.S.me.lat,pt(0,60).lat);});
test('wrong-way detection works when device omits speed and heading',async()=>{const h=harness(route([[0,0],[0,600],[200,600]]));for(let i=0;i<5;i++){h.fix(pt(0,400-i*20,{heading:null,speed:null}));await h.tick();}assert.ok(h.calls.length>=1);});
let failures=0;for(const[n,f]of tests){try{await f();console.log('PASS',n);}catch(e){failures++;console.log('FAIL',n,'—',e.message);}}console.log(`${tests.length-failures}/${tests.length} passed`);process.exitCode=failures?1:0;
