O=/workspace/gamenav/screenshots/menu099
for s in neon west sanguo space nord tac blueprint; do HIDEMAP=1 SETTLE=8000 timeout 700 python3 run.py http://127.0.0.1:18790/ $O $s 412x915 1; done
for v in 360x640 412x780; do for s in neon west sanguo space nord tac blueprint; do timeout 500 python3 run.py http://127.0.0.1:18790/ $O/$v $s $v 1 en; done; done
echo ALLDONE
