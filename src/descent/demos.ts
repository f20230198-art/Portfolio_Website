/**
 * One small interactive illustration per project, shown on its case-study page.
 * Each is drawn on a low-resolution canvas (scaled up, pixelated) so it sits with
 * the painted world. They illustrate the idea of the project; none of them is real data.
 */
import { esc } from './text';

const C = { bg: '#140c28', panel: '#1e1438', line: '#3a2c5e', ink: '#fff8ec', dim: '#a99cc4', gold: '#ffd27a', green: '#7fe0a8', red: '#ff6b6b', blue: '#8ab8ff', pink: '#f4a3c8' };
type G = CanvasRenderingContext2D;

/* ---------- shared bits ---------- */
function mount(host: HTMLElement, o: { title: string; hint: string; w: number; h: number; canvas?: boolean }) {
  host.innerHTML = `<div class="demo">
    <div class="demo-head"><p class="meta">Try it · ${esc(o.title)}</p><p class="hint">${esc(o.hint)}</p></div>
    ${o.canvas === false ? '' : `<canvas width="${o.w}" height="${o.h}"></canvas>`}
    <div class="demo-ui"></div>
    <p class="note">An illustration of the idea, simulated in your browser. Not real data.</p></div>`;
  const cv = host.querySelector('canvas') as HTMLCanvasElement;
  const ui = host.querySelector('.demo-ui') as HTMLElement;
  const g = cv?.getContext('2d') as G;
  const at = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) * o.w) / r.width, y: ((e.clientY - r.top) * o.h) / r.height }; };
  return { cv, g, ui, at, box: host.querySelector('.demo') as HTMLElement };
}

/** Run fn every frame, but only while the element is on screen. */
function loop(el: Element, fn: (t: number, dt: number) => void) {
  let on = false, last = 0;
  new IntersectionObserver(([e]) => {
    const was = on;
    on = e.isIntersecting;
    if (on && !was) { last = performance.now(); requestAnimationFrame(tick); }
  }).observe(el);
  function tick(now: number) {
    if (!on) return;
    fn(now / 1000, Math.min(0.05, (now - last) / 1000));
    last = now;
    requestAnimationFrame(tick);
  }
}

function txt(g: G, s: string, x: number, y: number, color = C.ink, size = 10, align: CanvasTextAlign = 'left') {
  g.font = `${size}px 'Pixelify Sans', monospace`;
  g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = color;
  g.fillText(s, Math.round(x), Math.round(y));
}
const rect = (g: G, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
/** A pixel block with a dark outline. */
const block = (g: G, x: number, y: number, s: number, c: string) => { rect(g, x - s / 2 - 1, y - s / 2 - 1, s + 2, s + 2, '#0b0716'); rect(g, x - s / 2, y - s / 2, s, s, c); };
function clear(g: G, w: number, h: number) {
  rect(g, 0, 0, w, h, C.bg);
  g.globalAlpha = 0.35;
  for (let y = 0; y < h; y += 10) for (let x = (y / 10) % 2 ? 5 : 0; x < w; x += 10) rect(g, x, y, 1, 1, C.line);
  g.globalAlpha = 1;
}
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function button(ui: HTMLElement, label: string, on: () => void) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'px-btn'; b.textContent = label;
  b.addEventListener('click', on);
  ui.append(b);
  return b;
}
function slider(ui: HTMLElement, label: string, on: (v: number) => void, value = 0) {
  const l = document.createElement('label');
  l.className = 'px-slider';
  l.innerHTML = `<span>${esc(label)}</span><input type="range" min="0" max="100" value="${value}" />`;
  const input = l.querySelector('input')!;
  input.addEventListener('input', () => on(+input.value / 100));
  ui.append(l);
  return input;
}

/* ---------- AI security ---------- */

