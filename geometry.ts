import * as THREE from 'three';
import { ParticleData, TreeConfig } from '../types';

const randomVectorInSphere = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

export const generateTreeParticles = (config: TreeConfig): ParticleData[] => {
  const particles: ParticleData[] = [];
  const { height, radius, needleCount } = config;

  // Golden Angle for spiral distribution
  const phi = Math.PI * (3 - Math.sqrt(5)); 

  for (let i = 0; i < needleCount; i++) {
    const y = (i / needleCount) * height; 
    const currentRadius = radius * (1 - y / height) + (Math.random() * 0.5 - 0.25);
    const angle = i * phi * 15; 

    const treePos = new THREE.Vector3(
      currentRadius * Math.cos(angle),
      y - height / 2,
      currentRadius * Math.sin(angle)
    );

    treePos.x += (Math.random() - 0.5) * 0.5;
    treePos.z += (Math.random() - 0.5) * 0.5;

    const scatterPos = randomVectorInSphere(15);

    const treeRot = new THREE.Euler(
        (Math.random() - 0.5) + Math.PI / 4, 
        Math.atan2(treePos.x, treePos.z), 
        (Math.random() - 0.5)
    );

    const scatterRot = new THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    particles.push({
      treePosition: treePos,
      scatterPosition: scatterPos,
      treeRotation: treeRot,
      scatterRotation: scatterRot,
      scale: 0.5 + Math.random() * 1.5
    });
  }

  return particles;
};

export const generateOrnaments = (config: TreeConfig): ParticleData[] => {
    const particles: ParticleData[] = [];
    const { height, radius, ornamentCount } = config;
    const phi = Math.PI * (3 - Math.sqrt(5)); 
  
    for (let i = 0; i < ornamentCount; i++) {
      const y = (i / ornamentCount) * height; 
      const currentRadius = (radius * (1 - y / height)) * 1.1; 
      const angle = i * phi * 5 + Math.random(); 
  
      const treePos = new THREE.Vector3(
        currentRadius * Math.cos(angle),
        y - height / 2, 
        currentRadius * Math.sin(angle)
      );
  
      const scatterPos = randomVectorInSphere(20);
  
      particles.push({
        treePosition: treePos,
        scatterPosition: scatterPos,
        treeRotation: new THREE.Euler(0,0,0),
        scatterRotation: new THREE.Euler(Math.random(), Math.random(), Math.random()),
        scale: 1.0 + Math.random() * 1.0 
      });
    }
    return particles;
  };

// Creates a 3D faceted star geometry (like a lantern)
// Center is puffed out (z-depth), edges are thin/sharp.
export const createFacetedStarGeometry = (innerRadius: number, outerRadius: number, depth: number): THREE.BufferGeometry => {
  const points = 5;
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];

  const step = Math.PI / points;
  
  // Center Front and Back
  // Front tip: 0,0,depth
  // Back tip: 0,0,-depth
  
  // We generate triangles. 
  // Each point of the star is made of 2 triangles on front and 2 on back.
  // One triangle connects Center-Outer-Inner(left).
  // One triangle connects Center-Outer-Inner(right).
  
  for (let i = 0; i < 2 * points; i++) {
    // Current vertex (Outer or Inner)
    const r1 = (i % 2 === 0) ? outerRadius : innerRadius;
    const a1 = i * step; 
    const x1 = r1 * Math.sin(a1);
    const y1 = r1 * Math.cos(a1);

    // Next vertex
    const r2 = ((i + 1) % 2 === 0) ? outerRadius : innerRadius;
    const a2 = (i + 1) * step;
    const x2 = r2 * Math.sin(a2);
    const y2 = r2 * Math.cos(a2);

    // Front Face
    vertices.push(0, 0, depth); // Center Front
    vertices.push(x1, y1, 0);   // Current Rim
    vertices.push(x2, y2, 0);   // Next Rim

    // Back Face
    vertices.push(0, 0, -depth); // Center Back
    vertices.push(x2, y2, 0);    // Next Rim (order swapped for normal)
    vertices.push(x1, y1, 0);    // Current Rim
    
    // Simple UVs (planar projection)
    uvs.push(0.5, 0.5, (x1/outerRadius)*0.5+0.5, (y1/outerRadius)*0.5+0.5, (x2/outerRadius)*0.5+0.5, (y2/outerRadius)*0.5+0.5);
    uvs.push(0.5, 0.5, (x2/outerRadius)*0.5+0.5, (y2/outerRadius)*0.5+0.5, (x1/outerRadius)*0.5+0.5, (y1/outerRadius)*0.5+0.5);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
};