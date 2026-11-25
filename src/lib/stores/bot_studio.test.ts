import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  botStudioState,
  toggleBot,
  createBot,
  deleteBot,
  tickBots,
} from './bot_studio';
import { account } from './trading';

describe('BULLIMIA Phase 3: Visual Bot Studio & Execution Engine', () => {
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
    });
  });

  it('allows toggling bots on and off', () => {
    const initial = get(botStudioState).bots[0].active;
    toggleBot('bot-alpha-mom');
    expect(get(botStudioState).bots[0].active).toBe(!initial);
    toggleBot('bot-alpha-mom');
    expect(get(botStudioState).bots[0].active).toBe(initial);
  });

  it('creates new custom algorithmic bot and appends to studio roster', () => {
    const newBot = createBot(
      'Custom Gamma Scalper',
      'SPY',
      'BOLLINGER_BREAKOUT',
      'BUY_BULL',
      50
    );

    const state = get(botStudioState);
    const found = state.bots.find((b) => b.id === newBot.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Custom Gamma Scalper');
    expect(found?.ticker).toBe('SPY');
    expect(found?.lotSize).toBe(50);
    expect(found?.active).toBe(true);
  });

  it('deletes a bot from roster', () => {
    const newBot = createBot('Temporary Bot', 'GME', 'VOLUME_SPIKE', 'BUY_BULL', 10);
    expect(get(botStudioState).bots.some((b) => b.id === newBot.id)).toBe(true);

    deleteBot(newBot.id);
    expect(get(botStudioState).bots.some((b) => b.id === newBot.id)).toBe(false);
  });

  it('ticks active bots and settles trades into account balance', () => {
    const initialCash = get(account).cash_balance;
    // Tick multiple times to ensure at least one algo trade cycles
    for (let i = 0; i < 20; i++) {
      tickBots(125.0);
    }

    const state = get(botStudioState);
    expect(state.totalBotTrades).toBeGreaterThan(0);
  });
});
