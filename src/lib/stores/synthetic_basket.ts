import { writable, get, derived } from 'svelte/store';
import { account, quotes, currentLevel, tradeHistory } from './trading';
import { soundEngine } from '../audio/soundtrack';
import type { PositionSide, TradeRecord } from '../types';

export interface BasketPosition {
  side: 'LONG_SPREAD' | 'SHORT_SPREAD'; // LONG_SPREAD = Long Primary / Short Hedge; SHORT_SPREAD = Short Primary / Long Hedge
  lots: number;
  entrySpread: number;
  entryPrimaryPrice: number;
  entryHedgePrice: number;
  timestamp: string;
}

export interface SyntheticBasketState {
  primaryTicker: string;
  hedgeTicker: string;
  hedgeRatio: number;
  primaryPrice: number;
  hedgePrice: number;
  currentSpread: number;
  spreadHistory: number[];
  spreadMean: number;
  spreadStdDev: number;
  zScore: number;
  activePosition: BasketPosition | null;
  unrealizedPnl: number;
  realizedPnl: number;
  basketTradeCount: number;
}

export interface DepthLevel {
  level: number;
  price: number;
  lots: number;
  cumulativeLots: number;
  depthPct: number;
}

export interface MarketDepthState {
  asks: DepthLevel[];
  bids: DepthLevel[];
  totalAskLots: number;
  totalBidLots: number;
  imbalanceRatio: number; // > 1.0 indicates bid heavy (bullish), < 1.0 ask heavy (bearish)
}

const initialBasketState: SyntheticBasketState = {
  primaryTicker: 'NVDA',
  hedgeTicker: 'AMD',
  hedgeRatio: 1.0,
  primaryPrice: 120.0,
  hedgePrice: 140.0,
  currentSpread: -20.0,
  spreadHistory: [-20.0, -19.8, -20.2, -19.9, -20.1],
  spreadMean: -20.0,
  spreadStdDev: 0.5,
  zScore: 0.0,
  activePosition: null,
  unrealizedPnl: 0.0,
  realizedPnl: 0.0,
  basketTradeCount: 0,
};

export const syntheticBasket = writable<SyntheticBasketState>(initialBasketState);

// Simulated prices for benchmark hedge assets when not loaded as active level
export const assetBenchmarkPrices = writable<Record<string, number>>({
  NVDA: 124.50,
  AMD: 142.10,
  TSLA: 215.30,
  SPY: 540.20,
  QQQ: 468.90,
  AAPL: 220.40,
  GME: 24.80,
  'BTC-USD': 64200.0,
});

export const marketDepth = writable<MarketDepthState>({
  asks: [],
  bids: [],
  totalAskLots: 0,
  totalBidLots: 0,
  imbalanceRatio: 1.0,
});

export function setBasketPair(primary: string, hedge: string, hedgeRatio: number = 1.0) {
  syntheticBasket.update((state) => {
    const benchmarks = get(assetBenchmarkPrices);
    const primPrice = benchmarks[primary] || 100.0;
    const hedPrice = benchmarks[hedge] || 100.0;
    const spread = Number((primPrice - hedPrice * hedgeRatio).toFixed(2));

    return {
      ...state,
      primaryTicker: primary,
      hedgeTicker: hedge,
      hedgeRatio,
      primaryPrice: primPrice,
      hedgePrice: hedPrice,
      currentSpread: spread,
      spreadHistory: [spread, spread + 0.1, spread - 0.1],
      spreadMean: spread,
      spreadStdDev: 0.5,
      zScore: 0.0,
      activePosition: null,
      unrealizedPnl: 0.0,
    };
  });
}

export function updateSyntheticTick(primaryPrice: number, hedgePriceOverride?: number) {
  syntheticBasket.update((state) => {
    const benchmarks = get(assetBenchmarkPrices);
    let hedgePrice = hedgePriceOverride ?? benchmarks[state.hedgeTicker] ?? (primaryPrice * 1.15);
    
    // Add micro-noise if hedge is not active chart to simulate live correlation
    if (!hedgePriceOverride) {
      const delta = (Math.random() - 0.49) * 0.08;
      hedgePrice = Number((hedgePrice + delta).toFixed(2));
      benchmarks[state.hedgeTicker] = hedgePrice;
      assetBenchmarkPrices.set(benchmarks);
    }

    const currentSpread = Number((primaryPrice - hedgePrice * state.hedgeRatio).toFixed(2));
    const history = [...state.spreadHistory.slice(-49), currentSpread];
    
    // Calculate Mean & Standard Deviation
    const mean = history.reduce((sum, val) => sum + val, 0) / history.length;
    const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
    const stdDev = Math.max(0.05, Math.sqrt(variance));
    const zScore = Number(((currentSpread - mean) / stdDev).toFixed(2));

    // Calculate Unrealized PnL for active basket position
    let unrealizedPnl = 0.0;
    if (state.activePosition) {
      const spreadDelta = currentSpread - state.activePosition.entrySpread;
      // 1 lot of spread trade = 1 lot Primary ($1/pt) and 1 lot Hedge ($1/pt)
      if (state.activePosition.side === 'LONG_SPREAD') {
        unrealizedPnl = spreadDelta * state.activePosition.lots * 10.0;
      } else {
        unrealizedPnl = -spreadDelta * state.activePosition.lots * 10.0;
      }
    }

    return {
      ...state,
      primaryPrice,
      hedgePrice,
      currentSpread,
      spreadHistory: history,
      spreadMean: Number(mean.toFixed(2)),
      spreadStdDev: Number(stdDev.toFixed(2)),
      zScore,
      unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
    };
  });
}

