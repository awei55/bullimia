// Bullimia Historical Record & Chart Pane
// Renders the open-ended candle progress, historical traversed chart, and MT5 trade lines (green & red)

export class Minimap {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.candles = [];
        this.minPrice = 0;
        this.maxPrice = 1;
        this.startIdx = 0;
    }

    setLevel(candles, startIdx = 0) {
        this.candles = candles || [];
        this.startIdx = startIdx;
        if (!this.canvas || !this.candles.length) return;

        this.minPrice = Math.min(...this.candles.map(c => c.low));
        this.maxPrice = Math.max(...this.candles.map(c => c.high));
    }

    render(currentCandleIndex, completedTrades = [], activeTrade = null) {
        if (!this.canvas || !this.ctx || !this.candles.length) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const count = this.candles.length;

        this.ctx.clearRect(0, 0, w, h);

        const priceRange = Math.max(0.1, this.maxPrice - this.minPrice);
        const cursorX = Math.min(w, Math.max(4, (currentCandleIndex / count) * w));

        // 1. Draw Traversed Historical Candlesticks (Up to currentCandleIndex)
        const barWidth = Math.max(1, w / count);
        for (let i = 0; i <= currentCandleIndex; i++) {
            const c = this.candles[i];
            const x = (i / count) * w;
            const yHigh = h - ((c.high - this.minPrice) / priceRange) * (h - 8) - 4;
            const yLow = h - ((c.low - this.minPrice) / priceRange) * (h - 8) - 4;
            const yOpen = h - ((c.open - this.minPrice) / priceRange) * (h - 8) - 4;
            const yClose = h - ((c.close - this.minPrice) / priceRange) * (h - 8) - 4;

            const isBull = c.close >= c.open;
            this.ctx.fillStyle = isBull ? 'rgba(0, 230, 118, 0.75)' : 'rgba(255, 23, 68, 0.75)';
            this.ctx.strokeStyle = isBull ? '#00E676' : '#FF1744';

            // Wick
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x + barWidth * 0.5, yHigh);
            this.ctx.lineTo(x + barWidth * 0.5, yLow);
            this.ctx.stroke();

            // Body
            const topY = Math.min(yOpen, yClose);
            const bodyH = Math.max(1, Math.abs(yClose - yOpen));
            this.ctx.fillRect(x, topY, Math.max(1, barWidth - 0.5), bodyH);
        }

        // 2. Render MT5 Trade Connection Lines on the Mini Chart!
        // Green lines for winning trades, Red lines for losing trades
        if (completedTrades && completedTrades.length > 0) {
            this.ctx.save();
            for (const t of completedTrades) {
                // Find candle indices corresponding to entry and exit
                const entryFrac = Math.max(0, Math.min(1, (t.entryWorldX - 100) / (count * 84)));
                const exitFrac = Math.max(0, Math.min(1, (t.exitWorldX - 100) / (count * 84)));

                const x1 = entryFrac * w;
                const x2 = exitFrac * w;
                const y1 = h - ((t.entryPrice - this.minPrice) / priceRange) * (h - 8) - 4;
                const y2 = h - ((t.exitPrice - this.minPrice) / priceRange) * (h - 8) - 4;

                const color = t.isWin ? '#00E676' : '#FF1744';
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 1.5;
                this.ctx.setLineDash([3, 2]);

                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();

                // Entry point dot
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(x1, y1, 2, 0, Math.PI * 2);
                this.ctx.fill();

                // Exit point dot
                this.ctx.beginPath();
                this.ctx.arc(x2, y2, 2.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        }

        // 3. Shroud the Unexplored Future in Fog of War
        if (cursorX < w) {
            this.ctx.fillStyle = 'rgba(6, 11, 22, 0.94)';
            this.ctx.fillRect(cursorX, 0, w - cursorX, h);

            // Subtle future scanline pattern
            this.ctx.fillStyle = 'rgba(0, 229, 255, 0.04)';
            for (let sx = cursorX; sx < w; sx += 8) {
                this.ctx.fillRect(sx, 0, 1, h);
            }

            if (w - cursorX > 140) {
                this.ctx.fillStyle = 'rgba(0, 229, 255, 0.28)';
                this.ctx.font = '8px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🔒 FOG OF WAR // UNSEEN HORIZON', cursorX + (w - cursorX) * 0.5, h * 0.5);
            }
        }

        // 4. Glowing Progress Cursor
        this.ctx.save();
        this.ctx.strokeStyle = '#00E5FF';
        this.ctx.shadowColor = '#00E5FF';
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = 2.0;
        this.ctx.beginPath();
        this.ctx.moveTo(cursorX, 0);
        this.ctx.lineTo(cursorX, h);
        this.ctx.stroke();

        this.ctx.fillStyle = '#00E5FF';
        this.ctx.beginPath();
        this.ctx.moveTo(cursorX - 4, 0);
        this.ctx.lineTo(cursorX + 4, 0);
        this.ctx.lineTo(cursorX, 6);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }
}
