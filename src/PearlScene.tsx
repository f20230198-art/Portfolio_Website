import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { chapters, connections, itemById, pearlPresentation, type Chapter } from './data';

type Props = {
  progress: { value: number };
  chapter: Chapter;
  selected: string | null;
  reduced: boolean;
  onSelect: (id: string) => void;
  onReady: () => void;
};

const worldPositions = Object.fromEntries(Object.entries(pearlPresentation).map(([id, p]) => [id, new THREE.Vector3(...p.position)]));
const pearlIds = Object.keys(pearlPresentation);
const temp = new THREE.Vector3();
const yAxis = new THREE.Vector3(0, 1, 0);
const litColor = new THREE.Color('#f0e4cc');
const dimColor = new THREE.Color('#4e5f7d');
const mobilePositions: Record<string, [number, number, number]> = {
  identity: [0, 0, 0], 'weights-arent-enough': [-1.45, 2.5, .35], propnet: [1.45, 2.5, -.6],
  'ai-security-research': [-2.65, .65, -.5], sentinelx: [2.65, .65, .05],
  'gdg-leadership': [-2.5, -1.65, -.7], 'doom-engine': [2.5, -1.65, -.75],
  'offensive-security': [-1.25, -3.25, .4], cyberscan: [1.25, -3.25, .3],
};
const positionFor = (id: string, mobile: boolean) => mobile ? mobilePositions[id] : pearlPresentation[id].position;

