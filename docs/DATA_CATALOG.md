# 📊 BULLIMIA DATA CATALOG & TECHNICAL INGESTION SPECIFICATION

> **Purpose**: Definitive technical reference for all generated market data, synthetic feeds, candlestick geometry, and state serialization.  
> **Location**: `docs/DATA_CATALOG.md`  
> **Source Datasets**: `public/data/` (client-bundled) & `data/` (backend source)

---

## 1. Asset Universe & Generated Datasets

Bullimia bundles both long-horizon historical data (5-year daily/hourly charts) and high-stress historical epoch crises:

### 1.1 Core Asset Catalog (`public/data/levels_catalog.json`)

| Asset Ticker | Asset Class | Horizon | Candle Count | Avg ATR % | Min Spread | Multiplier | Gameplay Dynamics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`NVDA`** *(Default)* | Semiconductor / AI | 5 Years | 1,255 | 3.79% | $0.04 | 1.0x | **Genesis Tutorial Default**. Fast momentum runs, earnings shocks, explosive trend moves. |
| **`AAPL`** | Mega-cap Tech | 5 Years | 1,255 | 2.15% | $0.02 | 1.0x | Unlocked after Uncle Gordon wire. Smooth trends, high liquidity, tight bid/ask corridor. |
| **`AMD`** | Semiconductor | 5 Years | 1,255 | 4.12% | $0.05 | 1.0x | High beta semiconductor, high volatility swings. |
| **`BTC-USD`** | Cryptocurrency | 5 Years | 1,826 | 4.65% | $15.00 | 0.1x | 24/7/365 crypto terrain, massive volatility, parabolic spikes, and brutal pullbacks. |
| **`TSLA`** | EV / Growth | 5 Years | 1,255 | 4.82% | $0.08 | 1.0x | Aggressive trends, gap-ups, sharp mean reversions. |
| **`SPY`** | S&P 500 Index ETF | 5 Years | 1,255 | 1.28% | $0.01 | 2.0x | Benchmark market index. Tightest spreads, macro-driven regime shifts. |
| **`QQQ`** | Nasdaq 100 Index ETF | 5 Years | 1,255 | 1.65% | $0.02 | 1.5x | Tech index benchmark, balanced trends. |
| **`GME`** | Meme / Short Squeeze | 5 Years | 1,255 | 8.45% | $0.15 | 1.0x | Extreme tail-risk asset, rapid momentum reversals. |

---

### 1.2 Special Historical Epoch Crises

These levels drop the player into the most notorious market events in modern financial history:

| Event ID | Historical Period | Dates | Dynamics |
| :--- | :--- | :--- | :--- |
| **`CRASH_2008`** | Global Financial Crisis | 2008-01 to 2009-04 | Violent downward cascade, liquidity freeze, huge intraday rallies followed by lower lows. |
| **`SPY_COVID`** | Pandemic Flash Crash | 2020-02 to 2020-06 | 35% decline in 23 days, followed by the fastest monetary-policy recovery in history. |
| **`GME_2021`** | WallStreetBets Squeeze | 2021-01 to 2021-02 | $20 to $483 short squeeze, extreme bid-ask widening, broker liquidation halts. |
| **`BTC_2021`** | Crypto Bull Run | 2020-10 to 2021-05 | Parabolic bull run from $11K to $64K followed by the 50% May crash. |
| **`TSLA_2020`** | Post-Split Hyper Rally | 2020-05 to 2021-01 | Epic $150 to $880 run driven by retail momentum and index inclusion. |
| **`NVDA_2024`** | Generative AI Explosion | 2023-01 to 2024-06 | $150 to $1,200 (pre-split) AI infrastructure rally with earnings beats. |

---

## 2. Candlestick Data Schema

All market datasets conform to the standardized JSON schema:

```json
{
  "ticker": "NVDA",
  "name": "NVIDIA Corp (Semiconductors / AI)",
  "avg_atr_pct": 0.0379,
  "log_scale": 1266,
  "start_price": 30.02,
  "end_price": 186.64,
  "candles": [
    {
      "date": "2021-11-08",
      "open": 30.02,
      "high": 30.96,
      "low": 29.78,
      "close": 30.67,
      "volume": 503101000,
      "spread": 0.04
    }
  ]
}
```

