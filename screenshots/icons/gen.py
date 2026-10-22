import cairosvg
NAVY='#0b1224';CY='#4fd6e8';BE='#c77a9a'
def glow(path,col,w,extra=''):
    s=''
    for k,o in [(5,.06),(3.2,.10),(2,.18)]:
        s+=f'<path d="{path}" fill="none" stroke="{col}" stroke-width="{w*k}" stroke-opacity="{o}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
    s+=f'<path d="{path}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
    return s
def bgneon(): return f'''<defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#16244a"/><stop offset="1" stop-color="{NAVY}"/></radialGradient></defs><rect width="108" height="108" fill="url(#g)"/>
<g stroke="{CY}" stroke-opacity=".06" stroke-width=".4">'''+''.join(f'<line x1="{i}" y1="0" x2="{i}" y2="108"/><line x1="0" y1="{i}" x2="108" y2="{i}"/>' for i in range(6,108,8))+'</g>'
def oct(c,r,ch):
    a,b=c-r,c+r
    return f'M{a+ch},{a} L{b-ch},{a} L{b},{a+ch} L{b},{b-ch} L{b-ch},{b} L{a+ch},{b} L{a},{b-ch} L{a},{a+ch} Z'
icons={}
# A neon nav arrow with route trail
icons['A']=bgneon()+glow('M30,82 L40,72 M44,68 L50,62',BE,2.2,'stroke-dasharray="0"')+ \
 ''.join(f'<path d="M54,26 L78,78 L54,66 L30,78 Z" fill="{CY}" fill-opacity="{o}" stroke="{CY}" stroke-width="{w}" stroke-opacity="{o}" stroke-linejoin="round"/>' for w,o in [(10,.06),(6,.1),(3,.2)])+ \
 f'<path d="M54,26 L78,78 L54,66 Z" fill="{CY}"/><path d="M54,26 L30,78 L54,66 Z" fill="#2aa3b6"/>'
# B pin + circuit
pin='M54,24 C41,24 33,33 33,45 C33,60 54,82 54,82 C54,82 75,60 75,45 C75,33 67,24 54,24 Z'
icons['B']=bgneon()+glow('M22,62 L34,62 L40,68 M86,56 L76,56 L70,50 M30,74 L44,74',BE,1.6)+ \
 ''.join(f'<circle cx="{x}" cy="{y}" r="2.2" fill="{BE}"/>' for x,y in [(22,62),(86,56),(30,74)])+glow(pin,CY,3)+ \
 glow('M54,37 L54,45 M54,45 L47,51 M54,45 L61,51',CY,1.8)+f'<circle cx="54" cy="45" r="3.4" fill="{BE}"/>'
# C chamfered compass
icons['C']=bgneon()+glow(oct(54,30,10),CY,2.4)+'<g opacity=".5">'+glow(oct(54,22,7),CY,.8)+'</g>'+ \
 f'<path d="M54,30 L60,54 L48,54 Z" fill="{CY}"/><path d="M54,78 L60,54 L48,54 Z" fill="{BE}"/>'+ \
 f'<path d="M30,54 L54,49 L54,59 Z" fill="{CY}" fill-opacity=".35"/><path d="M78,54 L54,49 L54,59 Z" fill="{CY}" fill-opacity=".35"/><rect x="51" y="51" width="6" height="6" transform="rotate(45 54 54)" fill="{NAVY}" stroke="{CY}" stroke-width="1.2"/>'
