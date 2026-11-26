import * as PIXI from 'pixi.js';

export class BullActor {
  public container: PIXI.Container = new PIXI.Container();
  private bodyGfx: PIXI.Graphics = new PIXI.Graphics();

  constructor() {
    this.container.addChild(this.bodyGfx);
  }

  public render(runCycle: number, isCharging: boolean) {
    this.bodyGfx.clear();
    const g = this.bodyGfx;

    const legOffset = Math.sin(runCycle) * 8;
    const headBob = Math.sin(runCycle * 2) * 2;

    // Muscular Torso (Metallic gold/bronze)
    g.ellipse(0, headBob - 14, 24, 15);
    g.fill({ color: 0xc67d0a });
    g.stroke({ color: 0x8c5200, width: 2 });

    // Muscle highlight contour
    g.ellipse(-4, headBob - 18, 15, 8);
    g.fill({ color: 0xe5a024, alpha: 0.9 });

    // 4 Running Legs
    // Front legs
    g.moveTo(12, headBob - 6);
    g.lineTo(16 + legOffset, 14);
    g.stroke({ color: 0x8c5200, width: 4.5, cap: 'round' });

    g.moveTo(8, headBob - 6);
    g.lineTo(10 - legOffset, 14);
    g.stroke({ color: 0x6e3f00, width: 4, cap: 'round' });

    // Back legs
    g.moveTo(-12, headBob - 6);
    g.lineTo(-16 - legOffset, 14);
    g.stroke({ color: 0x8c5200, width: 4.5, cap: 'round' });

    g.moveTo(-8, headBob - 6);
    g.lineTo(-6 + legOffset, 14);
    g.stroke({ color: 0x6e3f00, width: 4, cap: 'round' });

    // Head & Snout
    g.ellipse(18, headBob - 18, 11, 9);
    g.fill({ color: 0xb36b00 });

    g.ellipse(25, headBob - 16, 7, 5);
    g.fill({ color: 0xe5a024 });

    // Gleaming Golden Curved Horns
    g.moveTo(16, headBob - 24);
    g.quadraticCurveTo(20, headBob - 36, 29, headBob - 32);
    g.stroke({ color: 0xffea00, width: 3.5, cap: 'round' });

    // Glowing Emerald Eye
    g.circle(18, headBob - 20, 3);
    g.fill({ color: 0x00e676 });

    // Red Wall Street Power Tie flapping in the wind!
    g.moveTo(14, headBob - 10);
    g.lineTo(2, headBob - 4 + Math.sin(runCycle) * 3);
    g.lineTo(4, headBob + Math.sin(runCycle) * 3);
    g.lineTo(16, headBob - 7);
    g.closePath();
    g.fill({ color: 0xff1744 });

    // Swishing Tail
    g.moveTo(-22, headBob - 16);
    g.quadraticCurveTo(-30, headBob - 20 + Math.sin(runCycle * 1.5) * 6, -34, headBob - 10);
    g.stroke({ color: 0x8c5200, width: 2.5, cap: 'round' });

    // Electric lightning arcs when charging
    if (isCharging) {
      g.moveTo(Math.random() * 20 - 10, Math.random() * 20 - 25);
      for (let s = 0; s < 3; s++) {
        g.lineTo(Math.random() * 40 - 20, Math.random() * 40 - 25);
      }
      g.stroke({ color: 0x00e5ff, width: 2, alpha: 0.9 });
    }
  }

  public setVisible(visible: boolean) {
    this.container.visible = visible;
  }

  public setAlpha(alpha: number) {
    this.container.alpha = alpha;
  }

  public setPosition(x: number, y: number) {
    this.container.position.set(x, y);
  }

  public setRotation(rotation: number) {
    this.container.rotation = rotation;
  }
}
