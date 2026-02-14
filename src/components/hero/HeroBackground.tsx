'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// Option B Refined: Network/Constellation + Depth
// Adds a secondary layer of "distant" data points for volume.

const Constellation = ({ count = 100, depth = false }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const { size, viewport } = useThree();
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (depth ? 40 : 25); 
      const y = (Math.random() - 0.5) * (depth ? 40 : 25);
      const z = depth ? (Math.random() * -20) - 5 : (Math.random() - 0.5) * 5;
      const speedX = (Math.random() - 0.5) * 0.01;
      const speedY = (Math.random() - 0.5) * 0.01;
      
      temp.push({ x, y, z, speedX, speedY });
    }
    return temp;
  }, [count, depth]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Buffers for line positions
  const linePositions = useMemo(() => new Float32Array(count * count * 3), [count]);

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
    </>
  );
};

export default function HeroBackground() {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
  }, []);

  if (isReducedMotion) return null;

  return (
    <div className="absolute inset-0 -z-10 opacity-70">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }} dpr={[1, 2]} gl={{ alpha: true }}>
        {/* Foreground Layer */}
        <Constellation count={80} depth={false} />
        {/* Background Depth Layer */}
        <Constellation count={150} depth={true} />
      </Canvas>
    </div>
  );
}
