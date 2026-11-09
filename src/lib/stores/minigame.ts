import { writable, get } from 'svelte/store';
import { account, isTradingActive, triggerHeadlineAlert } from './trading';
import { soundEngine } from '../audio/soundtrack';

export type MinigameId = 'PITCHBOOK' | 'COMPLIANCE' | 'LBO_WATERFALL';

export interface MinigameSpec {
  id: MinigameId;
  title: string;
  subtitle: string;
  durationSeconds: number;
  payout: number;
  description: string;
}

export const MINIGAME_SPECS: Record<MinigameId, MinigameSpec> = {
  PITCHBOOK: {
    id: 'PITCHBOOK',
    title: 'PITCHBOOK VALUATION MULTIPLE ALIGNMENT',
    subtitle: 'MD Demands Deck in 15 Seconds',
    durationSeconds: 15,
    payout: 25000,
    description: 'Adjust valuation sliders to align EV/EBITDA, P/E, and PEG ratios with institutional target benchmarks.',
  },
  COMPLIANCE: {
    id: 'COMPLIANCE',
    title: 'EMERGENCY SEC COMPLIANCE AUDIT',
    subtitle: 'Identify 2 Wash Trades in Blotter',
    durationSeconds: 20,
    payout: 150000,
    description: 'Inspect the high-speed order blotter and flag the 2 spoofing / wash trade anomalies before the audit window closes.',
  },
  LBO_WATERFALL: {
    id: 'LBO_WATERFALL',
    title: 'LBO TRANCHE DEBT WATERFALL STRUCTURING',
    subtitle: 'Hurdle 65% LTV Senior Debt Ratio',
    durationSeconds: 25,
    payout: 500000,
    description: 'Balance Senior Secured Debt, Mezzanine Notes, and Sponsor Equity to hit target debt service coverage ratio.',
  },
};

export interface MinigameState {
  isAvailable: boolean;
  isOpen: boolean;
  activeGame: MinigameSpec | null;
  secondsRemaining: number;
  pitchbookValues: { evEbitda: number; pe: number; peg: number };
  complianceSelected: number[];
  lboSeniorDebt: number;
  lboMezzanine: number;
  totalBountiesWon: number;
  gamesCompleted: number;
}

const initialState: MinigameState = {
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
};

export const minigameState = writable<MinigameState>(initialState);

let countdownInterval: any = null;

export function triggerRandomOpportunity() {
  const acc = get(account);
  // Only trigger in Phase 2 or higher ($1,000,000+ equity) during active trading
  if (acc.equity < 1000000 || !get(isTradingActive)) return;

  const current = get(minigameState);
  if (current.isAvailable || current.isOpen) return;

  const keys: MinigameId[] = ['PITCHBOOK', 'COMPLIANCE', 'LBO_WATERFALL'];
  // Pick random game
  const chosenKey = keys[Math.floor(Math.random() * keys.length)];
  const spec = MINIGAME_SPECS[chosenKey];

  minigameState.update((s) => ({
    ...s,
    isAvailable: true,
    activeGame: spec,
    secondsRemaining: spec.durationSeconds,
    pitchbookValues: {
      evEbitda: 8 + Math.floor(Math.random() * 12),
      pe: 15 + Math.floor(Math.random() * 20),
      peg: Number((1.0 + Math.random() * 1.5).toFixed(1)),
    },
    complianceSelected: [],
    lboSeniorDebt: 50,
    lboMezzanine: 20,
  }));

  soundEngine.playMarginWarning();
  triggerHeadlineAlert(`⚡ IB DEAL OPPORTUNITY: ${spec.title} (+$${spec.payout.toLocaleString()} BOUNTY)`);
}

export function openMinigame() {
  minigameState.update((s) => {
    if (!s.activeGame) return s;
    return { ...s, isOpen: true, isAvailable: false };
  });

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    minigameState.update((s) => {
      if (!s.isOpen) {
        clearInterval(countdownInterval);
        return s;
      }
      const nextSec = s.secondsRemaining - 1;
      if (nextSec <= 0) {
        clearInterval(countdownInterval);
        // Timeout! Deal lost!
        soundEngine.playLoss(1000);
        triggerHeadlineAlert('⚡ IB DEAL EXPIRED: Opportunity lost while trading.');
        return { ...s, isOpen: false, isAvailable: false, activeGame: null, secondsRemaining: 0 };
      }
      return { ...s, secondsRemaining: nextSec };
    });
  }, 1000);
}

export function dismissMinigame() {
  clearInterval(countdownInterval);
  minigameState.update((s) => ({
    ...s,
    isOpen: false,
    isAvailable: false,
    activeGame: null,
    secondsRemaining: 0,
  }));
}

export function submitMinigameSuccess() {
  clearInterval(countdownInterval);
  const current = get(minigameState);
  if (!current.activeGame) return;

  const payout = current.activeGame.payout;

  // Add payout to account
  account.update((acc) => {
    acc.cash_balance += payout;
    acc.equity += payout;
    acc.free_margin += payout;
    if (acc.equity > acc.high_watermark) acc.high_watermark = acc.equity;
    return acc;
  });

  soundEngine.playWin(payout);
  triggerHeadlineAlert(`⚡ IB DEAL CLOSED: +$${payout.toLocaleString()} CASH BOUNTY CREDITED!`);

  minigameState.update((s) => ({
    ...s,
    isOpen: false,
    isAvailable: false,
    activeGame: null,
    secondsRemaining: 0,
    totalBountiesWon: s.totalBountiesWon + payout,
    gamesCompleted: s.gamesCompleted + 1,
  }));
}
