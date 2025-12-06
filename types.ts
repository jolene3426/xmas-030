import * as THREE from 'three';

export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export interface ParticleData {
  scatterPosition: THREE.Vector3;
  treePosition: THREE.Vector3;
  scatterRotation: THREE.Euler;
  treeRotation: THREE.Euler;
  scale: number;
  color?: THREE.Color;
}

export interface TreeConfig {
  height: number;
  radius: number;
  needleCount: number;
  ornamentCount: number;
}
