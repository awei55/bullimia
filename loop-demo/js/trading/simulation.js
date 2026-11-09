// Bullimia Trading Simulation Engine
// Implements Bid/Ask spread execution, lot scaling, commissions, floating P&L, Margin Calls & Millionaire goals

export class TradingSimulation {
    constructor() {
        this.initialCapital = 10000.0;
        this.cash = this.initialCapital;
        this.equity = this.initialCapital;
        this.unrealizedPnL = 0.0;
        this.commissionPerLot = 1.0; // $1 commission per lot
        this.multiplier = 1.0;

        // Active Position State
        // direction: 'LONG' (Bull) | 'SHORT' (Bear) | 'FLAT'
        this.position = {
            direction: 'FLAT',
            lots: 0,
            entryPrice: 0.0,
            entryDate: '',
            entryWorldX: 0
        };

        // Trade History & Performance Analytics
        this.tradeHistory = [];
        this.totalTrades = 0;
        this.winningTrades = 0;
        this.losingTrades = 0;
        this.peakEquity = this.initialCapital;
        this.maxProfit = 0;
        this.maxLoss = 0;

        // Game Status
        this.isMarginCalled = false;
        this.isMillionaire = false;
        this.isGameOver = false;

        // Callback hooks
        this.onTradeClosed = null;
        this.onMarginCall = null;
        this.onMillionaire = null;
    }

    reset(initialCapital = 10000.0, multiplier = 1.0) {
        this.initialCapital = initialCapital;
        this.cash = initialCapital;
        this.equity = initialCapital;
        this.unrealizedPnL = 0.0;
        this.multiplier = multiplier;

        this.position = {
            direction: 'FLAT',
            lots: 0,
            entryPrice: 0.0,
            entryDate: '',
            entryWorldX: 0
        };

        this.tradeHistory = [];
        this.totalTrades = 0;
        this.winningTrades = 0;
        this.losingTrades = 0;
        this.peakEquity = initialCapital;
        this.maxProfit = 0;
        this.maxLoss = 0;

        this.isMarginCalled = false;
        this.isMillionaire = false;
        this.isGameOver = false;
    }

    // Calculate dynamic Bid / Ask from mid price and spread
    getQuotes(price, spread) {
        const halfSpread = (spread || 0.02) * 0.5;
        return {
            mid: price,
            bid: Number(Math.max(0.01, price - halfSpread).toFixed(2)),
            ask: Number((price + halfSpread).toFixed(2)),
            spread: spread
        };
    }

    // Initialize the very first position at the level start (Bull goes Long)
    openInitialPosition(price, spread, lots = 1, date = '', worldX = 0) {
        const quotes = this.getQuotes(price, spread);
        // Player buys at Ask
        this.position = {
            direction: 'LONG',
            lots: lots,
            entryPrice: quotes.ask,
            entryDate: date,
            entryWorldX: worldX
        };

        // Deduct initial commission
        const commission = this.commissionPerLot * lots;
        this.cash -= commission;
        this.updateMarkToMarket(price, spread);
    }

    // Called on every frame to update floating P&L and total equity
    updateMarkToMarket(currentPrice, spread) {
        if (this.isGameOver) return;

        const quotes = this.getQuotes(currentPrice, spread);

        if (this.position.direction === 'LONG') {
            // Long position closes at Bid
            const diff = quotes.bid - this.position.entryPrice;
            this.unrealizedPnL = Number((diff * this.position.lots * this.multiplier).toFixed(2));
        } else if (this.position.direction === 'SHORT') {
            // Short position closes at Ask
            const diff = this.position.entryPrice - quotes.ask;
            this.unrealizedPnL = Number((diff * this.position.lots * this.multiplier).toFixed(2));
        } else {
            this.unrealizedPnL = 0.0;
        }

        this.equity = Number((this.cash + this.unrealizedPnL).toFixed(2));
        if (this.equity > this.peakEquity) {
            this.peakEquity = this.equity;
        }

        // Check End Conditions
        if (this.equity <= 0 && !this.isGameOver) {
            this.triggerMarginCall();
        } else if (this.equity >= 1000000.0 && !this.isGameOver) {
            this.triggerMillionaire();
        }
    }

