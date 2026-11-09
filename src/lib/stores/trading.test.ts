import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import {
  account,
  chargeProgress,
  chargedLots,
  timeDilation,
  quotes,
  benefactorState,
  isTradingActive,
  wireUncleGordonCapital,
  checkBenefactorTriggers,
} from './trading';

describe('Bullimia Frontend Trading Stores', () => {
  it('initializes with default $1,000 cash balance and FLAT state', () => {
    const acc = get(account);
    expect(acc.cash_balance).toBe(1000.0);
    expect(acc.equity).toBe(1000.0);
    expect(acc.side).toBe('FLAT');
    expect(acc.open_lots).toBe(0);
    expect(acc.is_margin_called).toBe(false);
    expect(acc.is_millionaire).toBe(false);
  });

  it('correctly maps chargeProgress 0.0 -> 1.0 to lots 1 -> 100', () => {
    // 0% charge = 1 lot
    chargeProgress.set(0.0);
    expect(get(chargedLots)).toBe(1);

    // 50% charge = ~50 lots
    chargeProgress.set(0.5);
    expect(get(chargedLots)).toBe(50);

    // 100% charge = 100 lots
    chargeProgress.set(1.0);
    expect(get(chargedLots)).toBe(100);
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

