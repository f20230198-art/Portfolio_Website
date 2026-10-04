/**
 * The slime companion — a pixel creature drawn on its own screen-layer canvas,
 * in front of the paintings, sitting on the bottom of the screen. You can pet it
 * (stroke it), click it to hop, and drag to stretch and fling it. It reacts to the scroll (stretching while it
 * drops, squashing when it lands), takes the colour of the light behind it,
 * looks at the text as it passes, and changes form in each zone.
 */

type RGB = [number, number, number];
type Put = (x: number, y: number, color: string, a?: number) => void;
type Form = {
  name: string;
  body: RGB; shade: RGB; light: RGB; outline: RGB;
  eye: string;
  alpha?: number;
  /** extra pixels; top = the dome's top row, t = time, sx = horizontal stretch */
  extra?: (put: Put, top: number, t: number, sx: number) => void;
  visor?: boolean;
};

const hex = (c: RGB, k = 1) => `rgb(${c.map((v) => Math.max(0, Math.min(255, Math.round(v * k)))).join(',')})`;
const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// one form per zone: intro, AI Security, ML, experience, Cybersecurity, about/contact
const EYE = '#1b2430'; // the same eyes in every form
const FORMS: Form[] = [
  {
    name: 'sprout', body: [120, 214, 110], shade: [62, 150, 84], light: [214, 255, 180], outline: [30, 70, 52], eye: EYE,
    extra: (put, top, t) => {
      const sway = Math.round(Math.sin(t * 2.2) * 0.8);
      put(0, top - 1, '#3f8a3a'); put(sway, top - 2, '#3f8a3a');
      put(sway - 1, top - 3, '#6fcf5a'); put(sway - 2, top - 3, '#6fcf5a'); put(sway - 2, top - 4, '#9be27c');
      put(sway + 1, top - 3, '#6fcf5a'); put(sway + 2, top - 4, '#6fcf5a'); put(sway + 3, top - 4, '#9be27c');
    },
  },
  {
    name: 'sentinel', body: [96, 196, 214], shade: [52, 120, 160], light: [200, 248, 255], outline: [22, 44, 74], eye: EYE, visor: true,
    extra: (put, top) => {
      // a little shield badge on the chest
      const y = top + 9;
      put(-1, y, '#f2d16b'); put(0, y, '#f2d16b'); put(1, y, '#f2d16b');
      put(-1, y + 1, '#f2d16b'); put(0, y + 1, '#fff3b0'); put(1, y + 1, '#f2d16b'); put(0, y + 2, '#c79a3a');
      put(0, top - 1, '#22324a'); put(0, top - 2, '#7ff8ff');
    },
  },
  {
    name: 'mycel', body: [134, 190, 104], shade: [78, 128, 74], light: [214, 240, 170], outline: [36, 56, 38], eye: EYE,
    extra: (put, top, t, sx) => {
      // a mushroom cap, and glowing neural nodes that fire in turn
      for (let x = -4; x <= 4; x++) put(x, top - 1, '#c8423a');
      for (let x = -3; x <= 3; x++) put(x, top - 2, '#d9574a');
      for (let x = -2; x <= 2; x++) put(x, top - 3, '#e46a58');
      put(-2, top - 2, '#fff0e0'); put(2, top - 1, '#fff0e0'); put(0, top - 3, '#fff0e0');
      const nodes: [number, number][] = [[-5, 8], [-1, 10], [4, 8]];
      nodes.forEach(([x, y], i) => {
        const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 3 - i * 1.4));
        put(Math.round(x * sx), top + y, '#e8ffa0', a);
        if (i < nodes.length - 1) put(Math.round(((x + nodes[i + 1][0]) / 2) * sx), top + y + (nodes[i + 1][1] > y ? 1 : -1), '#b8e070', a * 0.5);
      });
    },
  },
  {
    name: 'pond', body: [104, 170, 240], shade: [56, 104, 196], light: [210, 238, 255], outline: [26, 44, 100], eye: EYE, alpha: 0.88,
    extra: (put, top, t) => {
      // a lily-pad hat with a flower, and bubbles rising inside
      for (let x = -4; x <= 3; x++) put(x, top - 1, x === 0 ? '#2f7a3a' : '#4fa54a');
      for (let x = -3; x <= 2; x++) put(x, top - 2, '#5fbf55');
      put(2, top - 3, '#f4a3c8'); put(3, top - 3, '#ffd0e6'); put(2, top - 4, '#ffd0e6');
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.5 + i / 3) % 1;
        put(-4 + i * 4, top + 12 - Math.round(ph * 8), '#e6f6ff', Math.sin(ph * Math.PI) * 0.8);
      }
    },
  },
  {
    name: 'crystal', body: [98, 104, 222], shade: [56, 54, 156], light: [168, 214, 255], outline: [22, 20, 66], alpha: 0.9, eye: EYE,
    extra: (put, top, t) => {
      // crystal shards growing out of its back
      const shards: [number, number, number][] = [[-5, 3, 0], [-1, 5, 1], [4, 4, 2]];
      for (const [x, h, i] of shards) {
        const glint = Math.max(0, Math.sin(t * 2 - i * 1.3));
        for (let k = 0; k < h; k++) {
          put(x, top + 1 - k, k === h - 1 ? '#ffffff' : '#a8d8ff');
          if (k < h - 2) put(x + 1, top + 1 - k, '#6a7fe0');
        }
        put(x, top + 2 - h, '#ffffff', glint);
      }
    },
  },
  {
    name: 'ember', body: [246, 150, 74], shade: [196, 86, 52], light: [255, 228, 150], outline: [84, 30, 26], eye: EYE,
    extra: (put, top, t) => {
      // a flickering flame on its head and sparks drifting up
      const f = Math.floor(t * 9) % 3;
      put(0, top - 1, '#ffb347'); put(-1, top - 1, '#e0563f'); put(1, top - 1, '#e0563f');
      put(f === 1 ? 1 : 0, top - 2, '#ffd56a'); put(0, top - 3, '#fff1a0', f === 2 ? 0.4 : 1);
      if (f === 0) put(-1, top - 3, '#ffd56a', 0.8);
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.7 + i / 3) % 1;
        put(Math.round(Math.sin(t * 3 + i * 2) * 3), top - 4 - Math.round(ph * 8), '#ffb347', 1 - ph);
      }
    },
  },
];

