/**
 * The Descent — painted pixel-art scenes stacked into one vertical fall: the cliff,
 * the valley, a bank of clouds to fall through, then the pond, the crystal caves
 * and the deep cavern.
 *
 * Each scene has a background plate and a cut-out foreground (public/descent,
 * made by scripts/prepare-scenes.py). The plates are plain <img> layers the GPU
 * slides around; animated effects are drawn on small half-resolution canvases
 * (one per layer, only for scenes on screen), on a coarser grid (CELL source px
 * per effect pixel) that matches the size of the art's own pixel clusters.
 *
 * Motion comes from the paintings themselves: effect regions pick out real
 * pixels (water, glows, stars) and animate them, plus a few pixel particles.
 */

import { createSlime } from './slime';
import { blocks, revealOnScroll, onZone, chrome } from './text';

const SRC_W = 1880;       // scene image size (px)
const SRC_H = 3344;
const OVERLAPS = [0, 420, 900, 420, 420]; // rows where each scene blends into the one above (= FADES in prepare-scenes.py) // rows where each scene blends into the one above (= FADES in prepare-scenes.py, by file)
const CELL = 6;           // image px per effect pixel (the art's own pixel-cluster size)
const GW = Math.round(SRC_W / CELL); // effect grid
const GH = Math.round(SRC_H / CELL);
const K = GW / 940;       // design px → grid px
const PHONE = () => innerWidth < 700;
const ZOOM = () => (PHONE() ? 1 : 1.2); // the art is shown this much wider than the window (the edges crop off)
// on phones a scene is shorter than the screen, so the page scrolls this much faster than the painting
// (the text runs ahead of the art, which also spreads the text out)
const PACE = () => (PHONE() ? 2.2 : 1);
// phones (and small screens) get the half-size paintings
const LITE = Math.min(innerWidth, innerHeight) * Math.min(2, devicePixelRatio || 1) < 1100 ? '-m' : '';
const FG_PARALLAX = 0.18; // foregrounds move this much faster than their scene

type Layer = 'bg' | 'fg';
type Rect = [number, number, number, number]; // x0, y0, x1, y1 in SOURCE px
type Test = (r: number, g: number, b: number) => boolean;

const lum = (r: number, g: number, b: number) => 0.3 * r + 0.59 * g + 0.11 * b;
const is = {
  water: ((r, g, b) => lum(r, g, b) > 150 && b >= r - 12) as Test,
  wet: ((r, g, b) => lum(r, g, b) > 125 && b > 140 && b >= r) as Test,
  star: ((r, g, b) => lum(r, g, b) > 200) as Test,
  warm: ((r, g, b) => r > 215 && g > 130 && b < 130) as Test,
  light: ((r, g, b) => r > 200 && g > 175 && b < 170) as Test,
  crystal: ((r, g, b) => (b > 190 && r > 140 && g < 160) || (b > 210 && g > 190 && r < 170)) as Test,
  bright: ((r, g, b) => lum(r, g, b) > 175) as Test,
};

type Effect =
  | { kind: 'flow'; layer: Layer; rect: Rect; test: Test; speed: number }
  | { kind: 'sparkle'; layer: Layer; rect: Rect; test: Test; density: number; rate: number }
  | { kind: 'pulse'; layer: Layer; rect: Rect; test: Test; amp: number; speed: number }
  | { kind: 'ripple'; layer: Layer; rect: Rect; test: Test; speed: number }
  | { kind: 'glint'; layer: Layer; rect: Rect; test: Test; speed: number };
type Particles =
  | { kind: 'birds'; y0: number; y1: number; n: number }
  | { kind: 'fireflies'; rect: Rect; n: number; color: string }
  | { kind: 'motes'; rect: Rect; n: number; color: string }
  | { kind: 'embers'; x: number; y: number }
  | { kind: 'mist'; x: number; y: number; n: number }
  | { kind: 'rings'; rect: Rect; n: number }
  | { kind: 'drips'; rect: Rect; n: number }
  | { kind: 'petals'; rect: Rect; n: number };

type SceneDef = { file: number; name: string; title: string; effects: Effect[]; particles: Particles[] };

