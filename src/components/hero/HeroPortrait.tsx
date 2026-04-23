'use client';

import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const ACCENT = '#ff5a36';

const configurePortraitTexture = (tex: THREE.Texture | THREE.Texture[]): void => {
  const t = Array.isArray(tex) ? tex[0] : tex;
  if (!t) return;
  t.colorSpace = THREE.SRGBColorSpace;
  t.premultiplyAlpha = true;
  t.needsUpdate = true;
};

// Radial "ring glow" around the portrait edges. Flat-plane fresnel doesn't
// produce visible rim light (all normals face +Z), so we fake it with a soft
// ring painted onto a slightly larger plane placed just behind the portrait.
const rimVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const rimFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPulse;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c) * 2.0;
    // Soft ring peaking near the edge; smoothstep both inside and outside.
    float ring = smoothstep(0.55, 0.85, d) * smoothstep(1.05, 0.85, d);
    float alpha = ring * uIntensity * (0.85 + 0.15 * uPulse);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const buildRimUniforms = () => ({
  uColor: { value: new THREE.Color(ACCENT) },
  uIntensity: { value: 0.55 },
  uPulse: { value: 0 },
});

function PortraitPlane({ isHover }: { isHover: boolean }) {
  const texture = useTexture('/images/frontal_portrait.webp', configurePortraitTexture);
  const meshRef = useRef<THREE.Mesh>(null);
  const focusRef = useRef<THREE.Group>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const frameRef = useRef<THREE.LineSegments>(null);
  const cornersRef = useRef<THREE.Group>(null);

  const rimMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const rimUniforms = useMemo(() => buildRimUniforms(), []);

  const { width, height } = useMemo(() => {
    const img = texture.image as HTMLImageElement | undefined;
    if (!img) return { width: 4.5, height: 6.0 };
    const aspect = img.width / img.height;
    const targetHeight = 5.6;
    return { width: targetHeight * aspect, height: targetHeight };
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
      // Always-on baseline so mobile (no hover) still gets the frame language.
      const targetOpacity = isHover ? 0.55 : 0.22;
      corners.traverse((child) => {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
        if (material) {
          material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.08);
        }
      });
    }

    const t = clock.getElapsedTime();

    const scan = scanRef.current;
    if (scan) {
      const range = height * 0.55;
      scan.position.y = (t * 0.6) % (range * 2) - range;
      const scanMaterial = scan.material as THREE.MeshBasicMaterial;
      scanMaterial.opacity = (isHover ? 0.48 : 0.32) + Math.sin(t * 3.0) * 0.05;
    }

    const frame = frameRef.current;
    if (frame) {
      const frameMaterial = frame.material as THREE.LineBasicMaterial;
      frameMaterial.opacity = 0.42 + Math.sin(t * 1.2) * 0.08;
    }

    // Rim light: subtle breathing plus a brighter push on hover.
    const rim = rimMaterialRef.current;
    if (rim) {
      rim.uniforms.uPulse.value = 0.5 + 0.5 * Math.sin(t * 0.9);
      const targetIntensity = isHover ? 0.85 : 0.55;
      rim.uniforms.uIntensity.value = THREE.MathUtils.lerp(
        rim.uniforms.uIntensity.value as number,
        targetIntensity,
        0.08,
      );
    }
  });

  const yOffset = -height * 0.06;

  return (
    <group position={[0, yOffset, 0]}>
      {/* Rim glow behind the portrait — simulates edge/fresnel lighting on a flat plane. */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[width * 1.18, height * 1.1]} />
        <shaderMaterial
          ref={rimMaterialRef}
          attach="material"
          uniforms={rimUniforms}
          vertexShader={rimVertexShader}
          fragmentShader={rimFragmentShader}
          transparent
          depthWrite={false}
        />
      </mesh>

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
          <lineBasicMaterial color={ACCENT} transparent opacity={0.42} linewidth={1} />
        </lineSegments>

        {/* Scanning line */}
        <mesh ref={scanRef} position={[0, -height * 0.5, 0.06]}>
          <planeGeometry args={[width * 0.92, height * 0.01]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.32} />
        </mesh>
      </group>

      {/* Corner brackets — always faintly visible so mobile (no hover) gets them too. */}
      <group ref={cornersRef} position={[0, 0, 0.08]}>
        <mesh position={[-width * 0.48, height * 0.48, 0]}>
          <planeGeometry args={[width * 0.18, height * 0.01]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.22} />
        </mesh>
        <mesh position={[-width * 0.48, height * 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[height * 0.18, width * 0.01]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.22} />
        </mesh>

        <mesh position={[width * 0.48, -height * 0.48, 0]}>
          <planeGeometry args={[width * 0.18, height * 0.01]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.22} />
        </mesh>
        <mesh position={[width * 0.48, -height * 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[height * 0.18, width * 0.01]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.22} />
        </mesh>
      </group>

      {/* Soft far halo for presence. */}
      <mesh position={[0, -0.1, -0.4]}>
        <planeGeometry args={[width * 1.1, height * 1.08]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.1} />
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
        </div>
      </motion.div>
    </div>
  );
}