### Ingestion Validation Rules:
1. `high >= max(open, close)` and `low <= min(open, close)`.
2. `spread > 0` and is calibrated dynamically if missing:
   $$\text{Spread} = \max(0.0005, \min(0.005, \text{ATR}_{\%} \times 0.05)) \times P$$
3. `date` is ISO-8601 formatted (`YYYY-MM-DD`).

---

## 3. Mathematical Geometry & Autoscroller Scaling

### 3.1 Logarithmic ATR Geometry Scaling
In financial charts spanning multiple years, a $2 move on a $30 stock is a massive 6.7% move, whereas a $2 move on a $200 stock is a negligible 1% move. Linear vertical pixel scaling distorts gameplay.

Bullimia applies **ATR-Normalized Logarithmic Scaling**:
$$H_{\text{scale}} = \text{round}\left(\frac{48.0}{\text{avg\_atr\_pct}}\right)$$
$$\Delta Y = - \ln\left(\frac{P_{\text{candle}}}{P_{\text{entry}}}\right) \times H_{\text{scale}}$$

This guarantees that:
- Volatility is visually consistent regardless of the asset's nominal price.
- High-priced assets like Bitcoin ($60,000) render with the same intuitive physical rhythm as low-priced stocks like Ford ($12).

### 3.2 Random Epoch Slicing Algorithm
When a player loads a level with `random_epoch=true`, the engine selects a starting slice:
$$\text{startIdx} = \text{randomInt}(20, \text{totalCandles} - 160)$$
- Guarantees 20 historical lookback candles to prime moving averages and the Fog of War trail.
- Guarantees at least 140 forward playable candles before reaching the end of the dataset.

---

## 4. State Persistence Schema (`SaveState` v2.0.0)

Career progress is dual-persisted to both browser `localStorage['bullimia_career_save_v2']` and backend JSON storage (`backend/saves/career_save.json`):

```typescript
export interface SaveState {
  version: '2.0.0';
  timestamp: string;
  account: {
    cash_balance: number;
    equity: number;
    side: 'FLAT' | 'BULL' | 'BEAR';
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
  };
  phase: 'PHASE_1_CHART' | 'PHASE_2_CONSOLE' | 'PHASE_3_BOTS' | 'PHASE_4_PORTFOLIO';
  currentLevelId: string;
  playerProgress: number;
  openPosition: {
    side: 'FLAT' | 'BULL' | 'BEAR';
    lots: number;
    entryPrice: number;
    entryTimestamp: string;
    entryCandleIdx: number;
  } | null;
  tradeHistory: TradeRecord[];
  settings: {
    crtEnabled: boolean;
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
  };
}
```

---

## 5. API & WebSocket Protocol Reference

### 5.1 WebSocket Stream: `ws://localhost:8000/ws/stream`
- **Client $\rightarrow$ Server**:
  - `{"action": "mark_to_market", "price": 142.50, "atr_pct": 0.035}`: Request mark-to-market revaluation.
- **Server $\rightarrow$ Client**:
  - `{"type": "account_update", "account": AccountState, "quotes": Quotes}`: Broadcast on every price tick.
  - `{"type": "order_result", "data": {"account": AccountState, "closed_trade": TradeRecord, "quotes": Quotes}}`: Emitted when an order executes.

### 5.2 REST Endpoints (`backend/server.py`)
- `GET /api/health`: Health status and engine timestamp.
- `GET /api/catalog`: List available levels with ATR, price range, and difficulty.
- `GET /api/level/{id}?random_epoch=true`: Load candle data for specified asset.
- `POST /api/order`: Execute order transition (`BULL`, `BEAR`, `FLAT`).
- `POST /api/mark-to-market`: Recalculate floating PnL and margin.
- `POST /api/wire`: Sync Uncle Gordon +$9,000 cash injection with backend kernel.
- `POST /api/save`: Persist career state to disk.
- `GET /api/load`: Retrieve persisted career state.
- `POST /api/dev/warp`: Instantly set equity to $1M, $10M, or $100M for phase testing.
- `POST /api/dev/godmode`: Toggle liquidation immunity.
