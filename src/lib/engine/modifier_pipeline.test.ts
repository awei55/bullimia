import { describe, it, expect } from 'vitest';
import {
  COLOCATION_TIERS,
  VENUE_SPECS,
  ASSET_LICENSES,
  resolveTradeContext,
  baseTradeContext,
} from './modifier_pipeline';

describe('BULLIMIA Modifier Pipeline (Architecture Layer 2/3)', () => {
  it('resolves default trade context with retail fiber and lit exchange', () => {
    const ctx = resolveTradeContext({});
    expect(ctx.commissionPerLot).toBe(1.00);
    expect(ctx.effectiveSpreadMultiplier).toBe(1.0);
    expect(ctx.latencyMs).toBe(45.0);
    expect(ctx.slippageTicks).toBe(2);
    expect(ctx.godMode).toBe(false);
  });

  it('applies Secaucus NY4 cross-connect upgrades correctly', () => {
    const ctx = resolveTradeContext({
      colocationId: 'SECAUCUS_NY4',
      venueId: 'LIT_EXCHANGE',
    });
    expect(ctx.latencyMs).toBe(0.8);
    expect(ctx.slippageTicks).toBe(0);
    expect(ctx.effectiveSpreadMultiplier).toBe(0.70); // 30% tighter
    expect(ctx.commissionPerLot).toBe(1.00);
  });

  it('applies Dark Pool venue modifiers with midpoint price improvement', () => {
    const ctx = resolveTradeContext({
      colocationId: 'RETAIL_FIBER',
      venueId: 'DARK_POOL',
    });
    // Dark pool has 0.75 spread multiplier and $1.50 commission
    expect(ctx.commissionPerLot).toBe(1.50);
    expect(ctx.effectiveSpreadMultiplier).toBe(0.75);
    expect(ctx.latencyMs).toBe(60.0); // 45 + 15ms auction latency
  });

  it('applies Wholesale Internalizer rebates and sub-penny improvement', () => {
    const ctx = resolveTradeContext({
      colocationId: 'MICROWAVE_LINK',
      venueId: 'INTERNALIZER',
    });
    // Microwave (0.85) * Internalizer (0.85) = 0.7225
    expect(ctx.effectiveSpreadMultiplier).toBeCloseTo(0.723, 2);
    expect(ctx.commissionPerLot).toBe(0.75); // $0.75 rebate discount
    expect(ctx.latencyMs).toBe(14.0); // 12 + 2ms
  });

  it('stacks temporary minigame buffs (zero commissions & extra spread discount)', () => {
    const ctx = resolveTradeContext({
      colocationId: 'SECAUCUS_NY4',
      venueId: 'INTERNALIZER',
      minigameBuff: {
        zeroCommissions: true,
        spreadDiscount: 0.20,
      },
    });
    expect(ctx.commissionPerLot).toBe(0.0); // Zero commission buff active
    // 0.70 (NY4) * 0.85 (Internalizer) * (1 - 0.20) = 0.476
    expect(ctx.effectiveSpreadMultiplier).toBeCloseTo(0.476, 2);
  });

  it('respects god mode override', () => {
    const ctx = resolveTradeContext({ godMode: true });
    expect(ctx.godMode).toBe(true);
  });

  it('validates terminal shop specs catalog integrity', () => {
    expect(COLOCATION_TIERS.CHICAGO_CME.cost).toBe(1200000);
    expect(COLOCATION_TIERS.SECAUCUS_NY4.cost).toBe(500000);
    expect(ASSET_LICENSES.COMMODITIES.cost).toBe(250000);
    expect(ASSET_LICENSES.GLOBAL_FX.cost).toBe(500000);
    expect(ASSET_LICENSES.CRYPTO_ALTS.cost).toBe(750000);
  });
});
