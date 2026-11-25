import { writable, get } from 'svelte/store';
import { account, triggerHeadlineAlert } from './trading';
import { soundEngine } from '../audio/soundtrack';

export interface CreditFacility {
  id: string;
  name: string;
  limit: number;
  drawn: number;
  rate: string;
  ratePct: number;
}

export interface PETarget {
  id: string;
  name: string;
  cost: number;
  ebitdaYieldPct: number;
  annualEbitda: number;
  status: 'AVAILABLE' | 'ACQUIRED';
  totalDividendsPaid: number;
  perkDescription: string;
}

export interface OTCDerivative {
  id: string;
  name: string;
  counterparty: string;
  notional: number;
  premium: number;
  condition: string;
  status: 'OFFERED' | 'UNDERWRITTEN' | 'SETTLED_PROFIT' | 'SETTLED_LOSS';
  expirySeconds: number;
  remainingSeconds: number;
}

export interface SovereignPortfolioState {
  creditFacilities: CreditFacility[];
  peTargets: PETarget[];
  otcContracts: OTCDerivative[];
  totalCreditDrawn: number;
  totalCreditLimit: number;
  totalDividendsReceived: number;
  totalOTCPremiums: number;
}

const initialFacilities: CreditFacility[] = [
  {
    id: 'fed-primary',
    name: 'Federal Reserve Primary Dealer Standing Repo',
    limit: 250000000,
    drawn: 35000000,
    rate: '4.25% SOFR',
    ratePct: 4.25,
  },
  {
    id: 'ecb-bilateral',
    name: 'ECB Bilateral Sovereign Liquidity Facility',
    limit: 150000000,
    drawn: 0,
    rate: '3.75% ESTR',
    ratePct: 3.75,
  },
];

const initialPETargets: PETarget[] = [
  {
    id: 'pe-secaucus',
    name: 'Secaucus NY4 High-Speed Fiber Backbone',
    cost: 42000000,
    ebitdaYieldPct: 14,
    annualEbitda: 5880000,
    status: 'ACQUIRED',
    totalDividendsPaid: 1470000,
    perkDescription: 'Zero packet loss & +$140k recurring quarterly dividend payout',
  },
  {
    id: 'pe-apex',
    name: 'Apex Clearing Wholesale Internalizer',
    cost: 75000000,
    ebitdaYieldPct: 22,
    annualEbitda: 16500000,
    status: 'AVAILABLE',
    totalDividendsPaid: 0,
    perkDescription: 'Sub-penny price improvement & +$412k recurring quarterly payout',
  },
  {
    id: 'pe-cme-hive',
    name: 'Chicago CME Microwave Colocation Hive',
    cost: 110000000,
    ebitdaYieldPct: 28,
    annualEbitda: 30800000,
    status: 'AVAILABLE',
    totalDividendsPaid: 0,
    perkDescription: 'Cross-market arbitrage monopoly & +$770k recurring quarterly payout',
  },
  {
    id: 'pe-darkpool-ats',
    name: 'Dark Pool Alternative Trading System (ATS)',
    cost: 60000000,
    ebitdaYieldPct: 18,
    annualEbitda: 10800000,
    status: 'AVAILABLE',
    totalDividendsPaid: 0,
    perkDescription: 'Zero price impact on 10,000L block orders & +$270k recurring payout',
  },
];

const initialOTCContracts: OTCDerivative[] = [
  {
    id: 'otc-var-swap',
    name: 'Macro Volatility Variance Swap',
    counterparty: 'BlackRock Institutional Alpha',
    notional: 25000000,
    premium: 3500000,
    condition: 'Realized volatility stays below 3.5x ATR during term',
    status: 'OFFERED',
    expirySeconds: 30,
    remainingSeconds: 30,
  },
  {
    id: 'otc-cat-bond',
    name: 'Sovereign Catastrophe Bond (Cat Bond)',
    counterparty: 'GIC Sovereign Wealth Fund',
    notional: 50000000,
    premium: 6000000,
    condition: 'No flash crash cascade exceeding -10% during term',
    status: 'OFFERED',
    expirySeconds: 45,
    remainingSeconds: 45,
  },
  {
    id: 'otc-tail-corridor',
    name: 'Cross-Currency Tail-Risk Corridor',
    counterparty: 'Citadel Securities Quantitative Trading',
    notional: 35000000,
    premium: 4200000,
    condition: 'FX / Equities correlation remains bounded within ±0.60',
    status: 'OFFERED',
    expirySeconds: 35,
    remainingSeconds: 35,
  },
];

const initialState: SovereignPortfolioState = {
  creditFacilities: initialFacilities,
  peTargets: initialPETargets,
  otcContracts: initialOTCContracts,
  totalCreditDrawn: 35000000,
  totalCreditLimit: 400000000,
  totalDividendsReceived: 1470000,
  totalOTCPremiums: 0,
};

export const sovereignPortfolioState = writable<SovereignPortfolioState>(initialState);

