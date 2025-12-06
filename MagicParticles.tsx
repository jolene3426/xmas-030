import React, { useRef, useMemo, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { TreeMorphState, ParticleData, TreeConfig } from '../types';
import { generateTreeParticles, generateOrnaments, createFacetedStarGeometry } from '../utils/geometry';

interface MagicParticlesProps {
  state: TreeMorphState;
  paused: boolean;
}

interface WithTextures extends MagicParticlesProps {
    textures: string[];
}

const dummy = new THREE.Object3D();
const tempPos = new THREE.Vector3();

// --- 1. Needles (Approx 60% - increased by 15%) ---
export const Needles: React.FC<MagicParticlesProps> = ({ state, paused }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Increased needle count (2500 * 1.15 = ~2875)
  const config: TreeConfig = { height: 14, radius: 5, needleCount: 2875, ornamentCount: 0 };
  const particles = useMemo(() => generateTreeParticles(config), []);

  const currentPositions = useMemo(() => new Float32Array(particles.length * 3), [particles]);
  const currentRotations = useMemo(() => new Float32Array(particles.length * 3), [particles]);

  useLayoutEffect(() => {
    particles.forEach((p, i) => {
        p.scatterPosition.toArray(currentPositions, i * 3);
        p.scatterRotation.toArray(currentRotations, i * 3);
    });
  }, [particles]);

  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;
    const lerpFactor = THREE.MathUtils.clamp(delta * 2.5, 0, 1);
    const targetIsTree = state === TreeMorphState.TREE_SHAPE;
    const time = stateThree.clock.elapsedTime;

    particles.forEach((particle, i) => {
      const targetPos = targetIsTree ? particle.treePosition : particle.scatterPosition;
      const targetRot = targetIsTree ? particle.treeRotation : particle.scatterRotation;

      tempPos.set(currentPositions[i*3], currentPositions[i*3+1], currentPositions[i*3+2]);
      tempPos.lerp(targetPos, lerpFactor);
      
      if (!paused) {
          if (targetIsTree) tempPos.y += Math.sin(time * 2 + i) * 0.005;
          else {
             tempPos.y += Math.sin(time * 0.5 + i) * 0.02;
             tempPos.x += Math.cos(time * 0.3 + i) * 0.01;
          }
      }

      tempPos.toArray(currentPositions, i * 3);

      const curRotX = THREE.MathUtils.lerp(currentRotations[i*3], targetRot.x, lerpFactor);
      const curRotY = THREE.MathUtils.lerp(currentRotations[i*3+1], targetRot.y, lerpFactor);
      const curRotZ = THREE.MathUtils.lerp(currentRotations[i*3+2], targetRot.z, lerpFactor);
      
      currentRotations[i*3] = curRotX;
      currentRotations[i*3+1] = curRotY;
      currentRotations[i*3+2] = curRotZ;

      dummy.position.copy(tempPos);
      dummy.rotation.set(curRotX, curRotY, curRotZ);
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <cylinderGeometry args={[0.02, 0.08, 0.6, 3]} />
      {/* Saturated Green */}
      <meshStandardMaterial 
        color="#0f5f2c" 
        emissive="#042911"
        roughness={0.6}
        metalness={0.2}
      />
    </instancedMesh>
  );
};

// --- 2. Photo Cubes (Direct textured cubes, like spheres) ---
export const PhotoCubes: React.FC<WithTextures> = ({ state, textures, paused }) => {
  const hasTextures = textures.length > 0;
  const totalCubes = 300; 

  const chunkedParticles = useMemo(() => {
    const config: TreeConfig = { height: 14, radius: 5.5, needleCount: 0, ornamentCount: totalCubes };
    const allParticles = generateOrnaments(config);
    
    const numGroups = hasTextures ? textures.length : 1;
    const chunks = Array.from({ length: numGroups }, () => [] as ParticleData[]);
    
    allParticles.forEach((p, i) => {
        chunks[i % numGroups].push(p);
    });
    return chunks;
  }, [hasTextures, textures.length]);

  return (
      <group>
        {chunkedParticles.map((particles, index) => (
           <PhotoCubeCluster 
             key={index} 
             state={state} 
             paused={paused}
             particles={particles} 
             textureUrl={hasTextures ? textures[index] : null} 
           />
        ))}
      </group>
  );
};

const PhotoCubeCluster: React.FC<{
    state: TreeMorphState, 
    paused: boolean,
    particles: ParticleData[], 
    textureUrl: string | null
}> = ({ state, paused, particles, textureUrl }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const texture = useLoader(THREE.TextureLoader, textureUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='); 
    
    const currentPositions = useMemo(() => new Float32Array(particles.length * 3), [particles]);

    useLayoutEffect(() => {
        particles.forEach((p, i) => {
            p.scatterPosition.toArray(currentPositions, i * 3);
        });
    }, [particles]);

    useFrame((stateThree, delta) => {
        if (!meshRef.current) return;
        const lerpFactor = THREE.MathUtils.clamp(delta * 2.0, 0, 1);
        const targetIsTree = state === TreeMorphState.TREE_SHAPE;
        const time = stateThree.clock.elapsedTime;
    
        particles.forEach((particle, i) => {
          const targetPos = targetIsTree ? particle.treePosition : particle.scatterPosition;
          
          tempPos.set(currentPositions[i*3], currentPositions[i*3+1], currentPositions[i*3+2]);
          tempPos.lerp(targetPos, lerpFactor);
    
          if (!paused) {
            if (targetIsTree) {
                const breathing = Math.sin(time * 1.5 + i) * 0.02;
                tempPos.addScalar(breathing);
            } else {
                const angle = time * 0.1 + i;
                tempPos.add(new THREE.Vector3(Math.cos(angle)*0.05, Math.sin(angle)*0.05, 0));
            }
          }
    
          tempPos.toArray(currentPositions, i * 3);
    
          dummy.position.copy(tempPos);
          if (!paused) {
             dummy.rotation.set(time * 0.2 + i, time * 0.3 + i, 0); 
          } else {
             dummy.rotation.set(0.2 * i, 0.3 * i, 0); 
          }
          
          // Slightly smaller than before to account for solid mass
          const scaleMultiplier = targetIsTree ? 0.35 : 0.2;
          dummy.scale.setScalar(particle.scale * scaleMultiplier); 
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
                map={textureUrl ? texture : undefined}
                color={textureUrl ? '#ffffff' : '#b8860b'}
                roughness={0.3}
                metalness={0.1}
            />
        </instancedMesh>
    );
}

// --- 3. Mixed Ornaments (Spheres) ---
export const Ornaments: React.FC<WithTextures> = ({ state, textures, paused }) => {
  // Reduced sphere count by 20% (300 * 0.8 = 240)
  const sphereConfig: TreeConfig = { height: 14, radius: 6, needleCount: 0, ornamentCount: 240 };

  const sphereParticles = useMemo(() => generateOrnaments(sphereConfig), []);
  
  return (
    <group>
        <SphereCluster state={state} paused={paused} particles={sphereParticles} textures={textures} />
    </group>
  )
};

const SphereCluster: React.FC<{state: TreeMorphState, paused: boolean, particles: ParticleData[], textures: string[]}> = ({ state, paused, particles, textures }) => {
    const hasTextures = textures.length > 0;
    
    const chunked = useMemo(() => {
        const numGroups = hasTextures ? textures.length : 1;
        const chunks = Array.from({ length: numGroups }, () => [] as ParticleData[]);
        particles.forEach((p, i) => chunks[i % numGroups].push(p));
        return chunks;
    }, [particles, textures, hasTextures]);

    return (
        <>
            {chunked.map((subset, i) => (
               <TexturedSphereMesh 
                 key={i} 
                 state={state} 
                 paused={paused}
                 particles={subset} 
                 textureUrl={hasTextures ? textures[i] : null} 
               /> 
            ))}
        </>
    )
}

const TexturedSphereMesh: React.FC<{state: TreeMorphState, paused: boolean, particles: ParticleData[], textureUrl: string | null}> = ({ state, paused, particles, textureUrl }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const texture = useLoader(THREE.TextureLoader, textureUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=');
    const currentPositions = useMemo(() => new Float32Array(particles.length * 3), [particles]);

    useLayoutEffect(() => { particles.forEach((p, i) => p.scatterPosition.toArray(currentPositions, i * 3)); }, [particles]);

    useFrame((stateThree, delta) => {
        if (!meshRef.current) return;
        const lerpFactor = THREE.MathUtils.clamp(delta * 2.0, 0, 1);
        const targetIsTree = state === TreeMorphState.TREE_SHAPE;
        const time = stateThree.clock.elapsedTime;
        
        particles.forEach((particle, i) => {
             const targetPos = targetIsTree ? particle.treePosition : particle.scatterPosition;
             tempPos.set(currentPositions[i*3], currentPositions[i*3+1], currentPositions[i*3+2]);
             tempPos.lerp(targetPos, lerpFactor);
             
             if (!paused && !targetIsTree) {
                const angle = time * 0.15 + i;
                tempPos.add(new THREE.Vector3(Math.cos(angle)*0.03, 0, Math.sin(angle)*0.03));
             }
             tempPos.toArray(currentPositions, i * 3);
             
             dummy.position.copy(tempPos);
             if (!paused) dummy.rotation.set(0, time + i, 0);
             else dummy.rotation.set(0, i, 0); // Freeze rotation if paused

             dummy.scale.setScalar(particle.scale * (targetIsTree ? 0.6 : 0.3));
             dummy.updateMatrix();
             meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial 
                map={textureUrl ? texture : undefined}
                color="#B8860B" 
                roughness={0.3}
                metalness={0.4}
            />
        </instancedMesh>
    );
}

// --- 4. Topper Star (3D Faceted "Lantern" Style) ---
export const Topper: React.FC<{state: TreeMorphState}> = ({ state }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((stateThree) => {
        if(!ref.current) return;
        const time = stateThree.clock.elapsedTime;
        ref.current.rotation.y = time * 0.5;
        ref.current.position.y = state === TreeMorphState.TREE_SHAPE ? 7.5 : 10;
    });

    // Custom Faceted Geometry: Inner Radius 0.4, Outer 1.2, Depth 0.3 (Center thickness 0.6 total)
    // Tapers to sharp edges at 0 depth.
    const starGeom = useMemo(() => createFacetedStarGeometry(0.4, 1.2, 0.3), []);

    return (
        <group ref={ref}>
            <mesh geometry={starGeom}>
                <meshPhysicalMaterial 
                    color="#FFD700" 
                    emissive="#FFD700"
                    emissiveIntensity={1.0}
                    transmission={0.1}
                    roughness={0.2}
                    metalness={1.0}
                    clearcoat={1}
                />
            </mesh>
            <pointLight intensity={8} color="#FFD700" distance={15} decay={2} />
        </group>
    )
}