def M(d):  # mirror path tokens x -> 200-x for absolute coords pairs
  import re
  out=[];toks=re.findall(r'[MCLZ]|-?\d+\.?\d*',d);i=0;nums=[]
  res=[]
  for t in toks:
    if t in 'MCLZ': res.append(t)
    else: res.append(t)
  # mirror pairs
  r=[];flag=0
  for t in res:
    if t in 'MCLZ': r.append(t);flag=0;continue
    r.append(str(round(200-float(t),2)) if flag%2==0 else t); flag+=1
  return ' '.join(r)
def rev(d):
  return d
SKL='M100 19 C86 19 74 21 69 27 L65 39 C65 48 69 54 76 58 C80 68 83 80 84 94 C85 104 87 110 92 113 L108 113 C113 110 115 104 116 94 C117 80 120 68 124 58 C131 54 135 48 135 39 L131 27 C126 21 114 19 100 19 Z'
HL='M72 24 C55 12 34 20 16 12 C9 9 5 4 3 0 C5 12 11 21 22 28 C38 39 56 44 70 46 Z'
HR=M(HL)
EYEL='M73 42 C77 37 88 37 91 44 C92 51 86 56 80 54 C75 52 72 47 73 42 Z'
EYER=M(EYEL)
NL='M93 91 C90 97 91 104 96 108 C98 104 98 97 97 91 Z'
NR=M(NL)
def svg(v):
  A=v=='A'
  sw=.65 if A else 1.15; sp=1.8 if A else 3.0; ol=1.9 if A else 2.7
  hatch=lambda id,ang,s: f'<pattern id="{id}" width="{s}" height="{s}" patternUnits="userSpaceOnUse" patternTransform="rotate({ang})"><line x1="0" y1="0" x2="0" y2="{s}" stroke="currentColor" stroke-width="{sw}"/></pattern>'
  defs=f'''<defs>{hatch('h1',35,sp)}{hatch('h2',-35,sp)}{hatch('h3',90,sp*.9)}{hatch('hR',-55,sp)}
<clipPath id="sk"><path d="{SKL}"/></clipPath>
<clipPath id="hn"><path d="{HL}"/><path d="{HR}"/></clipPath></defs>'''
  g=[defs]
  # horns: outline + shading on lower inner half
  g.append(f'<path d="{HL}" fill="none" stroke="currentColor" stroke-width="{ol}" stroke-linejoin="round"/><path d="{HR}" fill="none" stroke="currentColor" stroke-width="{ol}" stroke-linejoin="round"/>')
  g.append(f'<g clip-path="url(#hn)"><rect x="0" y="26" width="200" height="22" fill="url(#h1)"/>'+('<rect x="0" y="33" width="200" height="12" fill="url(#h2)"/>' if A else '')+'</g>')
  # horn growth rings
  if A:
    for x,y1,y2 in [(62,22,42),(52,20,40),(42,18,37),(32,16,33)]:
      g.append(f'<path d="M{x} {y1} Q{x-2} {(y1+y2)/2} {x} {y2}" stroke="currentColor" stroke-width=".5" fill="none"/><path d="M{200-x} {y1} Q{202-x} {(y1+y2)/2} {200-x} {y2}" stroke="currentColor" stroke-width=".5" fill="none"/>')
  # skull outline + side shading
  g.append(f'<path d="{SKL}" fill="none" stroke="currentColor" stroke-width="{ol}" stroke-linejoin="round"/>')
  g.append(f'<g clip-path="url(#sk)"><path d="M60 30 L80 30 C76 50 86 72 92 114 L60 114 Z" fill="url(#h1)"/><path d="M140 30 L120 30 C124 50 114 72 108 114 L140 114 Z" fill="url(#h2)"/>'+
    ('<path d="M70 50 L80 50 C84 70 88 90 92 112 L70 112Z" fill="url(#h2)"/><path d="M130 50 L120 50 C116 70 112 90 108 112 L130 112Z" fill="url(#h1)"/>' if A else '')+'</g>')
  # brow ridge & forehead contour
  g.append(f'<path d="M68 37 C84 29 116 29 132 37" stroke="currentColor" stroke-width="{ol*1.15}" fill="none"/>')
  if A: g.append('<path d="M88 28 C95 26 105 26 112 28" stroke="currentColor" stroke-width=".5" fill="none"/><path d="M100 40 L100 70" stroke="currentColor" stroke-width=".5"/>')
  g.append(f'<path d="M70 50 C76 58 80 60 84 58" stroke="currentColor" stroke-width="{ol*.8}" fill="none"/><path d="M130 50 C124 58 120 60 116 58" stroke="currentColor" stroke-width="{ol*.8}" fill="none"/>')
  # eyes: dark cross-hatched
  for e in (EYEL,EYER):
    g.append(f'<path d="{e}" fill="currentColor" opacity=".45"/>');g.append(f'<path d="{e}" fill="url(#h1)" stroke="currentColor" stroke-width="{ol}"/><path d="{e}" fill="url(#h2)"/>')
    if A: g.append(f'<path d="{e}" fill="url(#h3)"/>')
  # snout nose
  for n in (NL,NR): g.append(f'<path d="{n}" fill="currentColor" stroke="currentColor" stroke-width="{sw}"/>')
  g.append(f'<path d="M88 110 C95 107 105 107 112 110" stroke="currentColor" stroke-width="{sw*1.5}" fill="none"/>')
  # small flourish below
  return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -5 204 122" width="200" height="116" style="color:#3a2a1a">{"".join(g)}</svg>'
if __name__=='__main__':
  for v in 'AB':
    open(f'../skull_{v}.svg','w').write(svg(v))
