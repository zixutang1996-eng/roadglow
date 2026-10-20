import json
P={
 'neon_dark':dict(bg='#14161f',water='#16283a',waterline='#2f8fa6',park='#17241f',land='#181a25',bld='#1f2130',bldline='#3a3354',minor='#2a2e40',sec='#33586a',pri='#a08a3c',mot='#9c4a7c',glow=True,rail='#4a4566',txt='#c4ccd9',halo='#101219',txt2='#d9c27a',font=['Rajdhani SemiBold'],fontb=['Rajdhani Bold'],bnd='#7a4a72',route='#4fd6e8',ink='#0f1118'),
 'neon_light':dict(bg='#8e94a2',water='#4d7c8f',waterline='#3f6a7b',park='#7b9488',land='#8a909e',bld='#9ba0ad',bldline='#7c8192',minor='#b9bdc8',sec='#c6c9d2',pri='#d8bf6a',mot='#c98aa9',glow=False,rail='#6f6a88',txt='#0e1018',halo='#b3b8c3',txt2='#4a0c3c',font=['Rajdhani SemiBold'],fontb=['Rajdhani Bold'],bnd='#b56aa3',route='#c2309a',ink='#c9cbd6'),
 'west_light':dict(bg='#ebddbb',water='#b4c0ac',waterline='#7d6a4c',park='#d9d3a6',land='#e5d5ad',bld='#dbc69a',bldline='#9c805a',minor='#f5ead0',sec='#f2e2bc',pri='#ecd29c',mot='#d9aa78',glow=False,rail='#5a4630',txt='#3b2c1c',halo='#f1e5c6',txt2='#6e3424',font=['IM FELL English Regular'],fontb=['IM FELL English Italic'],bnd='#8c4a32',route='#9a2a18',ink='#8a7150'),
 'west_dark':dict(bg='#26201a',water='#1f2a29',waterline='#6e6248',park='#2b2a1f',land='#2a231c',bld='#342b21',bldline='#5a4a36',minor='#3d3327',sec='#4d4030',pri='#6b5638',mot='#7d5a3a',glow=False,rail='#8a7656',txt='#d9c7a2',halo='#1c1712',txt2='#d8a878',font=['IM FELL English Regular'],fontb=['IM FELL English Italic'],bnd='#9a6a46',route='#e0a46a',ink='#17130f'),
}
ICONMAP={'restaurant':['restaurant','fast_food'],'cafe':['cafe','ice_cream','bakery'],'bar':['bar','beer','pub'],'library':['library'],
 'supermarket':['grocery','supermarket'],'fuel':['fuel'],'hotel':['lodging','hotel'],'hospital':['hospital','doctors','dentist'],'pharmacy':['pharmacy'],
 'school':['school','college','kindergarten','university'],'park':['park','playground','garden','dog_park','campsite'],'bank':['bank','atm'],
 'parking':['parking'],'transit':['bus','railway','tram','subway'],'ferry':['ferry_terminal','harbor'],'museum':['museum','art_gallery','attraction','monument','castle','theatre','cinema'],
 'shop':['shop','clothing_store','shoe','furniture','florist','mobile_phone','jewelry','optician','alcohol_shop','hardware','books','gift','car']}
ICON=['match',['get','class']]
for k,v in ICONMAP.items(): ICON+= [v,k]
ICON.append('generic')
IMPORTANT=['hospital','railway','ferry_terminal','attraction','museum','stadium','college','town_hall','zoo','castle','monument','theatre']
FOOD=['restaurant','fast_food','cafe']
PRIO=['+',['match',['get','class'],IMPORTANT,0,['bus'],['match',['get','subclass'],['bus_station'],0,80],FOOD,20,['grocery','supermarket','fuel','pharmacy','lodging','park','library'],30,60],['coalesce',['get','rank'],50]]
RK=['coalesce',['get','rank'],99]
CLS=lambda L:['match',['get','class'],L,True,False]
TIER=['case',['==',['get','class'],'hospital'],0, CLS(IMPORTANT),1,
  ['all',CLS(FOOD),['<=',RK,10]],2, CLS(['pharmacy','fuel']),2,
  CLS(FOOD),3, CLS(['grocery','supermarket','lodging','library','school','college','university']),3,
  ['<=',RK,10],4, ['<=',RK,20],5, ['<=',RK,40],6, 7]
REV=[11.5,11.8,12.6,13.3,14.0,14.8,15.7,16.6]   # zoom at which each tier starts fading in
# filter (integer tile zoom): include tiers that will start fading in before the next integer zoom
POIFILTER=['step',['zoom'],['<=',TIER,1]]+sum([[z,['<=',TIER,max(i for i,r in enumerate(REV) if r<z+1)]] for z in range(12,18)],[])
def ramp(lo,hi,delay=0):
    st=[]
    for zz in [x/4 for x in range(46,73)]:
        st+= [zz,['match',TIER,*sum([[i,round(lo+(hi-lo)*min(1,max(0,(zz-r-delay)/0.8)),2)] for i,r in enumerate(REV)],[]),hi]]
    return ['interpolate',['linear'],['zoom'],*st]
