import * as PIXI from 'pixi.js';

export class BearActor {
  public container: PIXI.Container = new PIXI.Container();
  private bodyGfx: PIXI.Graphics = new PIXI.Graphics();

  constructor() {
    this.container.addChild(this.bodyGfx);
    // Inverted vertically for underside running
    this.container.scale.set(1, -1);
  }

  public render(runCycle: number, isCharging: boolean) {
    this.bodyGfx.clear();
    const g = this.bodyGfx;

    const legOffset = Math.sin(runCycle) * 8;
    const headBob = Math.sin(runCycle * 2) * 2;

    // Grizzly Body (Dark cyber charcoal coat)
    g.ellipse(0, headBob - 14, 25, 16);
    g.fill({ color: 0x232a34 });
    g.stroke({ color: 0x151920, width: 2 });

    // Fur highlight
    g.ellipse(-2, headBob - 18, 17, 10);
    g.fill({ color: 0x414e60 });

    // 4 Running Bear Claws/Legs
    g.moveTo(12, headBob - 6);
    g.lineTo(16 + legOffset, 14);
    g.stroke({ color: 0x151920, width: 5, cap: 'round' });

    g.moveTo(8, headBob - 6);
    g.lineTo(10 - legOffset, 14);
    g.stroke({ color: 0x101318, width: 4.5, cap: 'round' });

    g.moveTo(-12, headBob - 6);
    g.lineTo(-16 - legOffset, 14);
    g.stroke({ color: 0x151920, width: 5, cap: 'round' });

    g.moveTo(-8, headBob - 6);
    g.lineTo(-6 + legOffset, 14);
    g.stroke({ color: 0x101318, width: 4.5, cap: 'round' });

    // Crimson Neon Claws
    g.rect(14 + legOffset, 13, 4, 3);
    g.fill({ color: 0xff1744 });
    g.rect(-18 - legOffset, 13, 4, 3);
    g.fill({ color: 0xff1744 });

    // Head & Snout
    g.ellipse(19, headBob - 18, 12, 10);
    g.fill({ color: 0x232a34 });

    g.ellipse(26, headBob - 16, 7, 5);
    g.fill({ color: 0x414e60 });

    // Crimson Cyber-Shades / Visor
    g.roundRect(14, headBob - 22, 11, 6, 2);
    g.fill({ color: 0xff1744 });
    g.stroke({ color: 0xffffff, width: 1 });

    // Bear Ear
    g.circle(14, headBob - 28, 4.5);
    g.fill({ color: 0x232a34 });

    if (isCharging) {
      g.moveTo(Math.random() * 20 - 10, Math.random() * 20 - 25);
      for (let s = 0; s < 3; s++) {
        g.lineTo(Math.random() * 40 - 20, Math.random() * 40 - 25);
      }
      g.stroke({ color: 0xff2e63, width: 2, alpha: 0.9 });
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
