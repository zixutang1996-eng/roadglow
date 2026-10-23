const p=require('/workspace/pptr/node_modules/puppeteer-core');const http=require('http'),fs=require('fs');
http.createServer((q,r)=>{try{r.end(fs.readFileSync('.'+decodeURIComponent(q.url.split('?')[0])))}catch(e){r.statusCode=404;r.end()}}).listen(8765);
(async()=>{const b=await p.launch({executablePath:process.env.CHROME,args:['--use-angle=swiftshader','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox']});const pg=await b.newPage();await pg.setViewport({width:1024,height:600});
for(const sk of ['neon','west','sanguo','nord'])for(const d of [0,1])for(const n of [0,1]){const f=`${sk}_${d?'dark':'light'}_${n?'nav':'map'}.png`;
await pg.goto(`http://localhost:8765/p.html?s=${sk}_${d?'dark':'light'}.json&dark=${d}&nav=${n}&ink=${sk=='sanguo'?1:0}`);
try{await pg.waitForFunction('window.done',{timeout:40000})}catch(e){console.log('timeout',f)}
await pg.screenshot({path:'out/'+f});console.log(f)}
await b.close();process.exit(0)})();
