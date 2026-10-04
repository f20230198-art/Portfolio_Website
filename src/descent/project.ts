/**
 * A project's own page, set in the forest scene: the full case study from
 * src/descent/content.ts, picked by ?id=.
 */
import { projects, zones } from './content';
import { esc } from './text';
import { DEMOS } from './demos';
import { createSlime } from './slime';
import { createWisps } from './wisp';

const page = document.getElementById('page')!;
const p = projects.find((p) => p.id === new URLSearchParams(location.search).get('id'));

if (!p) {
  page.innerHTML = `<article class="case"><h1>Lost in the forest</h1><p>That project doesn't exist.</p><a class="go" href="/">← Back to the descent</a></article>`;
} else {
  document.title = `${p.title} · Srivathsa Honyal`;
  const zone = zones.find((z) => z.id === p.zone)!;
  const others = projects.filter((o) => o.zone === p.zone && o.id !== p.id);
  page.innerHTML = `
    <a class="back" href="/#${p.zone}">← Back to ${esc(zone.title)}</a>
    <article class="case">
      <p class="meta">${esc(zone.title)} · ${esc(p.kind)} · ${esc(p.year)}</p>
      <h1>${esc(p.title)}</h1>
      <p class="lead">${esc(p.summary)}</p>
      <p class="stack">${p.stack.split(' · ').map((s) => `<span>${esc(s)}</span>`).join('')}</p>
      <h2>The problem</h2>
      <p>${esc(p.problem)}</p>
      <h2>What I did <small>${esc(p.role)}</small></h2>
      <ul>${p.process.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <div class="demo-host"></div>
      ${p.images.filter((i) => i.src).map((i) => `<figure><img src="${i.src}" alt="${esc(i.alt)}" /><figcaption>${esc(i.caption)}</figcaption></figure>`).join('')}
      <h2>Outcome</h2>
      <p class="outcome">${esc(p.outcome)}</p>
      ${p.link ? `<a class="go" href="${p.link.href}" target="_blank" rel="noopener">${esc(p.link.label)} →</a>` : ''}
    </article>
    ${others.length ? `<nav class="more"><p class="meta">More in ${esc(zone.title)}</p>${others.map((o) => `<a href="/project.html?id=${o.id}">${esc(o.title)} →</a>`).join('')}</nav>` : ''}`;
  const host = page.querySelector<HTMLElement>('.demo-host')!;
  DEMOS[p.id]?.(host);
}

// a gentle parallax: the near trees drift a little faster than the far forest
const far = document.querySelector<HTMLImageElement>('.far')!, near = document.querySelector<HTMLImageElement>('.near')!;
// phones get the half-size painting
if (Math.min(innerWidth, innerHeight) * Math.min(2, devicePixelRatio || 1) < 1100) for (const im of [far, near]) im.src = im.src.replace('.webp', '-m.webp');
addEventListener('scroll', () => {
  const k = scrollY / Math.max(1, document.body.scrollHeight - innerHeight);
  far.style.transform = `translate3d(0, ${-k * 8}%, 0)`;
  near.style.transform = `translate3d(0, ${-k * 16}%, 0)`;
}, { passive: true });

// the slime (in its forest form) and the wisps live here too
const slime = createSlime();
const wisps = createWisps((x) => slime.annoy(x));
const FOREST = 6;
let last = performance.now(), lastY = scrollY;
function tick(now: number) {
  const t = now / 1000, dt = Math.min(0.05, (now - last) / 1000);
  wisps.update(t, dt, slime.head());
  slime.update({ t, dt, vel: scrollY - lastY, zone: FOREST, ambient: null });
  last = now; lastY = scrollY;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
