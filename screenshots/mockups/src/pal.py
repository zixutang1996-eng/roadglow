D={
'd1':dict(fill='#5e4935',fill3='#6e5741',txt='#f1e4c8',sub='#dccaa6',brass='#e0b872',btn='#7a2e25',btxt='#f3e6cc',rule2='rgba(241,228,200,.22)',sh='inset 0 1px 0 rgba(255,236,200,.12),0 1px 2px rgba(0,0,0,.6),0 8px 20px rgba(0,0,0,.6)'),
'd2':dict(fill='#b49f78',fill3='#a38d66',txt='#140d06',sub='#36281a',brass='#4a3418',btn='#6e2a22',btxt='#f3e6cc',rule2='rgba(32,23,14,.25)',sh='0 1px 2px rgba(0,0,0,.6),0 8px 20px rgba(0,0,0,.55)'),
'd3':dict(fill='#15100b',fill3='#261d14',txt='#ecc27a',sub='#cfa868',brass='#e6b45e',btn='#6a241d',btxt='#f0dcb4',rule2='rgba(236,194,122,.2)',sh='inset 0 1px 0 rgba(236,180,94,.28),0 1px 2px rgba(0,0,0,.7),0 8px 22px rgba(0,0,0,.7)'),
'd4':dict(fill='#57291f',fill3='#6a3329',txt='#ead0a0',sub='#d8b98a',brass='#d9ae62',btn='#2a1310',btxt='#ead0a0',rule2='rgba(217,174,98,.28)',sh='inset 0 1px 0 rgba(234,208,160,.12),0 1px 2px rgba(0,0,0,.6),0 8px 20px rgba(0,0,0,.6)'),
}
def L(h):
  h=h.lstrip('#'); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
  c=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in c]; return .2126*c[0]+.7152*c[1]+.0722*c[2]
def cr(a,b): a,b=L(a),L(b); return (max(a,b)+.05)/(min(a,b)+.05)
if __name__=='__main__':
  MAP=['#2a231c','#3e3428']
  for k,p in D.items():
    print(k,'txt %.1f sub %.1f accent %.1f btn %.1f chipOnFill3 %.1f | panel vs map %.2f / %.2f'%(cr(p['txt'],p['fill']),cr(p['sub'],p['fill']),cr(p['brass'],p['fill']),cr(p['btxt'],p['btn']),cr(p['txt'],p['fill3']),cr(p['fill'],MAP[0]),cr(p['fill'],MAP[1])))
