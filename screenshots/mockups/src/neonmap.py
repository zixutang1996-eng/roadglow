import json
L={
1:dict(name='暖白霓虹',bg='#e8e3d9',land='#e9e4da',park='#cfdcc6',water='#9cc4cb',wedge='#6fa1ab',bld='#dcd5c9',bldo='#c9c0b2',path='#d2c9ba',casing='#c6bdae',minor='#f7f3ec',sec='#f4efe5',pri='#e6be5c',mot='#d98ab4',rail='#a49cb4',label='#25212b',poi='#7a1f55',halo='#f4f0e8',wlabel='#1d4a52'),
2:dict(name='冷灰混凝土',bg='#d4d8dc',land='#d6dade',park='#c2d3ca',water='#91b6c9',wedge='#5f8ea6',bld='#c8cdd3',bldo='#b4bac2',path='#bfc5cc',casing='#b2b9c2',minor='#eef1f4',sec='#e9edf1',pri='#7cc3cf',mot='#c690b6',rail='#8e93a8',label='#1a1f27',poi='#5e1d4c',halo='#e9ecef',wlabel='#1b4558'),
3:dict(name='沙色粉彩',bg='#e4d9c7',land='#e6dccb',park='#ccd8ba',water='#a6c8d4',wedge='#6f9dad',bld='#d8cbb6',bldo='#c4b59d',path='#cdbfa7',casing='#c1b29b',minor='#f4ede1',sec='#f1e8d9',pri='#eca974',mot='#d68bb2',rail='#a497a0',label='#2a221d',poi='#7c2550',halo='#f3ece0',wlabel='#1d4a57'),
}
def style(n):
  s=json.load(open('/workspace/gamenav/web/public/styles/neon_light.json')); p=L[n]
  M={'background':'bg','landuse':'land','park':'park','wood':'park','water':'water','water-edge':'wedge','waterway':'wedge','building':'bld','path':'path','minor':'minor','secondary':'sec','primary':'pri','motorway':'mot','rail':'rail'}
  for l in s['layers']:
    pt=l.setdefault('paint',{}); i=l['id']
    for k in list(pt):
      if 'color' not in k: continue
      if i in M: pt[k]=p[M[i]]
      if i.endswith('-ink'): pt[k]=p['casing']
      if i.endswith('-glow'): pt[k]=p[M[i[:-5]]]
      if i=='building' and k=='fill-outline-color': pt[k]=p['bldo']
      if l['type']=='symbol':
        if k=='text-halo-color': pt[k]=p['halo']
        else: pt[k]=p['wlabel'] if i=='water-name' else p['poi'] if i in ('poi','place-country') else p['label']
  return json.dumps(s)
