# Generates theme.css for the synthb (Chrome & Neon Poster) and synthc (Night Drive) packs from the
# mockup-v4 variables baked by bake.py (outB/outC/vars_*.json). Scoped with id-level specificity.
import json,os,sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
FONTS="""@font-face{font-family:'RG Synth Script';src:url(fonts/synth-script.woff2) format('woff2');font-display:swap}
@font-face{font-family:'RG Synth Round';src:url(fonts/synth-round.woff2) format('woff2');font-display:swap}
@font-face{font-family:'RG Synth Wide';src:url(fonts/synth-wide.woff2) format('woff2');font-display:swap;font-weight:400 900}
@font-face{font-family:'RG Synth Cursive';src:url(fonts/synth-cursive.woff2) format('woff2');font-display:swap}
"""
FAM={'Kaushan':"'RG Synth Script'",'Righteous':"'RG Synth Round'",'Orbitron':"'RG Synth Wide'"}
CJK="'Noto Sans CJK SC','Noto Sans SC',sans-serif"
def vars_(d,m):
  j=json.load(open(f'out{d}/vars_{m}.json'));V={**j['V'],**j['S']}
  V['--head']=FAM.get(V['--head'],V['--head'])+','+CJK; V['--body']=(FAM[V['--body']]+',' if '--body' in V else '')+CJK
  V.setdefault('--divh','2px')
  tok={'--fg':V['--tx'],'--muted':V['--tx2'],'--accent':V['--acc'],'--chip':V['--cbg'],'--line':V['--n1']+'55','--line2':V['--n1']+'33'}
  bgsolid=V['--dbg']
  s=';'.join(f'{k}:{v}' for k,v in {**V,**tok}.items())
  return s+f';--bg:{bgsolid};--art:url(art_{m}.png);--foot:url(foot_{m}.png);--cmp:url(compass_{m}.png)'
import re
def imp(css):
  # every declaration in a selector rule gets !important (the neon base uses !important everywhere); custom properties untouched
  def blk(m):
    sel,body=m.group(1),m.group(2)
    if sel.strip().startswith('@font-face'): return m.group(0)
    ds=[x for x in body.split(';') if x.strip()]
    out=[x if (x.strip().startswith('--') or '!important' in x) else x+'!important' for x in ds]
    return sel+'{'+';'.join(out)+'}'
  return re.sub(r'([^{}]+)\{([^{}]*)\}',blk,css)
def build(d,pid):
  P=f'html:not(#_a):not(#_b) body.pk-{pid}'
  c=FONTS+f"{P}.light{{{vars_(d,'light')}}}\n{P}.dark{{{vars_(d,'dark')}}}\n"
  c+=imp(open('theme.src.css').read()+open(f'theme{d}.src.css').read()).replace('$P',P)
  return c
if __name__=='__main__':
  for d,pid in (('B','synthb'),('C','synthc')): open(f'out{d}/theme.css','w').write(build(d,pid)); print(pid,'ok')
