const puppeteer=require('/workspace/pixelnav/node_modules/puppeteer-core');
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--lang=zh-CN'],headless:'new'});
for(const [th,dk] of [[0,0],[0,1],[1,0],[1,1]]){
const p=await b.newPage();await p.evaluateOnNewDocument(()=>{Object.defineProperty(navigator,'language',{get:()=>'zh-CN'});Object.defineProperty(navigator,'languages',{get:()=>['zh-CN','zh']});});await p.setViewport({width:412,height:860});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:18777/');await p.evaluate((th,dk)=>{localStorage.setItem('flutter.theme',th);localStorage.setItem('flutter.dark',dk)},th,dk);
await p.goto('http://localhost:18777/',{waitUntil:'networkidle0',timeout:90000});await new Promise(r=>setTimeout(r,15000));
const n=`web_${th?'west':'neon'}_${dk?'dark':'light'}.png`;await p.screenshot({path:__dirname+'/../screenshots/'+n});console.log(n);await p.close();}
await b.close()})();
