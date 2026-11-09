import { writable, get } from 'svelte/store';
import {
  type ColocationTierId,
  type VenueTypeId,
  type AssetLicenseId,
  type TerminalShopState,
  type TradeContext,
  COLOCATION_TIERS,
  VENUE_SPECS,
  ASSET_LICENSES,
  initialTerminalShopState,
  resolveTradeContext,
} from '../engine/modifier_pipeline';
import { account, triggerHeadlineAlert } from './trading';
import { soundEngine } from '../audio/soundtrack';

export const terminalShopState = writable<TerminalShopState>(initialTerminalShopState);
export const selectedVenue = writable<VenueTypeId>('LIT_EXCHANGE');

export function buyColocation(tierId: ColocationTierId): boolean {
  const spec = COLOCATION_TIERS[tierId];
  if (!spec) return false;

  const current = get(terminalShopState);
  if (current.currentColocation === tierId) return false;

  const acc = get(account);
  if (acc.cash_balance < spec.cost) {
    triggerHeadlineAlert(`⚡ TRANSACTION DECLINED: REQUIRES $${spec.cost.toLocaleString()} CASH`);
    return false;
  }

  // Deduct cash balance
  account.update((a) => {
    a.cash_balance -= spec.cost;
    a.equity -= spec.cost;
    a.free_margin -= spec.cost;
    return a;
  });

  terminalShopState.update((s) => ({
    ...s,
    currentColocation: tierId,
    totalShopSpent: s.totalShopSpent + spec.cost,
  }));

  soundEngine.playWin(spec.cost);
  triggerHeadlineAlert(`⚡ INFRASTRUCTURE UPGRADED: ${spec.name.toUpperCase()} (LATENCY: ${spec.latencyMs}ms)`);
  return true;
}

export function buyLicense(licenseId: AssetLicenseId): boolean {
  const spec = ASSET_LICENSES[licenseId];
  if (!spec) return false;

  const current = get(terminalShopState);
  if (current.ownedLicenses.includes(licenseId)) return false;

  const acc = get(account);
  if (acc.cash_balance < spec.cost) {
    triggerHeadlineAlert(`⚡ TRANSACTION DECLINED: REQUIRES $${spec.cost.toLocaleString()} CASH`);
    return false;
  }

  // Deduct cash balance
  account.update((a) => {
    a.cash_balance -= spec.cost;
    a.equity -= spec.cost;
    a.free_margin -= spec.cost;
    return a;
  });

  terminalShopState.update((s) => ({
    ...s,
    ownedLicenses: [...s.ownedLicenses, licenseId],
    totalShopSpent: s.totalShopSpent + spec.cost,
  }));

  soundEngine.playWin(spec.cost);
  triggerHeadlineAlert(`⚡ ASSET LICENSE ACQUIRED: ${spec.name.toUpperCase()} UNLOCKED`);
  return true;
}

export function getActiveTradeContext(minigameBuff?: { zeroCommissions?: boolean; spreadDiscount?: number } | null): TradeContext {
  const shop = get(terminalShopState);
  const venue = get(selectedVenue);
  return resolveTradeContext({
    colocationId: shop.currentColocation,
    venueId: venue,
    minigameBuff,
  });
}
