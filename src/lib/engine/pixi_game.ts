/**
 * BULLIMIA PIXI.JS HARDWARE-ACCELERATED AUTOSCROLLER ENGINE
 * High-performance WebGL 2D renderer for candlestick terrain,
 * Bull/Bear characters, Fog of War, Monte Carlo volatility surface,
 * MT5 trade connection lines, and rich particle systems.
 */

import * as PIXI from 'pixi.js';
import { get } from 'svelte/store';
import type { Candle, LevelData, PositionSide, TradeRecord } from '../types';
import { executeOrder, updateMarkToMarket, chargeProgress, isCharging, chargedLots, timeDilation, isTradingActive } from '../stores/trading';
import { soundEngine } from '../audio/soundtrack';

export class BullimiaPixiEngine {
  public app: PIXI.Application | null = null;
  private container: HTMLDivElement;

  // Render layers
  private backgroundLayer: PIXI.Container = new PIXI.Container();
  private gridLayer: PIXI.Graphics = new PIXI.Graphics();
  private tradeLinesLayer: PIXI.Graphics = new PIXI.Graphics();
  private terrainLayer: PIXI.Graphics = new PIXI.Graphics();
  private fogOfWarLayer: PIXI.Graphics = new PIXI.Graphics();
  private monteCarloLayer: PIXI.Graphics = new PIXI.Graphics();
  private particlesLayer: PIXI.Container = new PIXI.Container();
  private characterLayer: PIXI.Container = new PIXI.Container();
  private hudOverlayLayer: PIXI.Container = new PIXI.Container();

  // Character Graphic entities
  private bullGraphic: PIXI.Graphics = new PIXI.Graphics();
  private bearGraphic: PIXI.Graphics = new PIXI.Graphics();
  private lotText: PIXI.Text = new PIXI.Text({ text: '', style: { fontFamily: 'JetBrains Mono', fontSize: 13, fill: 0x00e5ff, fontWeight: 'bold' } });
  private lotBadgeBg: PIXI.Graphics = new PIXI.Graphics();

  // Simulation State
  private level: LevelData | null = null;
  private candles: Candle[] = [];
  private trades: TradeRecord[] = [];
  private playerProgress: number = 0; // Float index in candle array
  private playerX: number = 0;
  private playerY: number = 0;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private currentPrice: number = 100.0;
  private initialPrice: number = 100.0;
  private logScale: number = 1700.0;
  private avgAtrPct: number = 0.028;

  // Autoscroll & Controls
  private candleWidth: number = 26;
  private candleGap: number = 14;
  private candleStep: number = 40; // candleWidth + candleGap
  private scrollSpeed: number = 1.6; // candles per second
  private side: PositionSide = 'FLAT';
  private spaceHeld: boolean = false;
  private chargeStartTime: number = 0;
  private lastExecutedCandleIdx: number = -1;

  // Particles
  private particles: Array<{
    sprite: PIXI.Graphics;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: number;
    scale: number;
  }> = [];

  // Monte Carlo Animation Time
  private animTime: number = 0;

  constructor(container: HTMLDivElement) {
    this.container = container;
  }

