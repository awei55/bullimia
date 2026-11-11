/**
 * BULLIMIA PIXI.JS INDIE ARCADE GAME ENGINE
 * High-performance WebGL 2D renderer featuring:
 * - Handcrafted indie vector art for Bull & Bear with galloping animation cycles
 * - Centered camera tracking with screen shake
 * - Multi-layer parallax cyberpunk skyline & retro perspective grid
 * - Dynamic 20-path stochastic Monte Carlo volatility surface simulation
 * - MT5 trade connection lines with entry/exit markers and realized PnL badges
 * - Floating live position PnL badge tracking the character
 * - Rich particle FX (spinning gold coins, dollar bills, running hoof sparks, lightning arcs)
 */

import * as PIXI from 'pixi.js';
import { get } from 'svelte/store';
import type { Candle, LevelData, PositionSide, TradeRecord } from '../types';
import {
  executeOrder,
  updateMarkToMarket,
  chargeProgress,
  isCharging,
  chargedLots,
  lotMode,
  timeDilation,
  isTradingActive,
  account,
} from '../stores/trading';
import { soundEngine } from '../audio/soundtrack';

interface MonteCarloPath {
  steps: number[];
  targetSteps: number[];
  speed: number;
  phase: number;
  alpha: number;
  isCyan: boolean;
}

interface GameParticle {
  type: 'spark' | 'coin' | 'dollar' | 'steam';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

export class BullimiaPixiEngine {
  public app: PIXI.Application | null = null;
  private container: HTMLDivElement;

  // Scene graph layers
  private backgroundLayer: PIXI.Container = new PIXI.Container();
  private starfieldLayer: PIXI.Graphics = new PIXI.Graphics();
  private skylineFarLayer: PIXI.Graphics = new PIXI.Graphics();
  private skylineMidLayer: PIXI.Graphics = new PIXI.Graphics();
  private gridLayer: PIXI.Graphics = new PIXI.Graphics();
  private tradeLinesLayer: PIXI.Graphics = new PIXI.Graphics();
  private terrainLayer: PIXI.Graphics = new PIXI.Graphics();
  private monteCarloLayer: PIXI.Graphics = new PIXI.Graphics();
  private fogOfWarLayer: PIXI.Graphics = new PIXI.Graphics();
  private activeTradeLineLayer: PIXI.Graphics = new PIXI.Graphics();
  private particlesLayer: PIXI.Graphics = new PIXI.Graphics();
  private characterLayer: PIXI.Container = new PIXI.Container();
  private hudOverlayLayer: PIXI.Graphics = new PIXI.Graphics();

  // Character Graphic Entities
  private bullContainer: PIXI.Container = new PIXI.Container();
  private bearContainer: PIXI.Container = new PIXI.Container();
  private bullBodyGfx: PIXI.Graphics = new PIXI.Graphics();
  private bearBodyGfx: PIXI.Graphics = new PIXI.Graphics();
  private orderBadgeGfx: PIXI.Graphics = new PIXI.Graphics();
  private livePnlBadgeGfx: PIXI.Graphics = new PIXI.Graphics();
  private livePnlText: PIXI.Text | null = null;
  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyup: ((e: KeyboardEvent) => void) | null = null;

  // Simulation State
  private level: LevelData | null = null;
  private candles: Candle[] = [];
  private trades: TradeRecord[] = [];
  private playerProgress: number = 0; // Float index
  private playerX: number = 0;
  private playerY: number = 0;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private currentPrice: number = 100.0;
  private initialPrice: number = 100.0;
  private logScale: number = 1700.0;
  private avgAtrPct: number = 0.028;

  // Autoscroll & Controls
  private candleWidth: number = 32;
  private candleGap: number = 16;
  private candleStep: number = 48; // Width + gap
  private scrollSpeed: number = 1.7; // Candles per second
  private side: PositionSide = 'FLAT';
  private spaceHeld: boolean = false;
  private chargeStartTime: number = 0;
  private lastExecutedCandleIdx: number = -1;

  // Animation & Screen Shake
  private animTime: number = 0;
  private runCycle: number = 0;
  private shakeTimer: number = 0;
  private shakeIntensity: number = 0;

  // Monte Carlo Simulation Engine
  private mcPathsCount: number = 20;
  private mcHorizonSteps: number = 16;
  private mcStepPx: number = 42;
  private mcCycleTimer: number = 0;
  private mcPaths: MonteCarloPath[] = [];

