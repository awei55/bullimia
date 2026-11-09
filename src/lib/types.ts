export type PositionSide = 'FLAT' | 'BULL' | 'BEAR';

export interface Candle {
  index: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface LevelData {
  id: string;
  ticker: string;
  name: string;
  lore: string;
  candles: Candle[];
  total_candles: number;
  start_index: number;
  avg_atr_pct: number;
  log_scale: number;
  initial_price: number;
  start_date: string;
}

export interface Quotes {
  price: number;
  bid: number;
  ask: number;
  spread: number;
}

export interface AccountState {
  cash_balance: number;
  equity: number;
  side: PositionSide;
  open_lots: number;
  entry_price: number;
  entry_timestamp: string;
  unrealized_pnl: number;
  margin_used: number;
  free_margin: number;
  margin_level_pct: number;
  total_commission_paid: number;
  trade_count: number;
  winning_trades: number;
  losing_trades: number;
  win_rate_pct: number;
  is_margin_called: boolean;
  is_millionaire: boolean;
  high_watermark: number;
}

export interface TradeRecord {
  id: number;
  ticker: string;
  side: PositionSide;
  entry_price: number;
  exit_price: number;
  lots: number;
  entry_timestamp: string;
  exit_timestamp: string;
  pnl: number;
  commission_paid: number;
  is_win: boolean;
  entry_candle_idx?: number;
  exit_candle_idx?: number;
}

export interface AssetCatalogItem {
  id: string;
  ticker: string;
  name: string;
  category: string;
  difficulty: string;
  lore: string;
}
