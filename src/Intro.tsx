import { useEffect, useState } from 'react';
import SceneLoader from './SceneLoader';

const HOLD = 1800;   // minimum on-screen time, so the sequence is always seen
const FADE = 800;    // must match the CSS transition on .loader-intro

/**
 * Full-screen opening sequence. Shows on first visit only (sessionStorage)
 * keeps it from replaying on every internal navigation or refresh.
 */
export default function Intro({ reduced }: { reduced: boolean }) {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const hold = reduced ? 450 : HOLD;
    const a = window.setTimeout(() => setDone(true), hold);
    const b = window.setTimeout(() => {
      setGone(true);
      try { sessionStorage.setItem('intro-seen', '1'); } catch { /* private mode */ }
      document.documentElement.classList.remove('intro-locked');
    }, hold + (reduced ? 200 : FADE));
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [reduced]);

  if (gone) return null;
  return <SceneLoader reduced={reduced} done={done} variant="intro" />;
}

export function shouldShowIntro() {
  try { return sessionStorage.getItem('intro-seen') !== '1'; } catch { return true; }
}
