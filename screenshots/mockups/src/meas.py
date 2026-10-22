from night import N; from pal import cr
for k,p in N.items():
  P=p['P']
  print(k,'label/land %.1f poi/land %.1f | minor/bld %.2f minor/land %.2f pri/land %.2f water/land %.2f park/land %.2f | panel/land %.2f panel/bld %.2f panel/pri %.2f | txt %.1f sub %.1f acc %.1f btn %.1f'%(cr(p['label'],p['land']),cr(p['poi'],p['land']),cr(p['minor'],p['bld']),cr(p['minor'],p['land']),cr(p['pri'],p['land']),cr(p['water'],p['land']),cr(p['park'],p['land']),cr(P['fill'],p['land']),cr(P['fill'],p['bld']),cr(P['fill'],p['pri']),cr(P['txt'],P['fill']),cr(P['sub'],P['fill']),cr(P['brass'],P['fill']),cr(P['btxt'],P['btn'])))
