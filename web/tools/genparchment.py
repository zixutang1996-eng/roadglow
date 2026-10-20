# Procedural, original parchment textures for the ink-west theme (no external images used).
# Outputs to web/public/tex: seamless fill tiles + 9-slice rim (colour) and torn-edge (alpha mask) images.
import numpy as np
from PIL import Image
import os
OUT = os.path.join(os.path.dirname(__file__), '../public/tex'); os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

def pnoise(n, beta=2.0, seed=0):
    """Periodic (tileable) fractal noise via FFT-filtered white noise, range 0..1."""
    r = np.random.default_rng(seed); w = r.standard_normal((n, n))
    f = np.fft.fftfreq(n); fx, fy = np.meshgrid(f, f); k = np.sqrt(fx**2 + fy**2); k[0, 0] = 1
    a = np.real(np.fft.ifft2(np.fft.fft2(w) / k**(beta / 2))); a -= a.min(); return a / a.max()

def lerp(c1, c2, t): c1, c2 = np.array(c1, float), np.array(c2, float); return c1 + (c2 - c1) * t[..., None]
hexc = lambda h: [int(h[i:i+2], 16) for i in (1, 3, 5)]

def fill(n, light, seed):
    m = pnoise(n, 2.6, seed) * .65 + pnoise(n, 1.6, seed + 1) * .35            # blotchy mottling
    m = (m - m.mean()) / (m.std() * 3) + .5
    fib = pnoise(n, .9, seed + 2)                                                # fine fibre grain
    if light: c = lerp(hexc('#f1e5c8'), hexc('#d7b98a'), np.clip(m * .9, 0, 1))   # cream -> tan
    else: c = lerp(hexc('#5c4831'), hexc('#3c2b1b'), np.clip(m, 0, 1))          # lamp-lit aged
    c *= (0.96 + 0.08 * fib)[..., None]
    # foxing: small reddish-brown flecks, some with darker centres, clustered
    yy, xx = np.mgrid[0:n, 0:n]; r = np.random.default_rng(seed + 3)
    for _ in range(26 if light else 18):
        cx, cy, rad = r.uniform(0, n), r.uniform(0, n), r.uniform(1.2, 5)
        dx = np.minimum(abs(xx - cx), n - abs(xx - cx)); dy = np.minimum(abs(yy - cy), n - abs(yy - cy))
        d = np.sqrt(dx**2 + dy**2) / rad; a = np.clip(1 - d, 0, 1)**1.5 * r.uniform(.15, .4)
        c = c * (1 - a[..., None]) + np.array(hexc('#8a5a2b') if light else hexc('#24170c')) * a[..., None]
    # faint tide-line stains
    s = pnoise(n, 3.2, seed + 4); ring = np.exp(-((s - .62) / .012)**2) * (.10 if light else .14)
    c = c * (1 - ring[..., None]) + np.array(hexc('#9b6c38')) * ring[..., None] * (1 if light else .4)
    # fibres: short thin strokes
    for _ in range(60):
        x0, y0, ang, L = r.uniform(0, n), r.uniform(0, n), r.uniform(0, np.pi), r.uniform(6, 22)
        for t in np.linspace(0, L, int(L * 2)):
            x, y = int(x0 + np.cos(ang) * t) % n, int(y0 + np.sin(ang) * t) % n; c[y, x] *= (.93 if light else 1.08)
    return np.clip(c, 0, 255).astype(np.uint8)

