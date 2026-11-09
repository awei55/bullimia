import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { account, chargeProgress, chargedLots, timeDilation, quotes } from './trading';

describe('Bullimia Frontend Trading Stores', () => {
  it('initializes with default $10,000 cash balance and FLAT state', () => {
    const acc = get(account);
    expect(acc.cash_balance).toBe(10000.0);
    expect(acc.equity).toBe(10000.0);
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
});