const ALL_SCENES: SceneDef[] = [
  {
    file: 1, name: 'I', title: 'The cliff top at dawn',
    effects: [
      { kind: 'sparkle', layer: 'bg', rect: [0, 0, 940, 430], test: is.star, density: 0.5, rate: 1.2 },
      { kind: 'pulse', layer: 'bg', rect: [40, 560, 260, 700], test: is.light, amp: 0.35, speed: 0.9 },
      { kind: 'flow', layer: 'fg', rect: [580, 610, 800, 770], test: is.water, speed: 22 },
      { kind: 'flow', layer: 'fg', rect: [540, 740, 660, 1440], test: is.water, speed: 46 },
      { kind: 'sparkle', layer: 'fg', rect: [580, 600, 830, 800], test: is.water, density: 0.3, rate: 5 },
      { kind: 'pulse', layer: 'bg', rect: [0, 520, 400, 720], test: is.light, amp: 0.45, speed: 0.6 },
      { kind: 'pulse', layer: 'bg', rect: [0, 340, 940, 1672], test: is.bright, amp: 0.18, speed: 0.35 },
    ],
    particles: [
      { kind: 'birds', y0: 150, y1: 520, n: 5 }, { kind: 'petals', rect: [380, 300, 940, 1100], n: 14 },
      { kind: 'mist', x: 580, y: 1410, n: 26 }, { kind: 'motes', rect: [0, 400, 940, 1500], n: 18, color: '#ffd9ef' },
    ],
  },
  {
    file: 2, name: 'II', title: 'The valley',
    effects: [
      { kind: 'flow', layer: 'bg', rect: [630, 705, 690, 1010], test: is.water, speed: 34 },
      { kind: 'pulse', layer: 'bg', rect: [0, 0, 940, 700], test: is.bright, amp: 0.2, speed: 0.4 },
      { kind: 'pulse', layer: 'fg', rect: [700, 400, 940, 1672], test: is.light, amp: 0.3, speed: 0.7 },
      { kind: 'sparkle', layer: 'bg', rect: [180, 1040, 780, 1672], test: is.wet, density: 0.12, rate: 3 },
      { kind: 'pulse', layer: 'bg', rect: [460, 920, 800, 1110], test: is.warm, amp: 0.6, speed: 1.6 },
    ],
    particles: [{ kind: 'birds', y0: 120, y1: 520, n: 6 }, { kind: 'petals', rect: [600, 900, 940, 1600], n: 8 }, { kind: 'mist', x: 660, y: 1000, n: 14 }, { kind: 'fireflies', rect: [0, 1000, 940, 1672], n: 18, color: '#fff2a8' }],
  },
  {
    file: 4, name: 'III', title: 'The hidden pond',
    effects: [
      { kind: 'sparkle', layer: 'bg', rect: [360, 560, 940, 1320], test: is.bright, density: 0.14, rate: 2.5 },
      { kind: 'flow', layer: 'bg', rect: [520, 1300, 780, 1540], test: is.water, speed: 26 },
      { kind: 'pulse', layer: 'bg', rect: [0, 200, 940, 1300], test: is.warm, amp: 0.5, speed: 1.8 },
      { kind: 'pulse', layer: 'bg', rect: [0, 0, 940, 600], test: is.water, amp: 0.3, speed: 0.6 },
    ],
    particles: [
      { kind: 'fireflies', rect: [0, 150, 940, 1550], n: 150, color: '#ffd76a' },
      { kind: 'fireflies', rect: [0, 500, 940, 1300], n: 60, color: '#d6ff8a' },
      { kind: 'mist', x: 580, y: 1450, n: 16 },
    ],
  },
  {
    file: 5, name: 'IV', title: 'The crystal caves',
    effects: [
      { kind: 'flow', layer: 'bg', rect: [450, 30, 540, 900], test: is.water, speed: 52 },
      { kind: 'flow', layer: 'bg', rect: [400, 1060, 580, 1460], test: is.water, speed: 38 },
      { kind: 'pulse', layer: 'bg', rect: [0, 0, 940, 1672], test: is.warm, amp: 0.55, speed: 2.2 },
      { kind: 'pulse', layer: 'bg', rect: [0, 0, 940, 1672], test: is.crystal, amp: 0.35, speed: 0.8 },
      { kind: 'pulse', layer: 'fg', rect: [0, 0, 940, 1672], test: is.crystal, amp: 0.7, speed: 0.7 },
      { kind: 'sparkle', layer: 'fg', rect: [0, 0, 940, 1672], test: is.crystal, density: 0.22, rate: 2.2 },
      { kind: 'sparkle', layer: 'bg', rect: [0, 0, 940, 1672], test: is.crystal, density: 0.18, rate: 1.8 },
      { kind: 'glint', layer: 'fg', rect: [0, 0, 940, 1672], test: is.crystal, speed: 0.22 },
    ],
    particles: [{ kind: 'drips', rect: [60, 260, 900, 420], n: 12 }, { kind: 'motes', rect: [0, 300, 940, 1500], n: 50, color: '#b9a8ff' }, { kind: 'mist', x: 500, y: 1450, n: 14 }],
  },
  {
    file: 6, name: 'V', title: 'The deep cavern',
    effects: [
      { kind: 'flow', layer: 'bg', rect: [500, 30, 600, 910], test: is.water, speed: 48 },
      { kind: 'pulse', layer: 'bg', rect: [320, 900, 460, 1010], test: is.warm, amp: 0.8, speed: 7 },
      { kind: 'sparkle', layer: 'bg', rect: [520, 900, 940, 1672], test: is.bright, density: 0.16, rate: 2.5 },
      { kind: 'pulse', layer: 'bg', rect: [0, 0, 940, 1672], test: is.crystal, amp: 0.35, speed: 0.8 },
      { kind: 'pulse', layer: 'fg', rect: [0, 0, 940, 1672], test: is.crystal, amp: 0.7, speed: 0.6 },
      { kind: 'sparkle', layer: 'bg', rect: [0, 0, 940, 900], test: is.crystal, density: 0.22, rate: 2 },
      { kind: 'ripple', layer: 'bg', rect: [200, 900, 940, 1672], test: is.wet, speed: 9 },
      { kind: 'ripple', layer: 'bg', rect: [200, 900, 940, 1672], test: is.warm, speed: 7 },
      { kind: 'pulse', layer: 'bg', rect: [420, 900, 940, 1672], test: is.wet, amp: 0.35, speed: 0.5 },
    ],
    particles: [
      { kind: 'embers', x: 385, y: 960 }, { kind: 'drips', rect: [100, 200, 900, 330], n: 8 },
      { kind: 'mist', x: 540, y: 890, n: 24 }, { kind: 'rings', rect: [300, 960, 940, 1650], n: 9 },
      { kind: 'fireflies', rect: [250, 500, 940, 1500], n: 40, color: '#9fd8ff' },
    ],
  },
];

