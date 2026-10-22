from skull import SKL,HL,HR,EYEL,EYER,NL,NR,M
VB='viewBox="-2 -5 204 122" width="130" height="78"'
def head(): return f'<svg xmlns="http://www.w3.org/2000/svg" {VB} fill="none" stroke-linecap="round" stroke-linejoin="round">'
def mir(d): return M(d)
BROW='M68 37 C84 30 116 30 132 37'
CHEEK='M69 50 C75 58 80 60 85 58'
def m1():
  g=[head(),f'<defs><clipPath id="e"><path d="{EYEL}"/><path d="{EYER}"/></clipPath><clipPath id="h"><path d="{HL}"/><path d="{HR}"/></clipPath><mask id="ns" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="140"><rect x="-10" y="-10" width="220" height="140" fill="white"/><path d="{SKL}" fill="black"/></mask></defs>']
  g.append(f'<g mask="url(#ns)"><path d="{HL}" stroke="currentColor" stroke-width="3"/><path d="{HR}" stroke="currentColor" stroke-width="3"/></g>')
  g.append(f'<path d="{SKL}" stroke="currentColor" stroke-width="3"/>')
  g.append(f'<path d="{BROW}" stroke="currentColor" stroke-width="3"/>')
  for d in (CHEEK,mir(CHEEK)): g.append(f'<path d="{d}" stroke="currentColor" stroke-width="2.4"/>')
  for e in (EYEL,EYER): g.append(f'<path d="{e}" stroke="currentColor" stroke-width="2.6"/>')
  g.append('<g clip-path="url(#e)" stroke="currentColor" stroke-width="1.6">'+''.join(f'<line x1="{x}" y1="36" x2="{x+12}" y2="58"/><line x1="{200-x}" y1="36" x2="{188-x}" y2="58"/>' for x in (70,75,80,85))+'</g>')
  for a,b in [('M26 30 C40 38 54 42 70 43','M40 31 C50 37 60 40 70 40')]:
    g.append('<g clip-path="url(#h)">'+''.join(f'<path d="{d}" stroke="currentColor" stroke-width="1.8"/><path d="{mir(d)}" stroke="currentColor" stroke-width="1.8"/>' for d in (a,b))+'</g>')
  for n in (NL,NR): g.append(f'<path d="{n}" fill="currentColor"/>')
  g.append('<path d="M88 110 C95 107 105 107 112 110" stroke="currentColor" stroke-width="2.6"/>')
  return ''.join(g)+'</svg>'
def lens(d_outer,d_inner): return f'<path fill-rule="evenodd" fill="currentColor" d="{d_outer} {d_inner}"/>'
def scaled(d,s,cx,cy,dy=0): return f'<path d="{d}" transform="translate({cx} {cy+dy}) scale({s}) translate({-cx} {-cy})"/>'
def m2():
  # tapered strokes via mask: filled shape minus shrunken offset copy
  g=[head(),'<defs><mask id="m" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="140">']
  g.append(f'<path d="{SKL}" fill="white"/>'+scaled(SKL,.9,100,58,2.2).replace('<path','<path fill="black"'))
  for d,cx in ((HL,38),(HR,162)):
    inner='M70 30 C55 19 35 25 17 17 C11 14 7 9 5 5 C8 13 13 20 23 25.5 C39 35 56 40 69 41.5 Z'
    g.append(f'<path d="{d}" fill="white"/><path d="{inner if cx<100 else M(inner)}" fill="black"/>')
  g.append(scaled(SKL,.9,100,58,2.2).replace('<path','<path fill="black"')+'</mask></defs>')
  g.append('<rect x="-10" y="-10" width="220" height="140" fill="currentColor" mask="url(#m)"/>')
  # swelling brow & cheeks as lens fills
  g.append('<path d="M68 37 C84 29 116 29 132 37 C116 33 84 33 68 37Z" fill="currentColor"/>')
  for e in (EYEL,EYER): g.append(f'<path d="{e}" stroke="currentColor" stroke-width="1.2"/>'+scaled(e,1,0,0).replace('<path',f'<path fill="currentColor" opacity=".55"'))
  for d in ('M70 49 C75 57 80 60 86 59 C80 58 76 55 70 49Z',): g.append(f'<path d="{d}" fill="currentColor"/><path d="{mir(d)}" fill="currentColor"/>')
  for d in ('M24 32 C40 41 56 44 68 45',): g.append(f'<path d="{d}" stroke="currentColor" stroke-width="1"/><path d="{mir(d)}" stroke="currentColor" stroke-width="1"/>')
  for n in (NL,NR): g.append(f'<path d="{n}" fill="currentColor"/>')
  g.append('<path d="M88 110 C95 106 105 106 112 110 C105 108 95 108 88 110Z" fill="currentColor"/>')
  return ''.join(g)+'</svg>'
def m3():
  g=[head(),'<defs><mask id="s" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="140">']
  for d in (SKL,HL,HR): g.append(f'<path d="{d}" fill="white" stroke="white" stroke-width="2"/>')
  for d in (EYEL,EYER,NL,NR): g.append(f'<path d="{d}" fill="black"/>')
  for d in ('M30 18 C34 24 36 30 36 35','M44 22 C47 28 48 33 48 39','M58 26 C60 31 61 36 60 42'): g.append(f'<path d="{d}" stroke="black" stroke-width="1.1" fill="none"/><path d="{mir(d)}" stroke="black" stroke-width="1.1" fill="none"/>')
  g.append(f'<path d="{BROW}" stroke="black" stroke-width="1.4" fill="none"/>')
  g.append('<path d="M88 110 C95 107 105 107 112 110" stroke="black" stroke-width="1.4" fill="none"/>')
  g.append('</mask></defs><rect x="-10" y="-10" width="220" height="140" fill="currentColor" mask="url(#s)"/>')
  return ''.join(g)+'</svg>'
if __name__=='__main__':
  for k,f in (('M1',m1),('M2',m2),('M3',m3)): open(f'../mskull_{k}.svg','w').write(f())
