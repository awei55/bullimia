import * as PIXI from 'pixi.js';
import { priceToScreenY } from '../core/coordinate_map';

export class FogCorridorOverlay {
  public layer: PIXI.Graphics = new PIXI.Graphics();

  public render(
    playerX: number,
    cameraX: number,
    cameraY: number,
    currentPrice: number,
    avgAtrPct: number,
    screenW: number,
    initialPrice: number,
    logScale: number,
    screenH: number,
    animTime: number
  ) {
    this.layer.clear();
    const g = this.layer;

    const playerScreenX = playerX - cameraX;
    const currentPriceY = priceToScreenY(currentPrice, initialPrice, logScale, screenH) - cameraY;

    // Spread Band Corridor
    const spreadPct = Math.max(0.0005, Math.min(0.005, avgAtrPct * 0.05));
    const spread = currentPrice * spreadPct;
    const halfSpread = spread / 2.0;

    const askPrice = currentPrice + halfSpread;
    const bidPrice = currentPrice - halfSpread;

    const askY = priceToScreenY(askPrice, initialPrice, logScale, screenH) - cameraY;
    const bidY = priceToScreenY(bidPrice, initialPrice, logScale, screenH) - cameraY;

    const bandTop = Math.min(askY, bidY);
    const spreadHeight = Math.max(6, Math.abs(bidY - askY));

    // 1. Translucent glowing corridor fill
    g.rect(playerScreenX, bandTop, screenW - playerScreenX, spreadHeight);
    g.fill({ color: 0x00e5ff, alpha: 0.16 });

    // 2. Ask rail (Green)
    g.moveTo(playerScreenX, bandTop);
    g.lineTo(screenW, bandTop);
    g.stroke({ color: 0x00ff88, width: 2, alpha: 0.85 });

    // 3. Bid rail (Red)
    g.moveTo(playerScreenX, bandTop + spreadHeight);
    g.lineTo(screenW, bandTop + spreadHeight);
    g.stroke({ color: 0xff1744, width: 2, alpha: 0.85 });

    // 4. Center Mid Price Laser Line
    const pulse = 0.6 + Math.sin(animTime * 6) * 0.3;
    g.moveTo(playerScreenX, currentPriceY);
    g.lineTo(screenW, currentPriceY);
    g.stroke({ color: 0x00e5ff, width: 1.5, alpha: pulse });
  }

  public clear() {
    this.layer.clear();
  }
}