  // Particle System
  private particles: GameParticle[] = [];

  // Death Animation State
  private isDead: boolean = false;
  private deathTimer: number = 0;
  private deathVy: number = 0;
  private deathRotSpeed: number = 0;
  private accountUnsub: (() => void) | null = null;

  // Entry tracking for active trade line
  private activeEntryPrice: number = 0;
  private activeEntryCandleIdx: number = 0;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.initMonteCarlo();
  }

  private initMonteCarlo() {
    this.mcPaths = [];
    for (let k = 0; k < this.mcPathsCount; k++) {
      const steps = [0];
      let val = 0;
      for (let j = 1; j <= this.mcHorizonSteps; j++) {
        const shock = (Math.random() - 0.5) * 2.2;
        val += shock * Math.sqrt(j);
        steps.push(val);
      }
      this.mcPaths.push({
        steps: [...steps],
        targetSteps: [...steps],
        speed: 0.8 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.12 + Math.random() * 0.2,
        isCyan: Math.random() > 0.45,
      });
    }
  }

  private cycleMonteCarlo() {
    for (let k = 0; k < this.mcPathsCount; k++) {
      let val = 0;
      const newSteps = [0];
      for (let j = 1; j <= this.mcHorizonSteps; j++) {
        const shock = (Math.random() - 0.5) * 2.2;
        val += shock * Math.sqrt(j);
        newSteps.push(val);
      }
      this.mcPaths[k].targetSteps = newSteps;
    }
  }