/** Weights Aren't Enough: adaptive attacks pull backdoored adapters into the clean cluster. */
function lora(host: HTMLElement) {
  const W = 320, H = 180;
  const { g, ui, cv } = mount(host, { title: 'Collapse the detector', w: W, h: H,
    hint: 'Each block is a LoRA adapter, placed by the detector’s score. Raise the adaptive attack: the backdoors still fire, but the detector stops telling them apart.' });
  const dots = Array.from({ length: 40 }, (_, i) => ({ bad: i % 2 === 1, n: gauss() * 0.07, lane: Math.random(), x: 0, ph: Math.random() * 9 }));
  let atk = 0;
  const target = (d: (typeof dots)[0]) => Math.max(0.03, Math.min(0.97, (d.bad ? 0.75 - 0.47 * atk : 0.28) + d.n));
  dots.forEach((d) => (d.x = target(d)));
  slider(ui, 'Adaptive attack strength', (v) => (atk = v));
  const X0 = 16, X1 = 304, Y0 = 46, Y1 = 132;
  loop(cv, (t) => {
    clear(g, W, H);
    let pairs = 0, wins = 0, caught = 0;
    for (const d of dots) d.x += (target(d) - d.x) * 0.07;
    for (const a of dots) if (a.bad) { if (a.x > 0.5) caught++; for (const b of dots) if (!b.bad) { pairs++; wins += a.x > b.x ? 1 : a.x === b.x ? 0.5 : 0; } }
    const auc = wins / pairs;
    // the decision threshold
    for (let y = Y0 - 8; y < Y1 + 6; y += 6) rect(g, X0 + (X1 - X0) * 0.5, y, 1, 3, C.gold);
    txt(g, 'flag ▸', X0 + (X1 - X0) * 0.5 + 4, Y0 - 10, C.gold, 9);
    rect(g, X0, Y1 + 8, X1 - X0, 1, C.line);
    txt(g, 'looks clean', X0, Y1 + 18, C.dim, 9);
    txt(g, 'looks backdoored', X1, Y1 + 18, C.dim, 9, 'right');
    for (const d of dots) block(g, X0 + (X1 - X0) * d.x, Y0 + d.lane * (Y1 - Y0) + Math.sin(t * 2 + d.ph) * 1.5, 5, d.bad ? C.red : C.green);
    txt(g, `Detector AUC ${auc.toFixed(2)}`, 10, 14, auc > 0.8 ? C.green : auc > 0.65 ? C.gold : C.red, 12);
    txt(g, `Backdoor success 100%`, W - 10, 14, C.red, 12, 'right');
    txt(g, `${caught}/20 backdoors flagged`, 10, 30, C.dim, 9);
    block(g, W - 108, 30, 4, C.green); txt(g, 'clean', W - 102, 30, C.dim, 9);
    block(g, W - 66, 30, 4, C.red); txt(g, 'backdoored', W - 60, 30, C.dim, 9);
  });
}

/** Spoofing dataset ownership: make an innocent model look like it trained on protected data. */
function ownership(host: HTMLElement) {
  const W = 320, H = 180;
  const { g, ui, cv, at } = mount(host, { title: 'Frame an innocent model', w: W, h: H,
    hint: 'Only model A really trained on the protected dataset. Click another model to target it, then raise the spoofing budget until the verifier accuses it.' });
  const models = 'ABCDEF'.split('').map((n, i) => ({ n, trained: i === 0, s: i === 0 ? 0.86 : 0.1, x: 30 + i * 52 }));
  let target = 3, spoof = 0;
  slider(ui, 'Spoofing budget', (v) => (spoof = v));
  cv.addEventListener('pointerdown', (e) => { const p = at(e); const m = models.findIndex((m) => Math.abs(p.x - m.x) < 22); if (m > 0) target = m; });
  cv.style.cursor = 'pointer';
  const TH = 0.6, BASE = 150, TOP = 46;
  loop(cv, (t) => {
    clear(g, W, H);
    const y = (v: number) => BASE - v * (BASE - TOP);
    for (let x = 8; x < W - 8; x += 6) rect(g, x, y(TH), 3, 1, C.gold);
    txt(g, 'accuse ↑', W - 8, y(TH) - 6, C.gold, 9, 'right');
    let framed = false;
    models.forEach((m, i) => {
      const goal = m.trained ? 0.86 : 0.1 + (i === target ? 0.82 * spoof : 0) + Math.sin(t * 1.3 + i) * 0.015;
      m.s += (goal - m.s) * 0.08;
      const hit = m.s > TH;
      if (hit && !m.trained) framed = true;
      rect(g, m.x - 9, y(m.s), 18, BASE - y(m.s), hit ? (m.trained ? C.gold : C.red) : C.blue);
      rect(g, m.x - 9, y(m.s), 18, 2, C.ink);
      rect(g, m.x - 14, BASE + 4, 28, 18, i === target ? C.gold : C.panel);
      rect(g, m.x - 12, BASE + 6, 24, 14, C.bg);
      txt(g, m.n, m.x, BASE + 13, m.trained ? C.gold : C.ink, 10, 'center');
      if (hit) txt(g, m.trained ? 'guilty' : 'ACCUSED', m.x, y(m.s) - 8, m.trained ? C.gold : C.red, 9, 'center');
    });
    txt(g, framed ? `Model ${models[target].n} accused. It never saw the data.` : 'Verifier: only model A is flagged', 10, 14, framed ? C.red : C.green, 11);
    txt(g, 'trained on data: A only', 10, 30, C.dim, 9);
  });
}

