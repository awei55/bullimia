// Bullimia Core Game Loop & Orchestrator
// Connects physics, rendering, input handling, financial simulation, particles, camera and audio

import { Camera } from './camera.js';
import { ParticleSystem } from './particles.js';
import { audio } from './audio.js';
import { InputController } from './input.js';
import { Character } from '../entities/character.js';
import { CandlestickWorld } from '../entities/candlesticks.js';
import { TradingSimulation } from '../trading/simulation.js';

export class GameEngine {
    constructor(canvas, minimap, hud, menuController) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.minimap = minimap;
        this.hud = hud;
        this.menu = menuController;

        this.camera = new Camera(canvas.width, canvas.height);
        this.particles = new ParticleSystem();
        this.input = new InputController();
        this.character = new Character();
        this.world = new CandlestickWorld();
        this.simulation = new TradingSimulation();

        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.currentLevelData = null;

        this.setupWiring();
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.camera.resize(this.canvas.width, this.canvas.height);
    }

    setupWiring() {
        // 1. Input Controller Handlers
        this.input.onChargeStart = () => {
            if (!this.isRunning || this.isPaused || this.simulation.isGameOver) return;
            this.character.setCharging(true, 0, 1);
            audio.startCharge();
        };

        this.input.onChargeUpdate = (progress, lots) => {
            if (!this.isRunning || this.isPaused || this.simulation.isGameOver) return;
            this.character.setCharging(true, progress, lots);
            audio.updateCharge(progress);
        };

        this.input.onFlipOrder = (lots, progress) => {
            if (!this.isRunning || this.isPaused || this.simulation.isGameOver) return;
            this.handlePlayerFlip(lots, progress);
        };

        // 2. Simulation Callbacks
        this.simulation.onMarginCall = (stats) => {
            audio.stopCharge();
            audio.playMarginCall();
            this.camera.addShake(16, 1.2);
            this.character.setCharging(false, 0, 1);
            this.menu.showMarginCall(stats);
        };

        this.simulation.onMillionaire = (stats) => {
            audio.stopCharge();
            audio.playMillionaireFanfare();
            this.particles.spawnMillionaireFireworks(this.character.x, this.character.y);
            this.menu.showMillionaire(stats);
        };
    }

    startLevel(levelData, customStartIdx = null, preserveCareer = true) {
        // If switching assets seamlessly while holding a position, close old position at last market price
        if (preserveCareer && this.simulation.position.direction !== 'FLAT') {
            const spread = this.currentSpread || 0.05;
            const closedTrade = this.simulation.closePosition(
                this.currentPrice || 100,
                spread,
                this.currentDate || '',
                this.character.x
            );
            if (closedTrade) {
                this.world.addCompletedTrade(closedTrade);
            }
        } else if (!preserveCareer) {
            // Full fresh reset
            const multiplier = levelData.multiplier || 1.0;
            this.simulation.reset(10000.0, multiplier);
            this.world.clearTrades();
        }

        this.currentLevelData = levelData;
        const multiplier = levelData.multiplier || 1.0;
        this.simulation.multiplier = multiplier;

        // Load asset and drop into random historical epoch!
        const loadResult = this.world.loadLevel(levelData, customStartIdx);

        // Reset entities to the chosen epoch coordinate
        const startX = loadResult.startWorldX;
        const startY = this.world.getStateAtX(startX, true).surfaceY;
        this.character.reset(startX, startY);

        // Open initial Bull Long position on the epoch starting candle
        const startCandle = loadResult.startCandle;
        const startSpread = startCandle ? startCandle.spread : 0.05;
        this.currentPrice = startCandle.open;
        this.currentSpread = startSpread;
        this.currentDate = startCandle.date;

        this.simulation.openInitialPosition(
            startCandle ? startCandle.open : 100,
            startSpread,
            1, // 1 lot initial
            startCandle ? startCandle.date : '',
            startX
        );

        // Active MT5 trade line
        this.world.setActiveTrade({
            direction: 'LONG',
            lots: 1,
            entryPrice: this.simulation.position.entryPrice,
            entryWorldX: startX
        });

        // Setup Minimap
        if (this.minimap) {
            this.minimap.setLevel(levelData.candles, loadResult.startIdx);
        }

        // Setup HUD header
        if (this.hud) {
            this.hud.setLevelHeader(levelData.name, levelData.ticker);
        }

        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();

        // Start BGM if not muted
        audio.startBGM();

        // Start animation loop
        requestAnimationFrame((t) => this.loop(t));
    }

    handlePlayerFlip(lots, progress) {
        audio.stopCharge();
        
        // Query current price and candle at character's exact position
        const worldState = this.world.getStateAtX(this.character.x, this.character.isBull);
        const candle = worldState.candle;
        const spread = candle ? candle.spread : 0.05;

        // Flip character surface and state (Bull <-> Bear)
        this.character.flip();
        this.character.setCharging(false, 0, 1);

        // Add satisfying screen shake based on order size
        const shakePower = 3 + (lots / 100) * 10;
        this.camera.addShake(shakePower, 0.22);

        // Execute position flip in the trading engine
        const closedTrade = this.simulation.flipPosition(
            worldState.price,
            spread,
            lots,
            candle ? candle.date : '',
            this.character.x
        );

        // Audio and VFX triggers based on the new and closed positions
        if (this.character.isBull) {
            audio.playBullFlip();
        } else {
            audio.playBearFlip();
        }

        // Add completed trade to MT5 connection lines
        if (closedTrade) {
            this.world.addCompletedTrade(closedTrade);
        }

        // Active trade entry marker
        this.world.setActiveTrade({
            direction: this.simulation.position.direction,
            lots: this.simulation.position.lots,
            entryPrice: this.simulation.position.entryPrice,
            entryWorldX: this.character.x
        });

        // Did we close a trade?
        if (closedTrade) {
            if (closedTrade.pnl > 0) {
                audio.playProfit(closedTrade.pnl);
                this.particles.spawnProfitBurst(this.character.x, this.character.y, closedTrade.pnl);
                this.particles.spawnFloatingText(
                    this.character.x,
                    this.character.y,
                    `+$${closedTrade.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                    true
                );
            } else {
                audio.playLoss(closedTrade.pnl);
                this.particles.spawnLossBurst(this.character.x, this.character.y, closedTrade.pnl);
                this.particles.spawnFloatingText(
                    this.character.x,
                    this.character.y,
                    `-$${Math.abs(closedTrade.pnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                    false
                );
            }
        }
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
        this.lastTime = currentTime;

        if (!this.isPaused) {
            this.update(dt, currentTime);
        }

        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt, currentTime) {
        // Update spacebar hold timer
        this.input.update(currentTime);

        // Update character position on candlesticks
        const worldState = this.character.update(dt, this.world, this.particles);
        this.currentPrice = worldState.price;
        this.currentSpread = worldState.candle ? worldState.candle.spread : 0.05;

        // Update dynamic trading simulation mark-to-market
        if (worldState.candle) {
            this.simulation.updateMarkToMarket(worldState.price, worldState.candle.spread);
        }

        // Update camera to smoothly track character
        this.camera.update(this.character.x, this.character.y, dt);

        // Update particle physics
        this.particles.update(dt);

        // Update HUD
        if (this.hud) {
            this.hud.update(this.simulation, worldState, this.world.candles.length);
        }

        // Update Minimap / Historical Trade Record
        if (this.minimap) {
            this.minimap.render(worldState.index, this.world.completedTrades, this.world.activeTrade);
        }

        // Check if player reached present day (end of 5y data feed)
        if (worldState.index >= this.world.candles.length - 1 && worldState.progressInCandle >= 0.95) {
            if (!this.simulation.isGameOver) {
                this.handleLevelFinished();
            }
        }
    }

    handleLevelFinished() {
        this.simulation.isGameOver = true;
        audio.stopCharge();
        const stats = this.simulation.getSummaryStats();
        if (stats.finalEquity >= stats.initialCapital) {
            audio.playProfit(stats.finalEquity - stats.initialCapital);
        } else {
            audio.playLoss();
        }
        this.menu.showLevelComplete(stats);
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Parallax Wall Street / Cyber Cityscape Background
        this.renderParallaxBackground(ctx);

        // 2. Camera World Space
        ctx.save();
        this.camera.applyTransform(ctx);

        // Draw Candlestick World (Fog of War, Historical Candles, Volume, MT5 Trade Lines, Glowing Spread Beam & Monte Carlo Fan)
        this.world.render(
            ctx,
            this.camera,
            this.character.x,
            this.currentPrice || 100,
            this.currentSpread || 0.05,
            this.lastTime,
            this.simulation.unrealizedPnL
        );

        // Draw Character (Bull / Bear, run cycle, vibration, order badge)
        this.character.render(ctx);

        // Draw Particles (Sparks, Coins, Dollars, P&L Popups, Fireworks)
        this.particles.render(ctx, this.camera);

        ctx.restore();
    }

    renderParallaxBackground(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const camX = this.camera.x;

        // Base gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#060913');
        bgGrad.addColorStop(0.6, '#0B132B');
        bgGrad.addColorStop(1, '#1C2541');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Far Skyscraper Silhouettes (parallax factor 0.1)
        ctx.save();
        const p1 = (camX * 0.1) % 180;
        ctx.fillStyle = '#0F1A30';
        for (let x = -180; x < w + 180; x += 140) {
            const bx = x - p1;
            const bh = 220 + Math.sin(x * 0.02) * 80;
            ctx.fillRect(bx, h - bh, 110, bh);

            // Tiny lit windows
            ctx.fillStyle = 'rgba(0, 230, 118, 0.25)';
            for (let wy = h - bh + 20; wy < h - 40; wy += 24) {
                for (let wx = bx + 12; wx < bx + 90; wx += 22) {
                    if ((wx + wy) % 5 === 0) {
                        ctx.fillRect(wx, wy, 8, 12);
                    }
                }
            }
            ctx.fillStyle = '#0F1A30';
        }
        ctx.restore();

        // Mid Skyline Silhouettes (parallax factor 0.2)
        ctx.save();
        const p2 = (camX * 0.2) % 240;
        ctx.fillStyle = '#16233B';
        for (let x = -240; x < w + 240; x += 190) {
            const bx = x - p2;
            const bh = 140 + Math.cos(x * 0.03) * 60;
            ctx.fillRect(bx, h - bh, 150, bh);
        }
        ctx.restore();

        // Subtle digital matrix grid on floor
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
        ctx.lineWidth = 1;
        const pGrid = (camX * 0.5) % 40;
        for (let gx = -40; gx < w + 40; gx += 40) {
            ctx.beginPath();
            ctx.moveTo(gx - pGrid, h - 160);
            ctx.lineTo(gx - pGrid - 80, h);
            ctx.stroke();
        }
        ctx.restore();
    }
}