# D west/neon hybrid split
icons['D']=f'<defs><clipPath id="l"><polygon points="0,0 108,0 0,108"/></clipPath><clipPath id="r"><polygon points="108,0 108,108 0,108"/></clipPath></defs>'+ \
 f'<rect width="108" height="108" fill="#e9dcbf"/><polygon points="108,0 108,108 0,108" fill="{NAVY}"/>'+ \
 f'<g clip-path="url(#l)"><circle cx="54" cy="54" r="27" fill="none" stroke="#2b2622" stroke-width="2.4"/><path d="M54,22 L62,54 L54,86 L46,54 Z" fill="#b08a3e" stroke="#2b2622" stroke-width="1.6" stroke-linejoin="round"/><path d="M54,22 L54,86" stroke="#2b2622" stroke-width="1.2"/></g>'+ \
 f'<g clip-path="url(#r)">{glow(oct(54,27,9),CY,2.4)}<path d="M54,22 L62,54 L54,86 L46,54 Z" fill="{BE}"/><path d="M54,22 L62,54 L54,54 Z" fill="{CY}"/></g>'+ \
 '<line x1="0" y1="108" x2="108" y2="0" stroke="#fff" stroke-opacity=".25" stroke-width=".6"/>'
# E skull compass (frontier)
skull='M32,38 L22,30 L20,36 L34,46 L40,46 L44,70 L50,82 L58,82 L64,70 L68,46 L74,46 L88,36 L86,30 L76,38 L66,40 L42,40 Z'
icons['E']=f'<defs><radialGradient id="p" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#3a2f28"/><stop offset="1" stop-color="#1e1916"/></radialGradient></defs><rect width="108" height="108" fill="url(#p)"/>'+ \
 '<g transform="translate(54 54) scale(.86) translate(-54 -56)"><circle cx="54" cy="56" r="31" fill="none" stroke="#b08a3e" stroke-opacity=".55" stroke-width="1.2"/>'+ \
 ''.join(f'<line x1="54" y1="23" x2="54" y2="28" stroke="#b08a3e" stroke-width="1.6" transform="rotate({a} 54 56)"/>' for a in range(0,360,45))+ \
 f'<path d="{skull}" fill="#e9dcbf" stroke="#c9a258" stroke-width="2.2" stroke-linejoin="miter"/>'+ \
 '<path d="M46,50 L52,52 L50,57 L45,55 Z M62,50 L56,52 L58,57 L63,55 Z" fill="#1e1916"/><path d="M54,62 L57,74 L54,79 L51,74 Z" fill="#7a2838"/></g>'
# F road R monogram
R='M38,82 L38,28 L60,28 Q74,28 74,42 Q74,55 60,55 L40,55 M56,55 L74,82'
icons['F']=bgneon()+f'<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{CY}"/><stop offset="1" stop-color="{BE}"/></linearGradient></defs>'+ \
 ''.join(f'<path d="{R}" fill="none" stroke="url(#rg)" stroke-width="{w}" stroke-opacity="{o}" stroke-linejoin="round"/>' for w,o in [(26,.06),(19,.12)])+ \
 f'<path d="{R}" fill="none" stroke="#1a2440" stroke-width="13" stroke-linejoin="round"/><path d="{R}" fill="none" stroke="url(#rg)" stroke-width="13" stroke-linejoin="round" stroke-opacity="0" />'+ \
 f'<path d="{R}" fill="none" stroke="url(#rg)" stroke-width="2" stroke-linejoin="round" transform="translate(0,0)"/>'+ \
 f'<path d="{R}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.3" stroke-dasharray="3.5 3.5"/>'
# F: make road edges: draw outer cyan/berry rails
icons['F']=bgneon()+f'<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{CY}"/><stop offset="1" stop-color="{BE}"/></linearGradient></defs>'+ \
 ''.join(f'<path d="{R}" fill="none" stroke="url(#rg)" stroke-width="{w}" stroke-opacity="{o}" stroke-linejoin="round"/>' for w,o in [(24,.08),(18,.16),(15,1)])+ \
 f'<path d="{R}" fill="none" stroke="#141d36" stroke-width="11" stroke-linejoin="round"/>'+ \
 f'<path d="{R}" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.3" stroke-dasharray="3.5 3.5"/>'
for k,v in icons.items():
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">{v}</svg>'
    open(f'icon_{k}.svg','w').write(svg)
    cairosvg.svg2png(bytestring=svg.encode(),write_to=f'icon_{k}.png',output_width=512,output_height=512)