/** Threshold ML-DSA: a key split across parties, and what a leaky protocol gives away. */
function mldsa(host: HTMLElement) {
  const W = 320, H = 180;
  const { g, ui, cv, at } = mount(host, { title: 'Leak a split key', w: W, h: H,
    hint: 'The signing key is split across 5 parties; any 3 can sign. Click parties to corrupt them, then run signing sessions. A sound protocol leaks nothing below the threshold. A leaky one gives the key away a little at a time.' });
  const N = 5, T = 3, CX = 92, CY = 98, R = 58;
  const parties = Array.from({ length: N }, (_, i) => ({ bad: false, x: CX + Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / N) * R, y: CY + Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / N) * R }));
  const bits = Array.from({ length: 32 }, () => ({ v: Math.random() < 0.5 ? 0 : 1, seen: false }));
  let leaky = false, sessions = 0, queue = 0, anim = 0;
  const mode = button(ui, 'Protocol: sound', () => { leaky = !leaky; mode.textContent = `Protocol: ${leaky ? 'leaky (toy)' : 'sound'}`; });
  button(ui, 'Run 5 sessions', () => (queue += 5));
  button(ui, 'Reset', () => { bits.forEach((b) => (b.seen = false)); parties.forEach((p) => (p.bad = false)); sessions = 0; queue = 0; });
  cv.style.cursor = 'pointer';
  cv.addEventListener('pointerdown', (e) => { const p = at(e); for (const q of parties) if (Math.hypot(p.x - q.x, p.y - q.y) < 14) q.bad = !q.bad; });
  loop(cv, (t, dt) => {
    const bad = parties.filter((p) => p.bad).length;
    if (queue > 0 && anim <= 0) { anim = 1; queue--; }
    if (anim > 0) {
      anim -= dt * 2.2;
      if (anim <= 0) {
        sessions++;
        if (bad >= T) bits.forEach((b) => (b.seen = true));
        else if (leaky) for (const b of bits) if (!b.seen && Math.random() < 0.06 * bad) b.seen = true;
      }
    }
    clear(g, W, H);
    // the key in the middle, shares flowing in during a session
    for (const p of parties) {
      rect(g, Math.min(p.x, CX), Math.min(p.y, CY), Math.abs(p.x - CX) || 1, 1, C.line);
      if (anim > 0) { const k = 1 - anim; block(g, p.x + (CX - p.x) * k, p.y + (CY - p.y) * k, 3, p.bad ? C.red : C.gold); }
    }
    block(g, CX, CY, 16, C.gold); txt(g, '⚿', CX, CY + 1, C.bg, 12, 'center');
    parties.forEach((p, i) => {
      block(g, p.x, p.y + Math.sin(t * 2 + i) * 1, 14, p.bad ? C.red : C.blue);
      txt(g, p.bad ? '☠' : `P${i + 1}`, p.x, p.y + 1, C.bg, 9, 'center');
    });
    // what the corrupted parties have learned about the key
    const seen = bits.filter((b) => b.seen).length;
    txt(g, 'attacker’s view of the key', 186, 46, C.dim, 9);
    bits.forEach((b, i) => {
      const x = 190 + (i % 8) * 15, y = 62 + Math.floor(i / 8) * 17;
      rect(g, x - 6, y - 7, 13, 14, b.seen ? C.red : C.panel);
      txt(g, b.seen ? String(b.v) : '?', x, y + 1, b.seen ? C.bg : C.dim, 9, 'center');
    });
    txt(g, `${seen}/32 key bits leaked`, 186, 140, seen ? C.red : C.green, 10);
    txt(g, `${bad} of ${N} corrupted · threshold ${T}`, 10, 14, bad >= T ? C.red : C.ink, 11);
    txt(g, `sessions run: ${sessions}`, 10, 30, C.dim, 9);
    if (bad >= T) txt(g, 'threshold reached: key recovered', 186, 156, C.red, 9);
    else if (!leaky && sessions && bad) txt(g, 'below threshold: nothing learned', 186, 156, C.green, 9);
  });
}

