/**
 * BULLIMIA MODIFIER PIPELINE & DOMAIN CONTRACTS
 * 
 * In accordance with docs/ARCHITECTURE.md:
 * Pure functional modifier pipeline that resolves Character Archetypes,
 * Colocation Tiers, Execution Venues, and Minigame Buffs into an immutable
 * TradeContext for the Quant Kernel.
 * 
 * Zero presentation logic. Zero side effects on account balances.
 */

export type ColocationTierId = 'RETAIL_FIBER' | 'MICROWAVE_LINK' | 'SECAUCUS_NY4' | 'CHICAGO_CME';
export type VenueTypeId = 'LIT_EXCHANGE' | 'DARK_POOL' | 'INTERNALIZER';
export type AssetLicenseId = 'COMMODITIES' | 'GLOBAL_FX' | 'CRYPTO_ALTS';

export interface ColocationSpec {
  id: ColocationTierId;
  name: string;
  cost: number;
  latencyMs: number;
  spreadMultiplier: number;
  slippageTicks: number;
  description: string;
}

export const COLOCATION_TIERS: Record<ColocationTierId, ColocationSpec> = {
  RETAIL_FIBER: {
    id: 'RETAIL_FIBER',
    name: 'Retail Fiber (Default)',
    cost: 0,
    latencyMs: 45.0,
    spreadMultiplier: 1.0,
    slippageTicks: 2,
    description: 'Standard residential fiber connection. 45ms round-trip latency to NJ exchanges.',
  },
  MICROWAVE_LINK: {
    id: 'MICROWAVE_LINK',
    name: 'Dedicated Microwave Link',
    cost: 150000,
    latencyMs: 12.0,
    spreadMultiplier: 0.85,
    slippageTicks: 1,
    description: 'Line-of-sight microwave link from Manhattan towers. 15% tighter bid-ask spreads.',
  },
  SECAUCUS_NY4: {
    id: 'SECAUCUS_NY4',
    name: 'Secaucus NY4 Cross-Connect',
    cost: 500000,
    latencyMs: 0.8,
    spreadMultiplier: 0.70,
    slippageTicks: 0,
    description: 'Equinix NY4 cage colocation with direct 100G fiber cross-connect. Zero slippage.',
  },
  CHICAGO_CME: {
    id: 'CHICAGO_CME',
    name: 'Chicago CME Microwave Backbone',
    cost: 1200000,
    latencyMs: 4.0,
    spreadMultiplier: 0.60,
    slippageTicks: 0,
    description: 'Ultra-low latency Chicago-to-New Jersey microwave array. Cross-venue arbitrage parity.',
  },
};

export interface VenueSpec {
  id: VenueTypeId;
  name: string;
  commissionPerLot: number;
  spreadMultiplier: number;
  fillLatencyBonusMs: number;
  description: string;
}

export const VENUE_SPECS: Record<VenueTypeId, VenueSpec> = {
  LIT_EXCHANGE: {
    id: 'LIT_EXCHANGE',
    name: 'Lit Exchange (NYSE/NASDAQ)',
    commissionPerLot: 1.00,
    spreadMultiplier: 1.0,
    fillLatencyBonusMs: 0,
    description: 'Direct public lit book. Standard liquidity depth with guaranteed immediate fill.',
  },
  DARK_POOL: {
    id: 'DARK_POOL',
    name: 'Dark Pool (Sigma X / CrossFinder)',
    commissionPerLot: 1.50,
    spreadMultiplier: 0.75, // Midpoint matching tightens spread
    fillLatencyBonusMs: 15, // Slight auction delay
    description: 'Non-displayed institutional liquidity with midpoint matching and zero market impact.',
  },
  INTERNALIZER: {
    id: 'INTERNALIZER',
    name: 'Wholesale Internalizer (Citadel / Virtu)',
    commissionPerLot: 0.75, // Rebate discount
    spreadMultiplier: 0.85, // Sub-penny price improvement
    fillLatencyBonusMs: 2,
    description: 'Retail liquidity provider offering sub-penny price improvement and reduced commissions.',
  },
};

