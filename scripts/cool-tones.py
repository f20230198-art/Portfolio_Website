"""
Pull the pink/magenta tones of the cliff and valley scenes (and the cloud band)
toward blue, leaving greens, oranges and the waterfall alone.
Run ONCE after prepare-scenes.py; running it again shifts the colours further.
"""
import numpy as np
from PIL import Image

def shift(path):
    im = Image.open(path)
    alpha = im.getchannel('A') if im.mode == 'RGBA' else None
    hsv = np.array(im.convert('RGB').convert('HSV')).astype(np.float32)
    h = hsv[..., 0] * 360 / 255
    w = np.clip(1 - np.abs(h - 310) / 45, 0, 1)  # strongest at magenta, fading by violet and rose
    hsv[..., 0] = ((h + (225 - h) * w * 0.85) % 360) * 255 / 360
    hsv[..., 1] *= 1 - 0.15 * w
    out = Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB')
    if alpha is not None:
        out.putalpha(alpha)
    out.save(path, 'WEBP', quality=90, method=6)

files = [f'public/descent/s{n}-{l}{m}.webp' for n in (1, 2) for l in ('bg', 'fg') for m in ('', '-m')] + ['public/descent/clouds.webp']
for f in files:
    shift(f)
    print('cooled', f)