/* ---------- machine learning ---------- */

/** Behavioural drift: compare a student to their own normal, not to everyone. */
function drift(host: HTMLElement) {
  const W = 320, H = 180;
  const { g, ui, cv } = mount(host, { title: 'Catch the drift, spare the slow student', w: W, h: H,
    hint: 'This student naturally takes longer per question. Hold “paste answers” to fake a sudden burst of speed. Then switch the baseline to “everyone” and watch the honest slow work get flagged too.' });
  const POP = { m: 0.42, s: 0.07 }, OWN = { m: 0.66, s: 0.05 };
  const pts: { v: number; cheat: boolean }[] = [];
  let own = true, cheating = false, acc = 0, flagsFair = 0, flagsUnfair = 0;
  const cheat = button(ui, 'Hold: paste answers', () => {});
  const set = (v: boolean) => (e: Event) => { e.preventDefault(); cheating = v; cheat.classList.toggle('on', v); };
  cheat.addEventListener('pointerdown', set(true));
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) cheat.addEventListener(ev, set(false));
  const base = button(ui, 'Baseline: this student', () => { own = !own; base.textContent = `Baseline: ${own ? 'this student' : 'everyone'}`; });
  const X0 = 10, X1 = 310, Y0 = 40, Y1 = 160, M = 75;
  const y = (v: number) => Y1 - v * (Y1 - Y0);
  loop(cv, (_t, dt) => {
    acc += dt;
    while (acc > 0.12) {
      acc -= 0.12;
      pts.push(cheating ? { v: 0.18 + Math.random() * 0.06, cheat: true } : { v: OWN.m + gauss() * OWN.s * 0.8, cheat: false });
      if (pts.length > M) pts.shift();
    }
    const b = own ? OWN : POP;
    clear(g, W, H);
    rect(g, X0, y(b.m + 2 * b.s), X1 - X0, y(b.m - 2 * b.s) - y(b.m + 2 * b.s), own ? 'rgba(127,224,168,.16)' : 'rgba(138,184,255,.16)');
    rect(g, X0, y(b.m), X1 - X0, 1, own ? C.green : C.blue);
    txt(g, own ? 'this student’s normal' : 'population normal', X1, y(b.m + 2 * b.s) - 6, own ? C.green : C.blue, 9, 'right');
    let fair = 0, unfair = 0;
    pts.forEach((p, i) => {
      const x = X0 + ((X1 - X0) * i) / (M - 1);
      const z = Math.abs(p.v - b.m) / b.s, flag = z > 2.5;
      if (i) { const q = pts[i - 1]; rect(g, x - 4, Math.min(y(q.v), y(p.v)), 1, Math.abs(y(q.v) - y(p.v)) + 1, C.line); }
      block(g, x, y(p.v), flag ? 4 : 2, flag ? C.red : C.ink);
      if (flag) { if (p.cheat) fair++; else unfair++; }
    });
    flagsFair = fair; flagsUnfair = unfair;
    txt(g, 'time per question ↑', X0, Y0 - 8, C.dim, 9);
    txt(g, `flags: ${flagsFair} real drift`, 10, 14, flagsFair ? C.red : C.dim, 11);
    txt(g, `${flagsUnfair} honest work flagged`, W - 10, 14, flagsUnfair ? C.red : C.green, 11, 'right');
  });
}

