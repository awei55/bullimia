import { soundEngine } from '../../audio/soundtrack';
import type { BullActor } from './bull_actor';
import type { BearActor } from './bear_actor';

export class DeathAnimationController {
  public isDead: boolean = false;
  public deathTimer: number = 0;
  public deathVy: number = 0;
  public deathRotSpeed: number = 0;

  public triggerDeath(
    playerX: number,
    playerY: number,
    onSpawnSparks: (x: number, y: number, color: number, count: number) => void,
    onShake: (intensity: number, duration: number) => void
  ) {
    this.isDead = true;
    this.deathTimer = 0;
    this.deathVy = -240; // Dramatic upward pop before plummeting
    this.deathRotSpeed = (Math.random() > 0.5 ? 1 : -1) * 14; // High-speed arcade tumble
    onShake(28, 1.4);
    soundEngine.playDeath();

    // Giant explosion of sparks & shattered debris
    onSpawnSparks(playerX, playerY, 0xff0055, 60);
    onSpawnSparks(playerX, playerY, 0xffd700, 30);
    onSpawnSparks(playerX, playerY, 0xffffff, 20);
  }

  public update(
    dt: number,
    playerPos: { x: number; y: number },
    cameraPos: { x: number; y: number },
    bull: BullActor,
    bear: BearActor,
    onSpawnSparks: (x: number, y: number, color: number, count: number) => void
  ): boolean {
    if (!this.isDead) return false;

    this.deathTimer += dt;
    this.deathVy += 980 * dt; // Gravity
    playerPos.y += this.deathVy * dt;

    const rotDelta = this.deathRotSpeed * dt;
    bull.setRotation(bull.container.rotation + rotDelta);
    bear.setRotation(bear.container.rotation + rotDelta);

    const alpha = Math.max(0, 1 - this.deathTimer / 1.4);
    bull.setAlpha(alpha);
    bear.setAlpha(alpha);

    const charScreenX = playerPos.x - cameraPos.x;
    const charScreenY = playerPos.y - cameraPos.y;
    bull.setPosition(charScreenX, charScreenY);
    bear.setPosition(charScreenX, charScreenY);

    if (this.deathTimer < 0.8 && Math.random() < 0.6) {
      onSpawnSparks(
        playerPos.x + (Math.random() * 20 - 10),
        playerPos.y + (Math.random() * 20 - 10),
        0xff2e63,
        3
      );
    }

    return true;
  }

  public reset(bull: BullActor, bear: BearActor) {
    this.isDead = false;
    this.deathTimer = 0;
    this.deathVy = 0;
    this.deathRotSpeed = 0;
    bull.setRotation(0);
    bear.setRotation(0);
    bull.setAlpha(1.0);
    bear.setAlpha(1.0);
  }
}