    // Flip position when spacebar is pressed/released
    // If was Bull (Long) -> close Long at Bid, open Bear (Short) at Bid with newLots
    // If was Bear (Short) -> close Short at Ask, open Bull (Long) at Ask with newLots
    flipPosition(currentPrice, spread, newLots = 1, date = '', worldX = 0) {
        if (this.isGameOver) return null;

        const quotes = this.getQuotes(currentPrice, spread);
        let closedTrade = null;

        if (this.position.direction === 'LONG') {
            // 1. Close Long position: Sell at Bid
            const exitPrice = quotes.bid;
            const priceDiff = exitPrice - this.position.entryPrice;
            const grossPnL = priceDiff * this.position.lots * this.multiplier;
            const exitCommission = this.commissionPerLot * this.position.lots;
            const netPnL = Number((grossPnL - exitCommission).toFixed(2));

            this.cash += Number((grossPnL - exitCommission).toFixed(2));

            closedTrade = {
                id: this.totalTrades + 1,
                direction: 'LONG',
                lots: this.position.lots,
                entryPrice: this.position.entryPrice,
                exitPrice: exitPrice,
                entryWorldX: this.position.entryWorldX,
                exitWorldX: worldX,
                pnl: netPnL,
                commission: exitCommission,
                entryDate: this.position.entryDate,
                exitDate: date,
                isWin: netPnL > 0
            };
            this.recordClosedTrade(closedTrade);

            // 2. Open new Short position: Sell at Bid with new lots
            const entryCommission = this.commissionPerLot * newLots;
            this.cash -= entryCommission;

            this.position = {
                direction: 'SHORT',
                lots: newLots,
                entryPrice: quotes.bid,
                entryDate: date,
                entryWorldX: worldX
            };

        } else if (this.position.direction === 'SHORT') {
            // 1. Close Short position: Buy to cover at Ask
            const exitPrice = quotes.ask;
            const priceDiff = this.position.entryPrice - exitPrice;
            const grossPnL = priceDiff * this.position.lots * this.multiplier;
            const exitCommission = this.commissionPerLot * this.position.lots;
            const netPnL = Number((grossPnL - exitCommission).toFixed(2));

            this.cash += Number((grossPnL - exitCommission).toFixed(2));

            closedTrade = {
                id: this.totalTrades + 1,
                direction: 'SHORT',
                lots: this.position.lots,
                entryPrice: this.position.entryPrice,
                exitPrice: exitPrice,
                entryWorldX: this.position.entryWorldX,
                exitWorldX: worldX,
                pnl: netPnL,
                commission: exitCommission,
                entryDate: this.position.entryDate,
                exitDate: date,
                isWin: netPnL > 0
            };
            this.recordClosedTrade(closedTrade);

            // 2. Open new Long position: Buy at Ask with new lots
            const entryCommission = this.commissionPerLot * newLots;
            this.cash -= entryCommission;

            this.position = {
                direction: 'LONG',
                lots: newLots,
                entryPrice: quotes.ask,
                entryDate: date,
                entryWorldX: worldX
            };
        }

        // Update equity after flips
        this.updateMarkToMarket(currentPrice, spread);

        if (this.onTradeClosed && closedTrade) {
            this.onTradeClosed(closedTrade);
        }

        return closedTrade;
    }

