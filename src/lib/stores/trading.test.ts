import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  account,
  chargeProgress,
  chargedLots,
  lotMode,
  toggleLotMode,
  timeDilation,
  quotes,
  benefactorState,
  isTradingActive,
  wireUncleGordonCapital,
  checkBenefactorTriggers,
  updateMarkToMarket,
} from './trading';

describe('Bullimia Frontend Trading Stores', () => {
  beforeEach(() => {
    // Reset stores to default Genesis Tutorial state
    lotMode.set('MICROLOT');
    benefactorState.set({
      hasTriggeredWire: false,
      assetBarUnlocked: false,
      newsAlertsUnlocked: false,
      activeDialog: null,
    });
    account.set({
      cash_balance: 1000.0,
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
    });
  });

  it('initializes with default $1,000 cash balance and FLAT state in MICROLOT mode', () => {
    const acc = get(account);
    expect(acc.cash_balance).toBe(1000.0);
    expect(acc.equity).toBe(1000.0);
    expect(acc.side).toBe('FLAT');
    expect(acc.open_lots).toBe(0);
    expect(acc.is_margin_called).toBe(false);
    expect(acc.is_millionaire).toBe(false);
    expect(get(lotMode)).toBe('MICROLOT');
  });

  it('correctly maps chargeProgress in MICROLOT and STANDARD modes', () => {
    // 1. MICROLOT mode (0.01 -> 0.50 lots)
    lotMode.set('MICROLOT');
    chargeProgress.set(0.0);
    expect(get(chargedLots)).toBe(0.01);

    chargeProgress.set(1.0);
    expect(get(chargedLots)).toBe(0.5);

    // 2. STANDARD mode (1 -> 100 lots)
    lotMode.set('STANDARD');
    chargeProgress.set(0.0);
    expect(get(chargedLots)).toBe(1);

    chargeProgress.set(0.5);
    expect(get(chargedLots)).toBeGreaterThan(1);
    expect(get(chargedLots)).toBeLessThan(100);

    chargeProgress.set(1.0);
    expect(get(chargedLots)).toBe(100);
  });

  it('locks lotMode switching before $10k and unlocks after wire transmission', () => {
    expect(get(lotMode)).toBe('MICROLOT');

    // Attempt toggle in Genesis tutorial ($1K, no wire) -> Should stay MICROLOT
    toggleLotMode();
    expect(get(lotMode)).toBe('MICROLOT');

    // Trigger wire -> Should now toggle to STANDARD and back
    benefactorState.update((s) => ({ ...s, hasTriggeredWire: true }));
    toggleLotMode();
    expect(get(lotMode)).toBe('STANDARD');

    toggleLotMode();
    expect(get(lotMode)).toBe('MICROLOT');
  });

  it('suppresses margin call and triggers DEAD_BROKE only at equity <= 0 in tutorial', () => {
    // 1. In tutorial: position has margin_used = 200 (maintenance = 100)
    // Price drops so equity = 50 (< 100 maintenance). In tutorial, this should NOT trigger margin call!
    account.set({
      cash_balance: 500.0,
      equity: 500.0,
      side: 'BULL',
      open_lots: 100,
      entry_price: 100.0,
      entry_timestamp: '2024-01-01',
      unrealized_pnl: 0.0,
      margin_used: 200.0,
      free_margin: 300.0,
      margin_level_pct: 250.0,
      total_commission_paid: 1.0,
      trade_count: 1,
      winning_trades: 0,
      losing_trades: 0,
      win_rate_pct: 0.0,
      is_margin_called: false,
      is_millionaire: false,
      high_watermark: 1000.0,
    });

    // Price drops to 95.5: unrealized PnL approx -450, equity ~ 50 (< 100 maintenance margin)
    updateMarkToMarket(95.5, 0.001);
    let acc = get(account);
    expect(acc.equity).toBeLessThan(100.0);
    expect(acc.equity).toBeGreaterThan(0.0);
    expect(acc.is_margin_called).toBe(false); // NO margin call in tutorial!

    // 2. Price crashes further to 94.0: unrealized PnL -600, equity -100 <= 0
    updateMarkToMarket(94.0, 0.001);
    acc = get(account);
    expect(acc.equity).toBeLessThanOrEqual(0);
    expect(acc.is_margin_called).toBe(true);
    expect(acc.death_reason).toBe('DEAD_BROKE');
  });

  it('triggers MARGIN_CALL liquidation post-10k when equity breaches 50% maintenance margin', () => {
    // Unlocked post-10k via wire
    benefactorState.update((s) => ({ ...s, hasTriggeredWire: true }));
    account.update((acc) => {
      acc.high_watermark = 10000.0;
      acc.cash_balance = 500.0;
      acc.side = 'BULL';
      acc.open_lots = 10;
      acc.entry_price = 100.0;
      return acc;
    });

    // Mark to market at price 90 (unrealized_pnl = -100, equity = 400, margin_used = 10 * 100 * 0.02 = 20)
    // But if price drops to 55: unrealized pnl = -450, equity = 50, margin_used = 20
    // If margin_used = 200 (100 lots at 100 * 0.02 = 200), equity <= 100 triggers MARGIN_CALL
    account.update((acc) => {
      acc.side = 'BULL';
      acc.open_lots = 100;
      acc.entry_price = 100.0;
      acc.cash_balance = 500.0;
      return acc;
    });

    // Price drops to 95.5: mult=1.0, unrealized_pnl approx (95.5 - 100) * 100 = -450 -> equity = 50
    // margin_used = 100 * 100 * 0.02 = 200. Maintenance margin = 100. Equity 50 <= 100.
    updateMarkToMarket(95.5, 0.001);

    const acc = get(account);
    expect(acc.is_margin_called).toBe(true);
    expect(acc.death_reason).toBe('MARGIN_CALL');
  });

  it('handles time dilation speeds properly', () => {
    timeDilation.set(2.0);
    expect(get(timeDilation)).toBe(2.0);
    timeDilation.set(0.5);
    expect(get(timeDilation)).toBe(0.5);
  });

  it('stores and updates market quotes', () => {
    quotes.set({ price: 150.0, bid: 149.85, ask: 150.15, spread: 0.3 });
    const q = get(quotes);
    expect(q.price).toBe(150.0);
    expect(q.bid).toBe(149.85);
    expect(q.ask).toBe(150.15);
    expect(q.spread).toBe(0.3);
  });

  it('does not trigger benefactor modal while isTradingActive is false', () => {
    benefactorState.set({
      hasTriggeredWire: false,
      assetBarUnlocked: false,
      newsAlertsUnlocked: false,
      activeDialog: null,
    });
    isTradingActive.set(false);
    account.set({
      cash_balance: 5500.0,
      equity: 5500.0,
      margin_used: 0.0,
      free_margin: 5500.0,
      margin_level_pct: 999.0,
      unrealized_pnl: 0.0,
      realized_pnl: 0.0,
      side: 'FLAT',
      entry_price: 0.0,
      open_lots: 0,
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate_pct: 0.0,
      is_margin_called: false,
      is_millionaire: false,
      high_watermark: 5500.0,
    });

    checkBenefactorTriggers();
    expect(get(benefactorState).activeDialog).toBeNull();
  });

  it('generates distinct Uncle Gordon messages for profit, crisis, and time triggers', () => {
    // 1. Profit Trigger ($5,000)
    benefactorState.set({
      hasTriggeredWire: false,
      assetBarUnlocked: false,
      newsAlertsUnlocked: false,
      activeDialog: null,
    });
    wireUncleGordonCapital('profit');
    let bState = get(benefactorState);
    expect(bState.activeDialog?.title).toContain('PROFIT TRIGGER: $5,000');
    expect(bState.activeDialog?.message).toContain('turned pocket change into 5 grand');

    // 2. Crisis Trigger ($100)
    benefactorState.set({
      hasTriggeredWire: false,
      assetBarUnlocked: false,
      newsAlertsUnlocked: false,
      activeDialog: null,
    });
    wireUncleGordonCapital('crisis');
    bState = get(benefactorState);
    expect(bState.activeDialog?.title).toContain('BAILOUT TRIGGER: $100');
    expect(bState.activeDialog?.message).toContain('Down to your last hundred bucks');

    // 3. Time Trigger (120s survival)
    benefactorState.set({
      hasTriggeredWire: false,
      assetBarUnlocked: false,
      newsAlertsUnlocked: false,
      activeDialog: null,
    });
    wireUncleGordonCapital('time');
    bState = get(benefactorState);
    expect(bState.activeDialog?.title).toContain('SURVIVAL TRIGGER: 120s');
    expect(bState.activeDialog?.message).toContain('two minutes straight without blowing up');
  });

  it('triggers news alerts at $100,000 threshold when active', () => {
    benefactorState.set({
      hasTriggeredWire: true,
      assetBarUnlocked: true,
      newsAlertsUnlocked: false,
      activeDialog: null,
    });
    isTradingActive.set(true);

    account.set({
      cash_balance: 100000.0,
      equity: 100000.0,
      margin_used: 0.0,
      free_margin: 100000.0,
      margin_level_pct: 999.0,
      unrealized_pnl: 0.0,
      realized_pnl: 0.0,
      side: 'FLAT',
      entry_price: 0.0,
      open_lots: 0,
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate_pct: 0.0,
      is_margin_called: false,
      is_millionaire: false,
      high_watermark: 100000.0,
    });

    checkBenefactorTriggers();
    const bState = get(benefactorState);
    expect(bState.newsAlertsUnlocked).toBe(true);
  });
});

