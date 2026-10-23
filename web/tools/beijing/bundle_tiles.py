#!/usr/bin/env python3
"""Pack z13-14 tiles of an offline edition into per-z10 bundles (see registerTileProtocol in src/bj.js).
usage: bundle_tiles.py <tiles_dir>   (in place: writes tiles/b/*.bin and removes tiles/13, tiles/14)"""
import os, sys, struct, shutil, collections
T = sys.argv[1]; B = os.path.join(T, 'b'); os.makedirs(B, exist_ok=True)
groups = collections.defaultdict(list)
for z in (13, 14):
    zd = os.path.join(T, str(z))
    if not os.path.isdir(zd): continue
    for x in os.listdir(zd):
        for f in os.listdir(os.path.join(zd, x)):
            y = int(f.split('.')[0]); x_ = int(x); s = z - 10
            groups[(x_ >> s, y >> s)].append((z, x_ & ((1 << s) - 1), y & ((1 << s) - 1), os.path.join(zd, x, f)))
n = 0
for (bx, by), items in groups.items():
    items.sort(); data = []; idx = []; off = 0
    for z, dx, dy, fp in items:
        b = open(fp, 'rb').read(); idx.append(struct.pack('<BBBBII', z, dx, dy, 0, off, len(b))); data.append(b); off += len(b)
    with open(os.path.join(B, f'{bx}_{by}.bin'), 'wb') as o:
        o.write(struct.pack('<I', len(items))); o.write(b''.join(idx)); o.write(b''.join(data))
    n += len(items)
for z in (13, 14): shutil.rmtree(os.path.join(T, str(z)), ignore_errors=True)
print(f'bundled {n} tiles into {len(groups)} files')
