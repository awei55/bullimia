import * as PIXI from 'pixi.js';
import type { MonteCarloPath } from '../core/types';
import { priceToScreenY } from '../core/coordinate_map';

export class MonteCarloFanOverlay {
  public layer: PIXI.Graphics = new PIXI.Graphics();
  private paths: MonteCarloPath[] = [];
  private pathsCount: number = 20;
  private horizonSteps: number = 28;
  private stepPx: number = 28;

  constructor() {
    this.initPaths();
  }

  private initPaths() {
    this.paths = [];
    for (let k = 0; k < this.pathsCount; k++) {
      const steps = [0];
      let val = 0;
      for (let j = 1; j <= this.horizonSteps; j++) {
        const shock = (Math.random() - 0.5) * 2.2;
        val += shock * Math.sqrt(j);
        steps.push(val);
      }
      this.paths.push({
        steps: [...steps],
        targetSteps: [...steps],
        speed: 0.8 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.12 + Math.random() * 0.2,
        isCyan: Math.random() > 0.45,
      });
    }
  }

  public cyclePaths() {
    for (let k = 0; k < this.pathsCount; k++) {
      let val = 0;
      const newSteps = [0];
      for (let j = 1; j <= this.horizonSteps; j++) {
        const shock = (Math.random() - 0.5) * 2.2;
        val += shock * Math.sqrt(j);
        newSteps.push(val);
      }
      this.paths[k].targetSteps = newSteps;
    }
  }

  public render(
    playerX: number,
    cameraX: number,
    cameraY: number,
    currentPrice: number,
    avgAtrPct: number,
    logScale: number,
    initialPrice: number,
    screenH: number,
    animTime: number
  ) {
    this.layer.clear();
    const g = this.layer;

    const startX = playerX - cameraX + 8;
    const startY = priceToScreenY(currentPrice, initialPrice, logScale, screenH) - cameraY;

    const priceVolPx = Math.max(20, logScale * (avgAtrPct * 1.5));

    // 1. Upper and Lower 2-Sigma Probability Cones
    g.moveTo(startX, startY);
    for (let j = 1; j <= this.horizonSteps; j++) {
      const x = startX + j * this.stepPx;
      const distFactor = Math.sqrt(j / this.horizonSteps);
      const yUp = startY - priceVolPx * 2.0 * distFactor;
      g.lineTo(x, yUp);
    }
    for (let j = this.horizonSteps; j >= 1; j--) {
      const x = startX + j * this.stepPx;
      const distFactor = Math.sqrt(j / this.horizonSteps);
      const yDown = startY + priceVolPx * 2.0 * distFactor;
      g.lineTo(x, yDown);
    }
    g.closePath();
    g.fill({ color: 0x00e5ff, alpha: 0.05 });

    // 2. 1-Sigma Boundary Rails
    g.moveTo(startX, startY);
    for (let j = 1; j <= this.horizonSteps; j++) {
      const x = startX + j * this.stepPx;
      const y = startY - priceVolPx * 1.0 * Math.sqrt(j / this.horizonSteps);
      g.lineTo(x, y);
    }
    g.stroke({ color: 0x00e5ff, width: 1.2, alpha: 0.25 });

    g.moveTo(startX, startY);
    for (let j = 1; j <= this.horizonSteps; j++) {
      const x = startX + j * this.stepPx;
      const y = startY + priceVolPx * 1.0 * Math.sqrt(j / this.horizonSteps);
      g.lineTo(x, y);
    }
    g.stroke({ color: 0x00e5ff, width: 1.2, alpha: 0.25 });

    // 3. 20 Dynamic Stochastic Ghost Paths
    const scaleAmp = priceVolPx * 0.45;

    for (let k = 0; k < this.paths.length; k++) {
      const path = this.paths[k];
      for (let j = 1; j <= this.horizonSteps; j++) {
        path.steps[j] += (path.targetSteps[j] - path.steps[j]) * 0.04;
      }

      const wave = Math.sin(animTime * path.speed + path.phase);
      const alpha = Math.max(0.04, path.alpha * (0.6 + 0.4 * wave));
      const color = path.isCyan ? 0x00e5ff : 0xffd700;

      g.moveTo(startX, startY);
      for (let j = 1; j <= this.horizonSteps; j++) {
        const x = startX + j * this.stepPx;
        const shockY = path.steps[j] * scaleAmp * 0.35;
        const undulation = Math.sin(animTime * 2 + j * 0.5 + path.phase) * (j * 1.2);
        const y = startY + shockY + undulation;
        g.lineTo(x, y);
      }
      g.stroke({ color, width: 1.0, alpha });
    }
  }

  public clear() {
    this.layer.clear();
  }
}
