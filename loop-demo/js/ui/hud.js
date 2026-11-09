// Bullimia HUD (Heads-Up Display)
// Renders the real-time financial status bar, bid/ask quotes, equity, floating P&L, and position badges

export class HUD {
    constructor() {
        this.dom = {
            equityVal: document.getElementById('hud-equity'),
            cashVal: document.getElementById('hud-cash'),
            pnlVal: document.getElementById('hud-pnl'),
            positionBadge: document.getElementById('hud-position'),
            bidVal: document.getElementById('hud-bid'),
            askVal: document.getElementById('hud-ask'),
            tickerVal: document.getElementById('hud-ticker'),
            dateVal: document.getElementById('hud-date'),
            progressVal: document.getElementById('hud-progress'),
            muteBtn: document.getElementById('btn-mute'),
            bgmBtn: document.getElementById('btn-bgm'),
            levelBtn: document.getElementById('btn-select-level')
        };
    }

    update(simulation, worldState, totalCandles) {
        if (!worldState || !worldState.candle) return;

        const candle = worldState.candle;
        const quotes = simulation.getQuotes(worldState.price, candle.spread);

        // 1. Update Equity with color glow
        const equity = simulation.equity;
        const initCap = simulation.initialCapital;
        if (this.dom.equityVal) {
            this.dom.equityVal.textContent = `$${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            if (equity > initCap) {
                this.dom.equityVal.className = 'equity-val positive glow';
            } else if (equity < initCap) {
                this.dom.equityVal.className = 'equity-val negative';
            } else {
                this.dom.equityVal.className = 'equity-val neutral';
            }
        }

        // 2. Cash Balance
        if (this.dom.cashVal) {
            this.dom.cashVal.textContent = `$${simulation.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        // 3. Floating Unrealized P&L
        const pnl = simulation.unrealizedPnL;
        if (this.dom.pnlVal) {
            const sign = pnl >= 0 ? '+' : '';
            this.dom.pnlVal.textContent = `${sign}$${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            this.dom.pnlVal.className = pnl > 0 ? 'pnl-val positive' : (pnl < 0 ? 'pnl-val negative' : 'pnl-val neutral');
        }

        // 4. Current Position Badge
        if (this.dom.positionBadge) {
            const pos = simulation.position;
            if (pos.direction === 'LONG') {
                this.dom.positionBadge.innerHTML = `<span class="badge-icon">🐂</span> <strong>LONG</strong> ${pos.lots}L @ $${pos.entryPrice.toFixed(2)}`;
                this.dom.positionBadge.className = 'position-badge long';
            } else if (pos.direction === 'SHORT') {
                this.dom.positionBadge.innerHTML = `<span class="badge-icon">🐻</span> <strong>SHORT</strong> ${pos.lots}L @ $${pos.entryPrice.toFixed(2)}`;
                this.dom.positionBadge.className = 'position-badge short';
            } else {
                this.dom.positionBadge.innerHTML = `<strong>FLAT</strong>`;
                this.dom.positionBadge.className = 'position-badge flat';
            }
        }

        // 5. Market Quotes (Bid / Ask / Spread)
        if (this.dom.bidVal) this.dom.bidVal.textContent = `$${quotes.bid.toFixed(2)}`;
        if (this.dom.askVal) this.dom.askVal.textContent = `$${quotes.ask.toFixed(2)}`;

        // 6. Ticker & Date
        if (this.dom.dateVal) this.dom.dateVal.textContent = candle.date;
        if (this.dom.progressVal) {
            // Open-ended candle count & trade count (no arbitrary finish line)
            const tradeCountText = simulation.totalTrades > 0 ? ` • ${simulation.totalTrades} Trades (${simulation.winningTrades}W/${simulation.losingTrades}L)` : '';
            this.dom.progressVal.textContent = `Candle ${worldState.index + 1}${tradeCountText}`;
        }
    }

    setLevelHeader(levelName, ticker) {
        if (this.dom.tickerVal) {
            this.dom.tickerVal.innerHTML = `<span class="ticker-symbol">${ticker}</span> <span class="ticker-desc">${levelName}</span>`;
        }
    }
}