  public async init() {
    this.app = new PIXI.Application();
    await this.app.init({
      resizeTo: this.container,
      backgroundColor: 0x08090c,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.container.appendChild(this.app.canvas);

    // Build scene graph
    this.app.stage.addChild(this.backgroundLayer);
    this.backgroundLayer.addChild(this.gridLayer);
    this.backgroundLayer.addChild(this.tradeLinesLayer);
    this.backgroundLayer.addChild(this.terrainLayer);
    this.backgroundLayer.addChild(this.monteCarloLayer);
    this.backgroundLayer.addChild(this.fogOfWarLayer);
    this.backgroundLayer.addChild(this.particlesLayer);
    this.backgroundLayer.addChild(this.characterLayer);
    this.app.stage.addChild(this.hudOverlayLayer);

    this.setupCharacter();
    this.setupInputListeners();

    // Start 60fps game ticker
    this.app.ticker.add((ticker) => {
      this.update(ticker.deltaTime / 60);
      this.render();
    });
  }

  private setupCharacter() {
    // 1. Draw Cyber-Bull (Emerald neon silhouette with horns)
    this.bullGraphic.clear();
    // Bull Body
    this.bullGraphic.roundRect(-24, -14, 48, 28, 6);
    this.bullGraphic.fill({ color: 0x00f59b, alpha: 0.9 });
    this.bullGraphic.stroke({ color: 0xffffff, width: 2, alpha: 0.8 });
    // Horns
    this.bullGraphic.moveTo(18, -12);
    this.bullGraphic.lineTo(32, -22);
    this.bullGraphic.lineTo(24, -8);
    this.bullGraphic.fill({ color: 0xffd166 });
    // Eye
    this.bullGraphic.circle(12, -4, 3);
    this.bullGraphic.fill({ color: 0x08090c });

    // 2. Draw Cyber-Bear (Crimson neon silhouette with claws)
    this.bearGraphic.clear();
    this.bearGraphic.roundRect(-24, -14, 48, 28, 6);
    this.bearGraphic.fill({ color: 0xff2e63, alpha: 0.9 });
    this.bearGraphic.stroke({ color: 0xffffff, width: 2, alpha: 0.8 });
    // Claws / Ears
    this.bearGraphic.moveTo(18, 12);
    this.bearGraphic.lineTo(30, 20);
    this.bearGraphic.lineTo(22, 6);
    this.bearGraphic.fill({ color: 0xffd166 });
    // Eye
    this.bearGraphic.circle(12, 4, 3);
    this.bearGraphic.fill({ color: 0x08090c });

    this.characterLayer.addChild(this.bullGraphic);
    this.characterLayer.addChild(this.bearGraphic);
    this.bearGraphic.visible = false;

    // Lot Badge Text and Background
    this.characterLayer.addChild(this.lotBadgeBg);
    this.characterLayer.addChild(this.lotText);
    this.lotText.anchor.set(0.5, 0.5);
    this.lotBadgeBg.visible = false;
    this.lotText.visible = false;
  }

  public setLevel(
    level: LevelData,
    startCandleIdx?: number,
    restoredPosition?: { side: PositionSide; lots: number; entryPrice: number } | null
  ) {
    this.level = level;
    this.candles = level.candles;
    this.avgAtrPct = level.avg_atr_pct || 0.028;
    this.logScale = level.log_scale || 1700.0;

    const targetIdx = (startCandleIdx !== undefined && startCandleIdx >= 0 && startCandleIdx < this.candles.length)
      ? startCandleIdx
      : level.start_index;
    this.playerProgress = targetIdx;
    this.initialPrice = level.initial_price;
    this.currentPrice = this.candles[Math.floor(targetIdx)]?.close || level.initial_price;

    if (restoredPosition && restoredPosition.side !== 'FLAT') {
      this.side = restoredPosition.side;
      this.bullGraphic.visible = this.side === 'BULL';
      this.bearGraphic.visible = this.side === 'BEAR';
    } else {
      this.side = 'BULL';
      this.bullGraphic.visible = true;
      this.bearGraphic.visible = false;
      if (get(isTradingActive)) {
        const candle = this.candles[Math.floor(targetIdx)] || { open: 100, close: 100, high: 100, low: 100, date: '2020-01-01' };
        executeOrder(level.ticker, 'BULL', 1, this.currentPrice, candle.date, this.avgAtrPct);
      }
    }

    const candle = this.candles[Math.floor(targetIdx)] || { open: 100, close: 100, high: 100, low: 100 };
    this.playerX = targetIdx * this.candleStep;
    this.playerY = this.side === 'BULL' ? this.priceToScreenY(candle.high) - 22 : this.priceToScreenY(candle.low) + 22;
    this.cameraX = this.playerX - 300;
    this.cameraY = this.playerY;
  }

  public getPlayerProgress(): number {
    return this.playerProgress;
  }

  public getCurrentSide(): PositionSide {
    return this.side;
  }

  public setTrades(trades: TradeRecord[]) {
    this.trades = trades;
  }

  public priceToScreenY(price: number): number {
    const centerY = (this.app?.screen.height || 600) / 2;
    if (price <= 0 || this.initialPrice <= 0) return centerY;
    const logRatio = Math.log(price / this.initialPrice);
    return centerY - logRatio * this.logScale;
  }

  private setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        if (!get(isTradingActive)) return;
        soundEngine.resume();
        this.spaceHeld = true;
        this.chargeStartTime = performance.now();
        isCharging.set(true);
        chargeProgress.set(0.0);
      } else if (e.code === 'Escape' && this.spaceHeld) {
        if (!get(isTradingActive)) return;
        // Phase 2 unlock: SPACE + ESC Neutral Cash Flatten
        this.flattenToCash();
        this.spaceHeld = false;
        isCharging.set(false);
        chargeProgress.set(0.0);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && this.spaceHeld) {
        if (!get(isTradingActive)) return;
        const duration = (performance.now() - this.chargeStartTime) / 1000;
        // Sizing progression: 0s -> 1 lot, 2.5s -> 100 lots
        const ratio = Math.min(1.0, duration / 2.5);
        const lots = Math.max(1, Math.min(100, Math.floor(1 + ratio * 99)));

        this.flipAndExecute(lots);

        this.spaceHeld = false;
        isCharging.set(false);
        chargeProgress.set(0.0);
      }
    });
  }

  public flattenToCash() {
    if (!this.level || this.candles.length === 0) return;
    const currentIdx = Math.floor(this.playerProgress);
    const candle = this.candles[currentIdx] || this.candles[0];
    this.side = 'FLAT';
    executeOrder(this.level.ticker, 'FLAT', 1, this.currentPrice, candle.date, this.avgAtrPct);
    this.spawnSparks(this.playerX, this.playerY, 0x00e5ff, 25);
  }

  private flipAndExecute(lots: number) {
    if (!this.level || this.candles.length === 0) return;
    const currentIdx = Math.floor(this.playerProgress);
    const candle = this.candles[currentIdx] || this.candles[0];

    // Flip side: BULL -> BEAR, BEAR -> BULL, FLAT -> BULL
    const nextSide: PositionSide = this.side === 'BULL' ? 'BEAR' : 'BULL';
    this.side = nextSide;

    // Character visibility
    this.bullGraphic.visible = this.side === 'BULL';
    this.bearGraphic.visible = this.side === 'BEAR';

    // Execute order with Quant Kernel
    executeOrder(this.level.ticker, nextSide, lots, this.currentPrice, candle.date, this.avgAtrPct);

    // Visual burst
    const color = nextSide === 'BULL' ? 0x00f59b : 0xff2e63;
    this.spawnSparks(this.playerX, this.playerY, color, 30);
  }

  private update(dt: number) {
    if (!this.level || this.candles.length === 0) return;

    this.animTime += dt;

    if (!get(isTradingActive)) {
      return;
    }

    // 1. Time Dilation & Movement
    let speedMult = 1.0;
    timeDilation.subscribe((v) => (speedMult = v))();
    const effectiveSpeed = this.scrollSpeed * speedMult;
    this.playerProgress += effectiveSpeed * dt;

    // Check bounds
    if (this.playerProgress >= this.candles.length - 1) {
      this.playerProgress = this.candles.length - 1;
    }

    const currentIdx = Math.floor(this.playerProgress);
    const frac = this.playerProgress - currentIdx;
    const c1 = this.candles[currentIdx];
    const c2 = this.candles[Math.min(this.candles.length - 1, currentIdx + 1)];

    // Interpolate current price
    this.currentPrice = c1.close + (c2.open - c1.close) * frac;

    // World Coordinates
    this.playerX = this.playerProgress * this.candleStep;

    // Bull runs on high wick / upper edge; Bear hangs on low wick / lower edge
    const candleTopY = this.priceToScreenY(Math.max(c1.high, c1.close));
    const candleBottomY = this.priceToScreenY(Math.min(c1.low, c1.close));

    const targetY = this.side === 'BULL' ? candleTopY - 22 : candleBottomY + 22;
    this.playerY += (targetY - this.playerY) * 0.15;

    // Handle Vibration Charge
    let vibX = 0;
    let vibY = 0;
    if (this.spaceHeld) {
      const duration = (performance.now() - this.chargeStartTime) / 1000;
      const progress = Math.min(1.0, duration / 2.5);
      chargeProgress.set(progress);
      soundEngine.playVibrateCharge(progress);

      const amp = progress * 12;
      vibX = (Math.random() - 0.5) * amp;
      vibY = (Math.random() - 0.5) * amp;

      // Update badge
      let lots = 1;
      chargedLots.subscribe((l) => (lots = l))();
      this.lotText.text = `+${lots} L`;
      this.lotText.visible = true;
      this.lotBadgeBg.visible = true;
    } else {
      this.lotText.visible = false;
      this.lotBadgeBg.visible = false;
    }

    // Set Character Screen Position relative to Camera
    const screenW = this.app?.screen.width || 1200;
    const screenH = this.app?.screen.height || 700;

    // Camera tracks player
    const targetCamX = this.playerX - screenW * 0.32;
    const targetCamY = this.playerY - screenH * 0.5;
    this.cameraX += (targetCamX - this.cameraX) * 0.1;
    this.cameraY += (targetCamY - this.cameraY) * 0.08;

    const charScreenX = this.playerX - this.cameraX + vibX;
    const charScreenY = this.playerY - this.cameraY + vibY;

    this.bullGraphic.position.set(charScreenX, charScreenY);
    this.bearGraphic.position.set(charScreenX, charScreenY);

    // Lot Badge Position above character
    const badgeY = this.side === 'BULL' ? charScreenY - 32 : charScreenY + 32;
    this.lotText.position.set(charScreenX, badgeY);
    this.lotBadgeBg.clear();
    this.lotBadgeBg.roundRect(charScreenX - 30, badgeY - 12, 60, 24, 4);
    this.lotBadgeBg.fill({ color: 0x101217, alpha: 0.85 });
    this.lotBadgeBg.stroke({ color: 0x00e5ff, width: 1.5 });

    // Periodic Mark-to-Market sync
    if (currentIdx !== this.lastExecutedCandleIdx) {
      this.lastExecutedCandleIdx = currentIdx;
      updateMarkToMarket(this.currentPrice, this.avgAtrPct);
    }

    // Update Particles
    this.updateParticles(dt);

    // Trail particle
    if (Math.random() < 0.4) {
      const color = this.side === 'BULL' ? 0x00f59b : 0xff2e63;
      this.spawnSparks(this.playerX - 20, this.playerY, color, 1);
    }
  }

  private render() {
    const screenW = this.app?.screen.width || 1200;
    const screenH = this.app?.screen.height || 700;

    // 1. Grid Background
    this.gridLayer.clear();
    this.gridLayer.rect(0, 0, screenW, screenH);
    this.gridLayer.fill({ color: 0x08090c });

    // Subtle grid lines
    const gridSpacing = 60;
    const offsetX = - (this.cameraX % gridSpacing);
    const offsetY = - (this.cameraY % gridSpacing);

    for (let x = offsetX; x < screenW; x += gridSpacing) {
      this.gridLayer.moveTo(x, 0);
      this.gridLayer.lineTo(x, screenH);
      this.gridLayer.stroke({ color: 0x171a21, width: 1, alpha: 0.5 });
    }
    for (let y = offsetY; y < screenH; y += gridSpacing) {
      this.gridLayer.moveTo(0, y);
      this.gridLayer.lineTo(screenW, y);
      this.gridLayer.stroke({ color: 0x171a21, width: 1, alpha: 0.5 });
    }

    // 2. Candlestick Terrain (Only render candles within viewport and up to playerProgress)
    this.terrainLayer.clear();
    const currentIdx = Math.floor(this.playerProgress);

    const minCandle = Math.max(0, Math.floor((this.cameraX - 100) / this.candleStep));
    const maxCandle = Math.min(currentIdx, Math.ceil((this.cameraX + screenW + 100) / this.candleStep));

    for (let i = minCandle; i <= maxCandle; i++) {
      const c = this.candles[i];
      if (!c) continue;

      const screenX = i * this.candleStep - this.cameraX;
      const isBullish = c.close >= c.open;
      const color = isBullish ? 0x00f59b : 0xff2e63;

      const highY = this.priceToScreenY(c.high) - this.cameraY;
      const lowY = this.priceToScreenY(c.low) - this.cameraY;
      const openY = this.priceToScreenY(c.open) - this.cameraY;
      const closeY = this.priceToScreenY(c.close) - this.cameraY;

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(3, Math.abs(closeY - openY));

      // Wick
      this.terrainLayer.moveTo(screenX, highY);
      this.terrainLayer.lineTo(screenX, lowY);
      this.terrainLayer.stroke({ color, width: 1.5, alpha: 0.85 });

      // Body
      this.terrainLayer.roundRect(screenX - this.candleWidth / 2, bodyTop, this.candleWidth, bodyHeight, 3);
      this.terrainLayer.fill({ color, alpha: 0.75 });
      this.terrainLayer.stroke({ color, width: 1, alpha: 0.95 });
    }

    // 3. MT5 Trade Connection Lines
    this.tradeLinesLayer.clear();
    this.trades.forEach((trade) => {
      if (trade.entry_candle_idx !== undefined && trade.exit_candle_idx !== undefined) {
        const startX = trade.entry_candle_idx * this.candleStep - this.cameraX;
        const startY = this.priceToScreenY(trade.entry_price) - this.cameraY;
        const endX = trade.exit_candle_idx * this.candleStep - this.cameraX;
        const endY = this.priceToScreenY(trade.exit_price) - this.cameraY;

        const lineColor = trade.is_win ? 0x00f59b : 0xff2e63;
        this.tradeLinesLayer.moveTo(startX, startY);
        this.tradeLinesLayer.lineTo(endX, endY);
        this.tradeLinesLayer.stroke({ color: lineColor, width: 2, alpha: 0.7 });

        // Entry dot & Exit dot
        this.tradeLinesLayer.circle(startX, startY, 4);
        this.tradeLinesLayer.fill({ color: lineColor });
        this.tradeLinesLayer.circle(endX, endY, 4);
        this.tradeLinesLayer.fill({ color: lineColor });
      }
    });

    // 4. Fog of War & Bid/Ask Corridor Beam
    this.fogOfWarLayer.clear();
    const playerScreenX = this.playerX - this.cameraX;
    const currentPriceY = this.priceToScreenY(this.currentPrice) - this.cameraY;

    // Glowing Price Line ahead of player
    const spread = this.currentPrice * (this.avgAtrPct * 0.05);
    const askY = this.priceToScreenY(this.currentPrice + spread / 2) - this.cameraY;
    const bidY = this.priceToScreenY(this.currentPrice - spread / 2) - this.cameraY;
    const spreadHeight = Math.max(4, Math.abs(bidY - askY));

    // Spread Corridor Beam
    this.fogOfWarLayer.rect(playerScreenX, Math.min(askY, bidY), screenW - playerScreenX, spreadHeight);
    this.fogOfWarLayer.fill({ color: 0x00e5ff, alpha: 0.15 });

    // Center glowing laser line
    this.fogOfWarLayer.moveTo(playerScreenX, currentPriceY);
    this.fogOfWarLayer.lineTo(screenW, currentPriceY);
    this.fogOfWarLayer.stroke({ color: 0x00e5ff, width: 2, alpha: 0.8 });

    // 5. Monte Carlo Volatility Surface Fan
    this.monteCarloLayer.clear();
    const fanSteps = 10;
    const stepDx = 35;
    const paths = [-2.2, -1.4, -0.6, 0, 0.6, 1.4, 2.2];

    paths.forEach((sigma, pIdx) => {
      let px = playerScreenX;
      let py = currentPriceY;
      const alphaWave = 0.2 + Math.sin(this.animTime * 2.5 + pIdx) * 0.1;

      this.monteCarloLayer.moveTo(px, py);
      for (let s = 1; s <= fanSteps; s++) {
        px += stepDx;
        const drift = sigma * Math.sqrt(s) * (this.avgAtrPct * 25) * 8;
        py = currentPriceY + drift;
        this.monteCarloLayer.lineTo(px, py);
      }
      this.monteCarloLayer.stroke({
        color: sigma > 0 ? 0xff2e63 : 0x00f59b,
        width: 1.5,
        alpha: Math.max(0.05, alphaWave),
      });
    });
  }

  private spawnSparks(worldX: number, worldY: number, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const g = new PIXI.Graphics();
      g.circle(0, 0, Math.random() * 2.5 + 1.5);
      g.fill({ color, alpha: 0.9 });
      this.particlesLayer.addChild(g);

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 90 + 30;

      this.particles.push({
        sprite: g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.3,
        color,
        scale: 1.0,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particlesLayer.removeChild(p.sprite);
        p.sprite.destroy();
        this.particles.splice(i, 1);
        continue;
      }

      const ratio = 1 - p.life / p.maxLife;
      p.sprite.alpha = ratio;
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      p.vy += 80 * dt; // subtle gravity
    }
  }

  public destroy() {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
  }
}