function Pearl({ id, selected, active, reduced, onSelect }: { id: string; selected: string | null; active: boolean; reduced: boolean; onSelect: (id: string) => void }) {
  const spec = pearlPresentation[id];
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const interior = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const opening = useMemo(() => ({ value: 0 }), []);
  const axis = useMemo(() => ({ value: new THREE.Vector3(0, 0, 1) }), []);
  const idx = pearlIds.indexOf(id);
  const { camera, invalidate, size } = useThree();
  const position = positionFor(id, size.width < 760);
  const chosen = selected === id;

  useEffect(() => {
    const tween = gsap.to(opening, { value: chosen ? 1 : 0, duration: reduced ? 0 : .45, delay: chosen && !reduced ? .62 : 0, ease: 'power2.inOut', onUpdate: invalidate });
    return () => { tween.kill(); };
  }, [chosen, reduced, opening, invalidate]);

  useFrame(({ clock }, delta) => {
    const p = worldPositions[id];
    const t = clock.elapsedTime;
    // Two offset sine waves read as organic float rather than a metronome.
    const drift = reduced || selected ? 0
      : Math.sin(t * Math.PI * 2 / (24 + idx * .4) + idx * .8) * .055
      + Math.sin(t * Math.PI * 2 / (9.5 + idx * .23) + idx * 2.1) * .022;
    const sway = reduced || selected ? 0 : Math.cos(t * Math.PI * 2 / (17 + idx * .5) + idx * 1.4) * .03;
    p.set(position[0] + sway, position[1] + drift, position[2]);
    if (group.current) {
      group.current.position.copy(p);
      // Hover lifts the pearl toward the viewer and swells it slightly.
      const goal = chosen ? 1 : hovered && !selected ? 1.085 : 1;
      const k = reduced ? 1 : 1 - Math.pow(.0016, delta);
      group.current.scale.lerp(temp.set(goal, goal, goal), k);
      if (!reduced && !selected) group.current.rotation.y += delta * (hovered ? .16 : .045);
    }
    // The opening must be carved along the viewer's actual line of sight to the
    // pearl's true centre. Using the drifting position (p) or the raw camera
    // position pushed the hole off-centre, so it read like an egg yolk.
    if (chosen) {
      axis.value.set(position[0], position[1], position[2]).sub(camera.position).normalize().negate();
      // Ease the idle spin back to zero: the shader compares against local-space
      // vertices, so a leftover rotation would skew the opening off-centre.
      if (group.current) group.current.rotation.y += (0 - group.current.rotation.y) * (reduced ? 1 : .12);
    } else {
      axis.value.copy(camera.position).sub(p).normalize();
    }
    // Counter-rotate the axis into the mesh's local frame so the hole stays put.
    if (group.current && group.current.rotation.y) axis.value.applyAxisAngle(yAxis, -group.current.rotation.y);
    if (interior.current) interior.current.visible = opening.value > .001;
    if (material.current) {
      const bright = chosen || (!selected && (active || hovered));
      material.current.color.lerp(bright ? litColor : dimColor, reduced ? 1 : .07);
      const targetEmissive = hovered && !selected ? .26 : active && !selected ? .05 : .015;
      material.current.emissiveIntensity += (targetEmissive - material.current.emissiveIntensity) * (reduced ? 1 : .12);
      material.current.clearcoat = hovered && !selected ? .92 : .65;
    }
    if (hovered && !reduced) invalidate();
  });

  return (
    <group ref={group} position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); if (!selected) onSelect(id); }}
        onPointerOver={(e) => { e.stopPropagation(); if (!selected) { setHovered(true); document.body.style.cursor = 'pointer'; invalidate(); } }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; invalidate(); }}
      >
        <sphereGeometry args={[spec.radius, 64, 48]} />
        <meshPhysicalMaterial ref={material} color="#e5e5dd" metalness={.13} roughness={.27} clearcoat={.65} clearcoatRoughness={.22} iridescence={.34} iridescenceIOR={1.32} iridescenceThicknessRange={[130, 420]} envMapIntensity={1.4} emissive="#e8a33d"
          onBeforeCompile={(shader) => {
            shader.uniforms.pearlOpen = opening;
            shader.uniforms.pearlAxis = axis;
            shader.vertexShader = 'varying vec3 pearlPosition;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\npearlPosition = position;');
            shader.fragmentShader = 'uniform float pearlOpen;\nuniform vec3 pearlAxis;\nvarying vec3 pearlPosition;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (pearlOpen > 0.001 && dot(normalize(pearlPosition), pearlAxis) > mix(1.001, 0.72, pearlOpen)) discard;');
          }}
        />
      </mesh>
      <mesh ref={interior} visible={false}>
        <sphereGeometry args={[spec.radius * .98, 48, 32]} />
        <meshStandardMaterial color="#101b31" emissive="#14243f" emissiveIntensity={.5} roughness={.8} metalness={.1} side={THREE.BackSide} />
      </mesh>
      {!selected && (active || id === 'identity') && (
        <Html position={[0, -spec.radius - .16, .1]} center zIndexRange={[15, 5]}>
          <button className={`pearl-label ${hovered ? 'is-hovered' : ''} ${id === 'identity' ? 'core-label' : ''}`} onClick={() => onSelect(id)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)} aria-label={`Explore ${id === 'identity' ? 'Srivathsa H. Honyal' : itemById[id].name}`}>
            <span>{id === 'identity' ? 'SRIVATHSA' : itemById[id].shortName}<i aria-hidden="true">↗</i></span>
            <small>{id === 'identity' ? 'THE HUMAN AT THE CENTRE' : id === 'weights-arent-enough' ? 'FIRST AUTHOR · UNDER REVIEW' : id === 'ai-security-research' ? 'ADVERSARIAL ML' : `${spec.proof} ${id === 'propnet' ? '± 0.004 ROC-AUC' : id === 'sentinelx' ? 'POSTS' : id === 'offensive-security' ? '/ 30+ TEAMS' : id === 'gdg-leadership' ? 'ATTENDEES' : ''}`}</small>
          </button>
        </Html>
      )}
    </group>
  );
}

