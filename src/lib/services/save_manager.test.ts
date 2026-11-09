import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager, getPhaseForEquity, getPhaseTitle } from './save_manager';
import type { AccountState } from '../types';

describe('SaveManager & Phase Transition Logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly maps equity thresholds to game phases', () => {
    expect(getPhaseForEquity(10000)).toBe('PHASE_1_CHART');
    expect(getPhaseForEquity(999999)).toBe('PHASE_1_CHART');
    expect(getPhaseForEquity(1000000)).toBe('PHASE_2_CONSOLE');
    expect(getPhaseForEquity(5000000)).toBe('PHASE_2_CONSOLE');
    expect(getPhaseForEquity(10000000)).toBe('PHASE_3_BOTS');
    expect(getPhaseForEquity(50000000)).toBe('PHASE_3_BOTS');
    expect(getPhaseForEquity(100000000)).toBe('PHASE_4_PORTFOLIO');
    expect(getPhaseForEquity(500000000)).toBe('PHASE_4_PORTFOLIO');
  });

  it('provides human-readable titles for each phase', () => {
    expect(getPhaseTitle('PHASE_1_CHART')).toContain('Phase 1');
    expect(getPhaseTitle('PHASE_2_CONSOLE')).toContain('Phase 2');
    expect(getPhaseTitle('PHASE_3_BOTS')).toContain('Phase 3');
    expect(getPhaseTitle('PHASE_4_PORTFOLIO')).toContain('Phase 4');
  });

  it('saves and restores career snapshots accurately', async () => {
    const mockAccount: AccountState = {
      cash_balance: 1500000.0,
      equity: 1550000.0,
      side: 'BULL',
      open_lots: 25,
      entry_price: 135.0,
      entry_timestamp: '2024-03-01',
      unrealized_pnl: 50000.0,
      margin_used: 67500.0,
      free_margin: 1482500.0,
      margin_level_pct: 2296.0,
      total_commission_paid: 250.0,
      trade_count: 8,
      winning_trades: 6,
      losing_trades: 2,
      win_rate_pct: 75.0,
      is_margin_called: false,
      is_millionaire: true,
      high_watermark: 1600000.0,
    };

    expect(SaveManager.hasLocalSave()).toBe(false);

    await SaveManager.saveCareer({
      account: mockAccount,
      currentLevelId: 'TSLA',
      playerProgress: 88.0,
      openPosition: {
        side: 'BULL',
        lots: 25,
        entryPrice: 135.0,
        entryTimestamp: '2024-03-01',
        entryCandleIdx: 88,
      },
      tradeHistory: [],
    });

    expect(SaveManager.hasLocalSave()).toBe(true);

    const loaded = await SaveManager.loadCareer();
    expect(loaded).not.toBeNull();
    expect(loaded?.phase).toBe('PHASE_2_CONSOLE');
    expect(loaded?.account.equity).toBe(1550000.0);
    expect(loaded?.currentLevelId).toBe('TSLA');
    expect(loaded?.openPosition?.lots).toBe(25);
    expect(loaded?.openPosition?.side).toBe('BULL');

    await SaveManager.deleteCareer();
    expect(SaveManager.hasLocalSave()).toBe(false);
  });
});
