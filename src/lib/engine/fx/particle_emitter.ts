import * as PIXI from 'pixi.js';
import type { GameParticle } from '../core/types';

export class ParticleEmitter {
  public layer: PIXI.Graphics = new PIXI.Graphics();
  public particles: GameParticle[] = [];

  public spawnSparks(worldX: number, worldY: number, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 100 + 40;
      this.particles.push({
        type: 'spark',
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        rotation: 0,
        vRot: 0,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.3,
        size: Math.random() * 2.5 + 1.5,
        color,
      });
    }
  }

  public spawnCoins(worldX: number, worldY: number, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = Math.random() * 140 + 80;
      this.particles.push({
        type: 'coin',
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI,
        vRot: Math.random() * 12 - 6,
        life: 0,
        maxLife: Math.random() * 0.6 + 0.6,
        size: Math.random() * 4 + 6,
        color: 0xffd700,
      });
    }
  }

  public spawnSteam(worldX: number, worldY: number, count: number = 2) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: 'steam',
        x: worldX,
        y: worldY,
        vx: (Math.random() - 0.5) * 20 - 40,
        vy: -Math.random() * 30 - 20,
        rotation: Math.random() * Math.PI,
        vRot: Math.random() * 2 - 1,
        life: 0,
        maxLife: 0.5,
        size: Math.random() * 4 + 5,
        color: 0xdde6f0,
      });
    }
  }

  public update(dt: number, cameraX: number, cameraY: number) {
    this.layer.clear();
    const g = this.layer;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.type === 'coin' ? 260 : 70) * dt; // Gravity
      p.rotation += p.vRot * dt;

      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      const screenX = p.x - cameraX;
      const screenY = p.y - cameraY;

      if (p.type === 'coin') {
        const scaleX = Math.cos(p.rotation * 2);
        g.ellipse(screenX, screenY, Math.abs(scaleX) * p.size, p.size);
        g.fill({ color: 0xffd700, alpha });
        g.stroke({ color: 0xffa000, width: 1.5, alpha });
      } else if (p.type === 'steam') {
        g.circle(screenX, screenY, p.size * (1 + p.life));
        g.fill({ color: 0xdde6f0, alpha: alpha * 0.35 });
      } else {
        // Spark
        g.circle(screenX, screenY, p.size);
        g.fill({ color: p.color, alpha });
      }
    }
  }

  public clear() {
    this.particles = [];
    this.layer.clear();
  }
}
