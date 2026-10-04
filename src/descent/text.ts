/**
 * The words on the descent, kept light: a heading per zone and the project
 * titles, each one a door to its own page (project.html, set in the forest).
 * The real content lives in src/descent/content.ts.
 */
import { profile, scenes as copy, zones, projectsIn, experience, type ZoneId } from './content';

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);


const links = () => profile.links.map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');

/** Quick facts under the intro, and what I'm working on right now. */
const FACTS: [string, string][] = [
  ['First author', 'LoRA backdoor audit, being revised'],
  ['1st place', 'ACM BPDC CTF, 19/20 solved'],
  ['Tech Lead', 'GDG: hackathons & CTFs, inter-uni to national'],
  ['8.96', 'CGPA · BITS Pilani Dubai'],
];
const NOW = 'framing innocent models to test dataset-ownership watermarks';
const TAGS: Record<ZoneId, string[]> = {
  aisec: ['Adversarial ML', 'LoRA / PEFT', 'Watermarking', 'Post-quantum crypto'],
  ml: ['PyTorch', 'Graph neural nets', 'Transformers', 'LLM agents'],
  cyber: ['Web app pentesting', 'Threat intel', 'MITRE ATT&CK', 'CTFs'],
};

function hero() {
  return `
    <section class="block hero label">
      <p class="eyebrow">${esc(profile.discipline)}</p>
      <h1>${esc(profile.name)}</h1>
      <p class="lead">${esc(profile.intro)}</p>
      <ul class="chips">${FACTS.map((f) => `<li><b>${esc(f[0])}</b><span>${esc(f[1])}</span></li>`).join('')}</ul>
      <p class="now"><i></i>Now: ${esc(NOW)}</p>
      <nav class="links">${links()}</nav>
    </section>
    <a class="fall" href="#about">Start the fall <span>↓</span></a>`;
}

/* each zone is cut into pieces (its heading, then one block per project) so every screen of the fall has something on it */
function zoneHead(id: ZoneId, eyebrow: string) {
  const z = zones.find((z) => z.id === id)!;
  return `
    <section class="block" id="${id}">
      <header class="label"><p class="eyebrow">${esc(eyebrow)}</p><h2 class="type">${esc(z.title)}</h2><p class="lead">${esc(z.body)}</p>
        <ul class="tags">${TAGS[id].map((t) => `<li>${esc(t)}</li>`).join('')}</ul></header>
    </section>`;
}

const door = (p: ReturnType<typeof projectsIn>[0], i: number) => `
      <li><a href="/project.html?id=${p.id}" data-peek="${p.id}"><i>0${i + 1}</i><b>${esc(p.title)}</b><span class="result">${esc(p.result)}</span><span>${esc(p.kind.split(' · ')[0])} · ${esc(p.year)}</span></a></li>`;

const zoneTitle = (id: ZoneId) => zones.find((z) => z.id === id)!.title;

/** A zone's projects, all on one page. */
const work = (id: ZoneId, place: string) => `
    <section class="block"><p class="eyebrow">${esc(place)} · ${esc(zoneTitle(id))}</p>
      <ul class="doors">${projectsIn(id).map(door).join('')}</ul>
    </section>`;

