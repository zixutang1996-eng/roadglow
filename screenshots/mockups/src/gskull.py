def mx(pts): return [(240-x,y) for x,y in pts]
def P(pts): return 'M'+' L'.join(f'{x} {y}' for x,y in pts)+' Z'
def Lseg(a,b,w,col='currentColor'): return f'<path d="M{a[0]} {a[1]} L{b[0]} {b[1]}" stroke="{col}" stroke-width="{w}" stroke-linecap="butt"/>'
HORN=[(98,20),(44,18),(8,2),(34,29),(98,37)]
FACE=[(90,13),(150,13),(158,29),(141,44),(132,84),(108,84),(99,44),(82,29)]
EYE=[(96,32),(114,32),(107,45)]
NOS=[(110,71),(116,71),(113,79)]
HEAD='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -2 240 90" width="150" height="56" fill="none" stroke-linejoin="miter" stroke-miterlimit="10">'
def defs():
  return f'<defs><mask id="nf" maskUnits="userSpaceOnUse" x="-5" y="-5" width="250" height="100"><rect x="-5" y="-5" width="250" height="100" fill="white"/><path d="{P(FACE)}" fill="black"/></mask></defs>'
def outline(w):
  g=f'<g mask="url(#nf)"><path d="{P(HORN)}" stroke="currentColor" stroke-width="{w}"/><path d="{P(mx(HORN))}" stroke="currentColor" stroke-width="{w}"/></g>'
  g+=f'<path d="{P(FACE)}" stroke="currentColor" stroke-width="{w}"/>'
  for e in (EYE,mx(EYE)): g+=f'<path d="{P(e)}" stroke="currentColor" stroke-width="{w*.8}"/>'
  for n in (NOS,mx(NOS)): g+=f'<path d="{P(n)}" fill="currentColor"/>'
  return g
def g1(): return HEAD+defs()+outline(3.4)+'</svg>'
def g2():
  g=HEAD+defs()+outline(3)
  hs=[((50,22.5),(80,23.8)),((54,27),(80,30.2)),((20,10),(32,24))]
  es=[((99,35),(112.5,35)),((102,38),(111,38)),((105,41),(109.5,41))]
  for a,b in hs+es:
    g+=Lseg(a,b,1.3)+Lseg((240-a[0],a[1]),(240-b[0],b[1]),1.3)
  return g+'</svg>'
def g3():
  m=f'<mask id="s" maskUnits="userSpaceOnUse" x="-5" y="-5" width="250" height="100"><path d="{P(HORN)}" fill="white"/><path d="{P(mx(HORN))}" fill="white"/><path d="{P(FACE)}" fill="white"/>'
  for d in (EYE,mx(EYE),NOS,mx(NOS)): m+=f'<path d="{P(d)}" fill="black"/>'
  for a,b in [((86,24),(154,24)),((120,50),(120,66)),((40,22),(96,28.5)),((200,22),(144,28.5))]: m+=Lseg(a,b,1.4,'black')
  m+='</mask>'
  return HEAD+'<defs>'+m+'</defs><rect x="-5" y="-5" width="250" height="100" fill="currentColor" mask="url(#s)"/></svg>'
if __name__=='__main__':
  for k,f in (('G1',g1),('G2',g2),('G3',g3)):
    s=f(); assert ' C' not in s and ' Q' not in s and 'A' not in s.replace('maskUnits','').replace('ANY',''); open(f'../mskull_{k}.svg','w').write(s)
