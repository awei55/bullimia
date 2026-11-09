// Bullimia Candlestick Chart World Engine (Updated: MT5 Trade Lines, Log-ATR Scaling & Random Epochs)
// Solves flat curve variance via Volatility-Calibrated Logarithmic Scaling.
// Features MT5-style trade connection lines, real-time Fog of War, and Monte Carlo volatility fans.

export class CandlestickWorld {
    constructor() {
        this.levelData = null;
        this.candles = [];
        this.candleWidth = 64;
        this.candleGap = 20;
        this.stepX = this.candleWidth + this.candleGap;
        
        // Logarithmic & Volatility Scaling parameters
        this.anchorPrice = 100;
        this.anchorY = 480;
        this.scaleLog = 1600.0; // pixels per unit log-return
        this.avgAtrPct = 0.025;
        this.volatility = 0.025;

        this.startIdx = 0;
        this.startWorldX = 100;

        // MT5 Style Trade Lines
        this.completedTrades = [];
        this.activeTrade = null;

        // Monte Carlo Volatility Surface Simulation State
        this.mcPathsCount = 20;
        this.mcHorizonSteps = 15;
        this.mcStepPx = 42;
        this.mcCycleTimer = 0;
        this.mcPaths = [];
        this.initMonteCarloPaths();
    }