function ConnectionLines({ selected, chapter, reduced }: { selected: string | null; chapter: Chapter; reduced: boolean }) {
  const active = chapters.find((c) => c.id === chapter)!.members;
  const group = useRef<THREE.Group>(null);
  const attackStarted = useRef(0);
  useEffect(() => { attackStarted.current = performance.now(); }, [selected]);
  const lines = useMemo(() => connections.map(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(33 * 3), 3));
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#8c9ebb', transparent: true, opacity: .22 }));
  }), []);
  useEffect(() => () => lines.forEach((line) => { line.geometry.dispose(); (line.material as THREE.Material).dispose(); }), [lines]);
  useFrame(() => {
    lines.forEach((line, i) => {
      const edge = connections[i];
      const a = worldPositions[edge.from];
      const b = worldPositions[edge.to];
      const length = a.distanceTo(b);
      const fromT = Math.min(.45, (pearlPresentation[edge.from].radius + .03) / length);
      const toT = 1 - Math.min(.45, (pearlPresentation[edge.to].radius + .03) / length);
      const arr = line.geometry.attributes.position.array as Float32Array;
      for (let j = 0; j <= 32; j++) {
        const t = THREE.MathUtils.lerp(fromT, toT, j / 32);
        arr[j * 3] = THREE.MathUtils.lerp(a.x, b.x, t);
        arr[j * 3 + 1] = THREE.MathUtils.lerp(a.y, b.y, t) + Math.sin(t * Math.PI) * .12;
        arr[j * 3 + 2] = THREE.MathUtils.lerp(a.z, b.z, t) - Math.sin(t * Math.PI) * .35;
      }
      line.geometry.attributes.position.needsUpdate = true;
      const attack = selected === 'weights-arent-enough' && edge.id === 'adaptive-attack';
      const material = line.material as THREE.LineBasicMaterial;
      const related = active.includes(edge.from) || active.includes(edge.to);
      material.color.set(attack ? '#e0836b' : related ? '#c2955f' : '#7286a8');
      // A slow travelling pulse per edge keeps the lattice alive between interactions.
      const pulse = reduced || selected ? 0 : Math.sin(performance.now() / 1000 * 1.1 + i * .9) * .5 + .5;
      const base = selected ? attack ? .8 : .08 : related ? .3 + pulse * .17 : .1 + pulse * .05;
      material.opacity += (base - material.opacity) * (reduced ? 1 : .1);
      line.geometry.setDrawRange(0, attack && !reduced ? Math.min(33, Math.ceil((performance.now() - attackStarted.current) / 850 * 33)) : 33);
    });
  });
  return <group ref={group}>{lines.map((line, i) => <primitive key={i} object={line} />)}</group>;
}

function CameraRig({ progress, selected, reduced }: Pick<Props, 'progress' | 'selected' | 'reduced'>) {
  const { camera, size, invalidate } = useThree();
  const target = useRef(new THREE.Vector3());
  const saved = useRef({ position: new THREE.Vector3(), target: new THREE.Vector3() });
  const transitioning = useRef(false);
  const wasSelected = useRef<string | null>(null);
  const mobile = size.width < 760;

  useEffect(() => {
    if (!reduced) return;
    const onScroll = () => invalidate();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduced, invalidate]);

  useEffect(() => {
    const previous = wasSelected.current;
    wasSelected.current = selected;
    const timeline = gsap.timeline({ onUpdate: () => { camera.lookAt(target.current); invalidate(); }, onComplete: () => { transitioning.current = false; } });
    if (selected) {
      if (!previous) { saved.current.position.copy(camera.position); saved.current.target.copy(target.current); }
      transitioning.current = true;
      const spec = pearlPresentation[selected];
      const centre = new THREE.Vector3(...positionFor(selected, mobile));
      const angle = mobile ? .14 : .35;
      const aspect = size.width / size.height;
      const distance = spec.radius * (mobile ? 2.15 / Math.min(aspect, .8) : 3.0);
      // Level with the pearl's centre: any vertical offset makes the opening sit low in frame.
      const destination = centre.clone().add(new THREE.Vector3(Math.sin(angle) * distance, 0, Math.cos(angle) * distance));
      timeline.to(camera.position, { x: destination.x, y: destination.y, z: destination.z, duration: reduced ? 0 : 1, ease: 'power3.inOut' }, 0);
      timeline.to(target.current, { x: centre.x, y: centre.y, z: centre.z, duration: reduced ? 0 : 1, ease: 'power3.inOut' }, 0);
    } else if (previous) {
      transitioning.current = true;
      timeline.to(camera.position, { ...saved.current.position, duration: reduced ? 0 : 1, ease: 'power3.inOut' }, 0);
      timeline.to(target.current, { ...saved.current.target, duration: reduced ? 0 : 1, ease: 'power3.inOut' }, 0);
    }
    return () => { timeline.kill(); };
  }, [selected, camera, mobile, size.width, size.height, reduced, invalidate]);

  useFrame((state, delta) => {
    if (selected || transitioning.current) return;
    // Five poses: four chapters, then a final pull-back so the section
    // hands off to the next one instead of cutting at maximum zoom.
    const poses = mobile ? [
      { x: 0, y: 1.1, z: 24, tx: 0, ty: 1.1 },
      { x: -.5, y: 3.2, z: 21, tx: -.5, ty: 3.2 },
      { x: 1.6, y: .8, z: 21, tx: 1.6, ty: .8 },
      { x: -1.8, y: -.7, z: 17, tx: -1.8, ty: -.7 },
      { x: 0, y: .2, z: 30, tx: 0, ty: .1 },
    ] : [
      { x: -.8, y: .15, z: 11.4, tx: -.8, ty: -.15 },
      { x: -1.45, y: 2.65, z: 8.4, tx: -1.5, ty: 1.05 },
      { x: 3.7, y: 1.15, z: 8.6, tx: 1.5, ty: -.55 },
      { x: -3.0, y: -.3, z: 7.6, tx: -2.9, ty: -1.55 },
      { x: -.4, y: .35, z: 15.6, tx: -.3, ty: -.1 },
    ];
    const p = Math.min(4, Math.max(0, progress.value));
    const i = Math.min(3, Math.floor(p));
    const t = reduced ? (p - i > .5 ? 1 : 0) : THREE.MathUtils.smoothstep(p - i, 0, 1);
    const a = poses[i]; const b = poses[i + 1];
    // Pointer parallax: strong enough to feel, soft enough not to fight the scroll.
    const pointer = mobile || reduced ? 0 : .62;
    const damping = reduced ? 1 : 1 - Math.exp(-delta * 9);
    temp.set(THREE.MathUtils.lerp(a.x, b.x, t) + state.pointer.x * pointer, THREE.MathUtils.lerp(a.y, b.y, t) + state.pointer.y * pointer * .6, THREE.MathUtils.lerp(a.z, b.z, t));
    camera.position.lerp(temp, damping);
    // Counter-shifting the look-at target deepens the parallax between near and far pearls.
    temp.set(THREE.MathUtils.lerp(a.tx, b.tx, t) - state.pointer.x * pointer * .22, THREE.MathUtils.lerp(a.ty, b.ty, t) - state.pointer.y * pointer * .14, 0);
    target.current.lerp(temp, damping);
    camera.lookAt(target.current);
  });
  return null;
}