/** The smaller things built in a zone, linking straight to GitHub. */
function shelf(id: ZoneId) {
  const z = zones.find((z) => z.id === id)!;
  return `
    <section class="block shelf"><p class="eyebrow">Also built · ${esc(z.title)}</p>
      <ul>${z.shelf.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener"><b>${esc(s.title)}</b><span>${esc(s.line)}</span></a></li>`).join('')}</ul>
    </section>`;
}

const along = () => `
    <section class="block" id="experience"><header class="label"><p class="eyebrow">Along the way</p><h2 class="type">Experience</h2></header>
      <ul class="doors plain">${experience.items.map((i) => `
        <li><div><b>${esc(i.what.split(' · ')[0])}</b><span>${esc(i.what.split(' · ')[1] ?? '')} · ${esc(i.when)}</span><span class="line">${esc(i.line)}</span></div></li>`).join('')}</ul>
    </section>`;

function about() {
  return `
    <section class="block" id="about">
      <header class="label"><p class="eyebrow">Who’s falling</p><h2 class="type">About me</h2><p class="lead">${esc(copy.destination.body)}</p></header>
    </section>`;
}

function ending() {
  return `
    <section class="block ending" id="contact">
      <header class="label"><p class="eyebrow">End of the fall</p><h2 class="type">Thanks for falling all the way down.</h2>
        <p class="lead">${esc(copy.destination.contactLead)}</p></header>
      <a class="go big" href="mailto:${profile.email}">${esc(profile.email)}</a>
      <nav class="links">${links()}</nav>
      <button class="climb" type="button">Climb back up ↑</button>
    </section>`;
}

/**
 * The site, page by page. Each page is one screen of text, and rests with the
 * camera's top at row `at` of its scene ('start' and 'end' are the top and the
 * campfire). Scrolling snaps from page to page; the painting glides in between.
 */
export type Page = { scene: number; at: number | 'start' | 'end'; html: string };
export const pages: Page[] = [
  { scene: 0, at: 'start', html: hero() },
  { scene: 0, at: 1500, html: about() },
  { scene: 1, at: 150, html: zoneHead('aisec', 'The valley') },
  { scene: 1, at: 1250, html: work('aisec', 'The valley') },
  { scene: 2, at: 1000, html: zoneHead('ml', 'The hidden pond') },
  { scene: 2, at: 1650, html: work('ml', 'The hidden pond') },
  { scene: 2, at: 2300, html: shelf('ml') },
  { scene: 2, at: 2950, html: along() },
  { scene: 3, at: 700, html: zoneHead('cyber', 'The crystal caves') },
  { scene: 3, at: 1450, html: work('cyber', 'The crystal caves') },
  { scene: 3, at: 2200, html: shelf('cyber') },
  { scene: 4, at: 'end', html: ending() },
];

/** Fade things in as they arrive; headings type themselves out. */
export function revealOnScroll(root: HTMLElement) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target as HTMLElement;
    io.unobserve(el);
    if (el.classList.contains('type')) typeOut(el);
    else el.classList.add('in');
  }), { rootMargin: '0px 0px -10% 0px' });
  root.querySelectorAll('.reveal, .type').forEach((el) => {
    if (el.classList.contains('type')) el.innerHTML = [...(el.textContent ?? '')].map((ch) => `<span class="ch">${ch === ' ' ? ' ' : esc(ch)}</span>`).join('');
    io.observe(el);
  });
  root.querySelector('.climb')?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
}

function typeOut(el: HTMLElement) {
  const chs = [...el.querySelectorAll<HTMLElement>('.ch')];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { chs.forEach((c) => c.classList.add('on')); return; }
  chs.forEach((c, i) => setTimeout(() => c.classList.add('on'), i * 45));
}

export { copy };

/* ---------- site chrome: a header bar and a depth gauge ---------- */
const STOPS = [
  { name: 'Home', href: '#top', depth: 0 },
  { name: 'AI Security', href: '#aisec', depth: 120 },
  { name: 'Machine Learning', href: '#ml', depth: 340 },
  { name: 'Experience', href: '#experience', depth: 410 },
  { name: 'Cybersecurity', href: '#cyber', depth: 620 },
  { name: 'Contact', href: '#contact', depth: 900 },
];

export function chrome() {
  const bar = document.createElement('header');
  bar.className = 'bar';
  bar.innerHTML = `<a class="mark" href="#top">${esc(profile.name)}</a>
    <nav>${STOPS.slice(1).map((s) => `<a href="${s.href}">${esc(s.name)}</a>`).join('')}</nav>`;
  const gauge = document.createElement('aside');
  gauge.className = 'gauge';
  gauge.innerHTML = `<ol>${PAGE_NAMES.map((n, i) => `<li><a href="#" data-page="${i}"><span>${esc(n)}</span></a></li>`).join('')}</ol><p class="depth">0 m</p>`;
  document.body.append(bar, gauge);
  gauge.querySelectorAll<HTMLAnchorElement>('a').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: +a.dataset.page! * (document.getElementById('track')!.offsetHeight / PAGE_NAMES.length), behavior: 'smooth' }); }));
  // the dock: ticks swell gently on a curve around the cursor while it is over the gauge, else around the current page,
  // easing toward their size every frame so it glides
  const items = [...gauge.querySelectorAll<HTMLElement>('li')];
  const now = items.map(() => 1);
  let hoverY: number | null = null, running = false;
  const step = () => {
    let moving = false;
    items.forEach((li, i) => {
      const r = li.getBoundingClientRect();
      const d = hoverY === null ? Math.abs(i - activePage) * 24 : Math.abs(r.top + r.height / 2 - hoverY);
      const want = 1 + 0.5 * Math.exp(-((d / 40) ** 2));
      now[i] += (want - now[i]) * 0.2;
      if (Math.abs(want - now[i]) > 0.002) moving = true;
      li.style.setProperty('--s', now[i].toFixed(3));
    });
    running = moving;
    if (moving) requestAnimationFrame(step);
  };
  const swell = () => { if (!running) { running = true; requestAnimationFrame(step); } };
  gauge.addEventListener('pointermove', (e) => { hoverY = e.clientY; swell(); });
  gauge.addEventListener('pointerleave', () => { hoverY = null; swell(); });
  reswell = swell;
  swell();
  const top = document.createElement('a');
  top.id = 'top';
  document.getElementById('track')!.prepend(top);
}

const PAGE_NAMES = ['Home', 'About me', 'AI Security', 'AI projects', 'Machine Learning', 'ML projects', 'Also built', 'Experience', 'Cybersecurity', 'Cyber projects', 'Also built', 'Contact'];
let activePage = 0, reswell = () => {};
/** The page snapped to changed: light it up on the gauge. */
export function onPage(i: number) {
  activePage = i;
  document.querySelectorAll('.gauge li').forEach((li, j) => li.classList.toggle('on', j === i));
  reswell();
}

let depthShown = 0;
/** The slime's zone changed: light up the gauge and the header link, and count the depth. */
export function onZone(zone: number) {
  document.querySelectorAll('.bar nav a').forEach((a, i) => a.classList.toggle('on', i + 1 === zone));
  const el = document.querySelector('.gauge .depth');
  const to = STOPS[zone].depth, from = depthShown;
  depthShown = to;
  const t0 = performance.now();
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / 600);
    if (el) el.textContent = `${Math.round(from + (to - from) * (1 - (1 - k) ** 3))} m`;
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
