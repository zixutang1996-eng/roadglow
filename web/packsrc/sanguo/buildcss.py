# theme.src.css -> theme.css: expands the scope prefix ($P) and escapes quotes inside data: URIs (pack CSS sanitiser).
import re,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s=open('theme.src.css').read(); B='body.pk-sanguo.west.sk-west'; N=':not(#_a):not(#_b)'  # id-level specificity beats the 0.9.5 Frontier stitching rules
s=s.replace('html.fx-scroll $P',f'html.fx-scroll{N} {B}')
for l in ('en','zh'): s=s.replace(f'html[data-lang={l}] $P',f'html[data-lang={l}]{N} {B}')
s=s.replace('$P',f'html{N} {B}')
s=re.sub(r'url\("data:image/svg\+xml,([^"]*)"\)',lambda m:'url("data:image/svg+xml,'+m.group(1).replace("'","%27")+'")',s)
open('theme.css','w').write(s); print('theme.css',len(s))