  public async init() {
    this.app = new PIXI.Application();
    await this.app.init({
      resizeTo: this.container,
      backgroundColor: 0x05070e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.container.appendChild(this.app.canvas);

    // Build scene graph
    this.app.stage.addChild(this.backgroundLayer);
    this.backgroundLayer.addChild(this.starfieldLayer);
    this.backgroundLayer.addChild(this.skylineFarLayer);
    this.backgroundLayer.addChild(this.skylineMidLayer);
    this.backgroundLayer.addChild(this.gridLayer);
    this.backgroundLayer.addChild(this.tradeLinesLayer);
    this.backgroundLayer.addChild(this.terrainLayer);
    this.backgroundLayer.addChild(this.monteCarloLayer);
    this.backgroundLayer.addChild(this.fogOfWarLayer);
    this.backgroundLayer.addChild(this.activeTradeLineLayer);
    this.backgroundLayer.addChild(this.particlesLayer);
    this.backgroundLayer.addChild(this.characterLayer);
    this.app.stage.addChild(this.hudOverlayLayer);

    // Assemble character
    this.characterLayer.addChild(this.bullContainer);
    this.characterLayer.addChild(this.bearContainer);
    this.bullContainer.addChild(this.bullBodyGfx);
    this.bearContainer.addChild(this.bearBodyGfx);
    this.characterLayer.addChild(this.orderBadgeGfx);
    this.characterLayer.addChild(this.livePnlBadgeGfx);

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
    this.characterLayer.addChild(this.livePnlText);

    this.bearContainer.visible = false;

    this.setupInputListeners();

    // Listen to account for margin call death animation
    this.accountUnsub = account.subscribe((acc) => {
      if (acc.is_margin_called && !this.isDead) {
        this.triggerDeath();
      }
    });

    // Start 60 FPS ticker
    this.app.ticker.add((ticker) => {
      this.update(ticker.deltaTime / 60);
      this.render();
    });
  }

  public triggerDeath() {
    this.isDead = true;
    this.deathTimer = 0;
    this.deathVy = -240; // Dramatic upward pop before plummeting
    this.deathRotSpeed = (Math.random() > 0.5 ? 1 : -1) * 14; // High-speed arcade tumble
    this.addShake(28, 1.4);
    soundEngine.playDeath();

    // Giant explosion of sparks & shattered debris
    this.spawnSparks(this.playerX, this.playerY, 0xff0055, 60);
    this.spawnSparks(this.playerX, this.playerY, 0xffd700, 30);
    this.spawnSparks(this.playerX, this.playerY, 0xffffff, 20);

    this.livePnlBadgeGfx.clear();
    this.activeTradeLineLayer.clear();
    this.orderBadgeGfx.clear();
  }

  public resetCharacterState() {
    this.isDead = false;
    this.deathTimer = 0;
    this.deathVy = 0;
    this.deathRotSpeed = 0;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.spaceHeld = false;
    this.chargeStartTime = 0;
    chargeProgress.set(0);
    this.bullContainer.rotation = 0;
    this.bearContainer.rotation = 0;
    this.bullContainer.alpha = 1.0;
    this.bearContainer.alpha = 1.0;
    this.bullContainer.position.set(0, 0);
    this.bearContainer.position.set(0, 0);
    this.particles = [];
    this.livePnlBadgeGfx.clear();
    this.activeTradeLineLayer.clear();
    this.orderBadgeGfx.clear();
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
    this.logScale = level.log_scale || 1700.0;

    const targetIdx =
      startCandleIdx !== undefined && startCandleIdx >= 0 && startCandleIdx < this.candles.length
        ? startCandleIdx
        : (level.start_index !== undefined ? level.start_index : 0);
    this.playerProgress = targetIdx;
    this.initialPrice = level.initial_price || this.candles[0]?.open || 100.0;
    this.currentPrice = this.candles[Math.floor(targetIdx)]?.close || this.initialPrice;

    if (restoredPosition && restoredPosition.side !== 'FLAT') {
      this.side = restoredPosition.side;
      this.activeEntryPrice = restoredPosition.entryPrice;
      this.activeEntryCandleIdx = Math.floor(targetIdx);
      this.bullContainer.visible = this.side === 'BULL';
      this.bearContainer.visible = this.side === 'BEAR';
    } else {
      this.side = 'BULL';
      this.bullContainer.visible = true;
      this.bearContainer.visible = false;
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
    this.cameraX = this.playerX - screenW * 0.5; // Perfectly centered
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
    const centerY = (this.app?.screen.height || 600) / 2;
    if (price <= 0 || this.initialPrice <= 0) return centerY;
    const logRatio = Math.log(price / this.initialPrice);
    return centerY - logRatio * this.logScale;
  }

  private setupInputListeners() {
    this.boundKeydown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((document.activeElement?.tagName || '').toLowerCase())) return;
      if (e.code === 'Space' && !e.repeat) {
        if (!get(isTradingActive)) return;
        soundEngine.resume();
        this.spaceHeld = true;
        this.chargeStartTime = performance.now();
        isCharging.set(true);
        chargeProgress.set(0.0);
      } else if (e.code === 'Escape' && this.spaceHeld) {
        if (!get(isTradingActive)) return;
        this.flattenToCash();
        this.spaceHeld = false;
        isCharging.set(false);
        chargeProgress.set(0.0);
      }
    };

    this.boundKeyup = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((document.activeElement?.tagName || '').toLowerCase())) return;
      if (e.code === 'Space' && this.spaceHeld) {
        if (!get(isTradingActive)) return;
        const duration = (performance.now() - this.chargeStartTime) / 1000;

        // Tap deadzone: Quick taps under 200ms default to base lot
        const currentMode = get(lotMode);
        let lots = currentMode === 'MICROLOT' ? 0.01 : 1.0;
        if (duration > 0.20) {
          const chargeDuration = duration - 0.20;
          const ratio = Math.min(1.0, chargeDuration / 2.0); // 2.0s hold to charge to max
          if (currentMode === 'MICROLOT') {
            lots = Number((0.01 + Math.pow(ratio, 1.4) * 0.49).toFixed(2));
          } else {
            lots = Math.max(1, Math.min(100, Math.floor(1 + Math.pow(ratio, 1.4) * 99)));
          }
        }

        this.flipAndExecute(lots);

        this.spaceHeld = false;
        isCharging.set(false);
        chargeProgress.set(0.0);
      }
    };

