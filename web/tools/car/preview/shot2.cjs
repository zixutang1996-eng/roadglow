// v0.9.10 previews of the exported car styles → screenshots/car/v0910/ (MOCK: browser MapLibre GL JS, not the car host)
const p=require('/workspace/pptr/node_modules/puppeteer-core');const http=require('http'),fs=require('fs'),path=require('path');
const W=path.resolve(__dirname,'../../..'),OUT=path.resolve(W,'../screenshots/car/v0910');fs.mkdirSync(OUT,{recursive:true});
const map=u=>u.startsWith('/pub/')?W+'/public/'+u.slice(5):u.startsWith('/mlgl/')?W+'/node_modules/maplibre-gl/dist/'+u.slice(6):__dirname+u;
http.createServer((q,r)=>{try{r.end(fs.readFileSync(map(decodeURIComponent(q.url.split('?')[0]))))}catch(e){r.statusCode=404;r.end()}}).listen(8766);
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox']});const pg=await b.newPage();await pg.setViewport({width:1024,height:600});
const log=[];for(const sk of ['synthb','synthc','sanguo','neon'])for(const mode of ['light','dark'])for(const n of [0,1]){const f=`${sk}_${mode}_${n?'nav':'map'}.png`;
await pg.goto(`http://localhost:8766/p2.html?sk=${sk}&mode=${mode}&nav=${n}`);let to=false;
try{await pg.waitForFunction('window.done',{timeout:60000})}catch(e){to=true}
const miss=await pg.evaluate('window.miss||[]');await pg.screenshot({path:OUT+'/'+f});const l=`${f}${to?' TIMEOUT':''} missingImages=${JSON.stringify(miss)}`;console.log(l);log.push(l)}
fs.writeFileSync(OUT+'/render_log.txt',log.join('\n')+'\n');await b.close();process.exit(0)})();
