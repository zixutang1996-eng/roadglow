const f=require('fontnik'),fs=require('fs');
const map={'Rajdhani SemiBold':'Rajdhani-SemiBold.ttf','Rajdhani Bold':'Rajdhani-Bold.ttf','IM FELL English Regular':'IMFeENrm28P.ttf','IM FELL English Italic':'IMFeENit28P.ttf'};
const out=__dirname+'/../assets/glyphs/';
(async()=>{for(const [name,file] of Object.entries(map)){const buf=fs.readFileSync('../fonts/'+file);fs.mkdirSync(out+name,{recursive:true});
for(let s=0;s<65536;s+=256){if(s>=0x3000&&s<0xA000)continue;if(s>=0xAC00&&s<0xD800)continue;if(s>=0xD800&&s<0xF900)continue;
const pbf=await new Promise((r,j)=>f.range({font:buf,start:s,end:s+255},(e,d)=>e?j(e):r(d)));fs.writeFileSync(`${out}${name}/${s}-${s+255}.pbf`,pbf);}}
console.log('done')})();