/** PropNet: guess real or fake from the shape of the spread, against the model. */
function propnet(host: HTMLElement) {
  const W = 320, H = 190;
  const { g, ui, cv } = mount(host, { title: 'Real or fake, from the spread alone', w: W, h: H,
    hint: 'A story spreads from the centre outwards; you never see its text. Guess before PropNet does, or let it grow and read the shape.' });
  type Node = { a: number; d: number; t: number; p: number };
  let nodes: Node[] = [], fake = false, t0 = 0, guess: boolean | null = null, done = false, you = 0, net = 0, rounds = 0, now = 0;
  const msg = document.createElement('p');
  msg.className = 'demo-msg';
  function story() {
    fake = Math.random() < 0.5; nodes = [{ a: 0, d: 0, t: 0, p: -1 }]; guess = null; done = false; t0 = now;
    const n = 70 + Math.floor(Math.random() * 30);
    for (let i = 1; i < n; i++) {
      // real stories fan out wide and shallow; fake ones run in deep chains and bursts
      const par = fake ? (Math.random() < 0.65 ? Math.max(0, i - 1 - Math.floor(Math.random() * 3)) : Math.floor(Math.random() * i)) : Math.random() < 0.7 ? 0 : Math.floor(Math.random() * Math.min(i, 12));
      const P = nodes[par];
      if (P.d >= (fake ? 7 : 3)) { i--; continue; }
      nodes.push({ a: par === 0 ? Math.random() * Math.PI * 2 : P.a + (Math.random() - 0.5) * (fake ? 0.5 : 0.9), d: P.d + 1, t: fake ? i * 0.035 : i * 0.06 + Math.random() * 0.4, p: par });
    }
    nodes.sort((a, b) => a.t - b.t);
    msg.textContent = 'Watch it spread…';
  }
  const answer = (v: boolean) => () => { if (guess === null && !done) { guess = v; msg.textContent = `You said ${v ? 'fake' : 'real'}. Let it finish…`; } };
  button(ui, 'Real', answer(false));
  button(ui, 'Fake', answer(true));
  button(ui, 'Next story', story);
  ui.append(msg);
  story();
  const CX = 110, CY = 102, STEP = 12;
  loop(cv, (t) => {
    now = t;
    if (t0 === 0) t0 = t;
    const el = t - t0, end = nodes[nodes.length - 1].t + 0.4;
    const shown = nodes.filter((n) => n.t <= el);
    const pos = (n: Node) => ({ x: CX + Math.cos(n.a) * n.d * STEP, y: CY + Math.sin(n.a) * n.d * STEP * 0.85 });
    clear(g, W, H);
    // PropNet's belief, firming up as the tree grows
    const k = Math.min(1, el / end), p = 0.5 + (fake ? 1 : -1) * (0.47 * Math.min(1, k * 1.6)) + Math.sin(t * 5) * 0.02 * (1 - k);
    const byIndex = new Map(nodes.map((n, i) => [i, n]));
    for (const n of shown) if (n.p >= 0) {
      const a = pos(n), b = pos(byIndex.get(n.p) ?? nodes[0]);
      g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    }
    for (const n of shown) { const q = pos(n); block(g, q.x, q.y, n.d === 0 ? 6 : 3, n.d === 0 ? C.gold : el - n.t < 0.3 ? C.ink : n.d > 3 ? C.pink : C.blue); }
    rect(g, 230, 40, 76, 8, C.panel);
    rect(g, 230, 40, 76 * p, 8, p > 0.5 ? C.red : C.green);
    txt(g, 'PropNet P(fake)', 230, 30, C.dim, 9);
    txt(g, p.toFixed(2), 306, 56, C.ink, 10, 'right');
    txt(g, `nodes ${shown.length}`, 230, 76, C.dim, 9);
    txt(g, `depth ${Math.max(...shown.map((n) => n.d))}`, 230, 90, C.dim, 9);
    txt(g, `you ${you} · PropNet ${net}`, 230, 112, C.gold, 10);
    txt(g, `rounds ${rounds}`, 230, 126, C.dim, 9);
    if (!done && el > end) {
      done = true; rounds++;
      net++; // PropNet calls it once the shape is clear
      if (guess === fake) you++;
      msg.textContent = `It was ${fake ? 'FAKE' : 'REAL'}. ${guess === null ? 'You didn’t guess.' : guess === fake ? 'You got it.' : 'You missed it.'} PropNet: ${fake ? 'fake' : 'real'} (${p.toFixed(2)}).`;
    }
  });
}

