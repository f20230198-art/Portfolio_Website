/**
 * The wisps: small glowing spirits that float around the screen while the slime
 * keeps to the ground. Each wanders its own way, comes to look at a resting cursor,
 * swoops when the page changes and spins if clicked. Now and then one sneaks down,
 * boops the slime on the head, and flees.
 */
type Wisp = {
  core: string; edge: string; glow: string;
  x: number; y: number; vx: number; vy: number;
  ph: number; sp: number;               // its own wander phase and speed
  spin: number; blink: number; blinkAt: number;
  mode: 'roam' | 'tease' | 'flee'; modeT: number;
};

const KINDS = [
  { core: '#eaf6ff', edge: '#9fd0ff', glow: '160, 210, 255' },
  { core: '#fff6d8', edge: '#ffd27a', glow: '255, 210, 120' },
  { core: '#f6e8ff', edge: '#c9a4ff', glow: '200, 160, 255' },
];

export function createWisps(onBoop: (x: number) => void) {
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:29';
  document.body.appendChild(cv);
  const g = cv.getContext('2d')!;
  let dpr = 1, P = 4;
  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    P = Math.max(3, Math.round(Math.min(innerWidth, innerHeight) / 220));
  };
  addEventListener('resize', resize);
  resize();

  const wisps: Wisp[] = KINDS.map((k, i) => ({ ...k, x: innerWidth * (0.6 + i * 0.12), y: innerHeight * (0.2 + i * 0.12), vx: 0, vy: 0,
    ph: i * 2.1, sp: 0.8 + i * 0.25, spin: 0, blink: 0, blinkAt: 2 + i, mode: 'roam', modeT: 0 }));
  const trail: { x: number; y: number; life: number; c: string }[] = [];
  let mouse: { x: number; y: number; still: number } | null = null;
  let swoop = 0, nextTease = 14 + Math.random() * 8;
  addEventListener('pointermove', (e) => (mouse = { x: e.clientX, y: e.clientY, still: 0 }));
  addEventListener('pointerdown', (e) => { for (const w of wisps) if (Math.hypot(e.clientX - w.x, e.clientY - w.y) < 8 * P) w.spin = 1; });

  /** slime: where the top of its head is, on screen */
  function update(t: number, dt: number, slime: { x: number; y: number }) {
    if (mouse) mouse.still += dt;
    swoop = Math.max(0, swoop - dt);
    // every so often, one of them goes to bother the slime
    nextTease -= dt;
    if (nextTease < 0) {
      nextTease = 22 + Math.random() * 14;
      const free = wisps.filter((w) => w.mode === 'roam');
      const w = free[Math.floor(Math.random() * free.length)];
      if (w) { w.mode = 'tease'; w.modeT = 4; }
    }
    wisps.forEach((w, i) => {
      let tx = innerWidth * (0.7 + 0.16 * Math.sin(t * 0.21 * w.sp + w.ph)), ty = innerHeight * (0.3 + 0.17 * Math.sin(t * 0.33 * w.sp + w.ph * 1.7));
      let pull = 2.2;
      if (w.mode === 'tease') {
        // sneak over the slime's head, then dip down and boop it
        w.modeT -= dt;
        const dip = w.modeT < 1.2;
        tx = slime.x + Math.sin(t * 3) * 6; ty = slime.y - (dip ? 2 * P : 22 * P);
        pull = dip ? 6 : 3;
        if (dip && Math.hypot(w.x - slime.x, w.y - slime.y) < 7 * P) {
          onBoop(w.x); w.mode = 'flee'; w.modeT = 2.2; w.spin = 0.6;
          w.vx = (w.x > innerWidth / 2 ? -1 : 1) * 500; w.vy = -700;
        }
        if (w.modeT < 0) w.mode = 'roam';
      } else if (w.mode === 'flee') {
        w.modeT -= dt;
        tx = w.x + w.vx * 0.3; ty = innerHeight * 0.15;
        pull = 0.6;
        if (w.modeT < 0) w.mode = 'roam';
      } else if (mouse && mouse.still > 0.8 && Math.hypot(mouse.x - w.x, mouse.y - w.y) < innerWidth * 0.3) {
        // a resting cursor is interesting: hover beside it, each at its own angle
        tx = mouse.x + Math.cos(t * 0.8 + i * 2.1) * 60; ty = mouse.y + Math.sin(t * 0.8 + i * 2.1) * 40;
      }
      if (swoop > 0) ty += Math.sin((1 - swoop) * Math.PI) * innerHeight * 0.12 * (1 + i * 0.3);
      w.vx += ((tx - w.x) * pull - w.vx * 2.4) * dt;
      w.vy += ((ty - w.y) * pull - w.vy * 2.4) * dt;
      w.x += w.vx * dt; w.y += w.vy * dt;
      w.spin = Math.max(0, w.spin - dt * 1.2);
      w.blinkAt -= dt;
      if (w.blinkAt < 0) { w.blink = 0.12; w.blinkAt = 2 + Math.random() * 4; }
      w.blink = Math.max(0, w.blink - dt);
      if (Math.random() < dt * 10) trail.push({ x: w.x + (Math.random() - 0.5) * 3 * P, y: w.y + (Math.random() - 0.5) * 3 * P, life: 1, c: w.edge });
    });
    for (const p of trail) { p.life -= dt * 1.4; p.y -= dt * 10; }
    while (trail.length && trail[0].life <= 0) trail.shift();
    draw(t);
  }

  function draw(t: number) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, innerWidth, innerHeight);
    const px = (gx: number, gy: number, c: string, a = 1, s = P) => { g.globalAlpha = a; g.fillStyle = c; g.fillRect(Math.round(gx / P) * P, Math.round(gy / P) * P, s, s); };
    for (const p of trail) px(p.x, p.y, p.c, p.life * 0.6);
    wisps.forEach((w, i) => {
      const cx = w.x, cy = w.y + Math.sin(t * 2.4 + i) * P * 0.8;
      const glow = g.createRadialGradient(cx, cy, 0, cx, cy, 9 * P);
      glow.addColorStop(0, `rgba(${w.glow}, .45)`); glow.addColorStop(1, `rgba(${w.glow}, 0)`);
      g.globalAlpha = 1; g.fillStyle = glow; g.fillRect(cx - 9 * P, cy - 9 * P, 18 * P, 18 * P);
      [1, 2, 3, 3, 3, 2, 1].forEach((r, j) => { for (let k = -r; k <= r; k++) px(cx + k * P, cy + (j - 3) * P, j < 2 || Math.abs(k) === r ? w.edge : w.core); });
      const fl = Math.round(Math.sin(t * 9 + i));
      px(cx + fl * P, cy + 4 * P, w.edge, 0.8); px(cx - fl * P, cy + 5 * P, w.edge, 0.5); px(cx, cy - 4 * P, w.edge, 0.7);
      // eyes look where it is going; a teasing or fleeing one grins
      const a = w.spin > 0 ? t * 20 : Math.atan2(w.vy, w.vx), d = w.spin > 0 ? 1 : Math.min(1, Math.hypot(w.vx, w.vy) / 80);
      const ex = Math.round(Math.cos(a) * d), ey = Math.round(Math.sin(a) * d * 0.6);
      for (const s of [-1, 1]) px(cx + (s * 1.2 + ex * 0.6) * P, cy + ey * 0.6 * P, '#1b2a4a', 1, w.blink > 0 ? P / 2 : P);
      if (w.mode !== 'roam') px(cx + ex * 0.6 * P, cy + (1.4 + ey * 0.6) * P, '#1b2a4a', 0.8);
    });
    g.globalAlpha = 1;
  }

  return { update, swoop: () => (swoop = 1) };
}
