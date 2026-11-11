import { writable, derived, get } from 'svelte/store';
import type { AccountState, LevelData, Quotes, TradeRecord, PositionSide } from '../types';
import { soundEngine } from '../audio/soundtrack';

const initialAccount: AccountState = {
  cash_balance: 1000.0, // Genesis Tutorial starts with $1,000 USD
  equity: 1000.0,
  side: 'FLAT',
  open_lots: 0,
  entry_price: 0.0,
  entry_timestamp: '',
  unrealized_pnl: 0.0,
  margin_used: 0.0,
  free_margin: 1000.0,
  margin_level_pct: 999.0,
  total_commission_paid: 0.0,
  trade_count: 0,
  winning_trades: 0,
  losing_trades: 0,
  win_rate_pct: 0.0,
  is_margin_called: false,
  is_millionaire: false,
  high_watermark: 1000.0,
};

export interface BenefactorState {
  hasTriggeredWire: boolean;
  assetBarUnlocked: boolean;
  newsAlertsUnlocked: boolean;
  activeDialog: {
    title: string;
    message: string;
    wireAmount?: number;
    unlockNote?: string;
  } | null;
}

export const account = writable<AccountState>(initialAccount);
export const currentLevel = writable<LevelData | null>(null);
export const quotes = writable<Quotes>({ price: 100.0, bid: 99.95, ask: 100.05, spread: 0.1 });
export const tradeHistory = writable<TradeRecord[]>([]);
export const timeDilation = writable<number>(1.0);
export const isCharging = writable<boolean>(false);
export const chargeProgress = writable<number>(0.0);
export const chargedLots = derived(chargeProgress, ($p) => Math.max(1, Math.min(100, Math.floor(1 + $p * 99))));

export const benefactorState = writable<BenefactorState>({
  hasTriggeredWire: false,
  assetBarUnlocked: false,
  newsAlertsUnlocked: false,
  activeDialog: null,
});

export const activeNewsAlert = writable<{ headline: string; timestamp: number } | null>(null);
export const isTradingActive = writable<boolean>(false);

let ws: WebSocket | null = null;
let reconnectTimer: any = null;
let tradeCounter = 1;