function World(props: Props) {
  const active = chapters.find((c) => c.id === props.chapter)!.members;
  useEffect(() => { props.onReady(); }, [props.onReady]);
  return <>
    <ambientLight intensity={.34} color="#8fa0c4" />
    <directionalLight position={[-4, 6, 6]} intensity={2.35} color="#ffd9a0" />
    <directionalLight position={[5, 1, -3]} intensity={1.75} color="#5f82d0" />
    <Environment resolution={128} frames={1}>
      <Lightformer intensity={3.8} position={[-3, 5, 5]} scale={[8, 3, 1]} rotation={[0, 0, -.35]} color="#ffdda8" />
      <Lightformer intensity={2.15} position={[6, 0, 3]} scale={[2, 7, 1]} rotation={[0, -.7, 0]} color="#8ea6e0" />
      <Lightformer intensity={.85} position={[0, -4, -2]} scale={[6, 3, 1]} color="#d98f52" />
    </Environment>
    <ConnectionLines selected={props.selected} chapter={props.chapter} reduced={props.reduced} />
    {pearlIds.map((id) => <Pearl key={id} id={id} selected={props.selected} active={active.includes(id)} reduced={props.reduced} onSelect={props.onSelect} />)}
    <CameraRig progress={props.progress} selected={props.selected} reduced={props.reduced} />
  </>;
}

export default function PearlScene(props: Props) {
  const [hidden, setHidden] = useState(document.hidden);
  const [visible, setVisible] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div className="scene-mount" ref={container}><Canvas className="pearl-canvas" dpr={[1, window.innerWidth < 760 ? 1.25 : 1.6]} camera={{ fov: 40, near: .05, far: 60, position: [0, 0, 12] }} frameloop={hidden || !visible ? 'never' : props.reduced ? 'demand' : 'always'} gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}>
    <Suspense fallback={null}><World {...props} /></Suspense>
  </Canvas></div>;
}
