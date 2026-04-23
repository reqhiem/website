'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useSyncExternalStore } from 'react';
import * as THREE from 'three';

// Option B Refined: Network/Constellation + Depth
// Adds a secondary layer of "distant" data points for volume.

type Particle = { x: number; y: number; z: number; speedX: number; speedY: number };

// Deterministic PRNG so particle initialization is pure (no Math.random in render).
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// 16 anchor points distributed around the perimeter of a unit rectangle
// [-1,1] × [-1,1]. Mapped to world space at runtime based on the viewport
// so they frame the portrait column regardless of screen size.
const PORTRAIT_ANCHOR_UNITS: Array<[number, number]> = (() => {
  const pts: Array<[number, number]> = [];
  const perSide = 5;
  for (let i = 0; i < perSide; i++) {
    const t = -1 + (i * 2) / (perSide - 1);
    pts.push([t, 1]);
    pts.push([t, -1]);
  }
  for (let i = 1; i < perSide - 1; i++) {
    const t = -1 + (i * 2) / (perSide - 1);
    pts.push([-1, t]);
    pts.push([1, t]);
  }
  return pts;
})();

const Constellation = ({
  count = 100,
  depth = false,
  portraitLinks = false,
}: {
  count?: number;
  depth?: boolean;
  portraitLinks?: boolean;
}) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const anchorLinesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const { viewport, size } = useThree();

  const particles = useMemo<Particle[]>(() => {
    const temp: Particle[] = [];
    const seedOffset = depth ? 10_000 : 0;
    for (let i = 0; i < count; i++) {
      const base = (i + 1) * 7 + seedOffset;
      const x = (seededRandom(base) - 0.5) * (depth ? 40 : 25);
      const y = (seededRandom(base + 1) - 0.5) * (depth ? 40 : 25);
      const z = depth
        ? seededRandom(base + 2) * -20 - 5
        : (seededRandom(base + 2) - 0.5) * 5;
      const speedX = (seededRandom(base + 3) - 0.5) * 0.01;
      const speedY = (seededRandom(base + 4) - 0.5) * 0.01;

      temp.push({ x, y, z, speedX, speedY });
    }
    return temp;
  }, [count, depth]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Buffers for line positions
  const linePositions = useMemo(() => new Float32Array(count * count * 3), [count]);
  // Allocated inside useFrame on first tick — the immutability lint rule
  // forbids mutating `useMemo` results via indexed assignment.
  const anchorLinePositionsRef = useRef<Float32Array | null>(null);

  const mouseRef = useRef({ x: 0, y: 0 }); 

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    if (!depth) { // Only track mouse for the foreground layer to save perf
        window.addEventListener('mousemove', handleMouseMove);
    }
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [depth]);

  useFrame((state) => {
    const currentMesh = mesh.current;
    if (!currentMesh) return;

    let lineIndex = 0;
    const connectDistance = depth ? 4.5 : 3.5;
    
    const mouseX = (mouseRef.current.x * viewport.width) / 2;
    const mouseY = (mouseRef.current.y * viewport.height) / 2;
    const time = state.clock.getElapsedTime();

    particles.forEach((particle, i) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      // Wrap around
      const range = depth ? 20 : 15;
      if (particle.x > range) particle.x = -range;
      if (particle.x < -range) particle.x = range;
      if (particle.y > range) particle.y = -range;
      if (particle.y < -range) particle.y = range;

      if (!depth) {
        const dx = particle.x - mouseX;
        const dy = particle.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 4) {
            particle.x += dx * 0.01; 
            particle.y += dy * 0.01;
        }
      }

      dummy.position.set(particle.x, particle.y, particle.z);
      
      if (depth) {
         // Subtle wave motion for background layer
         dummy.position.y += Math.sin(time * 0.5 + particle.x) * 0.02;
      }

      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      currentMesh.setMatrixAt(i, dummy.matrix);

      // Connections
      // Optimization: Only check a subset or skip connections for background if needed
      // but for 100 points it's fine.
      for (let j = i + 1; j < count; j++) {
        const p2 = particles[j];
        const dx = particle.x - p2.x;
        const dy = particle.y - p2.y;
        const dz = particle.z - p2.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        if (dist < connectDistance) {
          linePositions[lineIndex * 3] = particle.x;
          linePositions[lineIndex * 3 + 1] = particle.y;
          linePositions[lineIndex * 3 + 2] = particle.z;
          
          linePositions[lineIndex * 3 + 3] = p2.x;
          linePositions[lineIndex * 3 + 4] = p2.y;
          linePositions[lineIndex * 3 + 5] = p2.z;

          lineIndex += 2;
        }
      }
    });
    
    currentMesh.instanceMatrix.needsUpdate = true;

    if (linesGeometryRef.current) {
        linesGeometryRef.current.setAttribute(
            'position',
            new THREE.BufferAttribute(linePositions.slice(0, lineIndex * 3), 3)
        );
        linesGeometryRef.current.attributes.position.needsUpdate = true;
    }

    // Portrait-anchor links: draw lines from perimeter anchor points (world
    // space, derived from viewport) to nearby foreground particles, so the
    // background constellation feels like it "reaches toward" the portrait.
    // Skipped on narrow screens where the portrait stacks above the text.
    if (
      portraitLinks &&
      anchorLinesGeometryRef.current &&
      size.width >= 768
    ) {
      let buf = anchorLinePositionsRef.current;
      if (!buf) {
        buf = new Float32Array(PORTRAIT_ANCHOR_UNITS.length * count * 3 * 2);
        anchorLinePositionsRef.current = buf;
      }

      const cx = viewport.width * 0.22;
      const cy = 0;
      const hw = viewport.width * 0.18;
      const hh = viewport.height * 0.36;
      const maxDist = 3.2;
      let anchorLineIdx = 0;

      for (const [ux, uy] of PORTRAIT_ANCHOR_UNITS) {
        const ax = cx + ux * hw;
        const ay = cy + uy * hh;
        for (const p of particles) {
          const dx = ax - p.x;
          const dy = ay - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            buf[anchorLineIdx * 3] = ax;
            buf[anchorLineIdx * 3 + 1] = ay;
            buf[anchorLineIdx * 3 + 2] = 0;
            buf[anchorLineIdx * 3 + 3] = p.x;
            buf[anchorLineIdx * 3 + 4] = p.y;
            buf[anchorLineIdx * 3 + 5] = p.z;
            anchorLineIdx += 2;
          }
        }
      }

      anchorLinesGeometryRef.current.setAttribute(
        'position',
        new THREE.BufferAttribute(buf.slice(0, anchorLineIdx * 3), 3),
      );
      anchorLinesGeometryRef.current.attributes.position.needsUpdate = true;
    } else if (portraitLinks && anchorLinesGeometryRef.current) {
      // Mobile / narrow: clear any stale lines from a prior resize.
      anchorLinesGeometryRef.current.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(0), 3),
      );
    }
  });

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <sphereGeometry args={[depth ? 0.02 : 0.04, 8, 8]} />
        <meshBasicMaterial color="#ff5a36" opacity={depth ? 0.3 : 0.8} transparent /> 
      </instancedMesh>
      
      <lineSegments>
        <bufferGeometry ref={linesGeometryRef} />
        <lineBasicMaterial
            color="#ff5a36"
            transparent
            opacity={depth ? 0.05 : 0.15}
            linewidth={1}
        />
      </lineSegments>

      {portraitLinks ? (
        <lineSegments>
          <bufferGeometry ref={anchorLinesGeometryRef} />
          <lineBasicMaterial
            color="#ff5a36"
            transparent
            opacity={0.28}
            linewidth={1}
          />
        </lineSegments>
      ) : null}
    </>
  );
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const subscribeReducedMotion = (callback: () => void): (() => void) => {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
};

const getReducedMotionSnapshot = (): boolean =>
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

const getReducedMotionServerSnapshot = (): boolean => false;

export default function HeroBackground() {
  const isReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  if (isReducedMotion) return null;

  return (
    <div className="absolute inset-0 -z-10 opacity-70">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }} dpr={[1, 2]} gl={{ alpha: true }}>
        {/* Foreground Layer — also draws links toward the portrait column. */}
        <Constellation count={80} depth={false} portraitLinks />
        {/* Background Depth Layer */}
        <Constellation count={150} depth={true} />
      </Canvas>
    </div>
  );
}
