N={
1:dict(name='暖棕夜',bg='#221a12',land='#251c14',park='#323520',water='#0c171c',wedge='#5b6a62',bld='#33281c',bldo='#4a3b2a',path='#9c8460',ink='#120d08',minor='#5a4832',sec='#77603f',pri='#9a7a4c',mot='#b08452',rail='#8a7656',label='#e2cfa8',poi='#e0ac74',halo='#140f0a',wlabel='#8fa7a0',
  P=dict(fill='#614c37',fill3='#715b45',txt='#f7eedb',sub='#ecdfc2',brass='#f0c780',btn='#7a2e25',btxt='#f3e6cc',rule2='rgba(243,231,204,.22)',sh='inset 0 1px 0 rgba(255,236,200,.14),0 1px 2px rgba(0,0,0,.6),0 8px 20px rgba(0,0,0,.6)')),
2:dict(name='石板蓝夜',bg='#1a1f26',land='#1c222a',park='#263a2e',water='#0a121b',wedge='#4c6478',bld='#262d36',bldo='#3a4552',path='#7f8c96',ink='#0c0f13',minor='#3c4652',sec='#53606c',pri='#7a828a',mot='#a08a66',rail='#6c7782',label='#d6d9d2',poi='#d9b98a',halo='#0e1216',wlabel='#7f9cb3',
  P=dict(fill='#b9a57e',fill3='#a8936b',txt='#150e07',sub='#33261a',brass='#4a3418',btn='#6e2a22',btxt='#f3e6cc',rule2='rgba(21,14,7,.25)',sh='0 1px 2px rgba(0,0,0,.6),0 8px 22px rgba(0,0,0,.6)')),
3:dict(name='橄榄林夜',bg='#1b1f16',land='#1d2118',park='#2e3d22',water='#0b1714',wedge='#506a58',bld='#2a2e20',bldo='#3e4430',path='#8e8a62',ink='#0d0f0a',minor='#454a34',sec='#5e6444',pri='#8a845a',mot='#a88a52',rail='#77775a',label='#dcd6b4',poi='#d6b07a',halo='#0f120c',wlabel='#86a594',
  P=dict(fill='#4a4630',fill3='#5a5540',txt='#f2e6c2',sub='#e2d3a8',brass='#efc472',btn='#6a241d',btxt='#f0dcb4',rule2='rgba(232,196,126,.2)',sh='inset 0 1px 0 rgba(230,180,94,.3),0 1px 2px rgba(0,0,0,.7),0 8px 22px rgba(0,0,0,.7)')),
4:dict(name='炭灰琥珀夜',bg='#1c1b1a',land='#1e1d1b',park='#2b3527',water='#0b1218',wedge='#556270',bld='#292725',bldo='#3d3a36',path='#8a7a62',ink='#0d0c0b',minor='#46423c',sec='#56514a',pri='#b08446',mot='#c8924a',rail='#706a60',label='#e0d4bc',poi='#e6a856',halo='#0f0e0d',wlabel='#8296a6',
  P=dict(fill='#4a3a2c',fill3='#5b4938',txt='#f0dcb4',sub='#dcc49a',brass='#f0b45a',btn='#7a2e25',btxt='#f3e6cc',rule2='rgba(240,220,180,.22)',sh='inset 0 1px 0 rgba(240,180,90,.18),0 1px 2px rgba(0,0,0,.65),0 8px 22px rgba(0,0,0,.65)')),
}
MAPK={'background':('background-color','bg'),'landuse':('fill-color','land'),'park':('fill-color','park'),'wood':('fill-color','park'),'water':('fill-color','water'),'water-edge':('line-color','wedge'),'waterway':('line-color','wedge'),'building':('fill-color','bld'),'path':('line-color','path'),'minor':('line-color','minor'),'secondary':('line-color','sec'),'primary':('line-color','pri'),'motorway':('line-color','mot'),'rail':('line-color','rail')}
def style(n):
  import json; s=json.load(open('/workspace/gamenav/web/public/styles/west_dark.json')); p=N[n]
  for l in s['layers']:
    pt=l.setdefault('paint',{}); i=l['id']
    if i in MAPK: pt[MAPK[i][0]]=p[MAPK[i][1]]
    if i=='building': pt['fill-outline-color']=p['bldo']
    if i.endswith('-ink'): pt['line-color']=p['ink']
    if l['type']=='symbol':
      pt['text-halo-color']=p['halo']; pt['text-color']=p['wlabel'] if i=='water-name' else p['poi'] if i in('poi','place-country') else p['label']
  return json.dumps(s)
