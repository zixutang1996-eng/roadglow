# Re-centre compass_*.png artwork so its opaque bbox centre == image centre (needle rotates about the centre). Idempotent.
import glob,os
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__))
for f in glob.glob(f'{D}/out*/compass_*.png'):
  im=Image.open(f).convert('RGBA');x0,y0,x1,y1=im.split()[-1].getbbox()
  dx=round(im.width/2-(x0+x1)/2);dy=round(im.height/2-(y0+y1)/2)
  if dx or dy:
    o=Image.new('RGBA',im.size);o.paste(im,(dx,dy));o.save(f);print('centred',os.path.basename(os.path.dirname(f)),os.path.basename(f),dx,dy)
