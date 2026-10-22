import json
from pal import cr
C={'P1':dict(name='灰玫瑰',mot='#c9a3ae',acc='#8a4a5d',dmot='#7d5a68'),
   'P2':dict(name='莓果红',mot='#bf8299',acc='#863a5a',dmot='#7e4a62'),
   'P3':dict(name='灰梅紫',mot='#a98ba9',acc='#6e3d69',dmot='#6a5274')}
def lab(h):
  h=h.lstrip('#'); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
  c=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in c]
  X=(c[0]*.4124+c[1]*.3576+c[2]*.1805)/.95047; Y=c[0]*.2126+c[1]*.7152+c[2]*.0722; Z=(c[0]*.0193+c[1]*.1192+c[2]*.9505)/1.08883
  f=lambda t: t**(1/3) if t>.008856 else 7.787*t+16/116
  return 116*f(Y)-16,500*(f(X)-f(Y)),200*(f(Y)-f(Z))
def dE(a,b): A,B=lab(a),lab(b); return sum((x-y)**2 for x,y in zip(A,B))**.5
if __name__=='__main__':
  from neonmap import L
  land=L[1]['land']; gold=L[1]['pri']; teal='#0b6f75'; panel='#f6f1e8'
  print('old','mot/land %.2f dE gold %.0f'%(cr('#d98ab4',land),dE('#d98ab4',gold)))
  for k,p in C.items():
    print(k,p['name'],'mot/land %.2f mot/L2land %.2f | dE mot-gold %.0f mot-land %.0f | acc/panel %.1f dE acc-teal %.0f | dark mot/land %.2f dE dmot-darkgold %.0f'%(cr(p['mot'],land),cr(p['mot'],L[2]['land']),dE(p['mot'],gold),dE(p['mot'],land),cr(p['acc'],panel),dE(p['acc'],teal),cr(p['dmot'],'#181a25'),dE(p['dmot'],'#a08a3c')))
