export interface MonteCarloPath {
  steps: number[];
  targetSteps: number[];
  speed: number;
  phase: number;
  alpha: number;
  isCyan: boolean;
}

export interface GameParticle {
  type: 'spark' | 'coin' | 'dollar' | 'steam';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

export interface ViewportBounds {
  screenW: number;
  screenH: number;
  cameraX: number;
  cameraY: number;
}
