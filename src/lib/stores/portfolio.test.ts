import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  sovereignPortfolioState,
  drawCredit,
  repayCredit,
  buyPETarget,
  distributePEDividends,
  underwriteOTCContract,
  tickOTCContracts,
} from './portfolio';
import { account } from './trading';

describe('BULLIMIA Phase 4: Sovereign Credit, PE & OTC Derivatives', () => {
  beforeEach(() => {
    sovereignPortfolioState.set({
      creditFacilities: [
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
      ],
      peTargets: [
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
      ],
      otcContracts: [
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
      ],
      totalCreditDrawn: 35000000,
      totalCreditLimit: 400000000,
      totalDividendsReceived: 1470000,
      totalOTCPremiums: 0,
    });

    account.set({
      cash_balance: 100000000.0,
      equity: 100000000.0,
      side: 'FLAT',
      open_lots: 0,
      entry_price: 0,
      entry_timestamp: '',
      unrealized_pnl: 0,
      margin_used: 0,
      free_margin: 100000000.0,
      margin_level_pct: 999.0,
      total_commission_paid: 0,
      trade_count: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate_pct: 0,
      is_margin_called: false,
      is_millionaire: true,
      high_watermark: 100000000.0,
    });
  });

  it('draws liquidity from Federal Reserve facility and credits cash balance', () => {
    const success = drawCredit('fed-primary', 25000000);
    expect(success).toBe(true);

    const state = get(sovereignPortfolioState);
    const fed = state.creditFacilities.find((f) => f.id === 'fed-primary');
    expect(fed?.drawn).toBe(60000000); // 35M initial + 25M
    expect(get(account).cash_balance).toBe(125000000.0);
  });

  it('repays principal on credit facility and deducts cash balance', () => {
    const success = repayCredit('fed-primary', 10000000);
    expect(success).toBe(true);

    const state = get(sovereignPortfolioState);
    const fed = state.creditFacilities.find((f) => f.id === 'fed-primary');
    expect(fed?.drawn).toBe(25000000); // 35M initial - 10M
    expect(get(account).cash_balance).toBe(90000000.0);
  });

  it('acquires Private Equity target and receives periodic EBITDA dividend yields', () => {
    // Buy Apex Clearing for $75,000,000
    const success = buyPETarget('pe-apex');
    expect(success).toBe(true);

    const target = get(sovereignPortfolioState).peTargets.find((t) => t.id === 'pe-apex');
    expect(target?.status).toBe('ACQUIRED');
    expect(get(account).cash_balance).toBe(25000000.0);

    // Distribute dividends
    const dividends = distributePEDividends();
    expect(dividends).toBeGreaterThan(0);
    expect(get(account).cash_balance).toBeGreaterThan(25000000.0);
  });

  it('underwrites OTC derivative contract, collects upfront premium, and ticks toward maturity', () => {
    const contractId = 'otc-var-swap';
    const success = underwriteOTCContract(contractId);
    expect(success).toBe(true);

    const contract = get(sovereignPortfolioState).otcContracts.find((c) => c.id === contractId);
    expect(contract?.status).toBe('UNDERWRITTEN');
    // Cash balance increased by premium ($3,500,000)
    expect(get(account).cash_balance).toBe(103500000.0);

    // Tick toward maturity
    for (let i = 0; i < 35; i++) {
      tickOTCContracts();
    }

    const matured = get(sovereignPortfolioState).otcContracts.find((c) => c.id === contractId);
    expect(['SETTLED_PROFIT', 'SETTLED_LOSS']).toContain(matured?.status);
  });
});
