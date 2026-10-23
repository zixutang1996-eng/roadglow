// v0.9.11 mockups → screenshots/car/v0911/ (MOCK: browser MapLibre + canvas re-implementation of PanelView, not the car host)
const p=require('/workspace/pptr/node_modules/puppeteer-core');const http=require('http'),fs=require('fs'),path=require('path');
const W=path.resolve(__dirname,'../../..'),OUT=path.resolve(W,'../screenshots/car/v0911');fs.mkdirSync(OUT,{recursive:true});
const map=u=>u.startsWith('/pub/')?W+'/public/'+u.slice(5):u.startsWith('/cf/')?W+'/android/app/src/car/assets/carfonts/'+u.slice(4):__dirname+u;
const srv=http.createServer((q,r)=>{try{r.end(fs.readFileSync(map(decodeURIComponent(q.url.split('?')[0]))))}catch(e){r.statusCode=404;r.end()}}).listen(8767);
const L=JSON.parse(fs.readFileSync(__dirname+'/layouts.json'));
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox']});const pg=await b.newPage();
const log=[];for(const lay of ['full','split','small'])for(const sk of ['synthb','synthc','sanguo','neon'])for(const mode of ['light','dark'])for(const n of [0,1]){const l=L[`${lay}_${n}`];await pg.setViewport({width:l.w,height:l.h});
const f=`${lay}_${sk}_${mode}_${n?'nav':'map'}.png`;await pg.goto(`http://localhost:8767/p3.html?sk=${sk}&mode=${mode}&nav=${n}&lay=${lay}`);let to=false;
try{await pg.waitForFunction('window.done',{timeout:60000})}catch(e){to=true}
const miss=await pg.evaluate('window.miss||[]'),ov=await pg.evaluate('!!window.overflow');await pg.screenshot({path:OUT+'/'+f});const s=`${f}${to?' TIMEOUT':''} textOverflow=${ov} meUnderPanel=${l.meUnderPanel} missingImages=${JSON.stringify(miss)}`;console.log(s);log.push(s)}
fs.writeFileSync(OUT+'/render_log.txt',log.join('\n')+'\n');await b.close();srv.close();})();
