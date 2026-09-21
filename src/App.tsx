import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters, investigations, itemById, links, pearlPresentation, type Chapter, type View } from './data';

gsap.registerPlugin(ScrollTrigger);
const PearlScene = lazy(() => import('./PearlScene'));
import SceneLoader from './SceneLoader';
import Intro, { shouldShowIntro } from './Intro';
type Route = { chapter: Chapter; node: string | null; contact: boolean };
function readRoute(): Route {
  const p = new URLSearchParams(window.location.search);
  const view = p.get('view'); const node = p.get('node');
  if ((view && !['work', 'research', 'systems', 'fieldwork'].includes(view)) || (node && !pearlPresentation[node])) return { chapter: 'identity', node: null, contact: false };
  return { chapter: node ? pearlPresentation[node].chapter : view && view !== 'work' ? view as Chapter : 'identity', node, contact: p.get('panel') === 'contact' && !node };
}
function routeUrl(chapter: Chapter, node: string | null = null, contact = false) {
  const p = new URLSearchParams();
  if (chapter !== 'identity') p.set('view', chapter);
  if (node) p.set('node', node);
  if (contact) p.set('panel', 'contact');
  return `${window.location.pathname}${p.size ? `?${p}` : ''}`;
}
function webGLAvailable() {
  if (new URLSearchParams(location.search).get('renderer') === 'static') return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function Arrow({ diagonal = false }: { diagonal?: boolean }) { return <span aria-hidden="true">{diagonal ? '↗' : '→'}</span>; }

function PearlInterior({ id, reduced, onClose, staticMode }: { id: string; reduced: boolean; onClose: () => void; staticMode: boolean }) {
  const [depth, setDepth] = useState<'overview' | 'evidence'>('overview');
  const [ready, setReady] = useState(reduced || staticMode);
  const dialog = useRef<HTMLDivElement>(null);
  const item = itemById[id]; const p = pearlPresentation[id];
  const title = id === 'identity' ? 'Srivathsa H. Honyal' : item.name;
  useEffect(() => {
    const focus = document.activeElement as HTMLElement;
    const timeout = window.setTimeout(() => { setReady(true); dialog.current?.focus(); }, reduced || staticMode ? 0 : 1000);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && dialog.current) {
        const targets = Array.from(dialog.current.querySelectorAll<HTMLElement>('button, a[href]'));
        const first = targets[0]; const last = targets[targets.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(timeout); document.removeEventListener('keydown', onKey); if (focus?.isConnected) focus.focus({ preventScroll: true }); };
  }, [onClose, reduced, staticMode]);
  return <div className={`interior-layer ${ready ? 'is-ready' : ''} ${staticMode ? 'static-interior' : ''}`}>
    <div ref={dialog} className="pearl-interior" role="dialog" aria-modal="true" aria-labelledby="interior-title" tabIndex={-1}>
      <div className="interior-topline"><span>{id === 'identity' ? 'THE HUMAN / 00' : `${item.category} / ${item.number}`}</span><button className="close-pearl" onClick={onClose} aria-label="Close pearl">×</button></div>
      <div className="interior-copy" key={depth}>
        <h2 id="interior-title">{title}</h2>
        {depth === 'overview' ? <>
          <div className={`proof ${id === 'ai-security-research' ? 'proof-word' : ''}`}>{p.proof}</div>
          <p className="proof-label">{p.proofLabel}</p>
          <p className="pearl-summary">{p.summary}</p>
          {id === 'ai-security-research' && <p className="submission-note">First-author AAAI 2027 submission · under review</p>}
        </> : <dl className="inner-evidence">
          <div><dt>{id === 'identity' ? 'FOCUS' : 'METHOD'}</dt><dd>{id === 'identity' ? 'AI security · adversarial machine learning · cybersecurity · intelligent systems' : item.method}</dd></div>
          <div><dt>{id === 'identity' ? 'EDUCATION' : 'FINDING'}</dt><dd>{id === 'identity' ? 'B.E. Computer Science · BITS Pilani, Dubai · CGPA 8.96 / 10.0' : item.finding}</dd></div>
          <div><dt>{id === 'identity' ? 'PRACTICE' : 'EVIDENCE'}</dt><dd>{id === 'identity' ? 'First-author AAAI 2027 submission, under review. GDG on Campus Tech Lead.' : item.evidence}</dd></div>
          {id === 'weights-arent-enough' && <div className="attack-note"><dt>ATTACK ROUTE</dt><dd>Functional backdoor → detector assumption fails</dd></div>}
        </dl>}
      </div>
      <div className="interior-actions">
        <button onClick={() => setDepth(depth === 'overview' ? 'evidence' : 'overview')}>{depth === 'overview' ? 'Inspect evidence' : 'Back to overview'} <Arrow /></button>
        {depth === 'evidence' && item.evidenceUrl && <a href={item.evidenceUrl} target="_blank" rel="noopener noreferrer">Source <Arrow diagonal /></a>}
      </div>
      <div className="depth-indicator" aria-label={depth === 'overview' ? 'Overview' : 'Evidence'}><i className={depth === 'overview' ? 'active' : ''} /><i className={depth === 'evidence' ? 'active' : ''} /></div>
    </div>
    <button className="return-button" onClick={onClose}>← Return to constellation <kbd>ESC</kbd></button>
  </div>;
}

function StaticMap({ chapter, onSelect }: { chapter: Chapter; onSelect: (id: string) => void }) {
  const entries = chapters.find(c => c.id === chapter)!.members;
  return <div className="static-map" aria-label="Portfolio node index">{entries.map((id) => <button key={id} onClick={() => onSelect(id)}><span className="static-pearl" /><span>{id === 'identity' ? 'Srivathsa H. Honyal' : itemById[id].name}<small>{pearlPresentation[id].proof} · {pearlPresentation[id].proofLabel}</small></span><Arrow diagonal /></button>)}</div>;
}

export default function App() {
  const initial = useRef(readRoute());
  const [chapter, setChapter] = useState<Chapter>('identity');
  const [selected, setSelected] = useState<string | null>(null);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [staticMode, setStaticMode] = useState(() => !webGLAvailable());
  const [sceneReady, setSceneReady] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const progress = useRef({ value: 0 });
  const journey = useRef<HTMLElement>(null);
  const hero = useRef<HTMLElement>(null);
  const pageScroll = useRef(0);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;
  const openedFromSite = useRef(false);
  const currentChapter = chapters.find(c => c.id === chapter)!;

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);

  const scrollChapter = useCallback((id: Chapter, smooth = true) => {
    const index = chapters.findIndex(c => c.id === id);
    const el = journey.current;
    if (!el) return;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.offsetTop + travel * index / 4, behavior: smooth && !reduced ? 'smooth' : 'instant' });
    if (!smooth || reduced) progress.current.value = index;
  }, [reduced]);

  useEffect(() => {
    const context = gsap.context(() => {
      // Progress runs 0->4: four chapter poses plus a closing pull-back.
      // The last stretch of scroll is the retreat, so chapters still map to 0-3.
      gsap.to(progress.current, { value: 4, ease: 'none', scrollTrigger: { trigger: journey.current, start: 'top top', end: 'bottom bottom', scrub: reduced ? true : .6,
        onUpdate: (self) => { setChapter(chapters[Math.min(3, Math.round(self.progress * 4))].id); },
      } });
      if (!reduced) gsap.to('.hero-type', { y: -90, scale: .92, opacity: .08, ease: 'none', scrollTrigger: { trigger: hero.current, start: 'top top', end: 'bottom 15%', scrub: .6 } });
      if (!reduced) gsap.to('.light-field', { xPercent: -5, yPercent: -3, scale: 1.12, ease: 'none', scrollTrigger: { trigger: journey.current, start: 'top bottom', end: 'bottom top', scrub: .6 } });
      // As the camera retreats at the end, dim the scene and lift the copy away
      // so the handoff to the work index reads as one continuous move.
      if (!reduced) gsap.to('.scene-stage', { opacity: .18, ease: 'none', scrollTrigger: { trigger: journey.current, start: 'bottom-=82% bottom', end: 'bottom bottom', scrub: .7 } });
      if (!reduced) gsap.to('.chapter-heading, .scene-bottom', { opacity: 0, y: -26, ease: 'none', scrollTrigger: { trigger: journey.current, start: 'bottom-=88% bottom', end: 'bottom-=40% bottom', scrub: .7 } });
      ScrollTrigger.create({ trigger: '#contact', start: 'top 55%', onEnter: () => setContactVisible(true), onLeaveBack: () => setContactVisible(false) });
      document.querySelectorAll<HTMLElement>('.reveal, .index-list').forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: () => el.classList.add('in') });
      });
    });
    document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => context.revert();
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const hx = gsap.quickTo('.hero-type', 'x', { duration: .9, ease: 'power3' });
    const hy = gsap.quickTo('.hero-type', 'y', { duration: .9, ease: 'power3' });
    const lx = gsap.quickTo('.light-field', 'x', { duration: 1.4, ease: 'power3' });
    const ly = gsap.quickTo('.light-field', 'y', { duration: 1.4, ease: 'power3' });
    const move = (e: PointerEvent) => {
      if (window.scrollY > window.innerHeight) return;
      const nx = e.clientX / window.innerWidth - .5;
      const ny = e.clientY / window.innerHeight - .5;
      hx(nx * 20); hy(ny * 12); lx(nx * -42); ly(ny * -28);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => { window.removeEventListener('pointermove', move); gsap.set('.hero-type, .light-field', { clearProps: 'x,y' }); };
  }, [reduced]);

  const closePearl = useCallback(() => {
    if (openedFromSite.current) { openedFromSite.current = false; window.history.back(); }
    else { setSelected(null); window.history.replaceState(null, '', routeUrl(pearlPresentation[initial.current.node || 'identity']?.chapter || 'identity')); }
  }, []);

  const selectPearl = useCallback((id: string) => {
    document.body.style.cursor = '';
    const el = journey.current;
    if (el && (window.scrollY < el.offsetTop - 10 || window.scrollY > el.offsetTop + el.offsetHeight - window.innerHeight + 10)) scrollChapter(pearlPresentation[id].chapter, false);
    setIndexOpen(false);
    pageScroll.current = window.scrollY;
    window.history.pushState({ pearl: true }, '', routeUrl(pearlPresentation[id].chapter, id));
    openedFromSite.current = true;
    setSelected(id);
  }, [scrollChapter]);

  useEffect(() => {
    if (!selected) return;
    const savedOverflow = document.body.style.overflow;
    const savedPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar) document.body.style.paddingRight = `${scrollbar}px`;
    return () => { document.body.style.overflow = savedOverflow; document.body.style.paddingRight = savedPadding; };
  }, [selected]);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useEffect(() => {
    const apply = () => {
      const route = readRoute();
      const wasOpen = !!selectedRef.current;
      if (route.node) { scrollChapter(route.chapter, false); pageScroll.current = window.scrollY; setSelected(route.node); }
      else {
        setSelected(null);
        if (wasOpen) window.scrollTo({ top: pageScroll.current, behavior: 'instant' });
        else if (route.contact) document.getElementById('contact')?.scrollIntoView();
        else if (new URLSearchParams(window.location.search).has('view')) scrollChapter(route.chapter, false);
        else window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    window.addEventListener('popstate', apply);
    return () => window.removeEventListener('popstate', apply);
  }, [scrollChapter]);

  useEffect(() => {
    const route = initial.current;
    if (!staticMode && !sceneReady) return;
    const timer = window.setTimeout(() => {
      if (route.contact) document.getElementById('contact')?.scrollIntoView();
      else if (route.node || route.chapter !== 'identity') {
        scrollChapter(route.chapter, false); pageScroll.current = window.scrollY;
        if (route.node) window.setTimeout(() => setSelected(route.node), reduced ? 0 : 120);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [staticMode, sceneReady, scrollChapter, reduced]);

  const ready = useCallback(() => setSceneReady(true), []);
  const [loaderGone, setLoaderGone] = useState(false);
  const [showIntro] = useState(shouldShowIntro);
  useEffect(() => {
    if (!showIntro) return;
    document.documentElement.classList.add('intro-locked');
    return () => document.documentElement.classList.remove('intro-locked');
  }, [showIntro]);
  useEffect(() => {
    if (!sceneReady) return;
    const t = window.setTimeout(() => setLoaderGone(true), reduced ? 320 : 900);
    return () => window.clearTimeout(t);
  }, [sceneReady, reduced]);
  const fallback = useCallback(() => setStaticMode(true), []);
  function navigate(view: View | 'contact') {
    setSelected(null); setIndexOpen(false); openedFromSite.current = false;
    document.body.style.overflow = ''; document.body.style.paddingRight = '';
    if (view === 'contact') {
      window.history.pushState(null, '', routeUrl(chapter, null, true));
      document.getElementById('contact')?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' });
    } else {
      const next = view === 'work' ? 'identity' : view;
      window.history.pushState(null, '', routeUrl(next)); scrollChapter(next);
    }
  }

  return <div className={`portfolio ${selected ? 'has-open-pearl' : ''} ${staticMode ? 'is-static' : ''}`}>
    {showIntro && <Intro reduced={reduced} />}
    <a className="skip-link" href="#work-index">Skip to work index</a>
    <div className="atmosphere" aria-hidden="true"><div className="light-field" /><div className="grain" /></div>
    <header className="site-header">
      <a className="monogram" href="/" aria-label="Srivathsa H. Honyal, home" onClick={(e) => { e.preventDefault(); setSelected(null); window.history.pushState(null, '', window.location.pathname); window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' }); }}>sh<span>.</span></a>
      <nav aria-label="Primary navigation">
        {(['work', 'research', 'systems', 'fieldwork'] as View[]).map(view => <a key={view} href={`#${view}`} onClick={e => { e.preventDefault(); navigate(view); }} aria-current={!contactVisible && (view === 'work' ? chapter === 'identity' : chapter === view) ? 'location' : undefined}>{view}</a>)}
        <a href="#contact" onClick={e => { e.preventDefault(); navigate('contact'); }} aria-current={contactVisible ? 'location' : undefined}>Contact <Arrow diagonal /></a>
      </nav>
    </header>
    <main>
      <section ref={hero} className="hero" aria-labelledby="name">
        <div className="hero-eyebrow"><span className="tiny-orbit" /> INDEPENDENT THOUGHT. CONNECTED WORK.</div>
        <div className="hero-type">
          <p className="hero-prelude">Computer Science · BITS Pilani, Dubai</p>
          <h1 id="name"><span>SRIVATHSA</span><span className="name-second">H. HONYAL<span className="name-star" aria-hidden="true">✳</span></span></h1>
          <div className="hero-subline"><p>Security assumptions in<br />machine-learning systems.</p><span>RESEARCH / SYSTEMS / FIELDWORK</span></div>
        </div>
        <div className="hero-bottom"><span>BASED IN DUBAI, UAE</span><a href="#work" onClick={e => { e.preventDefault(); navigate('work'); }}>Scroll to explore <span className="scroll-line" aria-hidden="true">↓</span></a><span>PORTFOLIO / 2026</span></div>
      </section>
      <section ref={journey} className="journey" aria-label="Connected portfolio">
        {chapters.map((c, i) => <div key={c.id} id={c.id === 'identity' ? 'work' : c.id} className="chapter-anchor" style={{ top: `${i * 100 / 5}%` }} />)}
        <div className={`scene-stage ${selected ? 'is-selected' : ''}`}>
          <div className="scene-wash" aria-hidden="true" />
          <div className="chapter-heading" key={chapter} aria-hidden={!!selected}>
            <span className="eyebrow"><i /> {currentChapter.number} / {chapter === 'identity' ? 'THE CONSTELLATION' : chapter.toUpperCase()}</span>
            <h2>{currentChapter.title.split('\n').map((line, i) => <span key={i}>{line}</span>)}</h2>
            <p>{currentChapter.subtitle}</p>
            <span className="interaction-hint">Choose a pearl. Follow a question. <Arrow diagonal /></span>
          </div>
          {!staticMode && <SceneBoundary onError={fallback}><Suspense fallback={null}><PearlScene progress={progress.current} chapter={chapter} selected={selected} reduced={reduced} onSelect={selectPearl} onReady={ready} /></Suspense></SceneBoundary>}
          {!staticMode && !loaderGone && <SceneLoader reduced={reduced} done={sceneReady} />}
          {staticMode && !selected && <StaticMap chapter={chapter} onSelect={selectPearl} />}
          <div className="scene-bottom" aria-hidden={!!selected}>
            <div className="chapter-progress" aria-label="Chapters">{chapters.map(c => <button key={c.id} className={c.id === chapter ? 'active' : ''} onClick={() => navigate(c.id === 'identity' ? 'work' : c.id)} aria-label={`Go to ${c.id}`} aria-current={c.id === chapter ? 'step' : undefined}><span>{c.number}</span><i /></button>)}</div>
            <p><span className="relation-line" /> Shared methods, not software integrations.</p>
            <button className="index-toggle" onClick={() => setIndexOpen(!indexOpen)} aria-expanded={indexOpen}>All work <span>{indexOpen ? '−' : '+'}</span></button>
          </div>
          {indexOpen && !selected && <div className="scene-index"><div className="eyebrow">EIGHT INVESTIGATIONS</div>{investigations.map(item => <button key={item.id} onClick={() => selectPearl(item.id)}><span>{item.number}</span>{item.name}<Arrow diagonal /></button>)}</div>}
          {selected && <PearlInterior key={selected} id={selected} reduced={reduced} onClose={closePearl} staticMode={staticMode} />}
        </div>
      </section>
      <section id="work-index" className="work-index" aria-labelledby="index-heading">
        <div className="index-heading reveal"><span className="eyebrow">A DIRECT WAY IN</span><h2 id="index-heading">Explore the work.</h2></div>
        <div className="index-list">{investigations.map(item => <button key={item.id} className={item.weight ? `is-${item.weight}` : undefined} onClick={() => selectPearl(item.id)}><span className="index-number">{item.number}</span><span>{item.name}<small>{item.system}</small></span><span className="index-proof">{pearlPresentation[item.id].proof}</span><Arrow diagonal /></button>)}</div>
      </section>
      <section id="contact" className="contact" aria-labelledby="contact-title">
        <span className="eyebrow reveal"><i /> THE NEXT CONNECTION</span>
        <h2 className="reveal reveal-d1" id="contact-title">A good question<br />starts something<span>.</span></h2>
        <div className="contact-bottom reveal reveal-d2"><a className="email-link" href={links.email}>shhonyal@gmail.com <Arrow diagonal /></a><div className="contact-links"><a href={links.github} target="_blank" rel="noopener noreferrer">GitHub <Arrow diagonal /></a><a href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <Arrow diagonal /></a></div></div>
      </section>
    </main>
    <footer><span>SRIVATHSA H. HONYAL © 2026</span><div className="view-controls"><button onClick={() => setReduced(!reduced)} aria-pressed={reduced}>{reduced ? 'Motion reduced' : 'Reduce motion'}</button><button onClick={() => { setStaticMode(!staticMode); setSelected(null); }}>{staticMode ? 'Enable 3D' : 'Use simple view'}</button></div><span>BUILT AROUND THE WORK.</span></footer>
  </div>;
}