    initMonteCarloPaths() {
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
                steps: steps,
                targetSteps: [...steps],
                speed: 0.8 + Math.random() * 0.8,
                phase: Math.random() * Math.PI * 2,
                alpha: 0.06 + Math.random() * 0.12,
                colorHue: Math.random() > 0.5 ? 185 : 45
            });
        }
    }

    cycleMonteCarloPaths() {
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

    loadLevel(assetData, customStartIdx = null) {
        this.levelData = assetData;
        this.candles = assetData.candles || [];
        this.activeTrade = null;

        if (this.candles.length === 0) return { startIdx: 0, startWorldX: 100 };

        // 1. Pick a Random Interesting Historical Time / Epoch
        const totalCount = this.candles.length;
        if (customStartIdx !== null && customStartIdx >= 0 && customStartIdx < totalCount) {
            this.startIdx = customStartIdx;
        } else {
            // Pick a random epoch from the historical continuum (leaving room to run forward)
            const minStart = Math.min(20, Math.floor(totalCount * 0.1));
            const maxStart = Math.max(minStart, totalCount - 80);
            this.startIdx = Math.floor(minStart + Math.random() * (maxStart - minStart));
        }

        const startCandle = this.candles[this.startIdx] || this.candles[0];
        this.anchorPrice = Math.max(0.01, startCandle.open);
        this.anchorY = 480;

        // 2. Calibrate Logarithmic / Volatility Scaling
        // Target: typical daily candle body is ~45px, wicks ~75px
        this.avgAtrPct = assetData.avg_atr_pct || 0.028;
        // Formula: scaleLog = targetPixelPerAtr / avgAtrPct
        this.scaleLog = 48.0 / Math.max(0.008, Math.min(0.08, this.avgAtrPct));
        // Clamp scaleLog to reasonable bounds (800 to 3200)
        this.scaleLog = Math.max(800.0, Math.min(3200.0, this.scaleLog));
        this.volatility = this.avgAtrPct;

        // 3. Precompute world coordinates for every candlestick
        this.maxVolume = Math.max(...this.candles.map(c => c.volume || 1), 1);

        for (let i = 0; i < this.candles.length; i++) {
            const c = this.candles[i];
            c.worldX = i * this.stepX + 100;
            c.centerX = c.worldX + this.candleWidth * 0.5;

            c.yHigh = this.priceToY(c.high);
            c.yLow = this.priceToY(c.low);
            c.yOpen = this.priceToY(c.open);
            c.yClose = this.priceToY(c.close);

            c.isBullish = c.close >= c.open;
            c.bodyTopY = Math.min(c.yOpen, c.yClose);
            c.bodyBottomY = Math.max(c.yOpen, c.yClose);
            // Tangible minimum body height so even flat dojies have crisp outline
            c.bodyHeight = Math.max(5, c.bodyBottomY - c.bodyTopY);
        }

        this.startWorldX = this.startIdx * this.stepX + 100;
        this.initMonteCarloPaths();

        return {
            startIdx: this.startIdx,
            startCandle: startCandle,
            startWorldX: this.startWorldX
        };
    }

    priceToY(price) {
        const p = Math.max(0.001, price);
        // Logarithmic scaling: higher price -> smaller Y (higher on screen)
        return this.anchorY - Math.log(p / this.anchorPrice) * this.scaleLog;
    }

    yToPrice(y) {
        return this.anchorPrice * Math.exp((this.anchorY - y) / this.scaleLog);
    }

    getCandleIndexAtX(worldX) {
        if (!this.candles.length) return 0;
        const relativeX = worldX - 100;
        const idx = Math.floor(relativeX / this.stepX);
        return Math.max(0, Math.min(this.candles.length - 1, idx));
    }

    getStateAtX(worldX, isBull) {
        if (!this.candles.length) {
            return { price: 100, surfaceY: 300, candle: null, progressInCandle: 0, index: 0 };
        }

        const idx = this.getCandleIndexAtX(worldX);
        const candle = this.candles[idx];
        const nextCandle = this.candles[Math.min(this.candles.length - 1, idx + 1)];

        const candleStart = candle.worldX;
        const progress = Math.max(0, Math.min(1.0, (worldX - candleStart) / this.stepX));

        let price = candle.open;
        if (candle.isBullish) {
            if (progress < 0.25) {
                const t = progress / 0.25;
                price = candle.open + (candle.low - candle.open) * t;
            } else if (progress < 0.7) {
                const t = (progress - 0.25) / 0.45;
                price = candle.low + (candle.high - candle.low) * t;
            } else {
                const t = (progress - 0.7) / 0.3;
                price = candle.high + (candle.close - candle.high) * t;
            }
        } else {
            if (progress < 0.25) {
                const t = progress / 0.25;
                price = candle.open + (candle.high - candle.open) * t;
            } else if (progress < 0.7) {
                const t = (progress - 0.25) / 0.45;
                price = candle.high + (candle.low - candle.high) * t;
            } else {
                const t = (progress - 0.7) / 0.3;
                price = candle.low + (candle.close - candle.low) * t;
            }
        }

        let currentSurfaceY = isBull ? candle.bodyTopY : candle.bodyBottomY;
        let targetSurfaceY = isBull ? nextCandle.bodyTopY : nextCandle.bodyBottomY;

        const smoothProgress = (1 - Math.cos(progress * Math.PI)) / 2;
        const surfaceY = currentSurfaceY + (targetSurfaceY - currentSurfaceY) * smoothProgress;

        return {
            price: Number(price.toFixed(2)),
            surfaceY: surfaceY,
            candle: candle,
            progressInCandle: progress,
            index: idx
        };
    }

    // MT5 Trade Management
    setActiveTrade(trade) {
        this.activeTrade = trade;
    }

    addCompletedTrade(trade) {
        // Record world coordinates for MT5 line
        const entryY = this.priceToY(trade.entryPrice);
        const exitY = this.priceToY(trade.exitPrice);

        this.completedTrades.push({
            ...trade,
            entryY: entryY,
            exitY: exitY
        });

        // Keep last 30 trade lines in memory
        if (this.completedTrades.length > 30) {
            this.completedTrades.shift();
        }
    }

    clearTrades() {
        this.completedTrades = [];
        this.activeTrade = null;
    }

    // --- Main Render Pipeline ---
    render(ctx, camera, characterX, currentPrice, currentSpread, timeMs = 0, currentUnrealizedPnL = 0) {
        if (!this.candles.length) return;

        ctx.save();

        // 1. Price Grid
        this.renderPriceGrid(ctx, camera, characterX);

        // 2. FOG OF WAR FILTER:
        const viewLeft = camera.x - 100;
        const startIdx = Math.max(0, this.getCandleIndexAtX(viewLeft));
        const currentIdx = this.getCandleIndexAtX(characterX);

        // 3. Render Historical Volume Bars
        for (let i = startIdx; i <= currentIdx; i++) {
            const c = this.candles[i];
            if (c.worldX < characterX) {
                this.renderVolumeBar(ctx, c, characterX);
            }
        }

        // 4. Render Historical Candlestick Bodies & Wicks
        for (let i = startIdx; i <= currentIdx; i++) {
            const c = this.candles[i];
            if (c.worldX < characterX) {
                this.renderCandleWithFog(ctx, c, characterX);
            }
        }

        // 5. META TRADER 5 (MT5) TRADE LINES (Connecting Past Positions)
        this.renderMT5TradeLines(ctx, camera, characterX, currentPrice, currentUnrealizedPnL);

        // 6. MONTE CARLO VOLATILITY SURFACE FAN
        this.renderMonteCarloVolatilitySurfaces(ctx, camera, characterX, currentPrice, currentSpread, timeMs);

        // 7. GLOWING CURRENT PRICE LINE WITH BID-ASK SPREAD THICKNESS
        this.renderGlowingBidAskSpreadBeam(ctx, camera, characterX, currentPrice, currentSpread, timeMs);

        ctx.restore();
    }

    renderPriceGrid(ctx, camera, characterX) {
        // Draw logarithmic price grid lines
        const centerPrice = this.yToPrice(camera.y + camera.height * 0.5);
        let stepPct = 0.05; // 5% price intervals
        if (this.avgAtrPct > 0.04) stepPct = 0.10;
        else if (this.avgAtrPct < 0.015) stepPct = 0.02;

        const baseMultiplier = Math.pow(1 + stepPct, Math.floor(Math.log(centerPrice / this.anchorPrice) / Math.log(1 + stepPct)));
        const gridPrices = [];
        for (let k = -8; k <= 8; k++) {
            gridPrices.push(this.anchorPrice * Math.pow(1 + stepPct, k));
        }

        ctx.lineWidth = 1;
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';

        for (const p of gridPrices) {
            const y = this.priceToY(p);
            if (y < camera.y - 50 || y > camera.y + camera.height + 50) continue;

            // Past dashed line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.moveTo(camera.x - 50, y);
            ctx.lineTo(characterX, y);
            ctx.stroke();

            // Future faint line
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.015)';
            ctx.beginPath();
            ctx.moveTo(characterX, y);
            ctx.lineTo(camera.x + camera.width + 50, y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Price watermark
            ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
            ctx.fillText(`$${p.toFixed(2)}`, camera.x + 12, y - 4);
        }
    }

    renderVolumeBar(ctx, c, characterX) {
        const maxVolHeight = 80;
        const volHeight = Math.max(3, (c.volume / this.maxVolume) * maxVolHeight);
        const yTop = this.anchorY + 180 - volHeight;

        const barRight = Math.min(c.worldX + this.candleWidth, characterX);
        const barWidth = Math.max(0, barRight - c.worldX);
        if (barWidth <= 0) return;

        ctx.fillStyle = c.isBullish ? 'rgba(0, 230, 118, 0.18)' : 'rgba(255, 23, 68, 0.18)';
        ctx.fillRect(c.worldX, yTop, barWidth, volHeight);
    }

    renderCandleWithFog(ctx, c, characterX) {
        const isBull = c.isBullish;
        const color = isBull ? '#00E676' : '#FF1744';
        const glowColor = isBull ? 'rgba(0, 230, 118, 0.28)' : 'rgba(255, 23, 68, 0.28)';

        ctx.save();

        const isCurrentlyTraversing = (characterX >= c.worldX && characterX < c.worldX + this.candleWidth + this.candleGap);
        if (isCurrentlyTraversing) {
            ctx.beginPath();
            ctx.rect(c.worldX - 10, -5000, (characterX - c.worldX) + 10, 10000);
            ctx.clip();
        }

        // 1. Draw Wicks
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(c.centerX, c.yHigh);
        ctx.lineTo(c.centerX, c.yLow);
        ctx.stroke();

        // 2. Draw Candlestick Body with 3D gradient
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;

        const grad = ctx.createLinearGradient(c.worldX, c.bodyTopY, c.worldX + this.candleWidth, c.bodyBottomY);
        if (isBull) {
            grad.addColorStop(0, '#00FF88');
            grad.addColorStop(1, '#00B359');
        } else {
            grad.addColorStop(0, '#FF3366');
            grad.addColorStop(1, '#CC0033');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(c.worldX, c.bodyTopY, this.candleWidth, c.bodyHeight, 3);
        ctx.fill();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isBull ? '#B9F6CA' : '#FF8A80';
        ctx.stroke();

        ctx.restore();

        // Date label below
        if (c.centerX <= characterX) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(c.date.slice(5), c.centerX, this.anchorY + 110);
        }
    }

    // --- MetaTrader 5 (MT5) Style Trade Connection Lines ---
    renderMT5TradeLines(ctx, camera, characterX, currentPrice, currentUnrealizedPnL) {
        ctx.save();

        // 1. Render All Completed Historical Trade Connection Lines
        for (const t of this.completedTrades) {
            // Viewport culling
            if (t.exitWorldX < camera.x - 100 || t.entryWorldX > camera.x + camera.width + 100) continue;

            const isWin = t.isWin;
            const color = isWin ? '#00E676' : '#FF1744';
            const shadowColor = isWin ? 'rgba(0, 230, 118, 0.5)' : 'rgba(255, 23, 68, 0.5)';

            // A. Draw MT5 Dashed Connection Line
            ctx.save();
            ctx.strokeStyle = color;
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = 8;
            ctx.lineWidth = 2.0;
            ctx.setLineDash([6, 5]);

            ctx.beginPath();
            ctx.moveTo(t.entryWorldX, t.entryY);
            ctx.lineTo(t.exitWorldX, t.exitY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;

            // B. Entry Marker (Arrow & Tag)
            const isBuy = t.direction === 'LONG';
            ctx.fillStyle = isBuy ? '#00E676' : '#FF1744';
            ctx.beginPath();
            if (isBuy) {
                // Upward triangle for Buy
                ctx.moveTo(t.entryWorldX, t.entryY - 14);
                ctx.lineTo(t.entryWorldX - 5, t.entryY - 5);
                ctx.lineTo(t.entryWorldX + 5, t.entryY - 5);
            } else {
                // Downward triangle for Sell
                ctx.moveTo(t.entryWorldX, t.entryY + 14);
                ctx.lineTo(t.entryWorldX - 5, t.entryY + 5);
                ctx.lineTo(t.entryWorldX + 5, t.entryY + 5);
            }
            ctx.fill();

            // Entry pill
            ctx.font = 'bold 9px monospace';
            const entryText = `${isBuy ? '▲ BUY' : '▼ SELL'} ${t.lots}L`;
            const etw = ctx.measureText(entryText).width;
            ctx.fillStyle = 'rgba(6, 12, 24, 0.85)';
            ctx.beginPath();
            ctx.roundRect(t.entryWorldX - etw * 0.5 - 4, isBuy ? t.entryY - 30 : t.entryY + 18, etw + 8, 14, 4);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(entryText, t.entryWorldX, isBuy ? t.entryY - 23 : t.entryY + 25);

            // C. Exit Marker (Close Circle)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(t.exitWorldX, t.exitY, 4, 0, Math.PI * 2);
            ctx.fill();

            // D. Midpoint Floating P&L Badge on the Connection Line
            const midX = (t.entryWorldX + t.exitWorldX) * 0.5;
            const midY = (t.entryY + t.exitY) * 0.5;
            const pnlText = `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}`;

            ctx.font = '900 11px monospace';
            const pnlWidth = ctx.measureText(pnlText).width;

            ctx.fillStyle = 'rgba(6, 12, 24, 0.92)';
            ctx.beginPath();
            ctx.roundRect(midX - pnlWidth * 0.5 - 6, midY - 10, pnlWidth + 12, 20, 5);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pnlText, midX, midY);

            ctx.restore();
        }

        // 2. Render Active Trade Live Floating Line (From Entry to Character)
        if (this.activeTrade && this.activeTrade.entryWorldX) {
            const entryX = this.activeTrade.entryWorldX;
            const entryY = this.priceToY(this.activeTrade.entryPrice);
            const liveY = this.priceToY(currentPrice);

            const isFloatingProfit = currentUnrealizedPnL >= 0;
            const liveColor = isFloatingProfit ? '#00E676' : '#FF1744';

            ctx.save();
            ctx.strokeStyle = liveColor;
            ctx.lineWidth = 1.8;
            ctx.setLineDash([4, 4]);

            // Line from entry point directly to current player position
            ctx.beginPath();
            ctx.moveTo(entryX, entryY);
            ctx.lineTo(characterX, liveY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Entry marker
            const isBuy = this.activeTrade.direction === 'LONG';
            ctx.fillStyle = liveColor;
            ctx.beginPath();
            ctx.arc(entryX, entryY, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Floating live P&L badge at 70% along the line
            const tagX = entryX + (characterX - entryX) * 0.7;
            const tagY = entryY + (liveY - entryY) * 0.7;
            const livePnlText = `${currentUnrealizedPnL >= 0 ? '+' : ''}$${currentUnrealizedPnL.toFixed(2)}`;

            ctx.font = 'bold 10px monospace';
            const ltw = ctx.measureText(livePnlText).width;

            ctx.fillStyle = 'rgba(6, 12, 24, 0.88)';
            ctx.beginPath();
            ctx.roundRect(tagX - ltw * 0.5 - 5, tagY - 9, ltw + 10, 18, 4);
            ctx.fill();
            ctx.strokeStyle = liveColor;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            ctx.fillStyle = liveColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(livePnlText, tagX, tagY);

            ctx.restore();
        }

        ctx.restore();
    }

    // --- Glowing Current Price Line with Bid-Ask Spread Thickness ---
    renderGlowingBidAskSpreadBeam(ctx, camera, characterX, currentPrice, currentSpread, timeMs) {
        const halfSpread = (currentSpread || 0.05) * 0.5;
        const askPrice = currentPrice + halfSpread;
        const bidPrice = Math.max(0.01, currentPrice - halfSpread);

        const yMid = this.priceToY(currentPrice);
        const yAsk = this.priceToY(askPrice);
        const yBid = this.priceToY(bidPrice);

        const rawHeight = Math.abs(yBid - yAsk);
        const bandHeight = Math.max(6, rawHeight);
        const halfBand = bandHeight * 0.5;
        const bandTop = yMid - halfBand;
        const bandBottom = yMid + halfBand;

        const beamEndX = camera.x + camera.width + 120;
        const beamStartX = characterX + 8;

        ctx.save();

        // 1. Translucent glowing corridor fill
        const corridorGrad = ctx.createLinearGradient(beamStartX, bandTop, beamStartX, bandBottom);
        corridorGrad.addColorStop(0, 'rgba(0, 230, 118, 0.18)');
        corridorGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.12)');
        corridorGrad.addColorStop(1, 'rgba(255, 23, 68, 0.18)');

        ctx.fillStyle = corridorGrad;
        ctx.fillRect(beamStartX, bandTop, beamEndX - beamStartX, bandHeight);

        // 2. Upper Ask Rail
        ctx.strokeStyle = '#00FF88';
        ctx.shadowColor = '#00FF88';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(beamStartX, bandTop);
        ctx.lineTo(beamEndX, bandTop);
        ctx.stroke();

        // 3. Lower Bid Rail
        ctx.strokeStyle = '#FF1744';
        ctx.shadowColor = '#FF1744';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(beamStartX, bandBottom);
        ctx.lineTo(beamEndX, bandBottom);
        ctx.stroke();

        // 4. Center Mid-Price Laser Line
        const pulse = 0.5 + Math.sin(timeMs * 0.008) * 0.3;
        ctx.strokeStyle = `rgba(0, 229, 255, ${pulse + 0.3})`;
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(beamStartX, yMid);
        ctx.lineTo(beamEndX, yMid);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // 5. Active Price / Spread HUD Badge
        const badgeX = characterX + 28;
        const badgeText = `$${currentPrice.toFixed(2)}`;
        const spreadText = `SPD $${(currentSpread || 0.05).toFixed(2)}`;

        ctx.font = 'bold 11px monospace';
        const tw = Math.max(ctx.measureText(badgeText).width, ctx.measureText(spreadText).width);

        ctx.fillStyle = 'rgba(6, 12, 24, 0.9)';
        ctx.beginPath();
        ctx.roundRect(badgeX, yMid - 18, tw + 18, 36, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#00E5FF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(badgeText, badgeX + 9, yMid - 14);

        ctx.fillStyle = '#FFD700';
        ctx.font = '9px monospace';
        ctx.fillText(spreadText, badgeX + 9, yMid + 2);

        ctx.restore();
    }

    // --- Monte Carlo Volatility Surface Paths & Probability Fan ---
    renderMonteCarloVolatilitySurfaces(ctx, camera, characterX, currentPrice, currentSpread, timeMs) {
        const startX = characterX + 12;
        const startY = this.priceToY(currentPrice);
        const tSec = timeMs * 0.001;

        this.mcCycleTimer += 0.016;
        if (this.mcCycleTimer > 1.2) {
            this.mcCycleTimer = 0;
            this.cycleMonteCarloPaths();
        }

        ctx.save();

        const horizonPx = this.mcHorizonSteps * this.mcStepPx;
        const priceVolPx = Math.max(16, this.scaleLog * (this.volatility * 1.6));

        // Upper and lower 2-sigma curves
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let j = 1; j <= this.mcHorizonSteps; j++) {
            const x = startX + j * this.mcStepPx;
            const distFactor = Math.sqrt(j / this.mcHorizonSteps);
            const yUp = startY - (priceVolPx * 2.0 * distFactor);
            ctx.lineTo(x, yUp);
        }
        for (let j = this.mcHorizonSteps; j >= 1; j--) {
            const x = startX + j * this.mcStepPx;
            const distFactor = Math.sqrt(j / this.mcHorizonSteps);
            const yDown = startY + (priceVolPx * 2.0 * distFactor);
            ctx.lineTo(x, yDown);
        }
        ctx.closePath();

        const fanGrad = ctx.createLinearGradient(startX, startY, startX + horizonPx, startY);
        fanGrad.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
        fanGrad.addColorStop(0.6, 'rgba(0, 229, 255, 0.03)');
        fanGrad.addColorStop(1, 'rgba(0, 229, 255, 0.0)');
        ctx.fillStyle = fanGrad;
        ctx.fill();

        // 1-sigma boundary rails
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let j = 1; j <= this.mcHorizonSteps; j++) {
            const x = startX + j * this.mcStepPx;
            const y = startY - (priceVolPx * 1.0 * Math.sqrt(j / this.mcHorizonSteps));
            ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let j = 1; j <= this.mcHorizonSteps; j++) {
            const x = startX + j * this.mcStepPx;
            const y = startY + (priceVolPx * 1.0 * Math.sqrt(j / this.mcHorizonSteps));
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Individual Monte Carlo Ghost Trajectories
        const scaleAmp = priceVolPx * 0.45;

        for (let k = 0; k < this.mcPaths.length; k++) {
            const path = this.mcPaths[k];
            for (let j = 1; j <= this.mcHorizonSteps; j++) {
                path.steps[j] += (path.targetSteps[j] - path.steps[j]) * 0.04;
            }

            const wave = Math.sin(tSec * path.speed + path.phase);
            const alpha = Math.max(0.02, path.alpha * (0.6 + 0.4 * wave));
            const color = path.colorHue === 185 ? `rgba(0, 229, 255, ${alpha})` : `rgba(255, 215, 0, ${alpha * 0.8})`;

            ctx.strokeStyle = color;
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(startX, startY);

            for (let j = 1; j <= this.mcHorizonSteps; j++) {
                const x = startX + j * this.mcStepPx;
                const shockY = path.steps[j] * scaleAmp * 0.35;
                const undulation = Math.sin(tSec * 2 + j * 0.5 + path.phase) * (j * 1.2);
                const y = startY + shockY + undulation;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('MONTE CARLO PROJECTION [ATR = ' + (this.avgAtrPct * 100).toFixed(1) + '%]', startX + horizonPx * 0.7, startY - priceVolPx * 1.8);

        ctx.restore();
    }
}
