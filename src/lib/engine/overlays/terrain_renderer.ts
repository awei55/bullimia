import * as PIXI from 'pixi.js';
import type { Candle } from '../../types';
import { priceToScreenY } from '../core/coordinate_map';

export class TerrainRenderer {
  public layer: PIXI.Graphics = new PIXI.Graphics();

  public render(
    candles: Candle[],
    playerProgress: number,
    candleStep: number,
    candleWidth: number,
    cameraX: number,
    cameraY: number,
    screenW: number,
    initialPrice: number,
    logScale: number,
    screenH: number
  ) {
    this.layer.clear();
    const currentIdx = Math.floor(playerProgress);
    const minCandle = Math.max(0, Math.floor((cameraX - 120) / candleStep));
    const maxCandle = Math.min(currentIdx, Math.ceil((cameraX + screenW + 120) / candleStep));

    for (let i = minCandle; i <= maxCandle; i++) {
      const c = candles[i];
      if (!c) continue;

      const screenX = i * candleStep - cameraX;
      const isBullish = c.close >= c.open;
      const color = isBullish ? 0x00f59b : 0xff2e63;

      const highY = priceToScreenY(c.high, initialPrice, logScale, screenH) - cameraY;
      const lowY = priceToScreenY(c.low, initialPrice, logScale, screenH) - cameraY;
      const openY = priceToScreenY(c.open, initialPrice, logScale, screenH) - cameraY;
      const closeY = priceToScreenY(c.close, initialPrice, logScale, screenH) - cameraY;

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(4, Math.abs(closeY - openY));

      // Wick
      this.layer.moveTo(screenX, highY);
      this.layer.lineTo(screenX, lowY);
      this.layer.stroke({ color, width: 2, alpha: 0.85 });

      // Body (Bold cel-shaded with dark outline)
      this.layer.roundRect(screenX - candleWidth / 2, bodyTop, candleWidth, bodyHeight, 4);
      this.layer.fill({ color, alpha: 0.8 });
      this.layer.stroke({ color: 0x000000, width: 1.5 });
    }
  }

  public clear() {
    this.layer.clear();
  }
}
