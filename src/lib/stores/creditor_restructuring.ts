import { writable, get } from 'svelte/store';
import { account, triggerHeadlineAlert } from './trading';
import { soundEngine } from '../audio/soundtrack';

export interface CreditorNotice {
  title: string;
  consortium: string;
  rescueCash: number;
  debtAdded: number;
  interestRate: number;
  reason: string;
  breachCount: number;
}

export interface CreditorRestructuringState {
  isModalOpen: boolean;
  activeNotice: CreditorNotice | null;
  totalRescues: number;
  interestAccrued: number;
}

const initialState: CreditorRestructuringState = {
  isModalOpen: false,
  activeNotice: null,
  totalRescues: 0,
  interestAccrued: 0,
};

export const creditorRestructuringState = writable<CreditorRestructuringState>(initialState);

export function triggerCreditorRestructuring(rescueCash: number = 5000000.0) {
  let notice: CreditorNotice | null = null;

  account.update((acc) => {
    const breachCount = (acc.restructuringBreachCount ?? 0) + 1;
    acc.restructuringBreachCount = breachCount;
    acc.isInRestructuring = true;
    acc.is_margin_called = false;
    acc.death_reason = undefined;

    // Debt addition with 10% senior restructuring fee
    const debtAddition = rescueCash * 1.10;
    acc.restructuringDebt = (acc.restructuringDebt ?? 0) + debtAddition;

    // Escalating interest rate: SOFR (5.25%) + 650 bps (6.5%) = 11.75% + 3.0% per consecutive breach
    const interestRate = 11.75 + (breachCount - 1) * 3.0;
    acc.debtInterestRate = interestRate;

    // Inject emergency rescue liquidity into cash and equity
    acc.cash_balance += rescueCash;
    acc.equity += rescueCash;
    acc.free_margin += rescueCash;

    notice = {
      title: `CHAPTER 11 RESCUE ORDER // BREACH #${breachCount}`,
      consortium: 'CITADEL-GOLDMAN-MILLENNIUM SENIOR CREDITOR FACILITY',
      rescueCash,
      debtAdded: debtAddition,
      interestRate,
      reason: 'PORTFOLIO MARGIN DEFICIT DETECTED // AUTOMATIC RESCUE INJECTED',
      breachCount,
    };

    return acc;
  });

  if (notice) {
    creditorRestructuringState.update((s) => ({
      ...s,
      isModalOpen: true,
      activeNotice: notice,
      totalRescues: s.totalRescues + 1,
    }));

    soundEngine.playMarginWarning();
    triggerHeadlineAlert(`⚡ CHAPTER 11 CREDITOR RESTRUCTURING ACTIVATED: +$${(rescueCash / 1e6).toFixed(1)}M EMERGENCY LIQUIDITY INJECTED`);
  }
}

export function repayCreditorDebt(amount: number): number {
  let repaid = 0;
  account.update((acc) => {
    if (!acc.isInRestructuring || !acc.restructuringDebt || acc.restructuringDebt <= 0) {
      return acc;
    }
    const maxRepayable = Math.min(amount, acc.restructuringDebt, Math.max(0, acc.cash_balance));
    repaid = maxRepayable;

    acc.cash_balance -= repaid;
    acc.equity -= repaid;
    acc.free_margin -= repaid;
    acc.restructuringDebt -= repaid;

    if (acc.restructuringDebt <= 0.01) {
      acc.restructuringDebt = 0;
      acc.isInRestructuring = false;
      acc.debtInterestRate = 0;
      triggerHeadlineAlert('⭐ CREDITOR DEBT FULLY RETIRED // AUTONOMOUS SOLVENCY RESTORED ⭐');
      soundEngine.playWin(100000);
    } else {
      soundEngine.playWin(repaid);
    }

    return acc;
  });

  return repaid;
}

export function accrueCreditorInterest(days: number = 1.0) {
  account.update((acc) => {
    if (!acc.isInRestructuring || !acc.restructuringDebt || acc.restructuringDebt <= 0) {
      return acc;
    }
    const rate = acc.debtInterestRate ?? 11.75;
    const dailyRate = (rate / 100.0) / 365.0;
    const interest = acc.restructuringDebt * dailyRate * days;

    acc.restructuringDebt += interest;
    creditorRestructuringState.update((s) => ({
      ...s,
      interestAccrued: s.interestAccrued + interest,
    }));

    return acc;
  });
}

export function closeCreditorModal() {
  creditorRestructuringState.update((s) => ({ ...s, isModalOpen: false }));
}
