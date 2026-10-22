import sys,os
from PIL import Image
d,sfx,out=sys.argv[1:4]; fs=sys.argv[4].split(',') if len(sys.argv)>4 else ['map','drawer_mid','drawer','drawer_bottom','search','skin_mid','skinswitch','place']
ims=[Image.open(f'{d}/{f}_{sfx}.png').resize((412,915)) for f in fs if os.path.exists(f'{d}/{f}_{sfx}.png')]
sh=Image.new('RGB',(412*4,915*((len(ims)+3)//4)),'white')
for i,im in enumerate(ims): sh.paste(im,((i%4)*412,(i//4)*915))
sh.save(out)