    // Seamlessly close current position when switching assets
    closePosition(currentPrice, spread, date = '', worldX = 0) {
        if (this.isGameOver || this.position.direction === 'FLAT' || this.position.lots === 0) return null;

        const quotes = this.getQuotes(currentPrice, spread);
        let closedTrade = null;

        if (this.position.direction === 'LONG') {
            const exitPrice = quotes.bid;
            const priceDiff = exitPrice - this.position.entryPrice;
            const grossPnL = priceDiff * this.position.lots * this.multiplier;
            const exitCommission = this.commissionPerLot * this.position.lots;
            const netPnL = Number((grossPnL - exitCommission).toFixed(2));
            this.cash += netPnL;

            closedTrade = {
                id: this.totalTrades + 1,
                direction: 'LONG',
                lots: this.position.lots,
                entryPrice: this.position.entryPrice,
                exitPrice: exitPrice,
                entryWorldX: this.position.entryWorldX,
                exitWorldX: worldX,
                pnl: netPnL,
                commission: exitCommission,
                entryDate: this.position.entryDate,
                exitDate: date,
                isWin: netPnL > 0
            };
            this.recordClosedTrade(closedTrade);
        } else if (this.position.direction === 'SHORT') {
            const exitPrice = quotes.ask;
            const priceDiff = this.position.entryPrice - exitPrice;
            const grossPnL = priceDiff * this.position.lots * this.multiplier;
            const exitCommission = this.commissionPerLot * this.position.lots;
            const netPnL = Number((grossPnL - exitCommission).toFixed(2));
            this.cash += netPnL;

            closedTrade = {
                id: this.totalTrades + 1,
                direction: 'SHORT',
                lots: this.position.lots,
                entryPrice: this.position.entryPrice,
                exitPrice: exitPrice,
                entryWorldX: this.position.entryWorldX,
                exitWorldX: worldX,
                pnl: netPnL,
                commission: exitCommission,
                entryDate: this.position.entryDate,
                exitDate: date,
                isWin: netPnL > 0
            };
            this.recordClosedTrade(closedTrade);
        }

        this.position = { direction: 'FLAT', lots: 0, entryPrice: 0, entryDate: '', entryWorldX: 0 };
        this.unrealizedPnL = 0.0;
        this.equity = Number(this.cash.toFixed(2));

        if (this.onTradeClosed && closedTrade) {
            this.onTradeClosed(closedTrade);
        }

        return closedTrade;
    }

    recordClosedTrade(trade) {
        this.tradeHistory.push(trade);
        this.totalTrades++;
        if (trade.pnl > 0) {
            this.winningTrades++;
            if (trade.pnl > this.maxProfit) this.maxProfit = trade.pnl;
        } else {
            this.losingTrades++;
            if (trade.pnl < this.maxLoss) this.maxLoss = trade.pnl;
        }
    }

    triggerMarginCall() {
        this.isGameOver = true;
        this.isMarginCalled = true;
        this.equity = 0;
        if (this.onMarginCall) {
            this.onMarginCall(this.getSummaryStats());
        }
    }

    triggerMillionaire() {
        this.isGameOver = true;
        this.isMillionaire = true;
        if (this.onMillionaire) {
            this.onMillionaire(this.getSummaryStats());
        }
    }

    getSummaryStats() {
        const winRate = this.totalTrades > 0 ? (this.winningTrades / this.totalTrades) * 100 : 0;
        const totalReturnPct = ((this.equity - this.initialCapital) / this.initialCapital) * 100;

        return {
            initialCapital: this.initialCapital,
            finalEquity: this.equity,
            totalReturnPct: Number(totalReturnPct.toFixed(2)),
            totalTrades: this.totalTrades,
            winningTrades: this.winningTrades,
            losingTrades: this.losingTrades,
            winRate: Number(winRate.toFixed(1)),
            maxProfit: this.maxProfit,
            maxLoss: this.maxLoss,
            peakEquity: this.peakEquity,
            isMarginCalled: this.isMarginCalled,
            isMillionaire: this.isMillionaire,
            history: this.tradeHistory.slice(-15) // last 15 trades
        };
    }
}
