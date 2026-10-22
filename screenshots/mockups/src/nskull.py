# half human / half machine skull, straight lines only. viewBox 0 0 100 110, centre x=50
def P(pts,close=True): return 'M'+' L'.join(f'{x} {y}' for x,y in pts)+(' Z' if close else '')
HUM=[(50,4),(31,8),(17,21),(12,42),(17,58),(22,72),(31,79),(33,94),(50,96)]
MEC=[(50,4),(70,5),(85,16),(90,38),(90,56),(82,70),(70,79),(68,94),(50,96)]
OUT=HUM+MEC[::-1][1:-1]
EYE_H=[(23,40),(42,37),(40,52),(27,53)]
NOSE=[(50,58),(43,70),(50,70)]
VISOR=[(56,38),(85,36),(84,47),(57,51)]
def svg(v):
  st='stroke="currentColor" stroke-linejoin="miter" stroke-linecap="square" fill="none"'
  g=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">']
  if v in ('S1','S2'):
    w=2.4 if v=='S1' else 2.0
    g.append(f'<path d="{P(OUT)}" {st} stroke-width="{w}"/>')
    g.append(f'<path d="M50 4 L50 96" {st} stroke-width="{w*.5}" stroke-dasharray="{"none" if v=="S1" else "3 2"}"/>')
    g.append(f'<path d="{P(EYE_H)}" {st} stroke-width="{w}"/>')
    g.append(f'<path d="{P(NOSE)}" fill="currentColor"/>')
    g.append(f'<path d="{P(VISOR)}" {st} stroke-width="{w}"/>')
    if v=='S2': g.append(f'<path d="{P(VISOR)}" fill="var(--mag,currentColor)" opacity=".85"/>')
    # teeth human
    g.append(f'<path d="M31 82 L50 82 M36 79 L36 86 M41 80 L41 87 M46 80 L46 87" {st} stroke-width="{w*.6}"/>')
    # machine seams + jaw vents
    g.append(f'<path d="M50 24 L84 20 M57 62 L89 58 M56 84 L69 84 M56 88 L68 88" {st} stroke-width="{w*.6}"/>')
    # circuit traces
    tr='M56 13 L66 13 L71 18 M60 70 L72 70 L78 64 M54 30 L62 30 L66 26'
    g.append(f'<path d="{tr}" {st} stroke-width="{w*.6}"/>')
    if v=='S2':
      for x,y in ((71,18),(78,64),(66,26)): g.append(f'<rect x="{x-1.6}" y="{y-1.6}" width="3.2" height="3.2" fill="currentColor"/>')
    # human cheekbone
    g.append(f'<path d="M17 58 L33 61" {st} stroke-width="{w*.6}"/>')
  else:
    m='<mask id="k" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><path d="'+P(OUT)+'" fill="white"/>'
    for d in (EYE_H,NOSE,VISOR): m+=f'<path d="{P(d)}" fill="black"/>'
    m+='<path d="M50 6 L50 94 M50 24 L84 20 M57 62 L89 58 M31 82 L50 82 M36 79 L36 86 M41 80 L41 87 M46 80 L46 87 M56 84 L69 84 M56 13 L66 13 L71 18 M60 70 L72 70 L78 64" stroke="black" stroke-width="1.6" fill="none"/></mask>'
    g.append('<defs>'+m+'</defs><rect width="100" height="100" fill="currentColor" mask="url(#k)"/>')
    g.append(f'<path d="{P(VISOR)}" fill="var(--mag,currentColor)" opacity=".9"/>')
  g.append('</svg>'); s=''.join(g); assert ' C' not in s and ' Q' not in s; return s
if __name__=='__main__':
  for v in ('S1','S2','S3'): open(f'../neon_skull_{v}.svg','w').write(svg(v))
