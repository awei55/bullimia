import * as PIXI from 'pixi.js';

export class BackgroundParallax {
  public container: PIXI.Container = new PIXI.Container();
  public starfieldLayer: PIXI.Graphics = new PIXI.Graphics();
  public skylineFarLayer: PIXI.Graphics = new PIXI.Graphics();
  public skylineMidLayer: PIXI.Graphics = new PIXI.Graphics();
  public gridLayer: PIXI.Graphics = new PIXI.Graphics();

  constructor() {
    this.container.addChild(this.starfieldLayer);
    this.container.addChild(this.skylineFarLayer);
    this.container.addChild(this.skylineMidLayer);
    this.container.addChild(this.gridLayer);
  }

  public render(screenW: number, screenH: number, cameraX: number, cameraY: number, animTime: number) {
    // 1. Starfield / Cyber Matrix Sky
    this.starfieldLayer.clear();
    this.starfieldLayer.rect(0, 0, screenW, screenH);
    this.starfieldLayer.fill({ color: 0x04060d });

    // Procedural Stars
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137.5) - (cameraX * 0.05)) % screenW;
      const actualX = sx < 0 ? sx + screenW : sx;
      const sy = (i * 83.1) % (screenH * 0.75);
      const twinkle = 0.3 + Math.sin(animTime * 3 + i) * 0.25;
      this.starfieldLayer.circle(actualX, sy, (i % 3) + 1);
      this.starfieldLayer.fill({ color: 0x00e5ff, alpha: twinkle });
    }

    // 2. Far Skyline Silhouette (Parallax 0.15x)
    this.skylineFarLayer.clear();
    const farOffset = -((cameraX * 0.15) % 240);
    const farBaseY = screenH * 0.78;

    for (let x = farOffset - 240; x < screenW + 240; x += 60) {
      const bHeight = 90 + Math.abs(Math.sin(x * 0.02) * 110);
      this.skylineFarLayer.rect(x, farBaseY - bHeight, 52, bHeight);
      this.skylineFarLayer.fill({ color: 0x0c1322 });

      // Spire beacon
      if (Math.floor(x / 60) % 3 === 0) {
        this.skylineFarLayer.moveTo(x + 26, farBaseY - bHeight);
        this.skylineFarLayer.lineTo(x + 26, farBaseY - bHeight - 20);
        this.skylineFarLayer.stroke({ color: 0x18253f, width: 2 });
        this.skylineFarLayer.circle(x + 26, farBaseY - bHeight - 20, 2);
        this.skylineFarLayer.fill({ color: 0xff1744, alpha: 0.8 + Math.sin(animTime * 4) * 0.2 });
      }
    }

    // 3. Mid Skyline Silhouette with Lit Windows (Parallax 0.35x)
    this.skylineMidLayer.clear();
    const midOffset = -((cameraX * 0.35) % 180);
    const midBaseY = screenH * 0.84;

    for (let x = midOffset - 180; x < screenW + 180; x += 45) {
      const bHeight = 60 + Math.abs(Math.sin(x * 0.035) * 80);
      this.skylineMidLayer.rect(x, midBaseY - bHeight, 40, bHeight);
      this.skylineMidLayer.fill({ color: 0x141e33 });

      // Lit office windows
      for (let wy = midBaseY - bHeight + 8; wy < midBaseY - 6; wy += 12) {
        if ((x + wy) % 5 === 0) {
          this.skylineMidLayer.rect(x + 8, wy, 6, 5);
          this.skylineMidLayer.fill({ color: 0xffd700, alpha: 0.6 });
        }
        if ((x + wy) % 7 === 0) {
          this.skylineMidLayer.rect(x + 24, wy, 6, 5);
          this.skylineMidLayer.fill({ color: 0x00e5ff, alpha: 0.5 });
        }
      }
    }

    // 4. Retro Synthwave Perspective Grid
    this.gridLayer.clear();
    const gridSpacing = 50;
    const offX = -((cameraX) % gridSpacing);
    const offY = -((cameraY) % gridSpacing);

    for (let x = offX; x < screenW; x += gridSpacing) {
      this.gridLayer.moveTo(x, 0);
      this.gridLayer.lineTo(x, screenH);
      this.gridLayer.stroke({ color: 0x0f1624, width: 1, alpha: 0.45 });
    }
    for (let y = offY; y < screenH; y += gridSpacing) {
      this.gridLayer.moveTo(0, y);
      this.gridLayer.lineTo(screenW, y);
      this.gridLayer.stroke({ color: 0x0f1624, width: 1, alpha: 0.45 });
    }
  }

  public clear() {
    this.starfieldLayer.clear();
    this.skylineFarLayer.clear();
    this.skylineMidLayer.clear();
    this.gridLayer.clear();
  }
}
