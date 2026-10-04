/**
 * The words on the descent, kept light: a heading per zone and the project
 * titles, each one a door to its own page (project.html, set in the forest).
 * The real content lives in src/descent/content.ts.
 */
import { profile, scenes as copy, zones, projectsIn, experience, type ZoneId } from './content';

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** A block of text and where it goes: scene index and rows below that scene's top. */
export type Block = { scene: number; at: number; html: string };

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
      <p class="cue">Scroll to fall <span>↓</span></p>
    </section>`;
}

function zone(id: ZoneId, eyebrow: string) {
  const z = zones.find((z) => z.id === id)!;
  return `
    <section class="block" id="${id}">
      <header class="label"><p class="eyebrow">${esc(eyebrow)}</p><h2 class="type">${esc(z.title)}</h2><p class="lead">${esc(z.body)}</p>
        <ul class="tags">${TAGS[id].map((t) => `<li>${esc(t)}</li>`).join('')}</ul></header>
      <ul class="doors">${projectsIn(id)
        .map((p, i) => `<li class="reveal"><a href="/project.html?id=${p.id}"><i>0${i + 1}</i><b>${esc(p.title)}</b><span>${esc(p.kind.split(' · ')[0])} · ${esc(p.year)}</span></a></li>`)
        .join('')}</ul>
    </section>`;
}

function along() {
  return `
    <section class="block" id="experience">
      <header class="label"><p class="eyebrow">Along the way</p><h2 class="type">Experience</h2></header>
      <ul class="doors plain">${experience.items
        .map((i) => `<li class="reveal"><div><b>${esc(i.what.split(' · ')[0])}</b><span>${esc(i.what.split(' · ')[1] ?? '')} · ${esc(i.when)}</span><span class="line">${esc(i.line)}</span></div></li>`)
        .join('')}</ul>
    </section>`;
}

function about() {
  return `
    <section class="block" id="about">
      <header class="label"><p class="eyebrow">The deep cavern</p><h2 class="type">About me</h2><p class="lead">${esc(copy.destination.body)}</p></header>
    </section>`;
}

function ending() {
  return `
    <section class="block ending" id="contact">
      <header class="label"><p class="eyebrow">End of the fall</p><h2 class="type">Thanks for falling all the way down.</h2>
        <p class="lead">${esc(copy.destination.contactLead)}</p></header>
      <a class="go big reveal" href="mailto:${profile.email}">${esc(profile.email)}</a>
      <nav class="links reveal">${links()}</nav>
      <button class="climb reveal" type="button">Climb back up ↑</button>
    </section>`;
}

export const blocks = (start: number, sceneH: number): Block[] => [
  { scene: 0, at: start + 140, html: hero() },
  { scene: 1, at: 700, html: zone('aisec', 'The valley') },
  { scene: 2, at: 1550, html: zone('ml', 'The hidden pond') },
  { scene: 2, at: Math.round(sceneH * 0.84), html: along() },
  { scene: 3, at: 650, html: zone('cyber', 'The crystal caves') },
  { scene: 4, at: 650, html: about() },
  { scene: 4, at: sceneH - 1150, html: ending() },
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
  gauge.innerHTML = `<ol>${STOPS.map((s) => `<li><a href="${s.href}"><span>${esc(s.name)}</span></a></li>`).join('')}</ol><p class="depth">0 m</p>`;
  document.body.append(bar, gauge);
  const top = document.createElement('a');
  top.id = 'top';
  document.getElementById('track')!.prepend(top);
}

let depthShown = 0;
/** The slime's zone changed: light up the gauge and the header link, and count the depth. */
export function onZone(zone: number) {
  document.querySelectorAll('.gauge li').forEach((li, i) => li.classList.toggle('on', i === zone));
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