export function executeBasketTrade(side: 'LONG_SPREAD' | 'SHORT_SPREAD' | 'FLATTEN', lots: number = 10) {
  syntheticBasket.update((state) => {
    const timestamp = new Date().toISOString();

    // Flatten existing position
    if (state.activePosition) {
      const spreadDelta = state.currentSpread - state.activePosition.entrySpread;
      const pnl = state.activePosition.side === 'LONG_SPREAD'
        ? spreadDelta * state.activePosition.lots * 10.0
        : -spreadDelta * state.activePosition.lots * 10.0;
      const commission = state.activePosition.lots * 2.0; // Two legs commission
      const netPnl = pnl - commission;

      // Credit account cash balance
      account.update((acc) => {
        acc.cash_balance += netPnl;
        acc.equity += netPnl;
        acc.free_margin += netPnl;
        acc.total_commission_paid += commission;
        acc.trade_count += 2; // Two synthetic legs
        if (netPnl > 0) acc.winning_trades += 2;
        else acc.losing_trades += 2;
        return acc;
      });

      if (netPnl > 0) {
        soundEngine.playWin(netPnl);
      } else {
        soundEngine.playLoss(netPnl);
      }

      state.realizedPnl += netPnl;
      state.basketTradeCount += 1;
      state.activePosition = null;
      state.unrealizedPnl = 0.0;

      if (side === 'FLATTEN') {
        return state;
      }
    }

    if (side === 'FLATTEN') return state;

    // Open new basket position
    const commission = lots * 2.0;
    account.update((acc) => {
      acc.cash_balance -= commission;
      acc.total_commission_paid += commission;
      return acc;
    });

    state.activePosition = {
      side,
      lots,
      entrySpread: state.currentSpread,
      entryPrimaryPrice: state.primaryPrice,
      entryHedgePrice: state.hedgePrice,
      timestamp,
    };
    state.basketTradeCount += 1;

    soundEngine.playOrderExecuted(side === 'LONG_SPREAD' ? 'BULL' : 'BEAR', lots);
    return state;
  });
}

export function generateDynamicMarketDepth(midPrice: number, spread: number, atrPct: number = 0.02) {
  const halfSpread = spread / 2.0;
  const tickStep = Math.max(0.01, Number((midPrice * 0.0005).toFixed(2)));
  const baseLots = Math.max(50, Math.round(1000 / (midPrice > 100 ? 5 : 1)));

  const asks: DepthLevel[] = [];
  let cumAsk = 0;
  for (let i = 1; i <= 5; i++) {
    const price = Number((midPrice + halfSpread + (i - 1) * tickStep).toFixed(2));
    const lots = Math.round(baseLots * (1 + (i * 0.4) + (Math.sin(Date.now() / 1000 + i) * 0.3)));
    cumAsk += lots;
    asks.push({ level: i, price, lots, cumulativeLots: cumAsk, depthPct: 0 });
  }

  const bids: DepthLevel[] = [];
  let cumBid = 0;
  for (let i = 1; i <= 5; i++) {
    const price = Number((midPrice - halfSpread - (i - 1) * tickStep).toFixed(2));
    const lots = Math.round(baseLots * (1 + (i * 0.4) + (Math.cos(Date.now() / 1000 + i) * 0.3)));
    cumBid += lots;
    bids.push({ level: i, price, lots, cumulativeLots: cumBid, depthPct: 0 });
  }

  // Calculate depth percentage
  const maxLots = Math.max(cumAsk, cumBid, 1);
  asks.forEach((a) => (a.depthPct = Math.round((a.cumulativeLots / maxLots) * 100)));
  bids.forEach((b) => (b.depthPct = Math.round((b.cumulativeLots / maxLots) * 100)));

  marketDepth.set({
    asks,
    bids,
    totalAskLots: cumAsk,
    totalBidLots: cumBid,
    imbalanceRatio: Number((cumBid / Math.max(1, cumAsk)).toFixed(2)),
  });
}
