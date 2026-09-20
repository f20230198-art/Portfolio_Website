import { useEffect, useRef, useState } from 'react';

/**
 * Loading sequence for the deferred 3D chunk: scattered points converge
 * into a sphere. Pure 2D canvas so it costs nothing while Three.js downloads.
 * `done` triggers the outward dissolve before the scene takes over.
 */
export default function SceneLoader({ reduced, done, variant = 'scene' }: { reduced: boolean; done: boolean; variant?: 'intro' | 'scene' }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pct, setPct] = useState(0);
  const settled = useRef(0);

  // Progress is synthetic: it eases toward 90% and only completes when the
  // chunk actually lands, so the counter never lies about being finished.
  useEffect(() => {
    if (done) { setPct(100); return; }
    let raf = 0;
    const tick = () => {
      setPct((p) => (p < 90 ? p + (90 - p) * .018 : p));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [done]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      const r = el.getBoundingClientRect();
      el.width = r.width * dpr; el.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener('resize', size);

    const count = reduced ? 90 : 260;
    const radius = Math.min(el.clientWidth, el.clientHeight) * .26;
    // Fibonacci sphere → even distribution, projected to 2D.
    const pts = Array.from({ length: count }, (_, i) => {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * Math.PI * (3 - Math.sqrt(5));
      const angle = Math.random() * Math.PI * 2;
      const far = Math.max(el.clientWidth, el.clientHeight) * (.55 + Math.random() * .5);
      return {
        tx: Math.cos(theta) * r, ty: y, tz: Math.sin(theta) * r,
        sx: Math.cos(angle) * far, sy: Math.sin(angle) * far,
        d: Math.random() * .45,
      };
    });

    let raf = 0;
    const start = performance.now();
    const draw = () => {
      const now = performance.now();
      const t = Math.min(1, (now - start) / 2600);
      settled.current += (t - settled.current) * .08;
      const spin = reduced ? 0 : (now - start) / 1000 * .42;
      const cx = el.clientWidth / 2, cy = el.clientHeight / 2;
      ctx.clearRect(0, 0, el.clientWidth, el.clientHeight);

      for (const p of pts) {
        // Each point eases in on its own delay -> the sphere assembles.
        const local = Math.max(0, Math.min(1, (settled.current - p.d) / (1 - p.d)));
        const e = 1 - Math.pow(1 - local, 3);
        const rx = p.tx * Math.cos(spin) - p.tz * Math.sin(spin);
        const rz = p.tx * Math.sin(spin) + p.tz * Math.cos(spin);
        const depth = (rz + 1) / 2;
        const px = cx + (p.sx * (1 - e) + rx * radius * e);
        const py = cy + (p.sy * (1 - e) + p.ty * radius * e);
        const alpha = (.2 + depth * .8) * e;
        // Warm points on the lit side, cool on the far side.
        ctx.fillStyle = depth > .55
          ? `rgba(232,163,61,${alpha * .95})`
          : `rgba(126,148,187,${alpha * .7})`;
        ctx.beginPath();
        ctx.arc(px, py, (.7 + depth * 1.5) * e, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, [reduced]);

  return (
    <div className={`scene-loader loader-${variant} ${done ? 'is-done' : ''}`} role="status" aria-live="polite">
      <canvas ref={canvas} className="loader-canvas" aria-hidden="true" />
      <div className="loader-readout">
        <span className="loader-pct">{String(Math.round(pct)).padStart(3, '0')}</span>
        <span className="loader-rule"><i style={{ transform: `scaleX(${pct / 100})` }} /></span>
        <span className="loader-caption">Assembling the constellation</span>
      </div>
    </div>
  );
}