export function drawCredit(facilityId: string, amount: number): boolean {
  let success = false;
  sovereignPortfolioState.update((state) => {
    const facility = state.creditFacilities.find((f) => f.id === facilityId);
    if (!facility) return state;

    const available = facility.limit - facility.drawn;
    if (amount <= 0 || amount > available) return state;

    facility.drawn += amount;
    state.totalCreditDrawn += amount;
    success = true;

    // Credit player cash balance
    account.update((acc) => {
      acc.cash_balance += amount;
      acc.equity += amount;
      acc.free_margin += amount;
      return acc;
    });

    soundEngine.playWin(amount);
    triggerHeadlineAlert(`🏛️ CENTRAL BANK FACILITY DRAW: +$${(amount / 1e6).toFixed(1)}M DRAWN FROM ${facility.name.split(' ')[0]}`);
    return state;
  });

  return success;
}

export function repayCredit(facilityId: string, amount: number): boolean {
  let success = false;
  sovereignPortfolioState.update((state) => {
    const facility = state.creditFacilities.find((f) => f.id === facilityId);
    if (!facility || facility.drawn <= 0) return state;

    const currentCash = get(account).cash_balance;
    const repayAmount = Math.min(amount, facility.drawn, Math.max(0, currentCash));
    if (repayAmount <= 0) return state;

    facility.drawn -= repayAmount;
    state.totalCreditDrawn -= repayAmount;
    success = true;

    // Deduct player cash balance
    account.update((acc) => {
      acc.cash_balance -= repayAmount;
      acc.equity -= repayAmount;
      acc.free_margin -= repayAmount;
      return acc;
    });

    soundEngine.playLoss(repayAmount);
    triggerHeadlineAlert(`🏛️ CREDIT FACILITY REPAYMENT: -$${(repayAmount / 1e6).toFixed(1)}M PRINCIPAL PAID TO ${facility.name.split(' ')[0]}`);
    return state;
  });

  return success;
}

export function buyPETarget(targetId: string): boolean {
  let success = false;
  sovereignPortfolioState.update((state) => {
    const target = state.peTargets.find((t) => t.id === targetId);
    if (!target || target.status === 'ACQUIRED') return state;

    const currentCash = get(account).cash_balance;
    if (currentCash < target.cost) return state;

    // Deduct cost
    account.update((acc) => {
      acc.cash_balance -= target.cost;
      acc.equity -= target.cost;
      acc.free_margin -= target.cost;
      return acc;
    });

    target.status = 'ACQUIRED';
    success = true;

    soundEngine.playWin(target.cost);
    triggerHeadlineAlert(`⭐ PRIVATE EQUITY ACQUISITION COMPLETED: ${target.name.toUpperCase()} (+$${(target.annualEbitda / 1e6).toFixed(1)}M/YR EBITDA)`);
    return state;
  });

  return success;
}

export function distributePEDividends(): number {
  let totalDistributed = 0;
  sovereignPortfolioState.update((state) => {
    state.peTargets.forEach((target) => {
      if (target.status === 'ACQUIRED') {
        // Quarterly dividend tranche
        const payout = Math.round(target.annualEbitda / 40); // tranche per cycle
        target.totalDividendsPaid += payout;
        totalDistributed += payout;
      }
    });

    if (totalDistributed > 0) {
      state.totalDividendsReceived += totalDistributed;
      account.update((acc) => {
        acc.cash_balance += totalDistributed;
        acc.equity += totalDistributed;
        acc.free_margin += totalDistributed;
        return acc;
      });
      soundEngine.playWin(totalDistributed);
    }

    return state;
  });

  return totalDistributed;
}

export function underwriteOTCContract(contractId: string): boolean {
  let success = false;
  sovereignPortfolioState.update((state) => {
    const contract = state.otcContracts.find((c) => c.id === contractId);
    if (!contract || contract.status !== 'OFFERED') return state;

    contract.status = 'UNDERWRITTEN';
    state.totalOTCPremiums += contract.premium;
    success = true;

    // Upfront premium credited directly to settled cash
    account.update((acc) => {
      acc.cash_balance += contract.premium;
      acc.equity += contract.premium;
      acc.free_margin += contract.premium;
      return acc;
    });

    soundEngine.playWin(contract.premium);
    triggerHeadlineAlert(`📜 OTC CONTRACT UNDERWRITTEN: +$${(contract.premium / 1e6).toFixed(1)}M UPFRONT PREMIUM COLLECTED FROM ${contract.counterparty.split(' ')[0]}`);
    return state;
  });

  return success;
}

export function tickOTCContracts() {
  sovereignPortfolioState.update((state) => {
    state.otcContracts.forEach((contract) => {
      if (contract.status === 'UNDERWRITTEN') {
        contract.remainingSeconds -= 1;
        if (contract.remainingSeconds <= 0) {
          // Expiry reached: 90% chance of clean premium retention, 10% breach payout
          const breached = Math.random() < 0.10;
          if (breached) {
            contract.status = 'SETTLED_LOSS';
            const payout = contract.premium * 1.5;
            account.update((acc) => {
              acc.cash_balance -= payout;
              acc.equity -= payout;
              acc.free_margin -= payout;
              return acc;
            });
            soundEngine.playLoss(payout);
            triggerHeadlineAlert(`⚠️ OTC CONTRACT BREACH: -$${(payout / 1e6).toFixed(1)}M COLLATERAL SETTLED TO ${contract.counterparty.split(' ')[0]}`);
          } else {
            contract.status = 'SETTLED_PROFIT';
            soundEngine.playWin(contract.premium);
            triggerHeadlineAlert(`🏆 OTC CONTRACT MATURED: 100% PREMIUM RETAINED FROM ${contract.counterparty.split(' ')[0]}`);
          }
        }
      }
    });

    return state;
  });
}