    window.addEventListener('keydown', this.boundKeydown);
    window.addEventListener('keyup', this.boundKeyup);
  }

  public flattenToCash() {
    if (!this.level || this.candles.length === 0) return;
    const currentIdx = Math.floor(this.playerProgress);
    const candle = this.candles[currentIdx] || this.candles[0];
    this.side = 'FLAT';
    executeOrder(this.level.ticker, 'FLAT', 1, this.currentPrice, candle.date, this.avgAtrPct, currentIdx);
    this.addShake(4, 0.2);
    this.spawnSparks(this.playerX, this.playerY, 0x00e5ff, 25);
  }

  private flipAndExecute(lots: number) {
    if (!this.level || this.candles.length === 0) return;
    const currentIdx = Math.floor(this.playerProgress);
    const candle = this.candles[currentIdx] || this.candles[0];

    // Flip side: BULL -> BEAR, BEAR -> BULL, FLAT -> BULL
    const nextSide: PositionSide = this.side === 'BULL' ? 'BEAR' : 'BULL';
    this.side = nextSide;
    this.activeEntryPrice = this.currentPrice;
    this.activeEntryCandleIdx = currentIdx;

    this.bullContainer.visible = this.side === 'BULL';
    this.bearContainer.visible = this.side === 'BEAR';

    executeOrder(this.level.ticker, nextSide, lots, this.currentPrice, candle.date, this.avgAtrPct, currentIdx);

    this.addShake(6, 0.25);
    const color = nextSide === 'BULL' ? 0x00f59b : 0xff2e63;
    this.spawnSparks(this.playerX, this.playerY, color, 30);
  }

  private update(dt: number) {
    if (!this.level || this.candles.length === 0) return;

    // Handle Character Death Animation when Margin Called
    if (this.isDead) {
      this.deathTimer += dt;
      this.deathVy += 980 * dt; // Gravity pulls character downward into the void
      this.playerY += this.deathVy * dt;

      this.bullContainer.rotation += this.deathRotSpeed * dt;
      this.bearContainer.rotation += this.deathRotSpeed * dt;

      const alpha = Math.max(0, 1 - this.deathTimer / 1.4);
      this.bullContainer.alpha = alpha;
      this.bearContainer.alpha = alpha;

      const charScreenX = this.playerX - this.cameraX;
      const charScreenY = this.playerY - this.cameraY;
      this.bullContainer.position.set(charScreenX, charScreenY);
      this.bearContainer.position.set(charScreenX, charScreenY);

      if (this.deathTimer < 0.8 && Math.random() < 0.6) {
        this.spawnSparks(this.playerX + (Math.random() * 20 - 10), this.playerY + (Math.random() * 20 - 10), 0xff2e63, 3);
      }

      this.updateParticles(dt);
      return;
    }

    this.animTime += dt;
    this.runCycle += dt * 14; // Footstep animation

    // Monte Carlo cycling
    this.mcCycleTimer += dt;
    if (this.mcCycleTimer > 1.2) {
      this.mcCycleTimer = 0;
      this.cycleMonteCarlo();
    }

    if (!get(isTradingActive)) return;

    // Movement & Time Dilation
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

    // Vibration Charging & Energetic Particle Sparks
    let vibX = 0;
    let vibY = 0;
    if (this.spaceHeld) {
      const duration = (performance.now() - this.chargeStartTime) / 1000;
      const progress = duration > 0.20 ? Math.min(1.0, (duration - 0.20) / 2.0) : 0.0;
      chargeProgress.set(progress);

      if (progress > 0) {
        soundEngine.playVibrateCharge(progress);

        const amp = 4.0 + progress * 16.0;
        vibX = (Math.random() - 0.5) * amp;
        vibY = (Math.random() - 0.5) * amp;

        // Charge sparks leaping off character
        if (Math.random() < 0.7) {
          const sparkCol = this.side === 'BULL' ? 0x00e5ff : 0xff0055;
          this.spawnSparks(this.playerX + (Math.random() * 24 - 12), this.playerY + (Math.random() * 24 - 12), sparkCol, 2);
        }

        if (Math.random() < 0.35) {
          this.spawnSteam(this.playerX + 20, this.playerY, 1);
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

    // Centered Camera Tracking (Character horizontally locked at 50% screen width!)
    const screenW = this.app?.screen.width || 1200;
    const screenH = this.app?.screen.height || 700;

    const targetCamX = this.playerX - screenW * 0.5; // Perfectly centered on screen
    const targetCamY = this.playerY - screenH * 0.5;

    // Direct synchronous lock horizontally: completely eliminates start/restart & speed rubberbanding!
    this.cameraX = targetCamX;
    // Smooth responsive vertical camera tracking
    this.cameraY += (targetCamY - this.cameraY) * 0.14;

    const charScreenX = this.playerX - this.cameraX + vibX + shakeX;
    const charScreenY = this.playerY - this.cameraY + vibY + shakeY;

    this.bullContainer.position.set(charScreenX, charScreenY);
    this.bearContainer.position.set(charScreenX, charScreenY);

    // Update Character Galloping Sprites
    this.drawBullCharacter();
    this.drawBearCharacter();

    // Clear order badge gfx to guarantee no rogue lines to (0,0)
    this.orderBadgeGfx.clear();

    // Real-time instantaneous 60 FPS mark-to-market calculation (0ms latency, zero desync)
    updateMarkToMarket(this.currentPrice, this.avgAtrPct);

    // Live Position PnL Badge near character (rendered AFTER mark-to-market so it is 100% current)
    this.drawLivePositionPnl(charScreenX, charScreenY);

    // Update Particles
    this.updateParticles(dt);

    // Hoof sparks while running
    if (Math.random() < 0.35) {
      const col = this.side === 'BULL' ? 0x00f59b : 0xff2e63;
      this.spawnSparks(this.playerX - 16, this.playerY, col, 1);
    }
  }

  // --- Character Rendering: Bull with 4 Galloping Legs, Muscular Torso, Horns, Emerald Eye & Red Tie ---
  private drawBullCharacter() {
    this.bullBodyGfx.clear();
    const g = this.bullBodyGfx;

    const legOffset = Math.sin(this.runCycle) * 8;
    const headBob = Math.sin(this.runCycle * 2) * 2;

    // Muscular Torso (Metallic gold/bronze)
    g.ellipse(0, headBob - 14, 24, 15);
    g.fill({ color: 0xc67d0a });
    g.stroke({ color: 0x8c5200, width: 2 });

    // Muscle highlight contour
    g.ellipse(-4, headBob - 18, 15, 8);
    g.fill({ color: 0xe5a024, alpha: 0.9 });

    // 4 Running Legs (Leg 1 & 2 front, Leg 3 & 4 back)
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
    g.lineTo(2, headBob - 4 + Math.sin(this.runCycle) * 3);
    g.lineTo(4, headBob + Math.sin(this.runCycle) * 3);
    g.lineTo(16, headBob - 7);
    g.closePath();
    g.fill({ color: 0xff1744 });

    // Swishing Tail
    g.moveTo(-22, headBob - 16);
    g.quadraticCurveTo(-30, headBob - 20 + Math.sin(this.runCycle * 1.5) * 6, -34, headBob - 10);
    g.stroke({ color: 0x8c5200, width: 2.5, cap: 'round' });

    // Electric lightning arcs when charging
    if (this.spaceHeld) {
      g.moveTo(Math.random() * 20 - 10, Math.random() * 20 - 25);
      for (let s = 0; s < 3; s++) {
        g.lineTo(Math.random() * 40 - 20, Math.random() * 40 - 25);
      }
      g.stroke({ color: 0x00e5ff, width: 2, alpha: 0.9 });
    }
  }

  // --- Character Rendering: Bear with Grizzly Coat, Claws & Crimson Visor (Runs on underside) ---
  private drawBearCharacter() {
    this.bearBodyGfx.clear();
    const g = this.bearBodyGfx;

    const legOffset = Math.sin(this.runCycle) * 8;
    const headBob = Math.sin(this.runCycle * 2) * 2;

    // Flip vertically for underside running
    this.bearContainer.scale.set(1, -1);

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

    if (this.spaceHeld) {
      g.moveTo(Math.random() * 20 - 10, Math.random() * 20 - 25);
      for (let s = 0; s < 3; s++) {
        g.lineTo(Math.random() * 40 - 20, Math.random() * 40 - 25);
      }
      g.stroke({ color: 0xff2e63, width: 2, alpha: 0.9 });
    }
  }

  // --- Floating Live Position PnL Badge near Character ---
  private drawLivePositionPnl(charX: number, charY: number) {
    this.livePnlBadgeGfx.clear();
    this.activeTradeLineLayer.clear();

    if (this.side === 'FLAT' || this.isDead || !this.activeEntryPrice || this.activeEntryPrice <= 0 || this.activeEntryCandleIdx === undefined) {
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
    const entryScreenX = this.activeEntryCandleIdx * this.candleStep - this.cameraX;
    const entryScreenY = this.priceToScreenY(this.activeEntryPrice) - this.cameraY;

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

  // --- Multi-Layer Parallax Background & Skyline ---
  private renderBackground(screenW: number, screenH: number) {
    // 1. Starfield / Cyber Matrix Sky
    this.starfieldLayer.clear();
    this.starfieldLayer.rect(0, 0, screenW, screenH);
    this.starfieldLayer.fill({ color: 0x04060d });

    // Procedural Stars
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137.5) - (this.cameraX * 0.05)) % screenW;
      const actualX = sx < 0 ? sx + screenW : sx;
      const sy = (i * 83.1) % (screenH * 0.75);
      const twinkle = 0.3 + Math.sin(this.animTime * 3 + i) * 0.25;
      this.starfieldLayer.circle(actualX, sy, (i % 3) + 1);
      this.starfieldLayer.fill({ color: 0x00e5ff, alpha: twinkle });
    }

    // 2. Far Skyline Silhouette (Parallax 0.15x)
    this.skylineFarLayer.clear();
    const farOffset = -((this.cameraX * 0.15) % 240);
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
        this.skylineFarLayer.fill({ color: 0xff1744, alpha: 0.8 + Math.sin(this.animTime * 4) * 0.2 });
      }
    }

    // 3. Mid Skyline Silhouette with Glowing Office Windows (Parallax 0.35x)
    this.skylineMidLayer.clear();
    const midOffset = -((this.cameraX * 0.35) % 180);
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
    const offX = -((this.cameraX) % gridSpacing);
    const offY = -((this.cameraY) % gridSpacing);

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

  private render() {
    const screenW = this.app?.screen.width || 1200;
    const screenH = this.app?.screen.height || 700;

    // 1. Render Multi-Layer Parallax Background
    this.renderBackground(screenW, screenH);

    // 2. Candlestick Terrain
    this.terrainLayer.clear();
    const currentIdx = Math.floor(this.playerProgress);
    const minCandle = Math.max(0, Math.floor((this.cameraX - 120) / this.candleStep));
    const maxCandle = Math.min(currentIdx, Math.ceil((this.cameraX + screenW + 120) / this.candleStep));

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
      const bodyHeight = Math.max(4, Math.abs(closeY - openY));

      // Wick
      this.terrainLayer.moveTo(screenX, highY);
      this.terrainLayer.lineTo(screenX, lowY);
      this.terrainLayer.stroke({ color, width: 2, alpha: 0.85 });

      // Body (Bold cel-shaded with dark outline)
      this.terrainLayer.roundRect(screenX - this.candleWidth / 2, bodyTop, this.candleWidth, bodyHeight, 4);
      this.terrainLayer.fill({ color, alpha: 0.8 });
      this.terrainLayer.stroke({ color: 0x000000, width: 1.5 });
    }

    // 3. MT5 Trade Connection Lines with Entry/Exit Markers and Midpoint PnL Badges
    this.renderMT5TradeLines();

    // 4. Fog of War & Bid/Ask Corridor Beam
    this.renderFogOfWarAndBidAskCorridor(screenW);

    // 5. Dynamic 20-Path Monte Carlo Volatility Surface Simulation
    this.renderMonteCarloFan(screenW);
  }

  // --- MT5 Connection Lines ---
  private renderMT5TradeLines() {
    this.tradeLinesLayer.clear();
    const g = this.tradeLinesLayer;

    this.trades.forEach((trade) => {
      if (trade.entry_candle_idx !== undefined && trade.exit_candle_idx !== undefined) {
        const startX = trade.entry_candle_idx * this.candleStep - this.cameraX;
        const startY = this.priceToScreenY(trade.entry_price) - this.cameraY;
        const endX = trade.exit_candle_idx * this.candleStep - this.cameraX;
        const endY = this.priceToScreenY(trade.exit_price) - this.cameraY;

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

  // --- Fog of War & Bid/Ask Corridor Beam ---
  private renderFogOfWarAndBidAskCorridor(screenW: number) {
    this.fogOfWarLayer.clear();
    const g = this.fogOfWarLayer;

    const playerScreenX = this.playerX - this.cameraX;
    const currentPriceY = this.priceToScreenY(this.currentPrice) - this.cameraY;

    const spread = this.currentPrice * (this.avgAtrPct * 0.05);
    const askY = this.priceToScreenY(this.currentPrice + spread / 2) - this.cameraY;
    const bidY = this.priceToScreenY(this.currentPrice - spread / 2) - this.cameraY;
    const spreadHeight = Math.max(6, Math.abs(bidY - askY));
    const bandTop = currentPriceY - spreadHeight * 0.5;

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
    const pulse = 0.6 + Math.sin(this.animTime * 6) * 0.3;
    g.moveTo(playerScreenX, currentPriceY);
    g.lineTo(screenW, currentPriceY);
    g.stroke({ color: 0x00e5ff, width: 1.5, alpha: pulse });
  }

  // --- Dynamic 20-Path Monte Carlo Volatility Surface Simulation ---
  private renderMonteCarloFan(screenW: number) {
    this.monteCarloLayer.clear();
    const g = this.monteCarloLayer;

    const startX = this.playerX - this.cameraX + 8;
    const startY = this.priceToScreenY(this.currentPrice) - this.cameraY;

    const priceVolPx = Math.max(20, this.logScale * (this.avgAtrPct * 1.5));
    const horizonPx = this.mcHorizonSteps * this.mcStepPx;

    // 1. Upper and Lower 2-Sigma Probability Cones
    g.moveTo(startX, startY);
    for (let j = 1; j <= this.mcHorizonSteps; j++) {
      const x = startX + j * this.mcStepPx;
      const distFactor = Math.sqrt(j / this.mcHorizonSteps);
      const yUp = startY - priceVolPx * 2.0 * distFactor;
      g.lineTo(x, yUp);
    }
    for (let j = this.mcHorizonSteps; j >= 1; j--) {
      const x = startX + j * this.mcStepPx;
      const distFactor = Math.sqrt(j / this.mcHorizonSteps);
      const yDown = startY + priceVolPx * 2.0 * distFactor;
      g.lineTo(x, yDown);
    }
    g.closePath();
    g.fill({ color: 0x00e5ff, alpha: 0.05 });

    // 2. 1-Sigma Boundary Rails
    g.moveTo(startX, startY);
    for (let j = 1; j <= this.mcHorizonSteps; j++) {
      const x = startX + j * this.mcStepPx;
      const y = startY - priceVolPx * 1.0 * Math.sqrt(j / this.mcHorizonSteps);
      g.lineTo(x, y);
    }
    g.stroke({ color: 0x00e5ff, width: 1.2, alpha: 0.25 });

    g.moveTo(startX, startY);
    for (let j = 1; j <= this.mcHorizonSteps; j++) {
      const x = startX + j * this.mcStepPx;
      const y = startY + priceVolPx * 1.0 * Math.sqrt(j / this.mcHorizonSteps);
      g.lineTo(x, y);
    }
    g.stroke({ color: 0x00e5ff, width: 1.2, alpha: 0.25 });

    // 3. 20 Dynamic Stochastic Ghost Paths
    const scaleAmp = priceVolPx * 0.45;

    for (let k = 0; k < this.mcPaths.length; k++) {
      const path = this.mcPaths[k];
      for (let j = 1; j <= this.mcHorizonSteps; j++) {
        path.steps[j] += (path.targetSteps[j] - path.steps[j]) * 0.04;
      }

      const wave = Math.sin(this.animTime * path.speed + path.phase);
      const alpha = Math.max(0.04, path.alpha * (0.6 + 0.4 * wave));
      const color = path.isCyan ? 0x00e5ff : 0xffd700;

      g.moveTo(startX, startY);
      for (let j = 1; j <= this.mcHorizonSteps; j++) {
        const x = startX + j * this.mcStepPx;
        const shockY = path.steps[j] * scaleAmp * 0.35;
        const undulation = Math.sin(this.animTime * 2 + j * 0.5 + path.phase) * (j * 1.2);
        const y = startY + shockY + undulation;
        g.lineTo(x, y);
      }
      g.stroke({ color, width: 1.0, alpha });
    }
  }

  // --- Particles: Hoof Sparks, Gold Coins, Dollar Bills, Steam Puffs ---
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

  private updateParticles(dt: number) {
    this.particlesLayer.clear();
    const g = this.particlesLayer;

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
      const screenX = p.x - this.cameraX;
      const screenY = p.y - this.cameraY;

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

  public destroy() {
    if (this.boundKeydown) {
      window.removeEventListener('keydown', this.boundKeydown);
      this.boundKeydown = null;
    }
    if (this.boundKeyup) {
      window.removeEventListener('keyup', this.boundKeyup);
      this.boundKeyup = null;
    }
    if (this.accountUnsub) {
      this.accountUnsub();
      this.accountUnsub = null;
    }
    if (this.livePnlText) {
      this.livePnlText.destroy();
      this.livePnlText = null;
    }
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
  }
}