PRIO=TIER
def w(base):  # width by zoom
    return ['interpolate',['exponential',1.5],['zoom'],8,base*0.3,14,base*2,18,base*12]
name=['coalesce',['get','name:zh'],['get','name'],['get','name:en']] # overridden by locale at runtime
def style(k,p):
    west='west' in k; ink=p.get('ink')
    L=[{'id':'background','type':'background','paint':{'background-color':p['bg']}}]
    if False: L.append({'id':'paper','type':'background','paint':{'background-pattern':'paper','background-opacity':0.55}})
    L+=[
     {'id':'landuse','type':'fill','source':'omt','source-layer':'landuse','paint':{'fill-color':p['land'],'fill-opacity':0.6}},
     {'id':'park','type':'fill','source':'omt','source-layer':'park','paint':{'fill-color':p['park']}},
     {'id':'wood','type':'fill','source':'omt','source-layer':'landcover','filter':['in',['get','class'],['literal',['wood','grass']]],'paint':{'fill-color':p['park'],'fill-opacity':0.7}},
     {'id':'water','type':'fill','source':'omt','source-layer':'water','paint':{'fill-color':p['water']}},
     {'id':'water-edge','type':'line','source':'omt','source-layer':'water','paint':{'line-color':p['waterline'],'line-width':['interpolate',['linear'],['zoom'],8,0.5,16,2 if west else 1.5],'line-opacity':0.8 if p['glow'] else 0.6,'line-blur':2 if p['glow'] else 0}},
     {'id':'waterway','type':'line','source':'omt','source-layer':'waterway','paint':{'line-color':p['waterline'],'line-width':1.2,'line-opacity':0.6}},
     {'id':'building','type':'fill','source':'omt','source-layer':'building','minzoom':14,'paint':{'fill-color':p['bld'],'fill-outline-color':p['bldline']}},
    ]
    if False: L.append({'id':'building-hatch','type':'fill','source':'omt','source-layer':'building','minzoom':14,'paint':{'fill-pattern':'hatch','fill-opacity':0.5}})
    roads=[('minor',['in',['get','class'],['literal',['minor','service','track']]],p['minor'],1.0),
           ('secondary',['in',['get','class'],['literal',['secondary','tertiary']]],p['sec'],1.6),
           ('primary',['in',['get','class'],['literal',['primary','trunk']]],p['pri'],2.2),
           ('motorway',['==',['get','class'],'motorway'],p['mot'],2.8)]
    L.append({'id':'path','type':'line','source':'omt','source-layer':'transportation','minzoom':14,'filter':['==',['get','class'],'path'],'paint':{'line-color':p['minor'] if p['glow'] else (p['rail'] if west else ink),'line-width':1,'line-dasharray':[2,2]}})
    mz={'minor':12,'secondary':8,'primary':5,'motorway':4}
    for rid,f,c,base in roads:
        if p['glow'] and rid!='minor':
            L.append({'id':rid+'-glow','type':'line','source':'omt','source-layer':'transportation','minzoom':mz[rid],'filter':f,'layout':{'line-cap':'round','line-join':'round'},'paint':{'line-color':c,'line-width':w(base*2.6),'line-blur':w(base*1.6),'line-opacity':0.18}})
        if ink:
            L.append({'id':rid+'-ink','type':'line','source':'omt','source-layer':'transportation','minzoom':mz[rid],'filter':f,'layout':{'line-cap':'round','line-join':'round'},'paint':{'line-color':ink,'line-width':w(base*1.5)}})
        L.append({'id':rid,'type':'line','source':'omt','source-layer':'transportation','minzoom':mz[rid],'filter':f,'layout':{'line-cap':'round','line-join':'round'},'paint':{'line-color':c,'line-width':w(base*(0.9 if ink else 1)) if rid!='minor' or not p['glow'] else w(base)}})
    L+=[
     {'id':'rail','type':'line','source':'omt','source-layer':'transportation','filter':['in',['get','class'],['literal',['rail','transit']]],'paint':{'line-color':p['rail'],'line-width':1.4,'line-dasharray':[3,2] if west else [1,0]}},
     {'id':'boundary','type':'line','source':'omt','source-layer':'boundary','filter':['<=',['get','admin_level'],4],'layout':{'line-join':'round'},'paint':{'line-color':p['bnd'],'line-width':1.5,'line-dasharray':[4,2,1,2]}},
     {'id':'water-name','type':'symbol','source':'omt','source-layer':'water_name','layout':{'text-field':name,'text-font':p['fontb'],'text-size':14},'paint':{'text-color':p['waterline'],'text-halo-color':p['halo'],'text-halo-width':1.2}},
     {'id':'road-name','type':'symbol','source':'omt','source-layer':'transportation_name','minzoom':13,'layout':{'symbol-placement':'line','text-field':name,'text-font':p['font'],'text-size':['interpolate',['linear'],['zoom'],13,11,18,15],**({'text-transform':'uppercase','text-letter-spacing':0.12} if p['glow'] or 'neon' in k else {})},'paint':{'text-color':p['txt'],'text-halo-color':p['halo'],'text-halo-width':1.5}},
     {'id':'poi','type':'symbol','source':'omt','source-layer':'poi','minzoom':11,'filter':POIFILTER,'layout':{'icon-image':ICON,'icon-size':ramp(0.7,1.15),'text-field':name,'text-font':p['fontb'] if west else p['font'],'text-size':12,'text-anchor':'top','text-offset':[0,1.0],'text-optional':True,'symbol-sort-key':PRIO},'paint':{'icon-opacity':ramp(0,1),'text-opacity':ramp(0,1,0.35),'text-color':p['txt2'],'text-halo-color':p['halo'],'text-halo-width':1.2}},
     {'id':'place-suburb','type':'symbol','source':'omt','source-layer':'place','minzoom':12,'filter':['in',['get','class'],['literal',['suburb','village','quarter']]],'layout':{'text-field':name,'text-font':p['fontb'] if west else p['font'],'text-size':['interpolate',['linear'],['zoom'],12,10.5,15,12.5],'text-padding':14,'text-max-width':7,**({'text-transform':'uppercase','text-letter-spacing':0.15} )},'paint':{'text-color':p['txt'],'text-opacity':['interpolate',['linear'],['zoom'],12,0,13,0.75],'text-halo-color':p['halo'],'text-halo-width':1.4}},
     {'id':'place-neigh','type':'symbol','source':'omt','source-layer':'place','minzoom':14,'filter':['in',['get','class'],['literal',['neighbourhood','hamlet']]],'layout':{'text-field':name,'text-font':p['font'],'text-size':['interpolate',['linear'],['zoom'],14,10,17,12],'text-padding':18,'text-max-width':7,**({'text-transform':'uppercase','text-letter-spacing':0.12} )},'paint':{'text-color':p['txt'],'text-opacity':['interpolate',['linear'],['zoom'],14,0,15,0.7],'text-halo-color':p['halo'],'text-halo-width':1.4}},
     {'id':'place-city','type':'symbol','source':'omt','source-layer':'place','minzoom':4,'filter':['in',['get','class'],['literal',['city','town']]],'layout':{'text-field':name,'text-font':p['fontb'] if not west else p['font'],'text-size':['interpolate',['linear'],['zoom'],4,12,12,24]},'paint':{'text-color':p['txt2'] if p['glow'] else p['txt'],'text-halo-color':p['halo'],'text-halo-width':2,'text-halo-blur':1 if p['glow'] else 0}},
    ]
    L+=[
     {'id':'place-state','type':'symbol','source':'omt','source-layer':'place','minzoom':3,'maxzoom':8,'filter':['==',['get','class'],'state'],'layout':{'text-field':name,'text-font':p['font'],'text-size':12,'text-transform':'uppercase','text-letter-spacing':0.15},'paint':{'text-color':p['txt'],'text-opacity':0.7,'text-halo-color':p['halo'],'text-halo-width':1.5}},
     {'id':'place-country','type':'symbol','source':'omt','source-layer':'place','maxzoom':7,'filter':['==',['get','class'],'country'],'layout':{'text-field':name,'text-font':p['fontb'],'text-size':['interpolate',['linear'],['zoom'],1,11,5,16]},'paint':{'text-color':p['txt2'],'text-halo-color':p['halo'],'text-halo-width':2}},
    ]
    return {'version':8,'name':k,'glyphs':'{GLYPHS}','sprite':'{SPRITE}/'+k,'sources':{'omt':{'type':'vector','url':'https://tiles.openfreemap.org/planet'}},'layers':L,'metadata':{'route':p['route']}}
MZ={'landuse':9,'wood':6,'waterway':10,'rail':10,'water-name':5,'water-edge':6}
def scale(v,k):
    if isinstance(v,(int,float)): return round(v*k,2)
    if isinstance(v,list) and v and v[0]=='interpolate': return v[:3]+[x if i%2==0 else scale(x,k) for i,x in enumerate(v[3:])]
    return v
def fix(st):
    for l in st['layers']:
        lay=l.get('layout',{}); pt=l.get('paint',{})
        if 'text-size' in lay: lay['text-size']=scale(lay['text-size'],1.5)
        pass
        if 'text-halo-width' in pt: pt['text-halo-width']=round(pt['text-halo-width']+0.8,2); pt['text-halo-blur']=0.3
        if 'text-max-width' not in lay and 'text-field' in lay: lay['text-max-width']=7
        if l['id'] in MZ: l['minzoom']=MZ[l['id']]
    return st
for k,p in P.items(): json.dump(fix(style(k,p)),open(f'../assets/styles/{k}.json','w'))
print('ok')
