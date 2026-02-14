'use client';

import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

function PortraitPlane({ isHover }: { isHover: boolean }) {
  const texture = useTexture('/images/frontal_portrait.webp');
  const meshRef = useRef<THREE.Mesh>(null);
  const focusRef = useRef<THREE.Group>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const frameRef = useRef<THREE.LineSegments>(null);
  const cornersRef = useRef<THREE.Group>(null);

  const { width, height } = useMemo(() => {
    const img = texture.image as HTMLImageElement | undefined;
    if (!img) return { width: 4.5, height: 6.0 };
    const aspect = img.width / img.height;
    const targetHeight = 5.6;
    return { width: targetHeight * aspect, height: targetHeight };
  }, [texture]);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.premultiplyAlpha = true;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame(({ mouse, clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const focus = focusRef.current;
    const targetScale = isHover ? 1.01 : 1.0;
    mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, targetScale, 0.08));
    mesh.rotation.set(0, 0, 0);

    if (focus) {
      const targetX = mouse.x * (isHover ? 0.25 : 0.12);
      const targetY = mouse.y * (isHover ? 0.18 : 0.08);
      focus.position.x = THREE.MathUtils.lerp(focus.position.x, targetX, 0.08);
      focus.position.y = THREE.MathUtils.lerp(focus.position.y, targetY, 0.08);
      const focusScale = isHover ? 1.03 : 1.0;
      focus.scale.setScalar(THREE.MathUtils.lerp(focus.scale.x, focusScale, 0.08));
    }

    const corners = cornersRef.current;
    if (corners) {
      const targetOpacity = isHover ? 0.45 : 0.0;
      corners.traverse((child) => {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
        if (material) {
          material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.08);
        }
      });
    }

    const scan = scanRef.current;
    if (scan) {
      const t = clock.getElapsedTime();
      const range = height * 0.55;
      scan.position.y = (t * 0.6) % (range * 2) - range;
      const scanMaterial = scan.material as THREE.MeshBasicMaterial;
      scanMaterial.opacity = (isHover ? 0.22 : 0.14) + Math.sin(t * 3.0) * 0.03;
    }

    const frame = frameRef.current;
    if (frame) {
      const frameMaterial = frame.material as THREE.LineBasicMaterial;
      frameMaterial.opacity = 0.25 + Math.sin(clock.getElapsedTime() * 1.2) * 0.06;
    }
  });

  const yOffset = -height * 0.06;

  return (
    <group position={[0, yOffset, 0]}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[width, height, 24, 24]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.06}
          roughness={0.7}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group ref={focusRef} position={[0, 0, 0.04]}>
        {/* Recognition frame */}
        <lineSegments ref={frameRef}>
          <edgesGeometry args={[new THREE.PlaneGeometry(width * 0.96, height * 0.96)]} />
          <lineBasicMaterial color="#ff5a36" transparent opacity={0.22} linewidth={1} />
        </lineSegments>

        {/* Scanning line */}
        <mesh ref={scanRef} position={[0, -height * 0.5, 0.06]}>
          <planeGeometry args={[width * 0.92, height * 0.006]} />
          <meshBasicMaterial color="#ff5a36" transparent opacity={0.16} />
        </mesh>
      </group>

      {/* Corner brackets on hover */}
      <group ref={cornersRef} position={[0, 0, 0.08]}>
        <mesh position={[-width * 0.48, height * 0.48, 0]}>
          <planeGeometry args={[width * 0.16, height * 0.008]} />
          <meshBasicMaterial color="#ff5a36" transparent opacity={0.0} />
        </mesh>
        <mesh position={[-width * 0.48, height * 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[height * 0.16, width * 0.008]} />
          <meshBasicMaterial color="#ff5a36" transparent opacity={0.0} />
        </mesh>

        <mesh position={[width * 0.48, -height * 0.48, 0]}>
          <planeGeometry args={[width * 0.16, height * 0.008]} />
          <meshBasicMaterial color="#ff5a36" transparent opacity={0.0} />
        </mesh>
        <mesh position={[width * 0.48, -height * 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[height * 0.16, width * 0.008]} />
          <meshBasicMaterial color="#ff5a36" transparent opacity={0.0} />
        </mesh>
      </group>

      {/* Soft halo for presence without adding a visible background */}
      <mesh position={[0, -0.1, -0.4]}>
        <planeGeometry args={[width * 1.02, height * 1.02]} />
        <meshBasicMaterial color="#ff5a36" transparent opacity={0.04} />
      </mesh>
    </group>
  );
}

export default function HeroPortrait() {
  const [isHover, setIsHover] = useState(false);

  return (
    <div className="relative h-full w-full flex items-end justify-center md:justify-end select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[520px] md:max-w-[560px] md:ml-auto bottom-0 origin-bottom"
      >
        <div
          className="relative h-[62vh] md:h-[72vh] w-full"
          style={{
            WebkitMaskImage:
              'radial-gradient(140% 140% at 50% 30%, #000 72%, transparent 100%)',
            maskImage:
              'radial-gradient(140% 140% at 50% 30%, #000 72%, transparent 100%)',
          }}
          onPointerEnter={() => setIsHover(true)}
          onPointerLeave={() => setIsHover(false)}
        >
          <Canvas
            className="h-full w-full bg-transparent"
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true }}
            camera={{ position: [0, 0.25, 9.6], fov: 30 }}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 6, 4]} intensity={1.1} />
            <directionalLight position={[-4, -2, 3]} intensity={0.6} />
            <Suspense fallback={null}>
              <PortraitPlane isHover={isHover} />
            </Suspense>
          </Canvas>

          {/* HUD labels (kept inside the portrait bounds) */}
          <div className="pointer-events-none absolute inset-[8%] hidden md:block text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            <div className="absolute left-0 top-0">subject: joel_perca</div>
            <div className="absolute left-0 top-4">timestamp: 2026-02-14 10:24:18</div>
            <div className="absolute right-0 bottom-0">match: 99.2%</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