/** DOOM Engine: nine agents vote, risk can veto, the orchestrator decides. */
function doom(host: HTMLElement) {
  const W = 320, H = 190;
  const { g, ui, cv, at } = mount(host, { title: 'Run a trading cycle', w: W, h: H,
    hint: 'Nine agents send their votes to the orchestrator every cycle. The market regime changes how bold they are, and the risk agent can veto. Click an agent to see its share of the P&L.' });
  const names = ['INTEL', 'TECH', 'ENERGY', 'FINANCE', 'HEALTH', 'SENTIMENT', 'STRATEGY', 'RISK', 'EXECUTION'];
  const CX = 160, CY = 102;
  const agents = names.map((n, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / names.length; return { n, x: CX + Math.cos(a) * 128, y: CY + Math.sin(a) * 66, vote: 0, pnl: 0 }; });
  const tickers = ['NVDA', 'XOM', 'JPM', 'AAPL', 'UNH', 'MSFT', 'CVX'];
  const regimes = ['BULL', 'BEAR', 'CHOPPY'];
  let regime = 0, phase = 1, decision = 'waiting', last = 'HOLD', sel = -1, auto = 0;
  const log = document.createElement('ol');
  log.className = 'demo-log';
  function cycle() {
    if (Math.random() < 0.3) regime = (regime + 1 + Math.floor(Math.random() * 2)) % 3;
    const bias = regime === 0 ? 0.35 : regime === 1 ? -0.35 : 0;
    agents.forEach((a) => (a.vote = Math.max(-1, Math.min(1, bias + gauss() * 0.45))));
    const sum = agents.slice(0, 7).reduce((s, a) => s + a.vote, 0) / 7;
    const veto = regime === 2 && Math.abs(sum) > 0.15 && Math.random() < 0.6;
    agents[7].vote = veto ? 0 : agents[7].vote;
    const tk = pick(tickers);
    last = veto ? 'VETO' : sum > 0.12 ? 'BUY' : sum < -0.12 ? 'SELL' : 'HOLD';
    decision = last === 'VETO' ? `risk veto · ${tk}` : last === 'HOLD' ? 'hold' : `${last} ${tk}`;
    const ret = (regime === 0 ? 1 : regime === 1 ? -1 : 0) * 0.6 + gauss() * 0.5;
    if (last === 'BUY' || last === 'SELL') agents.forEach((a) => (a.pnl += a.vote * ret * (last === 'BUY' ? 1 : -1) * 10));
    const li = document.createElement('li');
    li.textContent = `${regimes[regime].toLowerCase()} · ${decision}`;
    log.prepend(li);
    while (log.children.length > 4) log.lastChild!.remove();
    phase = 0;
  }
  button(ui, 'Run cycle', cycle);
  ui.append(log);
  cv.style.cursor = 'pointer';
  cv.addEventListener('pointerdown', (e) => { const p = at(e); sel = agents.findIndex((a) => Math.abs(p.x - a.x) < 26 && Math.abs(p.y - a.y) < 10); });
  loop(cv, (t, dt) => {
    phase = Math.min(1, phase + dt * 0.9);
    auto += dt;
    if (auto > 4.5) { auto = 0; cycle(); }
    clear(g, W, H);
    for (const a of agents) {
      rect(g, Math.min(a.x, CX), a.y, Math.abs(a.x - CX), 1, C.line);
      rect(g, CX, Math.min(a.y, CY), 1, Math.abs(a.y - CY), C.line);
      if (phase < 0.6) { const k = phase / 0.6; block(g, a.x + (CX - a.x) * k, a.y + (CY - a.y) * k, 3, a.vote > 0.1 ? C.green : a.vote < -0.1 ? C.red : C.dim); }
    }
    agents.forEach((a, i) => {
      const w = a.n.length * 5 + 8;
      rect(g, a.x - w / 2 - 1, a.y - 7, w + 2, 14, i === sel ? C.gold : '#0b0716');
      rect(g, a.x - w / 2, a.y - 6, w, 12, a.n === 'RISK' && last === 'VETO' && phase < 1 ? C.red : C.panel);
      txt(g, a.n, a.x, a.y + 1, C.ink, 8, 'center');
    });
    const hc = last === 'BUY' ? C.green : last === 'SELL' ? C.red : last === 'VETO' ? C.gold : C.dim;
    rect(g, CX - 40, CY - 15, 80, 30, '#0b0716');
    rect(g, CX - 39, CY - 14, 78, 28, phase > 0.6 ? C.panel : C.bg);
    txt(g, 'ORCHESTRATOR', CX, CY - 6, C.dim, 7, 'center');
    txt(g, phase > 0.6 ? decision.toUpperCase() : '…', CX, CY + 6, hc, 9, 'center');
    txt(g, `regime ${regimes[regime]}`, 6, 12, regime === 0 ? C.green : regime === 1 ? C.red : C.gold, 9);
    txt(g, `next cycle ${Math.ceil(4.5 - auto)}s`, W - 6, 12, C.dim, 9, 'right');
    if (sel >= 0) { const a = agents[sel]; txt(g, `${a.n} P&L ${a.pnl >= 0 ? '+' : ''}${a.pnl.toFixed(1)}`, 6, H - 8, a.pnl >= 0 ? C.green : C.red, 9); }
    else txt(g, 'click an agent', 6, H - 8, C.dim, 9);
    void t;
  });
}

