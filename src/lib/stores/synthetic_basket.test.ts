import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  syntheticBasket,
  marketDepth,
  setBasketPair,
  updateSyntheticTick,
  executeBasketTrade,
  generateDynamicMarketDepth,
} from './synthetic_basket';
import { account } from './trading';

describe('BULLIMIA Phase 2: Synthetic Basket Pairing & L2 Liquidity Depth', () => {
  beforeEach(() => {
    account.set({
      cash_balance: 1000000.0,
      equity: 1000000.0,
      side: 'FLAT',
      open_lots: 0,
      entry_price: 0,
      entry_timestamp: '',
      unrealized_pnl: 0,
      margin_used: 0,
      free_margin: 1000000.0,
      margin_level_pct: 999.0,
      total_commission_paid: 0,
      trade_count: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate_pct: 0,
      is_margin_called: false,
      is_millionaire: true,
      high_watermark: 1000000.0,
    });

    setBasketPair('NVDA', 'AMD', 1.0);
  });

  it('initializes basket with default spread calculation and zero active position', () => {
    const basket = get(syntheticBasket);
    expect(basket.primaryTicker).toBe('NVDA');
    expect(basket.hedgeTicker).toBe('AMD');
    expect(basket.hedgeRatio).toBe(1.0);
    expect(basket.activePosition).toBeNull();
    expect(basket.unrealizedPnl).toBe(0.0);
  });

  it('updates spread, statistical rolling window, and zScore on price ticks', () => {
    updateSyntheticTick(130.0, 140.0);
    const b1 = get(syntheticBasket);
    expect(b1.currentSpread).toBe(-10.0);
    expect(b1.primaryPrice).toBe(130.0);
    expect(b1.hedgePrice).toBe(140.0);

    // Multiple ticks to establish variance
    updateSyntheticTick(132.0, 140.0);
    updateSyntheticTick(135.0, 140.0);
    const b2 = get(syntheticBasket);
    expect(b2.currentSpread).toBe(-5.0);
    expect(b2.zScore).toBeGreaterThan(0);
  });

  it('opens a LONG_SPREAD position, tracks unrealized PnL, and closes with realized PnL', () => {
    updateSyntheticTick(120.0, 140.0); // Spread = -20.0
    executeBasketTrade('LONG_SPREAD', 10);

    let state = get(syntheticBasket);
    expect(state.activePosition).not.toBeNull();
    expect(state.activePosition?.side).toBe('LONG_SPREAD');
    expect(state.activePosition?.entrySpread).toBe(-20.0);
    expect(state.activePosition?.lots).toBe(10);

    // Price widens in our favor: Spread goes from -20 to -10 (+10 spread delta)
    updateSyntheticTick(130.0, 140.0); // Spread = -10.0
    state = get(syntheticBasket);
    // 10 spread delta * 10 lots * $10/pt = +$1,000
    expect(state.unrealizedPnl).toBe(1000.0);

    // Flatten position
    executeBasketTrade('FLATTEN');
    state = get(syntheticBasket);
    expect(state.activePosition).toBeNull();
    expect(state.unrealizedPnl).toBe(0.0);
    // Net PnL = 1000 - commissions (10 * 2 = 20 close commission)
    expect(state.realizedPnl).toBe(980.0);

    const acc = get(account);
    expect(acc.cash_balance).toBeGreaterThan(1000000.0);
    expect(acc.trade_count).toBe(2);
  });

  it('generates 5-tier bid and ask dynamic L2 liquidity depth ladder', () => {
    generateDynamicMarketDepth(125.0, 0.10, 0.02);
    const depth = get(marketDepth);

    expect(depth.asks.length).toBe(5);
    expect(depth.bids.length).toBe(5);
    expect(depth.totalAskLots).toBeGreaterThan(0);
    expect(depth.totalBidLots).toBeGreaterThan(0);
    expect(depth.asks[0].price).toBeGreaterThan(depth.bids[0].price);
    expect(depth.imbalanceRatio).toBeGreaterThan(0);
  });
});
