/**
 * BULLIMIA PIXI.JS INDIE ARCADE GAME ENGINE
 * Modular WebGL 2D engine coordinating decoupled subsystems:
 * - BackgroundParallax: Multi-layer cyberpunk skyline & retro grid
 * - TerrainRenderer: Candlestick bodies, wicks, volume
 * - FogCorridorOverlay: Shrouded Fog of War & glowing spread rails
 * - MonteCarloFanOverlay: 20-path stochastic volatility surface
 * - TradeOverlays: MT5 trade vectors & live floating position PnL badge
 * - BullActor & BearActor: Handcrafted vector kinematics with galloping cycles
 * - DeathAnimationController: Margin call liquidation tumble & explosion
 * - ParticleEmitter: Hoof sparks, spinning gold coins, steam puffs
 * - EngineInputController: Kinetic spacebar charging & deadzones
 */

import * as PIXI from 'pixi.js';
import { get } from 'svelte/store';
import type { Candle, LevelData, PositionSide, TradeRecord } from '../types';
import {
  account,
  executeOrder,
  isTradingActive,
  timeDilation,
  updateMarkToMarket,
} from '../stores/trading';
import { soundEngine } from '../audio/soundtrack';

import { priceToScreenY } from './core/coordinate_map';
import { EngineInputController } from './input/input_controller';
import { BullActor } from './actors/bull_actor';
import { BearActor } from './actors/bear_actor';
import { DeathAnimationController } from './actors/death_animation';
import { TerrainRenderer } from './overlays/terrain_renderer';
import { FogCorridorOverlay } from './overlays/fog_corridor';
import { MonteCarloFanOverlay } from './overlays/monte_carlo_fan';
import { TradeOverlays } from './overlays/trade_overlays';
import { BackgroundParallax } from './fx/background_parallax';
import { ParticleEmitter } from './fx/particle_emitter';

export class BullimiaPixiEngine {
  public app: PIXI.Application | null = null;
  private container: HTMLDivElement;

  // Scene Graph Layers
  private backgroundLayer: PIXI.Container = new PIXI.Container();
  private characterLayer: PIXI.Container = new PIXI.Container();

  // Subsystems
  private parallax: BackgroundParallax = new BackgroundParallax();
  private terrain: TerrainRenderer = new TerrainRenderer();
  private fogCorridor: FogCorridorOverlay = new FogCorridorOverlay();
  private monteCarlo: MonteCarloFanOverlay = new MonteCarloFanOverlay();
  private tradeOverlays: TradeOverlays = new TradeOverlays();
  private bull: BullActor = new BullActor();
  private bear: BearActor = new BearActor();
  private death: DeathAnimationController = new DeathAnimationController();
  private particles: ParticleEmitter = new ParticleEmitter();
  private inputController: EngineInputController | null = null;

  // Lifecycle & Observers
  private resizeObserver: ResizeObserver | null = null;
  private accountUnsub: (() => void) | null = null;

  // Simulation State
  private level: LevelData | null = null;
  private candles: Candle[] = [];
  private trades: TradeRecord[] = [];
  private playerProgress: number = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private currentPrice: number = 100.0;
  private initialPrice: number = 100.0;
  private logScale: number = 1700.0;
  private avgAtrPct: number = 0.028;

  // Autoscroll & Layout Parameters
  private candleWidth: number = 32;
  private candleGap: number = 16;
  private candleStep: number = 48; // candleWidth + candleGap
  private scrollSpeed: number = 0.55;
  private side: PositionSide = 'BULL';

  // Animation Timers & Camera Shake
  private animTime: number = 0;
  private runCycle: number = 0;
  private mcCycleTimer: number = 0;
  private shakeIntensity: number = 0;
  private shakeTimer: number = 0;

  // Entry Tracking
  private activeEntryPrice: number = 0;
  private activeEntryCandleIdx: number = 0;

  constructor(container: HTMLDivElement) {
    this.container = container;
  }