/* ---------- cybersecurity ---------- */

const TACTICS = ['Reconnaissance', 'Resource Development', 'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion',
  'Credential Access', 'Discovery', 'Lateral Movement', 'Collection', 'Command and Control', 'Exfiltration', 'Impact'];
const POSTS: [string, number][] = [
  ['scanning 198.51.100.0/24 for exposed VPN gateways, list soon', 0],
  ['registered paypa1-secure[.]example for the next campaign', 1],
  ['selling fresh RDP access to a logistics firm, 40 hosts, 203.0.113.24', 2],
  ['macro dropper runs powershell -enc on open, clean on VT', 3],
  ['scheduled-task kit survives reboots, $200', 4],
  ['local priv-esc for unpatched print spooler, works on 2019', 5],
  ['new stealer build bypasses EDR, sha256 9f86d081884c7d65', 6],
  ['dumped lsass on a DC, NTLM hashes for sale', 7],
  ['AD enum script maps every trust in one run', 8],
  ['pivot over psexec into the finance subnet', 9],
  ['keylogger + screen grabber bundle, weekly updates', 10],
  ['bot panel at panel-c2[.]example, 3k bots online', 11],
  ['exfil over DNS tunnel to 203.0.113.77, slow but quiet', 12],
  ['affiliate program, encrypts ESXi, 80/20 split', 13],
];
const IOC = /(\b\d{1,3}(?:\.\d{1,3}){3}(?:\/\d+)?\b|\b[\w-]+\[\.\][\w.]+|\bsha256 [0-9a-f]+|\b(?:powershell -enc|psexec|lsass)\b)/g;

/** SentinelX: posts stream in, IOCs are pulled out, and each lands on the ATT&CK heatmap. */
function sentinel(host: HTMLElement) {
  const W = 320, H = 120;
  const { g, ui, cv, at, box } = mount(host, { title: 'Map the chatter', w: W, h: H,
    hint: 'Synthetic dark-web posts stream in. Highlighted bits are extracted indicators. Each post is mapped to an ATT&CK tactic and heats up its cell. Hover a cell for its name.' });
  const feed = document.createElement('ol');
  feed.className = 'demo-feed';
  box.insertBefore(feed, cv);
  const heat = TACTICS.map(() => 0), flash = TACTICS.map(() => 0);
  let paused = false, acc = 1.2, hover = -1, order = [...POSTS.keys()].sort(() => Math.random() - 0.5), k = 0, total = 0;
  const pause = button(ui, 'Pause feed', () => { paused = !paused; pause.textContent = paused ? 'Resume feed' : 'Pause feed'; });
  const status = document.createElement('p');
  status.className = 'demo-msg';
  ui.append(status);
  const cell = (i: number) => ({ x: 6 + (i % 7) * 44, y: 8 + Math.floor(i / 7) * 52, w: 40, h: 46 });
  cv.addEventListener('pointermove', (e) => { const p = at(e); hover = TACTICS.findIndex((_, i) => { const c = cell(i); return p.x >= c.x && p.x < c.x + c.w && p.y >= c.y && p.y < c.y + c.h; }); });
  cv.addEventListener('pointerleave', () => (hover = -1));
  loop(cv, (_t, dt) => {
    if (!paused) acc += dt;
    if (acc > 1.6) {
      acc = 0;
      const [text, tac] = POSTS[order[k++ % order.length]];
      heat[tac]++; flash[tac] = 1; total++;
      const li = document.createElement('li');
      li.innerHTML = `<span class="tac">${esc(TACTICS[tac])}</span>${esc(text).replace(IOC, '<mark>$1</mark>')}`;
      feed.prepend(li);
      while (feed.children.length > 3) feed.lastChild!.remove();
    }
    clear(g, W, H);
    const max = Math.max(1, ...heat);
    TACTICS.forEach((name, i) => {
      const c = cell(i), v = heat[i] / max;
      flash[i] = Math.max(0, flash[i] - dt * 1.5);
      rect(g, c.x - 1, c.y - 1, c.w + 2, c.h + 2, i === hover ? C.gold : '#0b0716');
      rect(g, c.x, c.y, c.w, c.h, C.panel);
      g.globalAlpha = 0.15 + v * 0.85; rect(g, c.x, c.y + c.h * (1 - v), c.w, c.h * v, C.red); g.globalAlpha = 1;
      if (flash[i] > 0) { g.globalAlpha = flash[i]; rect(g, c.x, c.y, c.w, c.h, C.gold); g.globalAlpha = 1; }
      txt(g, name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase(), c.x + c.w / 2, c.y + 12, C.ink, 9, 'center');
      txt(g, String(heat[i]), c.x + c.w / 2, c.y + 32, C.ink, 12, 'center');
    });
    status.textContent = hover >= 0 ? `${TACTICS[hover]}: ${heat[hover]} post${heat[hover] === 1 ? '' : 's'}` : `${total} posts mapped across 14 tactics`;
  });
}

