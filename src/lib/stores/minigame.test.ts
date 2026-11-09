import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  minigameState,
  MINIGAME_SPECS,
  openMinigame,
  dismissMinigame,
  submitMinigameSuccess,
} from './minigame';
import { account } from './trading';

describe('BULLIMIA IB Distraction Minigames (Phase 2)', () => {
  beforeEach(() => {
    minigameState.set({
      isAvailable: false,
      isOpen: false,
      activeGame: null,
      secondsRemaining: 0,
      pitchbookValues: { evEbitda: 14, pe: 22, peg: 1.5 },
      complianceSelected: [],
      lboSeniorDebt: 50,
      lboMezzanine: 20,
      totalBountiesWon: 0,
      gamesCompleted: 0,
    });
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
  });

  it('correctly opens a minigame and transitions state', () => {
    minigameState.update((s) => ({
      ...s,
      isAvailable: true,
      activeGame: MINIGAME_SPECS.PITCHBOOK,
      secondsRemaining: 15,
    }));

    openMinigame();
    const state = get(minigameState);
    expect(state.isOpen).toBe(true);
    expect(state.isAvailable).toBe(false);
    expect(state.activeGame?.id).toBe('PITCHBOOK');
  });

  it('credits cash bounty to account upon successful puzzle completion', () => {
    minigameState.update((s) => ({
      ...s,
      isOpen: true,
      activeGame: MINIGAME_SPECS.PITCHBOOK,
      secondsRemaining: 10,
    }));

    submitMinigameSuccess();
    const acc = get(account);
    const state = get(minigameState);

    expect(acc.cash_balance).toBe(1025000.0); // +$25,000 bounty
    expect(state.isOpen).toBe(false);
    expect(state.totalBountiesWon).toBe(25000);
    expect(state.gamesCompleted).toBe(1);
  });

  it('dismisses minigame without awarding payout', () => {
    minigameState.update((s) => ({
      ...s,
      isOpen: true,
      activeGame: MINIGAME_SPECS.COMPLIANCE,
      secondsRemaining: 15,
    }));

    dismissMinigame();
    const acc = get(account);
    const state = get(minigameState);

    expect(acc.cash_balance).toBe(1000000.0); // unchanged
    expect(state.isOpen).toBe(false);
    expect(state.gamesCompleted).toBe(0);
  });
});
