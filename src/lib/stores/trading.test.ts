import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import {
  account,
  chargeProgress,
  chargedLots,
  timeDilation,
  quotes,
  benefactorState,
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

  it('handles Uncle Gordon wire transfer and benefactor state unlocks', () => {
    // Reset state for test
    benefactorState.set({
      hasTriggeredWire: false,
      assetBarUnlocked: false,
      newsAlertsUnlocked: false,
      activeDialog: null,
    });
    account.set({
      cash_balance: 1000.0,
      equity: 1000.0,
      margin_used: 0.0,
      free_margin: 1000.0,
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
      high_watermark: 1000.0,
    });

    // Wire capital
    wireUncleGordonCapital('profit');
    const bState = get(benefactorState);
    expect(bState.hasTriggeredWire).toBe(true);
    expect(bState.assetBarUnlocked).toBe(true);
    expect(bState.activeDialog).not.toBeNull();
    expect(bState.activeDialog?.wireAmount).toBe(9000);

    const updatedAcc = get(account);
    expect(updatedAcc.cash_balance).toBe(10000.0);
    expect(updatedAcc.equity).toBe(10000.0);
  });

  it('triggers news alerts at $100,000 threshold', () => {
    benefactorState.set({
      hasTriggeredWire: true,
      assetBarUnlocked: true,
      newsAlertsUnlocked: false,
      activeDialog: null,
    });

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

    checkBenefactorTriggers(0);
    const bState = get(benefactorState);
    expect(bState.newsAlertsUnlocked).toBe(true);
  });
});