/** CyberScan: a pretend scan with the real check list and weighted 0–100 score. */
function cyberscan(host: HTMLElement) {
  const { ui, box } = mount(host, { title: 'Scan a (pretend) site', w: 0, h: 0, canvas: false,
    hint: 'Type any domain and scan it. These are the checks CyberScan runs and how they are weighted. The results here are made up from the name you type: no request leaves your browser.' });
  const CHECKS: [string, number][] = [
    ['HTTPS and TLS configuration', 15], ['Strict-Transport-Security', 8], ['Content-Security-Policy', 10], ['X-Frame-Options', 6],
    ['X-Content-Type-Options', 5], ['Referrer-Policy', 4], ['Permissions-Policy', 4], ['SQL injection · 20+ payloads per form', 20],
    ['Cross-site scripting · 15+ payloads', 18], ['DNS and look-alike domains', 10],
  ];
  const form = document.createElement('form');
  form.className = 'scan-form';
  form.innerHTML = `<input type="text" value="my-shop.example" aria-label="Domain to scan" spellcheck="false" /><button class="px-btn" type="submit">Scan</button>`;
  const out = document.createElement('div');
  out.className = 'scan-out';
  ui.append(form);
  box.insertBefore(out, ui.nextSibling);
  let run = 0;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = ++run;
    const host = (form.querySelector('input')!.value.trim() || 'example.com').toLowerCase();
    let h = 2166136261;
    for (const c of host) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    out.innerHTML = `<p class="scan-score"><b>--</b><span>/ 100 · ${esc(host)}</span></p><ul class="scan-list"></ul>`;
    const list = out.querySelector('.scan-list')!, score = out.querySelector('.scan-score b')!;
    let total = 0;
    for (let i = 0; i < CHECKS.length; i++) {
      const li = document.createElement('li');
      li.innerHTML = `<i class="run"></i><span>${esc(CHECKS[i][0])}</span><em>…</em>`;
      list.append(li);
      await new Promise((r) => setTimeout(r, 260));
      if (id !== run) return;
      const pass = ((h >>> i) & 3) !== 0;
      if (pass) total += CHECKS[i][1];
      li.querySelector('i')!.className = pass ? 'ok' : 'bad';
      li.querySelector('em')!.textContent = pass ? `+${CHECKS[i][1]}` : 'fail';
      score.textContent = String(total);
    }
    score.className = total >= 80 ? 'good' : total >= 55 ? 'meh' : 'poor';
  });
  form.requestSubmit();
}

export const DEMOS: Record<string, (host: HTMLElement) => void> = {
  'lora-backdoor': lora, 'ownership-spoof': ownership, 'ml-dsa': mldsa,
  'exam-drift': drift, propnet, 'doom-engine': doom,
  sentinelx: sentinel, cyberscan,
};