export type SlimeFrame = {
  t: number;
  dt: number;
  /** camera movement this frame, in screen px (positive = falling) */
  vel: number;
  /** current zone, 0..5 */
  zone: number;
  /** average colour of the scene behind the slime (refreshed every few frames) */
  ambient: RGB | null;
};

export function createSlime() {
  const cv = document.createElement('canvas');
  cv.id = 'slime';
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:30';
  document.body.appendChild(cv);
  const g = cv.getContext('2d')!;

  // P = css px per design pixel (accessories, sparks); the body and face are drawn at half that, for detail
  let P = 6, Q = 3, dpr = 1;
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    Q = Math.max(3, Math.round(Math.min(innerWidth * 0.9, innerHeight) / 175));
    P = Math.round(Q * 1.5);
  }
  addEventListener('resize', resize);
  resize();

  let sy = 1, vy = 0;                  // body spring: vertical stretch (sx keeps the volume)
  let hop = 0, hopV = 0;               // a jump (design px) and its velocity
  let x = innerWidth * 0.8, xv = 0;    // position along the bottom (css px) and speed
  let carry = 0, stride = 0;           // drag start; the bounce cycle while moving
  let pullX = 0, pullY = 0, pvx = 0, pvy = 0;
  let form = 0, morph = 0;
  let tint: RGB = [255, 255, 255];
  let blinkAt = 2, blink = 0;
  let look = 0, lookY = 0;
  let alert = 0;
  let pet = 0, happy = 0, clicks = 0, clickT = 0;
  const seen = new Set<Element>();
  const sparks: { x: number; y: number; vx: number; vy: number; life: number; c: string; heart?: boolean }[] = [];
  let mouse: { x: number; y: number } | null = null;
  let goal: number | null = null;      // somewhere she's been asked to go (overrides the cursor)
  let bodyTop = 0;                     // screen y of the top of her head, for the speech bubble

  // speech bubble, typed out a letter at a time
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.setAttribute('role', 'status');
  document.body.appendChild(bubble);
  let line = '', typed = 0, sayFor = 0;
  function say(text: string, seconds = 4.5) {
    if (text === line && sayFor > 0) return;
    line = text; typed = 0; sayFor = seconds;
    bubble.textContent = '';
    bubble.classList.add('show');
  }
  let drag: { x: number; y: number } | null = null;

  const base = () => innerHeight - 2 * P;
  const over = (px: number, py: number) =>
    Math.abs(px - x) < 12 * P && py > base() - 17 * P - hop * P && py < base() + P;

  addEventListener('pointermove', (e) => {
    const prev = mouse;
    mouse = { x: e.clientX, y: e.clientY };
    if (drag) return;
    const on = over(e.clientX, e.clientY);
    document.documentElement.style.cursor = on ? 'grab' : '';
    if (on && prev) pet = Math.min(1.5, pet + Math.hypot(e.clientX - prev.x, e.clientY - prev.y) / 400);
  });
  addEventListener('pointerleave', () => (mouse = null));
  addEventListener('pointerdown', (e) => {
    if (!over(e.clientX, e.clientY)) return;
    drag = { x: e.clientX, y: e.clientY }; carry = x;
    document.documentElement.style.cursor = 'grabbing';
    e.preventDefault();
  });
  addEventListener('pointerup', (e) => {
    if (!drag) return;
    const moved = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
    drag = null;
    document.documentElement.style.cursor = over(e.clientX, e.clientY) ? 'grab' : '';
    if (moved < 6) {
      clicks = clickT > 0 ? clicks + 1 : 1; clickT = 0.6;
      if (hop < 1) { hopV = 34 + Math.min(clicks, 4) * 8; vy -= 3; }
      burst(8, FORMS[form].light);
    } else {
      if (pullY < -4) hopV = Math.min(70, -pullY * 5);
      pvx = -pullX * 5; pvy = -pullY * 5;
    }
  });

  function burst(n: number, c: RGB, heart = false) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      sparks.push({ x: (Math.random() - 0.5) * 8, y: -8, vx: Math.cos(a) * (10 + Math.random() * 14), vy: Math.sin(a) * (14 + Math.random() * 10), life: 1, c: hex(c), heart });
    }
  }

  function update(f: SlimeFrame) {
    const { t, dt } = f;

    // follow the cursor: a smooth glide (critically damped), so she never jitters
    const lo = 12 * P, hi = innerWidth - 12 * P;
    if (drag && mouse) {
      const nx = Math.max(lo, Math.min(hi, carry + mouse.x - drag.x));
      xv = (nx - x) / Math.max(dt, 1e-3); x = nx;
    } else {
      const want = goal ?? mouse?.x ?? null;
      const target = want !== null ? Math.max(lo, Math.min(hi, want)) : x;
      const dx = target - x;
      const k = Math.abs(dx) < 3 * P ? 0 : 5;
      xv += (dx * k - xv * 4.5) * dt;
      xv = Math.max(-700, Math.min(700, xv));
      if (k === 0) xv *= Math.max(0, 1 - dt * 6);
      x = Math.max(lo, Math.min(hi, x + xv * dt));
    }
    const speed = Math.min(1, Math.abs(xv) / 400);

    // the bounce: while moving she bobs along in a steady rhythm; idle, she just breathes
    stride += dt * (2.2 + speed * 2.5) * Math.min(1, speed * 6);
    const bob = speed > 0.02 && !drag ? Math.abs(Math.sin(stride * Math.PI)) * (1.5 + speed * 2.5) : 0;

    // scrolling stretches her a little; a sudden stop settles into a soft squash
    const fall = Math.min(1, Math.abs(f.vel) / (900 * dt + 1e-6));
    const land = bob > 0 ? (1 - Math.abs(Math.sin(stride * Math.PI))) * 0.12 * speed : 0;
    const target = 1 + fall * 0.25 + Math.sin(t * 1.6) * 0.025 - happy * 0.06 - land;
    vy += ((target - sy) * 90 - vy * 14) * dt;
    sy = Math.max(0.7, Math.min(1.5, sy + vy * dt));

    if (hopV !== 0 || hop > 0) {
      hopV -= 170 * dt; hop += hopV * dt;
      if (hop <= 0) { hop = 0; hopV = 0; vy -= 3; }
    }
    clickT = Math.max(0, clickT - dt);

    if (drag && mouse) {
      pullY = Math.max(-14, Math.min(4, ((mouse.y - drag.y) / P) * 0.6));
    } else {
      pvy += (-pullY * 110 - pvy * 9) * dt; pullY += pvy * dt;
    }
    // her top trails behind when she moves
    const lean = -Math.max(-1, Math.min(1, xv / 500)) * 4;
    pvx += ((lean - pullX) * 110 - pvx * 12) * dt; pullX += pvx * dt;

    if (f.zone !== form) {
      form = f.zone; morph = 1; vy -= 4;
      const fm = FORMS[form];
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2;
        sparks.push({ x: 0, y: -8, vx: Math.cos(a) * (14 + (i % 3) * 6), vy: Math.sin(a) * 14 - 8, life: 1, c: hex(i % 2 ? fm.light : fm.body) });
      }
    }
    morph = Math.max(0, morph - dt * 2.2);
    if (f.ambient) tint = mix(tint, f.ambient, Math.min(1, dt * 3));

    pet = Math.max(0, pet - dt * 0.35);
    happy += ((pet > 0.25 ? 1 : 0) - happy) * Math.min(1, dt * 6);
    if (pet > 0.9 && Math.random() < dt * 4) burst(1, [255, 120, 160], true);

    blinkAt -= dt;
    if (blinkAt < 0) { blink = 0.13; blinkAt = 2.5 + Math.random() * 3.5; }
    blink = Math.max(0, blink - dt);

    // eyes: on the cursor; a new heading on screen gets a quick look and a "!"
    const hy = base() - 8 * P;
    let tx = mouse ? mouse.x : x - 100, ty = mouse ? mouse.y : hy;
    document.querySelectorAll<HTMLElement>('.label').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) { seen.delete(el); return; }
      if (Math.abs(r.top + r.height / 2 - innerHeight * 0.5) < innerHeight * 0.3 && !seen.has(el)) {
        seen.add(el); alert = 1.4; if (hop === 0) hopV = 30;
      }
      if (alert > 0) { tx = r.left + r.width / 2; ty = r.top + r.height / 2; }
    });
    const ang = Math.atan2(ty - hy, tx - x);
    const dist = Math.min(1, Math.hypot(tx - x, ty - hy) / (12 * P));
    look += (Math.cos(ang) * 2.5 * dist - look) * Math.min(1, dt * 8);
    lookY += (Math.sin(ang) * 2 * dist - lookY) * Math.min(1, dt * 8);
    alert = Math.max(0, alert - dt);

    for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += (s.heart ? -4 : 30) * dt; s.life -= dt * (s.heart ? 0.8 : 1.6); }
    for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);

    draw(f, bob);

    if (sayFor > 0) {
      sayFor -= dt;
      if (typed < line.length) { typed = Math.min(line.length, typed + dt * 45); bubble.textContent = line.slice(0, Math.ceil(typed)); }
      if (sayFor <= 0) bubble.classList.remove('show');
    }
    const bx = Math.max(130, Math.min(innerWidth - 130, x));
    bubble.style.transform = `translate3d(${bx}px, ${bodyTop - 14}px, 0) translate(-50%, -100%)`;
    bubble.style.setProperty('--tail', `${x - bx}px`);
  }

  let lastBox = { x: 0, y: 0, w: 0, h: 0 };
  function draw(f: SlimeFrame, bob: number) {
    const { t } = f;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(lastBox.x, lastBox.y, lastBox.w, lastBox.h);
    const floor = Math.round(base() / Q);
    const lift = Math.round((hop + bob) * 2);         // in fine pixels
    const cx = Math.round(x / Q), cy = floor - lift;  // fine-pixel origin: bottom centre of the body
    lastBox = { x: x - 70 * P, y: base() - 90 * P, w: 140 * P, h: 94 * P };
    bodyTop = (cy - Math.round(28 * sy)) * Q;
    // fine pixels (body, face) and design pixels (accessories, sparks = 2x2 fine)
    const dot = (px: number, py: number, color: string, a = 1, w = 1, h = 1) => {
      if (a <= 0.02) return;
      g.globalAlpha = a; g.fillStyle = color; g.fillRect((cx + px) * Q, (cy + py) * Q, w * Q, h * Q);
    };
    const put: Put = (px, py, color, a = 1) => {
      if (a <= 0.02) return;
      g.globalAlpha = a; g.fillStyle = color; g.fillRect(cx * Q + px * P, cy * Q + py * P, P, P);
    };

    const fm = FORMS[form];
    const pop = 1 + Math.sin(morph * Math.PI) * 0.2;
    const stretch = 1 + Math.max(0, -pullY) / 15;
    const sx = (1 / Math.sqrt(sy * stretch)) * pop, syy = (sy * stretch) / pop;
    const W = 15 * sx, H = Math.round(21 * syy);       // fine pixels
    const amb = (c: RGB, k: number) => mix(c, tint, k);
    const tone = {
      line: hex(mix(amb(fm.outline, 0.15), [0, 0, 0], 0.15)), deep: hex(mix(amb(fm.shade, 0.18), fm.outline, 0.4)),
      shade: hex(amb(fm.shade, 0.18)), mid: hex(mix(amb(fm.shade, 0.15), amb(fm.body, 0.14), 0.5)),
      body: hex(amb(fm.body, 0.14)), light: hex(amb(fm.light, 0.1)),
    };
    const rim = hex(mix(tint, [255, 255, 255], 0.5));
    const A = fm.alpha ?? 1;

    // contact shadow, shrinking as she leaves the ground
    const sw = Math.round(W * (1.05 - Math.min(0.5, lift * 0.012)));
    g.globalAlpha = 0.28; g.fillStyle = '#000';
    g.fillRect((cx - sw) * Q, (floor + 1) * Q, sw * 2 * Q, 2 * Q);
    g.fillRect((cx - sw + 3) * Q, (floor + 3) * Q, (sw * 2 - 6) * Q, Q);

    // body: a dome flattened at the base, shaded in clean bands like a lit ball
    const top = -H;
    const rows: [number, number][] = [];
    for (let i = 0; i <= H; i++) {
      const v = i / H;
      const dome = v < 0.6 ? Math.sqrt(1 - ((0.6 - v) / 0.6) ** 2) : 1 - 0.1 * ((v - 0.6) / 0.4) ** 3;
      rows.push([Math.round(pullX * 2 * (1 - v) ** 1.5), Math.round(W * dome)]);
    }
    rows.forEach(([sh, xr], i) => {
      const y = top + i, v = i / H;
      const pl = i > 0 ? rows[i - 1][0] - rows[i - 1][1] : 0, pr = i > 0 ? rows[i - 1][0] + rows[i - 1][1] - 1 : 0;
      for (let px = -xr; px < xr; px++) {
        const X = px + sh;
        if (px === -xr || px === xr - 1 || i === 0 || i === H || X < pl || X > pr) { dot(X, y, tone.line, A); continue; }
        const nx = (px + 0.5) / xr, ny = (v - 0.55) / 0.55;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny * 0.8));
        const lit = -0.5 * nx - 0.6 * ny + 0.62 * nz;
        let c = lit > 0.7 ? tone.light : lit > 0.32 ? tone.body : lit > 0.02 ? tone.mid : lit > -0.3 ? tone.shade : tone.deep;
        if (v > 0.9) c = tone.deep;
        dot(X, y, c, A);
        if (px >= xr - 3 && px < xr - 1 && v > 0.25 && v < 0.85) dot(X, y, rim, px === xr - 2 ? 0.55 : 0.25);
      }
    });
    // glossy highlight: a soft oval and a sparkle
    const gx = Math.round(-W * 0.45 + pullX), gy = top + 3;
    dot(gx, gy, '#ffffff', 0.85, 2, 2); dot(gx + 2, gy - 1, '#ffffff', 0.5); dot(gx - 1, gy + 2, '#ffffff', 0.35);

    // face (fine pixels)
    const shTop = rows[Math.round(H * 0.45)][0];
    const ey = Math.round(top + H * 0.4 + lookY * 0.7), ex = Math.round(4.6 * sx), lx = Math.round(look * 0.7) + shTop;
    if (fm.visor) {
      dot(-ex - 3 + lx, ey, '#13233a', 1, ex * 2 + 6, 3);
      const scan = Math.floor(t * 14) % (ex * 2 + 6);
      dot(-ex - 3 + scan + lx, ey, '#7ff8ff', 1, 2, 3);
      dot(-ex - 3 + lx, ey + 1, '#7ff8ff', 0.25, ex * 2 + 6, 1);
    } else {
      for (const s of [-1, 1]) {
        const e0 = s * ex + lx - 1;                     // left edge of a 3-wide eye
        if (happy > 0.5) {
          dot(e0, ey + 2, EYE); dot(e0 + 1, ey + 1, EYE); dot(e0 + 2, ey + 2, EYE);
        } else if (blink > 0 || drag) {
          dot(e0, ey + 2, EYE, 1, 3, 1);
        } else {
          dot(e0, ey, EYE, 1, 3, 4);
          dot(e0, ey, '#ffffff', 0.95, 1, 2); dot(e0 + 2, ey + 3, '#ffffff', 0.45);
        }
      }
      const blush = 0.4 + happy * 0.4;
      dot(-ex - 3 + lx, ey + 4, '#ff8fa8', blush, 2, 1); dot(ex + 2 + lx, ey + 4, '#ff8fa8', blush, 2, 1);
      // mouth: a small "w", wide open when happy or in the air
      if (happy > 0.5 || hop > 3) { dot(lx - 1, ey + 4, EYE, 1, 3, 1); dot(lx - 1, ey + 5, '#c0485e', 1, 3, 1); }
      else { dot(lx - 1, ey + 4, EYE, 0.9); dot(lx, ey + 5, EYE, 0.9); dot(lx + 1, ey + 4, EYE, 0.9); }
    }
    // accessories, in design pixels, riding on top of her head
    const topDesign = Math.round((top * Q) / P);
    fm.extra?.((px, py, c, a) => put(px + Math.round((rows[0][0] * Q) / P), py, c, a), topDesign, t, sx * 0.85);

    if (alert > 0) {
      const a = Math.min(1, alert * 3), ax = Math.round((W * Q) / P) + 1;
      put(ax, topDesign - 6, '#fff8ec', a); put(ax, topDesign - 5, '#fff8ec', a); put(ax, topDesign - 4, '#fff8ec', a); put(ax, topDesign - 2, '#fff8ec', a);
    }
    for (const s of sparks) {
      const px = Math.round(s.x), py = Math.round(s.y) - Math.round((H * Q) / P / 2);
      if (s.heart) {
        put(px - 1, py, s.c, s.life); put(px + 1, py, s.c, s.life);
        put(px - 1, py + 1, s.c, s.life); put(px, py + 1, s.c, s.life); put(px + 1, py + 1, s.c, s.life); put(px, py + 2, s.c, s.life);
      } else put(px, py, s.c, s.life);
    }
    g.globalAlpha = 1;
  }

  const home = () => ({ x, y: base() - 8 * P });
  /** Hop over to a screen x (null: go back to following the cursor). */
  const focus = (sx: number | null) => { goal = sx; if (sx !== null && hop === 0) hopV = 26; };
  return { update, home, say, focus };
}