export function initWebSocket() {
  if (typeof window === 'undefined') return;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws/stream`;

  try {
    ws = new WebSocket(wsUrl);
    ws.onopen = () => console.log('Connected to Bullimia Quant WebSocket');
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'account_update') {
          account.set(msg.account);
          if (msg.quotes) quotes.set(msg.quotes);
          soundEngine.updateTelemetry(msg.account.unrealized_pnl, msg.account.open_lots, msg.account.margin_level_pct < 100);
        } else if (msg.type === 'order_result') {
          const res = msg.data;
          account.set(res.account);
          if (res.closed_trade) {
            tradeHistory.update((h) => [...h, res.closed_trade]);
            if (res.closed_trade.is_win) {
              soundEngine.playWin(res.closed_trade.pnl);
            } else {
              soundEngine.playLoss(res.closed_trade.pnl);
            }
          }
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };
    ws.onclose = () => {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(initWebSocket, 4000);
    };
  } catch (e) {
    // Rely on HTTP / client fallback
  }
}

export async function loadLevel(levelId: string, randomEpoch: boolean = false): Promise<LevelData> {
  const query = randomEpoch ? '?random_epoch=true' : '';
  let rawData: any = null;

  // 1. Try backend API
  try {
    const res = await fetch(`/api/level/${levelId}${query}`);
    if (res.ok) {
      rawData = await res.json();
    }
  } catch (e) {
    // Backend offline, fallback to static JSON
  }

  // 2. Static File Fallback (public/data/)
  if (!rawData) {
    try {
      const staticRes = await fetch(`/data/level_${levelId}.json`);
      if (staticRes.ok) {
        rawData = await staticRes.json();
      }
    } catch (e) {}
  }

  // 3. Last-resort fallback to NVDA
  if (!rawData) {
    try {
      const nvdaRes = await fetch('/data/level_NVDA.json');
      if (nvdaRes.ok) {
        rawData = await nvdaRes.json();
      }
    } catch (e) {}
  }

  if (!rawData) {
    throw new Error(`Could not load market data for ${levelId}`);
  }

  // Format LevelData
  const candles = rawData.candles || [];
  const total = candles.length;
  let startIdx = 0;
  if (randomEpoch && total > 180) {
    startIdx = Math.floor(Math.random() * (total - 160)) + 20;
  }

  const avgAtrPct = rawData.avg_atr_pct || 0.028;
  const logScale = rawData.log_scale || Math.round(48.0 / avgAtrPct);
  const initialPrice = candles[startIdx]?.open || 100.0;
  const startDate = candles[startIdx]?.date || '2020-01-01';
  const multiplier = rawData.multiplier !== undefined ? Number(rawData.multiplier) : 1.0;

  const level: LevelData = {
    id: rawData.id || levelId,
    ticker: rawData.ticker || levelId,
    name: rawData.name || levelId,
    lore: rawData.lore || 'Surfing historical market price action.',
    candles,
    total_candles: total,
    start_index: startIdx,
    avg_atr_pct: avgAtrPct,
    log_scale: logScale,
    initial_price: initialPrice,
    start_date: startDate,
    multiplier,
  };

  currentLevel.set(level);
  quotes.set({
    price: initialPrice,
    bid: Number((initialPrice * 0.999).toFixed(4)),
    ask: Number((initialPrice * 1.001).toFixed(4)),
    spread: Number((initialPrice * 0.002).toFixed(4)),
  });

  return level;
}

export function executeOrder(
  ticker: string,
  side: PositionSide,
  lots: number,
  price: number,
  timestamp: string,
  atrPct: number = 0.02,
  candleIdx: number = 0
) {
  // 1. Execute immediately and synchronously on client side (0ms latency, zero desync)
  clientSideExecuteOrder(ticker, side, lots, price, timestamp, atrPct, candleIdx);

  // 2. Non-blocking asynchronous sync with backend if available
  if (typeof window !== 'undefined') {
    fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker,
        side,
        lots,
        current_price: price,
        timestamp,
        atr_pct: atrPct,
        candle_idx: candleIdx,
      }),
    }).catch(() => {});
  }
}

function clientSideExecuteOrder(
  ticker: string,
  side: PositionSide,
  lots: number,
  price: number,
  timestamp: string,
  atrPct: number,
  candleIdx: number = 0
) {
  const mult = get(currentLevel)?.multiplier ?? 1.0;

  account.update((acc) => {
    const spreadPct = Math.max(0.0005, Math.min(0.005, atrPct * 0.05));
    const spread = price * spreadPct;
    const halfSpread = spread / 2.0;
    const bid = price - halfSpread;
    const ask = price + halfSpread;

    // Close previous position if active
    let closedTrade: TradeRecord | null = null;
    if (acc.side !== 'FLAT' && acc.open_lots > 0) {
      const exitPrice = acc.side === 'BULL' ? bid : ask;
      const realizedPnl = acc.side === 'BULL'
        ? (exitPrice - acc.entry_price) * acc.open_lots * mult
        : (acc.entry_price - exitPrice) * acc.open_lots * mult;
      const commission = acc.open_lots * 1.0;

      acc.cash_balance += (realizedPnl - commission);
      acc.total_commission_paid += commission;
      acc.trade_count += 1;
      const isWin = realizedPnl > 0;
      if (isWin) acc.winning_trades += 1;
      else acc.losing_trades += 1;

      closedTrade = {
        id: tradeCounter++,
        ticker,
        side: acc.side,
        entry_price: acc.entry_price,
        exit_price: exitPrice,
        lots: acc.open_lots,
        entry_timestamp: acc.entry_timestamp,
        exit_timestamp: timestamp,
        pnl: realizedPnl - commission,
        commission_paid: commission,
        is_win: isWin,
        entry_candle_idx: acc.entry_candle_idx ?? Math.max(0, candleIdx - 15),
        exit_candle_idx: candleIdx,
      };
      tradeHistory.update((h) => [...h, closedTrade!]);
      if (isWin) soundEngine.playWin(realizedPnl);
      else soundEngine.playLoss(realizedPnl);
    } else {
      soundEngine.playOrderExecuted(side, lots);
    }

    // Open new position
    if (side !== 'FLAT') {
      const openComm = lots * 1.0;
      acc.cash_balance -= openComm;
      acc.total_commission_paid += openComm;
      acc.side = side;
      acc.open_lots = lots;
      acc.entry_price = side === 'BULL' ? ask : bid;
      acc.entry_timestamp = timestamp;
      acc.entry_candle_idx = candleIdx;
    } else {
      acc.side = 'FLAT';
      acc.open_lots = 0;
      acc.entry_price = 0;
      acc.entry_timestamp = '';
      acc.entry_candle_idx = undefined;
    }

    acc.win_rate_pct = acc.trade_count > 0 ? Number(((acc.winning_trades / acc.trade_count) * 100).toFixed(1)) : 0;
    return acc;
  });

  updateMarkToMarket(price, atrPct);
}

export function updateMarkToMarket(price: number, atrPct: number = 0.02) {
  const mult = get(currentLevel)?.multiplier ?? 1.0;

  const spreadPct = Math.max(0.0005, Math.min(0.005, atrPct * 0.05));
  const spread = price * spreadPct;
  const halfSpread = spread / 2.0;
  const bid = price - halfSpread;
  const ask = price + halfSpread;

  quotes.set({
    price: Number(price.toFixed(2)),
    bid: Number(bid.toFixed(2)),
    ask: Number(ask.toFixed(2)),
    spread: Number(spread.toFixed(2)),
  });

  account.update((acc) => {
    if (acc.side === 'FLAT' || acc.open_lots === 0) {
      acc.unrealized_pnl = 0;
      acc.equity = acc.cash_balance;
      acc.margin_used = 0;
      acc.free_margin = acc.cash_balance;
      acc.margin_level_pct = 999.0;
    } else if (acc.side === 'BULL') {
      acc.unrealized_pnl = (bid - acc.entry_price) * acc.open_lots * mult;
      acc.equity = acc.cash_balance + acc.unrealized_pnl;
      acc.margin_used = acc.open_lots * acc.entry_price * mult * 0.02;
      acc.free_margin = acc.equity - acc.margin_used;
      acc.margin_level_pct = acc.margin_used > 0 ? (acc.equity / acc.margin_used) * 100.0 : 999.0;
    } else if (acc.side === 'BEAR') {
      acc.unrealized_pnl = (acc.entry_price - ask) * acc.open_lots * mult;
      acc.equity = acc.cash_balance + acc.unrealized_pnl;
      acc.margin_used = acc.open_lots * acc.entry_price * mult * 0.02;
      acc.free_margin = acc.equity - acc.margin_used;
      acc.margin_level_pct = acc.margin_used > 0 ? (acc.equity / acc.margin_used) * 100.0 : 999.0;
    }

    if (acc.equity > acc.high_watermark) acc.high_watermark = acc.equity;
    if (acc.equity >= 1000000) acc.is_millionaire = true;
    if (acc.equity <= 0 || (acc.margin_used > 0 && acc.equity <= acc.margin_used * 0.5)) {
      acc.is_margin_called = true;
    }

    return acc;
  });

  const acc = get(account);
  soundEngine.updateTelemetry(acc.unrealized_pnl, acc.open_lots, acc.margin_level_pct < 100);

  // Check Benefactor Wire Triggers ($1,000 -> $10,000)
  checkBenefactorTriggers();
}

export function checkBenefactorTriggers() {
  if (!get(isTradingActive)) return;
  const bState = get(benefactorState);
  const acc = get(account);

  // Check Uncle Gordon Wire Trigger (if not already triggered)
  if (!bState.hasTriggeredWire) {
    let triggered = false;
    let reason = '';

    if (acc.equity >= 5000.0) {
      triggered = true;
      reason = 'profit';
    } else if (acc.equity <= 100.0 && acc.equity > 0) {
      triggered = true;
      reason = 'crisis';
    }

    if (triggered) {
      wireUncleGordonCapital(reason);
    }
  }

  // Check News Alerts Unlock ($100,000)
  if (!bState.newsAlertsUnlocked && acc.equity >= 100000.0) {
    benefactorState.update((s) => ({ ...s, newsAlertsUnlocked: true }));
    triggerHeadlineAlert('⚡ BREAKING: MACRO VOLATILITY ALERTS UNLOCKED ($100,000 MILESTONE REACHED)');
  }
}

export function wireUncleGordonCapital(reason: string = 'time') {
  benefactorState.update((s) => {
    if (s.hasTriggeredWire) return s;

    let title = 'ENCRYPTED TRANSMISSION // UNCLE GORDON';
    let message = '';
    if (reason === 'profit') {
      title = 'ENCRYPTED TRANSMISSION // UNCLE GORDON (PROFIT TRIGGER: $5,000)';
      message = "Kid, I've been watching your candlestick runs. You've got instinct—turned pocket change into 5 grand! But trading one lot at a time on a single stock won't get you off retail streets. I just wired $9,000 into your account. Try trading AAPL or EUR/USD. I just unlocked the multi-asset terminal for you.";
    } else if (reason === 'crisis') {
      title = 'ENCRYPTED TRANSMISSION // UNCLE GORDON (BAILOUT TRIGGER: $100)';
      message = "Ouch. Almost wiped out your first grand. Down to your last hundred bucks! Welcome to Wall Street, kid. Don't sweat it—every legend bleeds on day one. I just wired $9,000 into your broker account so you can stay in the game. Take a breather, switch to AAPL or EUR/USD, and respect your risk limits.";
    } else {
      title = 'ENCRYPTED TRANSMISSION // UNCLE GORDON (SURVIVAL TRIGGER: 120s)';
      message = "Word on the street is you've started surfing the candlestick tape. You've held your own out here for two minutes straight without blowing up. Not bad for a rookie. I just wired $9,000 into your broker account to give you real trading capital. Recommending you diversify into AAPL or EUR/USD. Multi-asset selector is now unlocked.";
    }

    // Add $9,000 cash locally and notify backend
    if (typeof window !== 'undefined' && window.location?.port && window.location.port !== '3000') {
      fetch('/api/wire', { method: 'POST' }).catch(() => {});
    }
    account.update((acc) => {
      acc.cash_balance += 9000.0;
      acc.equity += 9000.0;
      acc.free_margin += 9000.0;
      return acc;
    });

    soundEngine.playWin(9000.0);

    return {
      hasTriggeredWire: true,
      assetBarUnlocked: true,
      newsAlertsUnlocked: s.newsAlertsUnlocked,
      activeDialog: {
        title,
        message,
        wireAmount: 9000,
        unlockNote: 'UNLOCKED: Multi-Asset Switching Panel (Keys 1-8)',
      },
    };
  });
}

export function triggerHeadlineAlert(headline: string) {
  activeNewsAlert.set({ headline, timestamp: Date.now() });
  soundEngine.playMarginWarning();
  setTimeout(() => activeNewsAlert.set(null), 5500);
}

export async function resetCareer(startingCash: number = 1000.0) {
  try {
    await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starting_cash: startingCash }),
    });
  } catch (e) {}

  account.set({
    ...initialAccount,
    cash_balance: startingCash,
    equity: startingCash,
    free_margin: startingCash,
    high_watermark: startingCash,
  });
  tradeHistory.set([]);
  benefactorState.set({
    hasTriggeredWire: false,
    assetBarUnlocked: false,
    newsAlertsUnlocked: false,
    activeDialog: null,
  });
  isTradingActive.set(false);
}