const SCENES = ALL_SCENES;
const START = 200; // skip the starry strip, so it opens on the tree

/* ---------- helpers ---------- */
function hash(x: number, y: number, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

type Px = { x: number; y: number; r: number; g: number; b: number; h: number };
type Built =
  | { kind: 'flow' | 'sparkle' | 'ripple' | 'glint'; layer: Layer; px: Px[]; e: Effect }
  | { kind: 'pulse'; layer: Layer; glow: HTMLCanvasElement; gx: number; gy: number; e: Effect & { kind: 'pulse' } };

function pixelsOf(img: HTMLImageElement, w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

/** A glow layer at full resolution: just the pixels that pass the test, in their own colours. */
const HW = SRC_W / 2, HH = SRC_H / 2; // glow layers are built at half resolution and drawn at 2x
function buildGlow(e: Effect, data: Uint8ClampedArray) {
  const [x0, y0, x1, y1] = e.rect;
  const lit: number[] = [];
  let bx0 = HW, by0 = HH, bx1 = 0, by1 = 0;
  for (let y = Math.max(0, y0); y < Math.min(HH, y1); y++) for (let x = Math.max(0, x0); x < Math.min(HW, x1); x++) {
    const i = (y * HW + x) * 4;
    if (data[i + 3] < 128 || !e.test(data[i], data[i + 1], data[i + 2])) continue;
    lit.push(x, y);
    bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y);
  }
  const pad = 4;
  const gx = Math.max(0, bx0 - pad), gy = Math.max(0, by0 - pad);
  const w = Math.max(1, Math.min(HW, bx1 + pad) - gx), h = Math.max(1, Math.min(HH, by1 + pad) - gy);
  const glow = document.createElement('canvas');
  glow.width = w; glow.height = h;
  const g = glow.getContext('2d')!;
  const img = g.createImageData(w, h);
  for (let k = 0; k < lit.length; k += 2) {
    const x = lit[k], y = lit[k + 1], i = (y * HW + x) * 4;
    img.data.set([data[i], data[i + 1], data[i + 2], 255], ((y - gy) * w + (x - gx)) * 4);
  }
  g.putImageData(img, 0, 0);
  // a soft bloom around the lit pixels
  const bloom = document.createElement('canvas');
  bloom.width = w; bloom.height = h;
  const b = bloom.getContext('2d')!;
  b.filter = 'blur(4px)';
  b.drawImage(glow, 0, 0);
  b.filter = 'none';
  b.drawImage(glow, 0, 0);
  return { glow: bloom, gx, gy };
}

function build(e: Effect, data: Uint8ClampedArray, full: Uint8ClampedArray): Built {
  if (e.kind === 'pulse') return { kind: 'pulse', layer: e.layer, ...buildGlow(e, full), e };
  const [x0, y0, x1, y1] = e.rect.map((v) => Math.round(v * K));
  const px: Px[] = [];
  for (let y = Math.max(0, y0); y < Math.min(GH, y1); y++) for (let x = Math.max(0, x0); x < Math.min(GW, x1); x++) {
    const i = (y * GW + x) * 4;
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (e.test(r, g, b)) px.push({ x, y, r, g, b, h: hash(x, y, 7) });
  }
  return { kind: e.kind, layer: e.layer, px, e };
}

/* ---------- scene assembly ---------- */
type Layers = { el: HTMLDivElement; bg: HTMLImageElement; fg: HTMLImageElement; bgfx: HTMLCanvasElement; fgfx: HTMLCanvasElement };
type Scene = { def: SceneDef; top: number; grid: { bg: Uint8ClampedArray; fg: Uint8ClampedArray }; fx: Built[]; dom: Layers };
const world = document.getElementById('world') as HTMLDivElement;
const track = document.getElementById('track')!;
let ctx!: CanvasRenderingContext2D; // the fx canvas being drawn into

const TOPS = OVERLAPS.map((_, i) => OVERLAPS.slice(1, i + 1).reduce((a, o) => a + SRC_H - o, 0));
function fxCanvas() {
  const c = document.createElement('canvas');
  c.className = 'fx';
  return c;
}
async function loadScene(i: number): Promise<Scene> {
  const def = SCENES[i];
  const [bg, fg] = await Promise.all([loadImage(`/descent/s${def.file}-bg${LITE}.webp`), loadImage(`/descent/s${def.file}-fg${LITE}.webp`)]);
  const grid = { bg: pixelsOf(bg, GW, GH), fg: pixelsOf(fg, GW, GH) };
  const half = { bg: pixelsOf(bg, HW, HH), fg: pixelsOf(fg, HW, HH) };
  // build the effects a few at a time, so loading never blocks a frame for long
  const fx: Built[] = [];
  for (const e of def.effects) { fx.push(build(e, grid[e.layer], half[e.layer])); await new Promise((r) => setTimeout(r, 0)); }
  const el = document.createElement('div');
  el.className = 'scene';
  el.style.zIndex = String(i + 1);
  bg.className = fg.className = 'plate';
  const dom = { el, bg, fg, bgfx: fxCanvas(), fgfx: fxCanvas() };
  el.append(dom.bg, dom.bgfx, dom.fg, dom.fgfx);
  world.appendChild(el);
  sizeScene(dom);
  return { def, top: TOPS[i], grid, fx, dom };
}
const WORLD_H = TOPS[TOPS.length - 1] + SRC_H;

let scale = 1, vh = 200, left = 0, pace = 1;
function sizeScene(d: Layers) {
  for (const im of [d.bg, d.fg]) im.style.width = `${SRC_W * scale}px`;
  for (const c of [d.bgfx, d.fgfx]) { c.width = HW; c.height = Math.ceil(vh / 2); c.style.width = `${SRC_W * scale}px`; c.style.height = `${(c.height * 2) * scale}px`; }
}
/**
 * Put each text block where its scene is, but never on top of the one before it:
 * a block that would collide is pushed down, and the page's scroll length (and so
 * how fast the painting moves per scroll) stretches to fit everything.
 */
function layoutText() {
  const range = (WORLD_H - START - vh) * scale; // world scroll in css px at pace 1
  const els = [...track.querySelectorAll<HTMLElement>('.place')];
  const gap = innerHeight * 0.3;
  pace = PACE();
  for (let pass = 0; pass < 3; pass++) {
    let bottom = -Infinity;
    for (const el of els) {
      const top = Math.max((+el.dataset.wy! - START) * scale * pace, bottom + gap);
      el.style.top = `${top}px`;
      bottom = top + el.offsetHeight;
    }
    const need = bottom + innerHeight * 0.15 - innerHeight; // scroll needed to show the last block
    const next = Math.max(PACE(), need / range);
    if (Math.abs(next - pace) < 0.01) break;
    pace = next;
  }
  track.style.height = `${range * pace + innerHeight}px`;
}

function resize() {
  scale = (innerWidth / SRC_W) * ZOOM(); // css px per source px
  vh = Math.ceil(innerHeight / scale);                          // viewport height in source px
  left = Math.round((innerWidth - SRC_W * scale) / 2);
  world.style.left = `${left}px`; world.style.width = `${SRC_W * scale}px`;
  track.style.width = `${innerWidth}px`;
  layoutText();
  for (const s of scenes) if (s) sizeScene(s.dom);
}
for (const b of blocks(START, SRC_H)) {
  const el = document.createElement('div');
  el.className = 'place';
  el.innerHTML = b.html;
  el.dataset.wy = String(TOPS[b.scene] + b.at);
  track.appendChild(el);
}
revealOnScroll(track);
chrome();
// re-place the text whenever a block changes size (fonts loading, a line wrapping)
const ro = new ResizeObserver(() => layoutText());
track.querySelectorAll('.place').forEach((el) => ro.observe(el));

// lazy: the first scene loads before anything is shown, the rest stream in behind it, in order
const scenes: (Scene | undefined)[] = SCENES.map(() => undefined);
addEventListener('resize', resize);
resize();
scenes[0] = await loadScene(0);
const loader = document.getElementById('loader')!;
loader.classList.add('done');
setTimeout(() => loader.remove(), 900);
(async () => {
  for (let i = 1; i < SCENES.length; i++) { scenes[i] = await loadScene(i); await new Promise((r) => setTimeout(r, 0)); }
})();

/* ---------- drawing ---------- */
function drawEffects(s: Scene, layer: Layer, oy: number, t: number) {
  for (const f of s.fx) {
    if (f.layer !== layer) continue;
    if (f.kind === 'pulse') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = f.e.amp * (0.55 + 0.45 * Math.sin(t * f.e.speed * Math.PI * 2 * 0.25));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // only the on-screen rows of the glow (the fx canvas is half resolution, like the glow)
      const gy = (oy * CELL) / 2 + f.gy, y0 = Math.max(0, Math.floor(-gy)), y1 = Math.min(f.glow.height, Math.ceil(vh / 2 - gy));
      if (y1 > y0) ctx.drawImage(f.glow, 0, y0, f.glow.width, y1 - y0, f.gx, gy + y0, f.glow.width, y1 - y0);
      ctx.setTransform(CELL / 2, 0, 0, CELL / 2, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      continue;
    }
    const e = f.e;
    const px = f.px, yTop = -1 - oy, yBot = vh / CELL - oy;
    let lo = 0, hi = px.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (px[m].y < yTop) lo = m + 1; else hi = m; }
    ctx.fillStyle = '#ffffff';
    for (let j = lo; j < px.length; j++) {
      const p = px[j];
      if (p.y > yBot) break;
      const y = p.y + oy;
      if (e.kind === 'flow') {
        // bright streaks running down the water, each column on its own phase
        const period = 14 + Math.floor(hash(p.x, 0, 3) * 10);
        const ph = (((p.y - t * e.speed + hash(p.x, 1, 3) * period) % period) + period) % period;
        if (ph < 3) { ctx.globalAlpha = ph < 1 ? 0.9 : 0.5; ctx.fillStyle = '#ffffff'; ctx.fillRect(p.x, y, 1, 1); }
        else if (ph > period - 2) { ctx.globalAlpha = 0.25; ctx.fillStyle = '#1b2a5a'; ctx.fillRect(p.x, y, 1, 1); }
      } else if (e.kind === 'ripple') {
        // glints sliding sideways across the water, on every other row
        if (p.y % 2) continue;
        const ph = (((p.x + Math.sin(p.y * 0.9) * 4 - t * e.speed * (p.y % 4 ? 1 : -0.6)) % 18) + 18) % 18;
        if (ph < 2) { ctx.globalAlpha = ph < 1 ? 0.7 : 0.35; ctx.fillStyle = '#ffffff'; ctx.fillRect(p.x, y, 1, 1); }
      } else if (e.kind === 'glint') {
        // a band of light sweeping diagonally over the crystals
        const sweep = ((t * e.speed) % 1.4) * (GW + GH * 0.5);
        const d = Math.abs(p.x + p.y * 0.5 - sweep);
        if (d < 4) { ctx.globalAlpha = (1 - d / 4) * 0.85; ctx.fillStyle = '#ffffff'; ctx.fillRect(p.x, y, 1, 1); }
      } else if (e.kind === 'sparkle') {
        const cyc = Math.floor(t * e.rate + p.h * 10);
        if (hash(p.x, p.y, cyc) < e.density) {
          const fr = (t * e.rate + p.h * 10) % 1;
          ctx.globalAlpha = Math.sin(fr * Math.PI) * 0.9;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(p.x, y, 1, 1);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}

function dot(x: number, y: number, color: string, a = 1, w = 1, h = 1) {
  ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fillRect(Math.round(x), y, w, h);
}

function drawParticles(s: Scene, oy: number, t: number) {
  s.def.particles.forEach((pt, pi) => {
    const R = (i: number, k: number) => hash(i, k, pi * 31 + s.top);
    if (pt.kind === 'birds') {
      for (let i = 0; i < pt.n; i++) {
        const speed = 8 + R(i, 1) * 6;
        const x = ((R(i, 2) * (GW + 60) + t * speed) % (GW + 60)) - 30;
        const y = oy + (pt.y0 + R(i, 3) * (pt.y1 - pt.y0)) * K + Math.sin(t * 1.5 + i) * 2;
        const f = Math.floor(t * 5 + i) % 2;
        dot(x, y, '#2a2347'); dot(x - 1, y - f, '#2a2347'); dot(x + 1, y - f, '#2a2347'); dot(x - 2, y - 1 + f, '#2a2347', 0.7); dot(x + 2, y - 1 + f, '#2a2347', 0.7);
      }
    } else if (pt.kind === 'fireflies' || pt.kind === 'motes') {
      const [x0, y0, x1, y1] = pt.rect.map((v) => v * K);
      for (let i = 0; i < pt.n; i++) {
        const x = x0 + R(i, 1) * (x1 - x0) + Math.sin(t * 0.6 + i) * 6;
        const y = oy + y0 + R(i, 2) * (y1 - y0) + Math.cos(t * 0.45 + i * 1.7) * 5 - (pt.kind === 'motes' ? (t * 2 + i * 13) % 20 : 0);
        const a = pt.kind === 'fireflies' ? Math.max(0, Math.sin(t * 1.4 + R(i, 3) * 9)) : 0.35 + 0.35 * Math.sin(t * 2 + i);
        dot(x, y, pt.color, a);
        if (pt.kind === 'fireflies' && a > 0.3) dot(x - 1, y - 1, pt.color, a * 0.12, 3, 3);
        if (pt.kind === 'fireflies' && a > 0.6) { dot(x - 1, y, pt.color, a * 0.3); dot(x + 1, y, pt.color, a * 0.3); dot(x, y - 1, pt.color, a * 0.3); dot(x, y + 1, pt.color, a * 0.3); }
      }
    } else if (pt.kind === 'petals') {
      const [x0, y0, x1, y1] = pt.rect.map((v) => v * K);
      for (let i = 0; i < pt.n; i++) {
        const ph = (t * 0.06 + R(i, 1)) % 1;
        const x = x1 - ph * (x1 - x0) * 1.3 + Math.sin(t * 2 + i) * 3;
        const y = oy + y0 + R(i, 2) * (y1 - y0) + ph * 40;
        dot(x, y, i % 3 ? '#f4a3c8' : '#ffe2f0', 0.9, Math.floor(t * 4 + i) % 2 ? 2 : 1, 1);
      }
    } else if (pt.kind === 'embers') {
      for (let i = 0; i < 16; i++) {
        const ph = (t * 0.5 + R(i, 1)) % 1;
        const x = pt.x * K + Math.sin(t * 3 + i * 2) * (2 + ph * 4);
        const y = oy + pt.y * K - ph * 40;
        dot(x, y, ph < 0.4 ? '#fff1a0' : ph < 0.7 ? '#ffb347' : '#e0563f', 1 - ph);
      }
    } else if (pt.kind === 'mist') {
      // spray where falling water breaks up
      for (let i = 0; i < pt.n; i++) {
        const ph = (t * 0.35 + R(i, 1)) % 1;
        const x = pt.x * K + (R(i, 2) - 0.5) * 14 * (0.4 + ph) + Math.sin(t * 1.3 + i) * 2;
        const y = oy + pt.y * K - ph * 10 + R(i, 3) * 4;
        dot(x, y, '#eef8ff', Math.sin(ph * Math.PI) * 0.55, ph > 0.5 ? 2 : 1, 1);
      }
    } else if (pt.kind === 'rings') {
      // ripple rings spreading where drops hit the lake
      const [x0, y0, x1, y1] = pt.rect.map((v) => v * K);
      for (let i = 0; i < pt.n; i++) {
        const cyc = Math.floor(t * 0.4 + R(i, 9));
        const ph = (t * 0.4 + R(i, 9)) % 1;
        const cx = x0 + hash(i, cyc, 5) * (x1 - x0), cy = oy + y0 + hash(i, cyc, 6) * (y1 - y0);
        const rx = 1 + ph * 9, a = (1 - ph) * 0.6;
        for (let k = 0; k < 16; k++) {
          const ang = (k / 16) * Math.PI * 2;
          dot(cx + Math.cos(ang) * rx, Math.round(cy + Math.sin(ang) * rx * 0.3), '#cfe9ff', a);
        }
      }
    } else if (pt.kind === 'drips') {
      const [x0, y0] = [pt.rect[0] * K, pt.rect[1] * K];
      const w = (pt.rect[2] - pt.rect[0]) * K, h = (pt.rect[3] - pt.rect[1]) * K;
      for (let i = 0; i < pt.n; i++) {
        const ph = (t * 0.4 + R(i, 1)) % 1;
        const x = x0 + R(i, 2) * w, ys = oy + y0 + R(i, 3) * h;
        if (ph < 0.2) dot(x, ys, '#bfe8ff', ph / 0.2);
        else dot(x, ys + (ph - 0.2) * (ph - 0.2) * 260, '#bfe8ff', 0.9, 1, 2);
      }
    }
  });
  ctx.globalAlpha = 1;
}

/* ---------- the cloud passage between the valley and the pond ---------- */
// a short veil of painted clouds pinned over the seam, so the valley sinks into the pond through cloud
const BAND = 650, VEIL = 250; // cloud band height; the fully clouded strip at the seam
const WALL_TOP = TOPS[2] + OVERLAPS[2] / 2 - VEIL / 2 - BAND / 2;
const WALL_H = BAND + VEIL;
function sizeClouds() {
  const c = document.getElementById('clouds')!;
  c.style.height = `${WALL_H * scale}px`;
  c.style.setProperty('--band', `${BAND * scale}px`);
  c.style.setProperty('--tile', `${BAND * scale * (1880 / 722)}px`);
}
sizeClouds();
addEventListener('resize', sizeClouds);
const clouds = document.getElementById('clouds') as HTMLDivElement;

let cam = Math.min(WORLD_H - vh, START + scrollY / (scale * pace)), frameCount = 0;
const t0 = performance.now();
const slime = createSlime();
let shownZone = -1, restingByFire = false;
let lastNow = t0, lastCam = cam, ambient: [number, number, number] | null = null;
function frame(now: number) {
  const target = Math.min(WORLD_H - vh, START + Math.max(0, scrollY / (scale * pace)));
  cam += (target - cam) * 0.16;
  if (Math.abs(target - cam) < 0.02) cam = target;
  const c = Math.round(cam), t = (now - t0) / 1000;

  const wy = WALL_TOP - c;
  clouds.style.display = wy > vh || wy + WALL_H < 0 ? 'none' : '';
  clouds.style.transform = `translate3d(0, ${wy * scale}px, 0)`;

  for (const s of scenes) {
    if (!s) continue;
    const oy = s.top - c;
    const on = !(oy > vh || oy + SRC_H < 0);
    s.dom.el.style.display = on ? '' : 'none';
    if (!on) continue;
    // the foreground slides a little faster than the scene, centred when the scene is centred
    const anchor = s.top + (SRC_H - vh) / 2;
    // (only ever below its resting place, so grounded foregrounds never lift off the bottom)
    const fy = Math.round(oy + Math.max(0, (anchor - c) * FG_PARALLAX));
    s.dom.bg.style.transform = `translate3d(0, ${oy * scale}px, 0)`;
    s.dom.fg.style.transform = `translate3d(0, ${fy * scale}px, 0)`;
    ctx = s.dom.bgfx.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, HW, s.dom.bgfx.height);
    ctx.setTransform(CELL / 2, 0, 0, CELL / 2, 0, 0);
    drawEffects(s, 'bg', oy / CELL, t); drawParticles(s, oy / CELL, t);
    ctx = s.dom.fgfx.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, HW, s.dom.fgfx.height);
    ctx.setTransform(CELL / 2, 0, 0, CELL / 2, 0, 0);
    drawEffects(s, 'fg', fy / CELL, t);
  }
  // the slime, on the screen layer: its zone, its fall speed and the light behind it
  const dt = Math.min(0.05, (now - lastNow) / 1000);
  let si = 0;
  for (let i = 0; i < SCENES.length; i++) if (cam + vh / 2 >= TOPS[i] + OVERLAPS[i] / 2) si = i;
  // zones: intro, AI Security, ML + experience (the two halves of the pond), Cybersecurity, about
  const zone = si < 2 ? si : si === 2 ? (cam + vh / 2 < TOPS[2] + SRC_H * 0.8 ? 2 : 3) : si + 1;
  if (frameCount % 12 === 0) {
    // the colour behind the slime, read from the CPU copy of the scene (no GPU readback)
    const h = slime.home(), wy = cam + h.y / scale - 120, s = scenes[si] ?? scenes[0]!;
    const gx = Math.round((h.x - left) / scale / CELL), gy = Math.round((wy - s.top) / CELL);
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = gy - 6; y <= gy + 6; y += 2) for (let x = gx - 6; x <= gx + 6; x += 2) {
      if (x < 0 || y < 0 || x >= GW || y >= GH) continue;
      const i = (y * GW + x) * 4, src = s.grid.fg[i + 3] > 128 ? s.grid.fg : s.grid.bg;
      r += src[i]; g += src[i + 1]; b += src[i + 2]; n++;
    }
    if (n) ambient = [r / n, g / n, b / n];
  }
  slime.update({ t, dt, vel: (cam - lastCam) * scale * pace, zone, ambient });
  if (zone !== shownZone) { shownZone = zone; onZone(zone); }
  // at the very end, she goes and sits by the campfire
  const atEnd = cam >= WORLD_H - vh - 40;
  if (atEnd !== restingByFire) { restingByFire = atEnd; slime.focus(atEnd ? left + 385 * 2 * scale : null); }
  lastNow = now; lastCam = cam;

  frameCount++;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
