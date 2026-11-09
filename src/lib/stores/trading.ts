import { writable, derived } from 'svelte/store';
import type { AccountState, LevelData, Quotes, TradeRecord, PositionSide } from '../types';
import { soundEngine } from '../audio/soundtrack';

const initialAccount: AccountState = {
  cash_balance: 10000.0,
  equity: 10000.0,
  side: 'FLAT',
  open_lots: 0,
  entry_price: 0.0,
  entry_timestamp: '',
  unrealized_pnl: 0.0,
  margin_used: 0.0,
  free_margin: 10000.0,
  margin_level_pct: 999.0,
  total_commission_paid: 0.0,
  trade_count: 0,
  winning_trades: 0,
  losing_trades: 0,
  win_rate_pct: 0.0,
  is_margin_called: false,
  is_millionaire: false,
  high_watermark: 10000.0,
};

export const account = writable<AccountState>(initialAccount);
export const currentLevel = writable<LevelData | null>(null);
export const quotes = writable<Quotes>({ price: 100.0, bid: 99.95, ask: 100.05, spread: 0.1 });
export const tradeHistory = writable<TradeRecord[]>([]);
export const timeDilation = writable<number>(1.0); // 0.5x, 1x, 2x, 5x
export const isCharging = writable<boolean>(false);
export const chargeProgress = writable<number>(0.0); // 0.0 to 1.0
export const chargedLots = derived(chargeProgress, ($p) => Math.max(1, Math.min(100, Math.floor(1 + $p * 99))));

let ws: WebSocket | null = null;
let reconnectTimer: any = null;

export function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  // Connect to local backend
  const wsUrl = `${protocol}//${host}/ws/stream`;

  try {
    ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      console.log('Connected to Bullimia Quant WebSocket Stream');
    };
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
      reconnectTimer = setTimeout(initWebSocket, 2000);
    };
    ws.onerror = () => {
      // Fallback gracefully to HTTP
    };
  } catch (e) {
    console.warn('WebSocket unavailable, relying on HTTP API fallback');
  }
}

export async function loadLevel(levelId: string, randomEpoch: boolean = false): Promise<LevelData> {
  const query = randomEpoch ? '?random_epoch=true' : '';
  const res = await fetch(`/api/level/${levelId}${query}`);
  if (!res.ok) {
    throw new Error(`Failed to load level ${levelId}`);
  }
  const data: LevelData = await res.json();
  currentLevel.set(data);
  quotes.set({
    price: data.initial_price,
    bid: Number((data.initial_price * 0.999).toFixed(4)),
    ask: Number((data.initial_price * 1.001).toFixed(4)),
    spread: Number((data.initial_price * 0.002).toFixed(4)),
  });
  return data;
}

export async function executeOrder(
  ticker: string,
  side: PositionSide,
  lots: number,
  price: number,
  timestamp: string,
  atrPct: number = 0.02
) {
  // If WS is open, send via WS
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      action: 'order',
      ticker,
      side,
      lots,
      price,
      timestamp,
      atr_pct: atrPct,
    }));
    soundEngine.playOrderExecuted(side, lots);
    return;
  }

  // HTTP fallback
  const res = await fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticker,
      side,
      lots,
      current_price: price,
      timestamp,
      atr_pct: atrPct,
    }),
  });
  if (res.ok) {
    const data = await res.json();
    account.set(data.account);
    if (data.quotes) quotes.set(data.quotes);
    if (data.closed_trade) {
      tradeHistory.update((h) => [...h, data.closed_trade]);
      if (data.closed_trade.is_win) {
        soundEngine.playWin(data.closed_trade.pnl);
      } else {
        soundEngine.playLoss(data.closed_trade.pnl);
      }
    }
    soundEngine.playOrderExecuted(side, lots);
  }
}

export async function updateMarkToMarket(price: number, atrPct: number = 0.02) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      action: 'mark_to_market',
      price,
      atr_pct: atrPct,
    }));
    return;
  }

  const res = await fetch('/api/mark-to-market', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_price: price, atr_pct: atrPct }),
  });
  if (res.ok) {
    const data = await res.json();
    account.set(data.account);
    if (data.quotes) quotes.set(data.quotes);
    soundEngine.updateTelemetry(data.account.unrealized_pnl, data.account.open_lots, data.account.margin_level_pct < 100);
  }
}

export async function resetCareer(startingCash: number = 10000.0) {
  const res = await fetch('/api/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ starting_cash: startingCash }),
  });
  if (res.ok) {
    const data = await res.json();
    account.set(data.account);
    tradeHistory.set([]);
  }
}
