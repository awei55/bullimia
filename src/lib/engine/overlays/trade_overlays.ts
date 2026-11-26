import * as PIXI from 'pixi.js';
import { get } from 'svelte/store';
import type { PositionSide, TradeRecord } from '../../types';
import { account } from '../../stores/trading';
import { priceToScreenY } from '../core/coordinate_map';

export class TradeOverlays {
  public tradeLinesLayer: PIXI.Graphics = new PIXI.Graphics();
  public activeTradeLineLayer: PIXI.Graphics = new PIXI.Graphics();
  public livePnlBadgeGfx: PIXI.Graphics = new PIXI.Graphics();
  public livePnlText: PIXI.Text | null = null;

  constructor() {
    this.livePnlText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'Chakra Petch, monospace, sans-serif',
        fontSize: 10,
        fontWeight: 'bold',
        fill: 0x00f59b,
      },
    });
    this.livePnlText.visible = false;
  }

  public renderHistoricalTrades(
    trades: TradeRecord[],
    candleStep: number,
    cameraX: number,
    cameraY: number,
    initialPrice: number,
    logScale: number,
    screenH: number
  ) {
    this.tradeLinesLayer.clear();
    const g = this.tradeLinesLayer;

    trades.forEach((trade) => {
      if (trade.entry_candle_idx !== undefined && trade.exit_candle_idx !== undefined) {
        const startX = trade.entry_candle_idx * candleStep - cameraX;
        const startY = priceToScreenY(trade.entry_price, initialPrice, logScale, screenH) - cameraY;
        const endX = trade.exit_candle_idx * candleStep - cameraX;
        const endY = priceToScreenY(trade.exit_price, initialPrice, logScale, screenH) - cameraY;

        const lineColor = trade.is_win ? 0x00f59b : 0xff2e63;

        // Dashed connection line
        g.moveTo(startX, startY);
        g.lineTo(endX, endY);
        g.stroke({ color: lineColor, width: 2.2, alpha: 0.85 });

        // Entry Marker: Triangle
        const isLong = trade.side === 'BULL';
        if (isLong) {
          g.moveTo(startX, startY - 14);
          g.lineTo(startX - 6, startY - 4);
          g.lineTo(startX + 6, startY - 4);
        } else {
          g.moveTo(startX, startY + 14);
          g.lineTo(startX - 6, startY + 4);
          g.lineTo(startX + 6, startY + 4);
        }
        g.closePath();
        g.fill({ color: lineColor });

        // Exit Marker: Circle
        g.circle(endX, endY, 5);
        g.fill({ color: lineColor });
        g.stroke({ color: 0xffffff, width: 1 });

        // Midpoint P&L Badge
        const midX = (startX + endX) * 0.5;
        const midY = (startY + endY) * 0.5;

        g.roundRect(midX - 32, midY - 10, 64, 20, 5);
        g.fill({ color: 0x070c17, alpha: 0.95 });
        g.stroke({ color: lineColor, width: 1.5 });
      }
    });
  }

  public renderLivePositionPnl(
    charX: number,
    charY: number,
    side: PositionSide,
    isDead: boolean,
    activeEntryPrice: number,
    activeEntryCandleIdx: number,
    candleStep: number,
    cameraX: number,
    cameraY: number,
    initialPrice: number,
    logScale: number,
    screenH: number
  ) {
    this.livePnlBadgeGfx.clear();
    this.activeTradeLineLayer.clear();

    if (side === 'FLAT' || isDead || !activeEntryPrice || activeEntryPrice <= 0 || activeEntryCandleIdx === undefined) {
      if (this.livePnlText) this.livePnlText.visible = false;
      return;
    }

    const acc = get(account);
    if (!acc || acc.side === 'FLAT' || acc.open_lots === 0) {
      if (this.livePnlText) this.livePnlText.visible = false;
      return;
    }

    const pnl = acc.unrealized_pnl;
    const isProfit = pnl >= 0;
    const col = isProfit ? 0x00f59b : 0xff2e63;

    // 1. Live Dotted Laser Trail from Entry Price to Character
    const entryScreenX = activeEntryCandleIdx * candleStep - cameraX;
    const entryScreenY = priceToScreenY(activeEntryPrice, initialPrice, logScale, screenH) - cameraY;

    if (!isNaN(entryScreenX) && !isNaN(entryScreenY) && entryScreenX > -400 && entryScreenX < 3500) {
      this.activeTradeLineLayer.moveTo(entryScreenX, entryScreenY);
      this.activeTradeLineLayer.lineTo(charX, charY);
      this.activeTradeLineLayer.stroke({ color: col, width: 2, alpha: 0.75 });

      // Entry point beacon
      this.activeTradeLineLayer.circle(entryScreenX, entryScreenY, 4.5);
      this.activeTradeLineLayer.fill({ color: col });
      this.activeTradeLineLayer.stroke({ color: 0xffffff, width: 1 });
    }

    // 2. Floating PnL badge right beside character
    const badgeX = charX + 38;
    const badgeY = charY - 12;

    const g = this.livePnlBadgeGfx;
    g.roundRect(badgeX, badgeY, 86, 24, 6);
    g.fill({ color: 0x080d1a, alpha: 0.95 });
    g.stroke({ color: col, width: 2 });

    // Side badge indicator dot
    g.circle(badgeX + 10, badgeY + 12, 4);
    g.fill({ color: col });

    // Live PnL formatted text directly on character badge
    if (this.livePnlText) {
      const sign = pnl >= 0 ? '+' : '-';
      const absVal = Math.abs(pnl);
      const textVal = `${sign}$${absVal >= 1000 ? absVal.toFixed(0) : absVal.toFixed(2)}`;
      this.livePnlText.text = textVal;
      this.livePnlText.style.fill = col;
      this.livePnlText.position.set(badgeX + 18, badgeY + 4);
      this.livePnlText.visible = true;
    }
  }

  public clear() {
    this.tradeLinesLayer.clear();
    this.activeTradeLineLayer.clear();
    this.livePnlBadgeGfx.clear();
    if (this.livePnlText) {
      this.livePnlText.visible = false;
    }
  }

  public destroy() {
    if (this.livePnlText) {
      this.livePnlText.destroy();
      this.livePnlText = null;
    }
    this.tradeLinesLayer.destroy();
    this.activeTradeLineLayer.destroy();
    this.livePnlBadgeGfx.destroy();
  }
}