export interface AssetLicenseSpec {
  id: AssetLicenseId;
  name: string;
  cost: number;
  assets: string[];
  description: string;
}

export const ASSET_LICENSES: Record<AssetLicenseId, AssetLicenseSpec> = {
  COMMODITIES: {
    id: 'COMMODITIES',
    name: 'Global Commodities License',
    cost: 250000,
    assets: ['XAU-USD', 'WTI-CRUDE'],
    description: 'Allows institutional trading of physical and derivative Gold, Crude Oil, and Natural Gas.',
  },
  GLOBAL_FX: {
    id: 'GLOBAL_FX',
    name: 'G10 FX & Sovereign Rates License',
    cost: 500000,
    assets: ['EUR-USD', 'USD-JPY', 'US-10Y'],
    description: 'Permits leveraged spot forex arbitrage and sovereign yield curve carry operations.',
  },
  CRYPTO_ALTS: {
    id: 'CRYPTO_ALTS',
    name: 'Digital Asset Perp Swap License',
    cost: 750000,
    assets: ['BTC-USD', 'ETH-USD', 'SOL-USD'],
    description: 'Grants venue access to 100x perpetual swaps and cross-market crypto volatility books.',
  },
};

export interface TerminalShopState {
  currentColocation: ColocationTierId;
  ownedLicenses: AssetLicenseId[];
  totalShopSpent: number;
}

export const initialTerminalShopState: TerminalShopState = {
  currentColocation: 'RETAIL_FIBER',
  ownedLicenses: [],
  totalShopSpent: 0,
};

export interface TradeContext {
  contractMultiplier: number;
  marginRate: number;
  maintenanceMarginRate: number;
  effectiveSpreadMultiplier: number;
  commissionPerLot: number;
  slippageTicks: number;
  latencyMs: number;
  godMode: boolean;
}

export const baseTradeContext: TradeContext = {
  contractMultiplier: 10.0,
  marginRate: 0.02,
  maintenanceMarginRate: 0.50,
  effectiveSpreadMultiplier: 1.0,
  commissionPerLot: 1.00,
  slippageTicks: 2,
  latencyMs: 45.0,
  godMode: false,
};

/**
 * Pure evaluation function: Composes Colocation, Venue routing, and active Minigame buffs
 * into a single evaluated TradeContext.
 */
export function resolveTradeContext(params: {
  colocationId?: ColocationTierId;
  venueId?: VenueTypeId;
  minigameBuff?: {
    zeroCommissions?: boolean;
    spreadDiscount?: number;
  } | null;
  godMode?: boolean;
}): TradeContext {
  const colocation = COLOCATION_TIERS[params.colocationId || 'RETAIL_FIBER'];
  const venue = VENUE_SPECS[params.venueId || 'LIT_EXCHANGE'];

  // 1. Calculate effective spread multiplier
  let spreadMult = colocation.spreadMultiplier * venue.spreadMultiplier;
  if (params.minigameBuff?.spreadDiscount) {
    spreadMult *= (1 - params.minigameBuff.spreadDiscount);
  }
  spreadMult = Math.max(0.2, spreadMult); // Floor spread at 20% of base

  // 2. Calculate effective commissions
  let commPerLot = venue.commissionPerLot;
  if (params.minigameBuff?.zeroCommissions) {
    commPerLot = 0.0;
  }

  // 3. Effective Latency
  const latency = Math.max(0.5, colocation.latencyMs + venue.fillLatencyBonusMs);

  return {
    contractMultiplier: 10.0,
    marginRate: 0.02,
    maintenanceMarginRate: 0.50,
    effectiveSpreadMultiplier: Number(spreadMult.toFixed(3)),
    commissionPerLot: Number(commPerLot.toFixed(2)),
    slippageTicks: colocation.slippageTicks,
    latencyMs: Number(latency.toFixed(1)),
    godMode: Boolean(params.godMode),
  };
}
