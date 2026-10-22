// builds a MapLibre style for each candidate skin
export const PAL = {
 space_light:{bg:'#eceae4',land:'#e4e2db',park:'#d9ddd2',water:'#c9d3dc',wline:'#9fb0bf',bld:'#dcd9d1',minor:'#ffffff',minorC:'#cfccc4',major:'#ffffff',majorC:'#a9a59b',mw:'#f2b33a',mwC:'#c9861c',rail:'#9a968c',lbl:'#2a2a2a',halo:'#eceae4',road:'#5b5b58',font:'Rajdhani SemiBold'},
 space_dark:{bg:'#0a0c10',land:'#0d1015',park:'#0d1310',water:'#030407',wline:'#2b3a52',bld:'#12151c',minor:'#1b1f28',minorC:null,major:'#2a303c',majorC:null,mw:'#8a5a1c',mwC:null,rail:'#2c313b',lbl:'#d8dbe2',halo:'#07080b',road:'#8b909b',font:'Rajdhani SemiBold'},
 nord_light:{bg:'#d9d7cf',land:'#d4d2c9',park:'#c3c6b6',water:'#a9b4b6',wline:'#7d8a8c',bld:'#c6c3b9',minor:'#ece9e1',minorC:'#b3afa4',major:'#efece4',majorC:'#8f8a7e',mw:'#e9e3d3',mwC:'#6e665a',rail:'#857f73',lbl:'#3b3731',halo:'#dcdad2',road:'#5d584f',font:'IM FELL English Regular'},
 nord_dark:{bg:'#24272a',land:'#272a2d',park:'#2a302c',water:'#171b1f',wline:'#4a545c',bld:'#2f3235',minor:'#3a3c3e',minorC:null,major:'#55575a',majorC:null,mw:'#7d7668',mwC:null,rail:'#4b4d50',lbl:'#d9d6cc',halo:'#1d2023',road:'#a19c90',font:'IM FELL English Regular'},
 tac_dark:{tac:true,bg:'#11140f',land:'#151a12',park:'#1a2315',water:'#080a09',wline:'#3a4a32',bld:'#3a4630',bldL:'#56634a',minor:'#4a5242',minorC:null,major:'#7d8670',majorC:null,mw:'#c9a646',mwC:null,rail:'#4e5446',lbl:'#d9dccd',halo:'#0b0d0a',road:'#b9bdaa',font:'Rajdhani SemiBold'},
 tac_light:{tac:true,bg:'#c4c1ab',land:'#bcb99f',park:'#a7ab8a',water:'#8c9a94',wline:'#5a665f',bld:'#8e8b70',bldL:'#6b6a55',minor:'#e4e2d4',minorC:null,major:'#f3f1e6',majorC:'#3c3f33',mw:'#e0a33a',mwC:'#5c4313',rail:'#5e5e52',lbl:'#1f211b',halo:'#cfcdbb',road:'#2e3027',font:'Rajdhani SemiBold'},
};
const W = (a,b,c,d)=>['interpolate',['exponential',1.6],['zoom'],10,a,13,b,16,c,18,d];
export function style(key, nav){
 const p=PAL[key], name=['coalesce',['get','name:en'],['get','name:latin'],['get','name']];
 const cls=(...c)=>['match',['get','class'],c,true,false];
 const L=[{id:'bg',type:'background',paint:{'background-color':p.bg}}];
 if(p.sat){L.push({id:'sat',type:'raster',source:'sat',paint:{'raster-saturation':-0.85,'raster-contrast':key==='tac_dark'?0.15:0.05,'raster-brightness-max':key==='tac_dark'?0.42:0.92,'raster-brightness-min':key==='tac_dark'?0:0.25,'raster-hue-rotate':25,'raster-opacity':1}});}
 else L.push({id:'landuse',type:'fill',source:'v','source-layer':'landuse',paint:{'fill-color':p.land}},
  {id:'park',type:'fill',source:'v','source-layer':'park',paint:{'fill-color':p.park}},
  {id:'wood',type:'fill',source:'v','source-layer':'landcover',filter:cls('wood','grass'),paint:{'fill-color':p.park,'fill-opacity':.7}});
 L.push({id:'water',type:'fill',source:'v','source-layer':'water',paint:{'fill-color':p.water,'fill-opacity':p.sat?.55:1}},
  {id:'water-edge',type:'line',source:'v','source-layer':'water',paint:{'line-color':p.wline,'line-width':1}});
 if(p.tac){ if(nav) L.push({id:'bld3d',type:'fill-extrusion',source:'v','source-layer':'building',minzoom:14,paint:{'fill-extrusion-color':p.bld,'fill-extrusion-height':['coalesce',['get','render_height'],8],'fill-extrusion-base':0,'fill-extrusion-opacity':1,'fill-extrusion-vertical-gradient':true}});
  else L.push({id:'bld',type:'fill',source:'v','source-layer':'building',minzoom:13,paint:{'fill-color':p.bld}}); }
 else if(!p.sat) L.push({id:'bld',type:'fill',source:'v','source-layer':'building',minzoom:14,paint:{'fill-color':p.bld}});
 else L.push({id:'bld',type:'line',source:'v','source-layer':'building',minzoom:14,paint:{'line-color':p.wline,'line-width':.5,'line-opacity':.6}});
 const road=(id,f,c,cc,w)=>{ if(cc) L.push({id:id+'-c',type:'line',source:'v','source-layer':'transportation',filter:f,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':cc,'line-width':W(...w.map(x=>x+1.6))}});
  L.push({id,type:'line',source:'v','source-layer':'transportation',filter:f,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':c,'line-width':W(...w)}}); };
 road('minor',cls('minor','service','tertiary'),p.minor,p.minorC,[.3,1,4,10]);
 road('major',cls('primary','secondary','trunk'),p.major,p.majorC,[.8,2,6,14]);
 road('mw',cls('motorway'),p.mw,p.mwC,[1,2.6,7,16]);
 L.push({id:'rail',type:'line',source:'v','source-layer':'transportation',filter:cls('rail'),paint:{'line-color':p.rail,'line-width':1,'line-dasharray':[3,3]}});
 L.push({id:'route-case',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#000','line-opacity':.0,'line-width':10}});
 L.push({id:'route',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fff','line-width':6}});
 const t=(id,sl,f,size,extra={})=>L.push({id,type:'symbol',source:'v','source-layer':sl,filter:f,layout:{'text-field':name,'text-font':[p.font],'text-size':size,'text-letter-spacing':.08,'text-max-width':8,...extra.l},paint:{'text-color':extra.c||p.lbl,'text-halo-color':p.halo,'text-halo-width':1.4,...extra.p}});
 t('wname','water_name',true,13,{c:p.wline==='#2b3a52'?'#5b7396':p.wline,l:{'text-letter-spacing':.25}});
 t('rname','transportation_name',true,11,{c:p.road,l:{'symbol-placement':'line','text-letter-spacing':.05}});
 t('neigh','place',cls('neighbourhood','suburb','quarter'),12,{l:{'text-transform':'uppercase','text-letter-spacing':.22},c:p.road});
 t('city','place',cls('city','town'),18,{l:{'text-transform':'uppercase','text-letter-spacing':.3}});
 return {version:8,glyphs:'/web/public/glyphs/{fontstack}/{range}.pbf',
  sources:{v:{type:'vector',url:'https://tiles.openfreemap.org/planet'},route:{type:'geojson',data:{type:'FeatureCollection',features:[]}},
   ...(p.sat?{sat:{type:'raster',tileSize:256,tiles:['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg'],maxzoom:15}}:{})},layers:L};
}
