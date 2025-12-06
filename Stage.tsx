import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, Stars, Sparkles, MeshReflectorMaterial, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Needles, PhotoCubes, Ornaments, Topper } from './MagicParticles';
import { TreeMorphState } from '../types';

interface StageProps {
  treeState: TreeMorphState;
  generatedTextures: string[];
  paused: boolean;
}

export const Stage: React.FC<StageProps> = ({ treeState, generatedTextures, paused }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Continuous slow rotation of the entire assembly, paused when interacting
  useFrame((state, delta) => {
    if (groupRef.current && !paused) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 30]} fov={35} />
      <OrbitControls 
        enablePan={false} 
        minDistance={15} 
        maxDistance={50} 
        maxPolarAngle={Math.PI / 1.5} 
        autoRotate={treeState === TreeMorphState.SCATTERED && !paused} 
        autoRotateSpeed={0.3}
        enableRotate={true}
      />

      {/* --- Environment & Lighting (Brighter Theme) --- */}
      <color attach="background" args={['#1a0b05']} />
      <fog attach="fog" args={['#1a0b05', 10, 60]} />
      
      {/* High intensity lighting for sparkle */}
      <ambientLight intensity={1.8} color="#8b5a2b" />
      <spotLight 
        position={[15, 25, 10]} 
        angle={0.4} 
        penumbra={1} 
        intensity={20} 
        color="#ffecd1" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={10} color="#ff8c00" />
      <pointLight position={[0, -10, 10]} intensity={8} color="#b8860b" />
      <directionalLight position={[0, 10, 5]} intensity={5} color="#ffffff" />

      <Environment preset="city" background={false} blur={0.8} />

      {/* --- Objects --- */}
      <group ref={groupRef} position={[0, 1, 0]}>
        <Needles state={treeState} paused={paused} />
        <PhotoCubes state={treeState} textures={generatedTextures} paused={paused} />
        <Ornaments state={treeState} textures={generatedTextures} paused={paused} />
        <Topper state={treeState} />
      </group>

      {/* Reflective Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]}>
        <planeGeometry args={[100, 100]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#100502"
          metalness={0.5}
          mirror={0.5}
        />
      </mesh>

      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
      <Sparkles 
        count={400} 
        scale={25} 
        size={4} 
        speed={0.2} 
        opacity={0.8} 
        color="#FFD700"
      />

      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.4}
        />
        <Noise opacity={0.04} />
        <Vignette eskil={false} offset={0.2} darkness={0.9} />
      </EffectComposer>
    </>
  );
};