def edge(S, light, seed, amp, nicks, rc=16, fe=8):
    """9-slice source: size 3S, slice S (2x px). Gentle low-frequency undulation (period = S, i.e. 40-64 css px per repeat),
    amplitude `amp` (2x px), a few small nicks, feathered thin scorch, soft alpha."""
    N = 3 * S; r = np.random.default_rng(seed)
    def prof(k):
        t = np.arange(N); p = np.zeros(N)
        for h, a in [(1, 1.0), (2, .45)]: p += a * np.sin(2 * np.pi * h * t / S + r.uniform(0, 6.3))
        p = (p - p.min()) / (p.max() - p.min()) * amp
        for _ in range(nicks):                                  # occasional small nick (periodic per tile)
            c, w, dpt = r.uniform(0, S), r.uniform(3, 7), r.uniform(.8, 1.6) * amp
            d = np.minimum(abs((t - c) % S), S - abs((t - c) % S)); p += dpt * np.clip(1 - d / w, 0, 1) ** 1.5
        return p + 2
    L, R, T, B = (prof(k) for k in range(4))
    yy, xx = np.mgrid[0:N, 0:N]
    dl, dr, dt, db = xx - L[yy], (N - 1 - xx) - R[yy], yy - T[xx], (N - 1 - yy) - B[xx]
    d = np.minimum.reduce([dl, dr, dt, db]).astype(float)
    # v0.9.1 rounded (slightly irregular) corners: radius rc (2x px) varies +-25% per corner
    for hx, hy in [(dl, dt), (dr, dt), (dl, db), (dr, db)]:
        rr = rc * r.uniform(.75, 1.25); m = (hx < rr) & (hy < rr)
        d = np.where(m, np.minimum(d, rr - np.hypot(rr - hx, rr - hy)), d)
    nz = pnoise(S, 2.0, seed + 9); nz = nz[yy % S, xx % S]
    alpha = np.clip(d / fe, 0, 1) ** 1.3                          # v0.9.1 feathered alpha falloff (fe 2x px)
    mask = np.zeros((N, N, 4), np.uint8); mask[..., 3] = (alpha * 255).astype(np.uint8)
    w = S * .16 * (0.75 + 0.5 * nz)                             # narrow feathered scorch (~5-10 css px)
    q = np.clip(d / w, 0, 1)
    umber, tan = hexc('#5a3a1a'), (hexc('#b98f58') if light else hexc('#2c1e10'))
    col = lerp(umber, tan, q)
    a = (1 - q) ** 2.2 * alpha * (.42 if light else .5) * (.8 + .4 * nz)
    rim = np.dstack([col, np.clip(a, 0, 1) * 255]).astype(np.uint8)
    rim[S:2*S, S:2*S, 3] = 0; mask[S:2*S, S:2*S, 3] = 255
    return rim, mask

for light, name in [(True, 'light'), (False, 'dark')]:
    Image.fromarray(fill(384, light, 11 if light else 21)).save(f'{OUT}/parch_{name}.webp', quality=80)
for size, S, amp, nk, rc, fe in [('s', 24, 1.5, 0, 12, 6), ('m', 40, 3.0, 1, 16, 9), ('l', 64, 4.5, 1, 20, 12)]:
    for light, name in [(True, 'light'), (False, 'dark')]:
        rim, mask = edge(S * 2, light, 100 + S, amp, nk, rc, fe)   # rendered at 2x for retina; CSS slices at S*2 and draws at S px
        Image.fromarray(rim, 'RGBA').save(f'{OUT}/rim_{size}_{name}.webp', quality=82)
    Image.fromarray(mask, 'RGBA').save(f'{OUT}/torn_{size}.png', optimize=True)
# contrast report: text vs lightest/darkest 1% of fill
def lum(c):
    c = np.asarray(c, float) / 255; c = np.where(c <= .03928, c / 12.92, ((c + .055) / 1.055)**2.4); return c @ [.2126, .7152, .0722]
for name, fg in [('light', '#22160b'), ('dark', '#f6ead0')]:
    f = np.asarray(Image.open(f'{OUT}/parch_{name}.webp').convert('RGB')).reshape(-1, 3); L = lum(f); lf = lum(hexc(fg))
    lo, hi = np.percentile(L, 1), np.percentile(L, 99)
    cr = [(max(lf, x) + .05) / (min(lf, x) + .05) for x in (lo, hi)]; print(name, 'contrast worst', round(min(cr), 2), 'best', round(max(cr), 2))