  public async init() {
    this.app = new PIXI.Application();
    await this.app.init({
      resizeTo: this.container,
      backgroundColor: 0x05070e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      powerPreference: 'high-performance',
    });

    this.container.appendChild(this.app.canvas);

    // Build Scene Graph Hierarchy
    this.app.stage.addChild(this.backgroundLayer);

    this.backgroundLayer.addChild(this.parallax.container);
    this.backgroundLayer.addChild(this.tradeOverlays.tradeLinesLayer);
    this.backgroundLayer.addChild(this.terrain.layer);
    this.backgroundLayer.addChild(this.monteCarlo.layer);
    this.backgroundLayer.addChild(this.fogCorridor.layer);
    this.backgroundLayer.addChild(this.tradeOverlays.activeTradeLineLayer);
    this.backgroundLayer.addChild(this.particles.layer);
    this.backgroundLayer.addChild(this.characterLayer);

    this.characterLayer.addChild(this.bull.container);
    this.characterLayer.addChild(this.bear.container);
    this.characterLayer.addChild(this.tradeOverlays.livePnlBadgeGfx);
    if (this.tradeOverlays.livePnlText) {
      this.characterLayer.addChild(this.tradeOverlays.livePnlText);
    }

    this.bear.setVisible(false);

    // Setup Input Subsystem
    this.inputController = new EngineInputController({
      onFlipPosition: (lots) => this.flipAndExecute(lots),
      onFlatten: () => this.flattenToCash(),
    });

    // ResizeObserver for automatic WebGL viewport recalibration
    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.resize(width, height);
          }
        }
      });
      this.resizeObserver.observe(this.container);
    }

    // Account Solvency Listener (triggers liquidation death sequence)
    this.accountUnsub = account.subscribe((acc) => {
      if (acc.is_margin_called && !this.death.isDead) {
        this.triggerDeath();
      }
    });

    // Main 60 FPS Engine Tick
    this.app.ticker.add((ticker) => {
      this.update(ticker.deltaTime / 60);
      this.render();
    });
  }

  public triggerDeath() {
    this.death.triggerDeath(
      this.playerX,
      this.playerY,
      (x, y, col, count) => this.particles.spawnSparks(x, y, col, count),
      (intensity, duration) => this.addShake(intensity, duration)
    );
    this.tradeOverlays.clear();
  }

  public resetCharacterState() {
    this.death.reset(this.bull, this.bear);
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.inputController?.reset();
    this.particles.clear();
    this.tradeOverlays.clear();

    if (this.candles.length > 0) {
      const currentIdx = Math.max(0, Math.min(Math.floor(this.playerProgress), this.candles.length - 1));
      const c = this.candles[currentIdx];
      if (c) {
        this.playerX = currentIdx * this.candleStep;
        this.playerY = this.side === 'BULL' ? this.priceToScreenY(c.high) - 24 : this.priceToScreenY(c.low) + 24;
      }
    }

    const screenW = this.app?.screen.width && this.app.screen.width > 0 ? this.app.screen.width : 1200;
    const screenH = this.app?.screen.height && this.app.screen.height > 0 ? this.app.screen.height : 700;
    this.cameraX = this.playerX - screenW * 0.5;
    this.cameraY = this.playerY - screenH * 0.5;
  }

  public addShake(intensity: number = 6, duration: number = 0.25) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  public setLevel(
    level: LevelData,
    startCandleIdx?: number,
    restoredPosition?: { side: PositionSide; lots: number; entryPrice: number } | null,
    autoStartOrder: boolean = false
  ) {
    this.resetCharacterState();
    this.level = level;
    this.candles = level.candles;
    this.avgAtrPct = level.avg_atr_pct || 0.028;
    this.logScale = level.log_scale || Math.round(48.0 / this.avgAtrPct);
    this.initialPrice = level.initial_price || 100.0;

    const targetIdx = startCandleIdx !== undefined ? startCandleIdx : (level.start_index || 0);
    this.playerProgress = targetIdx;
    this.currentPrice = this.candles[Math.floor(targetIdx)]?.open || this.initialPrice;

    if (restoredPosition && restoredPosition.side !== 'FLAT') {
      this.side = restoredPosition.side;
      this.activeEntryPrice = restoredPosition.entryPrice;
      this.activeEntryCandleIdx = Math.floor(targetIdx);
      this.bull.setVisible(this.side === 'BULL');
      this.bear.setVisible(this.side === 'BEAR');
    } else {
      this.side = 'BULL';
      this.bull.setVisible(true);
      this.bear.setVisible(false);
      this.activeEntryPrice = this.currentPrice;
      this.activeEntryCandleIdx = Math.floor(targetIdx);
      if (get(isTradingActive) || autoStartOrder) {
        const candle = this.candles[Math.floor(targetIdx)] || { open: 100, close: 100, high: 100, low: 100, date: '2020-01-01' };
        executeOrder(level.ticker, 'BULL', 1, this.currentPrice, candle.date, this.avgAtrPct, Math.floor(targetIdx));
      }
    }

    const candle = this.candles[Math.floor(targetIdx)] || { open: 100, close: 100, high: 100, low: 100 };
    this.playerX = targetIdx * this.candleStep;
    this.playerY = this.side === 'BULL' ? this.priceToScreenY(candle.high) - 24 : this.priceToScreenY(candle.low) + 24;

    const screenW = this.app?.screen.width || 1200;
    const screenH = this.app?.screen.height || 700;
    this.cameraX = this.playerX - screenW * 0.5;
    this.cameraY = this.playerY - screenH * 0.5;
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
    const screenH = (this.app?.screen.height && this.app.screen.height > 0)
      ? this.app.screen.height
      : (this.container?.clientHeight && this.container.clientHeight > 0 ? this.container.clientHeight : 600);
    return priceToScreenY(price, this.initialPrice, this.logScale, screenH);
  }

  public resize(width?: number, height?: number) {
    if (!this.app || !this.app.renderer || !this.container) return;
    const w = width ?? this.container.clientWidth;
    const h = height ?? this.container.clientHeight;
    if (w <= 0 || h <= 0) return;

    this.app.renderer.resize(w, h);
    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;
    this.cameraX = this.playerX - screenW * 0.5;
    this.cameraY = this.playerY - screenH * 0.5;
  }

  public flattenToCash() {
    if (!this.level || this.candles.length === 0) return;
    const currentIdx = Math.floor(this.playerProgress);
    const candle = this.candles[currentIdx] || this.candles[0];
    this.side = 'FLAT';
    executeOrder(this.level.ticker, 'FLAT', 1, this.currentPrice, candle.date, this.avgAtrPct, currentIdx);
    this.addShake(4, 0.2);
    this.particles.spawnSparks(this.playerX, this.playerY, 0x00e5ff, 25);
    this.bull.setVisible(true);
    this.bear.setVisible(false);
    this.bull.setAlpha(0.65);
  }

  private flipAndExecute(lots: number) {
    if (!this.level || this.candles.length === 0) return;
    const currentIdx = Math.floor(this.playerProgress);
    const candle = this.candles[currentIdx] || this.candles[0];

    const nextSide: PositionSide = this.side === 'BULL' ? 'BEAR' : 'BULL';
    this.side = nextSide;
    this.activeEntryPrice = this.currentPrice;
    this.activeEntryCandleIdx = currentIdx;

    this.bull.setVisible(this.side === 'BULL');
    this.bear.setVisible(this.side === 'BEAR');
    this.bull.setAlpha(1.0);
    this.bear.setAlpha(1.0);

    executeOrder(this.level.ticker, nextSide, lots, this.currentPrice, candle.date, this.avgAtrPct, currentIdx);

    this.addShake(6, 0.25);
    const color = nextSide === 'BULL' ? 0x00f59b : 0xff2e63;
    this.particles.spawnSparks(this.playerX, this.playerY, color, 30);
  }

  public spawnSparks(worldX: number, worldY: number, color: number, count: number) {
    this.particles.spawnSparks(worldX, worldY, color, count);
  }

  public spawnCoins(worldX: number, worldY: number, count: number = 8) {
    this.particles.spawnCoins(worldX, worldY, count);
  }

  public spawnSteam(worldX: number, worldY: number, count: number = 2) {
    this.particles.spawnSteam(worldX, worldY, count);
  }

  private update(dt: number) {
    if (!this.level || this.candles.length === 0) return;
    if (this.container && (this.container.clientWidth <= 0 || this.container.clientHeight <= 0)) return;

    // Handle Death Tumble & Explosion
    const isHandlingDeath = this.death.update(
      dt,
      { x: this.playerX, y: this.playerY },
      { x: this.cameraX, y: this.cameraY },
      this.bull,
      this.bear,
      (x, y, col, count) => this.particles.spawnSparks(x, y, col, count)
    );
    if (isHandlingDeath) {
      this.particles.update(dt, this.cameraX, this.cameraY);
      return;
    }

    this.animTime += dt;
    this.runCycle += dt * 14;

    // Monte Carlo 1.2s recalibration cycle
    this.mcCycleTimer += dt;
    if (this.mcCycleTimer > 1.2) {
      this.mcCycleTimer = 0;
      this.monteCarlo.cyclePaths();
    }

    // Input spacebar charge update
    this.inputController?.updateCharge();

    if (!get(isTradingActive)) return;

    // Time Dilation & Autoscroll Velocity
    let speedMult = 1.0;
    timeDilation.subscribe((v) => (speedMult = v))();
    const effectiveSpeed = this.scrollSpeed * speedMult;
    this.playerProgress += effectiveSpeed * dt;

    if (this.playerProgress >= this.candles.length - 1) {
      this.playerProgress = this.candles.length - 1;
    }

    const currentIdx = Math.floor(this.playerProgress);
    const frac = this.playerProgress - currentIdx;
    const c1 = this.candles[currentIdx];
    const c2 = this.candles[Math.min(this.candles.length - 1, currentIdx + 1)];

    this.currentPrice = c1.close + (c2.open - c1.close) * frac;
    this.playerX = this.playerProgress * this.candleStep;

    const top1 = this.priceToScreenY(Math.max(c1.high, c1.close));
    const top2 = this.priceToScreenY(Math.max(c2.high, c2.close));
    const candleTopY = top1 + (top2 - top1) * frac;

    const bot1 = this.priceToScreenY(Math.min(c1.low, c1.close));
    const bot2 = this.priceToScreenY(Math.min(c2.low, c2.close));
    const candleBottomY = bot1 + (bot2 - bot1) * frac;

    const targetY = this.side === 'BULL' ? candleTopY - 24 : candleBottomY + 24;
    this.playerY += (targetY - this.playerY) * 0.16;

    // Spacebar Holding Vibration & Electrical Discharges
    let vibX = 0;
    let vibY = 0;
    if (this.inputController?.spaceHeld) {
      const duration = (performance.now() - this.inputController.chargeStartTime) / 1000;
      const progress = duration > 0.20 ? Math.min(1.0, (duration - 0.20) / 2.0) : 0.0;
      if (progress > 0) {
        soundEngine.playVibrateCharge(progress);
        const amp = 4.0 + progress * 16.0;
        vibX = (Math.random() - 0.5) * amp;
        vibY = (Math.random() - 0.5) * amp;

        if (Math.random() < 0.7) {
          const sparkCol = this.side === 'BULL' ? 0x00e5ff : 0xff0055;
          this.particles.spawnSparks(this.playerX + (Math.random() * 24 - 12), this.playerY + (Math.random() * 24 - 12), sparkCol, 2);
        }
        if (Math.random() < 0.35) {
          this.particles.spawnSteam(this.playerX + 20, this.playerY, 1);
        }
      }
    }

    // Screen Shake Update
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const decay = Math.max(0, this.shakeTimer / 0.25);
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * decay * 2;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * decay * 2;
    }

    // Centered Camera Tracking (Locked firmly at 50% screen width horizontally)
    const screenW = this.app?.screen.width || 1200;
    const screenH = this.app?.screen.height || 700;
    this.cameraX = this.playerX - screenW * 0.5;
    this.cameraY += (this.playerY - screenH * 0.5 - this.cameraY) * 0.14;

    const charScreenX = this.playerX - this.cameraX + vibX + shakeX;
    const charScreenY = this.playerY - this.cameraY + vibY + shakeY;

    this.bull.setPosition(charScreenX, charScreenY);
    this.bear.setPosition(charScreenX, charScreenY);

    const isCharging = this.inputController?.spaceHeld ?? false;
    this.bull.render(this.runCycle, isCharging);
    this.bear.render(this.runCycle, isCharging);

    // Instantaneous 60 FPS mark-to-market
    updateMarkToMarket(this.currentPrice, this.avgAtrPct);

    // Live Position PnL Badge tracking character
    this.tradeOverlays.renderLivePositionPnl(
      charScreenX,
      charScreenY,
      this.side,
      this.death.isDead,
      this.activeEntryPrice,
      this.activeEntryCandleIdx,
      this.candleStep,
      this.cameraX,
      this.cameraY,
      this.initialPrice,
      this.logScale,
      screenH
    );

    // Update Particles
    this.particles.update(dt, this.cameraX, this.cameraY);

    // Running hoof sparks
    if (Math.random() < 0.35) {
      const col = this.side === 'BULL' ? 0x00f59b : 0xff2e63;
      this.particles.spawnSparks(this.playerX - 16, this.playerY, col, 1);
    }
  }

  private render() {
    if (this.container && (this.container.clientWidth <= 0 || this.container.clientHeight <= 0)) return;
    const screenW = this.app?.screen.width && this.app.screen.width > 0 ? this.app.screen.width : (this.container?.clientWidth || 1200);
    const screenH = this.app?.screen.height && this.app.screen.height > 0 ? this.app.screen.height : (this.container?.clientHeight || 700);

    // 1. Parallax Sky & Skyline
    this.parallax.render(screenW, screenH, this.cameraX, this.cameraY, this.animTime);

    // 2. Candlestick Terrain
    this.terrain.render(
      this.candles,
      this.playerProgress,
      this.candleStep,
      this.candleWidth,
      this.cameraX,
      this.cameraY,
      screenW,
      this.initialPrice,
      this.logScale,
      screenH
    );

    // 3. MT5 Trade Connection Lines
    this.tradeOverlays.renderHistoricalTrades(
      this.trades,
      this.candleStep,
      this.cameraX,
      this.cameraY,
      this.initialPrice,
      this.logScale,
      screenH
    );

    // 4. Fog of War Corridor & Spread Rails
    this.fogCorridor.render(
      this.playerX,
      this.cameraX,
      this.cameraY,
      this.currentPrice,
      this.avgAtrPct,
      screenW,
      this.initialPrice,
      this.logScale,
      screenH,
      this.animTime
    );

    // 5. Dynamic 20-Path Monte Carlo Fan
    this.monteCarlo.render(
      this.playerX,
      this.cameraX,
      this.cameraY,
      this.currentPrice,
      this.avgAtrPct,
      this.logScale,
      this.initialPrice,
      screenH,
      this.animTime
    );
  }

  public destroy() {
    this.inputController?.destroy();
    this.inputController = null;

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.accountUnsub) {
      this.accountUnsub();
      this.accountUnsub = null;
    }

    this.tradeOverlays.destroy();

    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
  }
}
