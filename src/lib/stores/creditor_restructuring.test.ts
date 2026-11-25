import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  creditorRestructuringState,
  triggerCreditorRestructuring,
  repayCreditorDebt,
  accrueCreditorInterest,
  closeCreditorModal,
} from './creditor_restructuring';
import { account, updateMarkToMarket } from './trading';

describe('BULLIMIA Phase 3: Creditor Restructuring & Solvency Protection', () => {
  beforeEach(() => {
    account.set({
      cash_balance: 10000000.0,
      equity: 10000000.0,
      side: 'FLAT',
      open_lots: 0,
      entry_price: 0,
      entry_timestamp: '',
      unrealized_pnl: 0,
      margin_used: 0,
      free_margin: 10000000.0,
      margin_level_pct: 999.0,
      total_commission_paid: 0,
      trade_count: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate_pct: 0,
      is_margin_called: false,
      is_millionaire: true,
      high_watermark: 10000000.0,
      isInRestructuring: false,
      restructuringDebt: 0,
      debtInterestRate: 0,
      restructuringBreachCount: 0,
    });

    creditorRestructuringState.set({
      isModalOpen: false,
      activeNotice: null,
      totalRescues: 0,
      interestAccrued: 0,
    });
  });

  it('triggers restructuring when portfolio suffers catastrophic breach at >= $10M', () => {
    triggerCreditorRestructuring(5000000.0);

    const acc = get(account);
    const cState = get(creditorRestructuringState);

    expect(acc.isInRestructuring).toBe(true);
    expect(acc.is_margin_called).toBe(false);
    expect(acc.restructuringBreachCount).toBe(1);
    // $5M rescue cash + 10% fee = $5.5M restructuring debt
    expect(acc.restructuringDebt).toBe(5500000.0);
    expect(acc.debtInterestRate).toBe(11.75); // SOFR + 650 bps
    // Cash increased by $5M
    expect(acc.cash_balance).toBe(15000000.0);

    expect(cState.isModalOpen).toBe(true);
    expect(cState.totalRescues).toBe(1);
    expect(cState.activeNotice?.rescueCash).toBe(5000000.0);
  });

  it('escalates interest rate on consecutive breaches', () => {
    triggerCreditorRestructuring(5000000.0);
    triggerCreditorRestructuring(5000000.0);

    const acc = get(account);
    expect(acc.restructuringBreachCount).toBe(2);
    expect(acc.debtInterestRate).toBe(14.75); // 11.75 + 3.0%
    expect(acc.restructuringDebt).toBe(11000000.0);
  });

  it('accrues compounding interest on restructuring debt', () => {
    triggerCreditorRestructuring(5000000.0);
    const initialDebt = get(account).restructuringDebt ?? 0;

    accrueCreditorInterest(30.0); // 30 days
    const updatedDebt = get(account).restructuringDebt ?? 0;

    expect(updatedDebt).toBeGreaterThan(initialDebt);
  });

  it('allows debt repayment and clears restructuring status when fully retired', () => {
    triggerCreditorRestructuring(5000000.0); // Debt = 5.5M

    // Partial repayment of $2M
    const partial = repayCreditorDebt(2000000.0);
    expect(partial).toBe(2000000.0);
    expect(get(account).restructuringDebt).toBe(3500000.0);
    expect(get(account).isInRestructuring).toBe(true);

    // Full remaining repayment of $4M (more than remaining $3.5M)
    const full = repayCreditorDebt(4000000.0);
    expect(full).toBe(3500000.0);
    expect(get(account).restructuringDebt).toBe(0);
    expect(get(account).isInRestructuring).toBe(false);
  });

  it('permanently suppresses margin call when equity >= $100M (Sovereign Too Big To Fail)', () => {
    account.set({
      cash_balance: -50000000.0,
      equity: -50000000.0,
      side: 'FLAT',
      open_lots: 0,
      entry_price: 0,
      entry_timestamp: '',
      unrealized_pnl: 0,
      margin_used: 0,
      free_margin: -50000000.0,
      margin_level_pct: 999.0,
      total_commission_paid: 0,
      trade_count: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate_pct: 0,
      is_margin_called: false,
      is_millionaire: true,
      high_watermark: 100000000.0, // $100M sovereign watermark
    });

    updateMarkToMarket(100.0, 0.02);
    const acc = get(account);

    expect(acc.is_margin_called).toBe(false);
    expect(acc.death_reason).toBeUndefined();
  });
});
