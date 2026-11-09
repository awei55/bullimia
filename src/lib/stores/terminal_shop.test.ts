import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  terminalShopState,
  selectedVenue,
  buyColocation,
  buyLicense,
  getActiveTradeContext,
} from './terminal_shop';
import { account } from './trading';
import { initialTerminalShopState } from '../engine/modifier_pipeline';

describe('BULLIMIA Terminal Shop & Venue Routing (Phase 2)', () => {
  beforeEach(() => {
    terminalShopState.set(initialTerminalShopState);
    selectedVenue.set('LIT_EXCHANGE');
    account.set({
      cash_balance: 1000000.0, // $1M initial cash
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

  it('allows purchasing microwave link colocation when solvent', () => {
    const success = buyColocation('MICROWAVE_LINK');
    expect(success).toBe(true);
    expect(get(terminalShopState).currentColocation).toBe('MICROWAVE_LINK');
    expect(get(account).cash_balance).toBe(850000.0); // $1M - $150K
  });

  it('rejects colocation purchase if cash is insufficient', () => {
    account.update((a) => ({ ...a, cash_balance: 50000.0 })); // only $50K
    const success = buyColocation('SECAUCUS_NY4'); // requires $500K
    expect(success).toBe(false);
    expect(get(terminalShopState).currentColocation).toBe('RETAIL_FIBER');
  });

  it('allows purchasing asset licenses and reflects in ownedLicenses', () => {
    const success = buyLicense('COMMODITIES');
    expect(success).toBe(true);
    expect(get(terminalShopState).ownedLicenses).toContain('COMMODITIES');
    expect(get(account).cash_balance).toBe(750000.0); // $1M - $250K
  });

  it('resolves active trade context dynamically based on shop purchases', () => {
    buyColocation('SECAUCUS_NY4');
    selectedVenue.set('INTERNALIZER');

    const ctx = getActiveTradeContext();
    expect(ctx.latencyMs).toBe(2.8); // 0.8ms + 2ms
    expect(ctx.commissionPerLot).toBe(0.75); // internalizer rebate
    expect(ctx.effectiveSpreadMultiplier).toBeCloseTo(0.70 * 0.85, 2);
  });
});
