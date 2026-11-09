import type { SaveState, GamePhase, AccountState, TradeRecord, PositionSide } from '../types';
import type { TerminalShopState } from '../engine/modifier_pipeline';

const STORAGE_KEY = 'bullimia_career_save_v2';

export function getPhaseForEquity(equity: number, cash?: number): GamePhase {
  const effective = Math.max(equity, cash ?? equity);
  if (effective >= 100000000) return 'PHASE_4_PORTFOLIO';
  if (effective >= 10000000) return 'PHASE_3_BOTS';
  if (effective >= 1000000) return 'PHASE_2_CONSOLE';
  return 'PHASE_1_CHART';
}

export function getPhaseTitle(phase: GamePhase): string {
  switch (phase) {
    case 'PHASE_1_CHART':
      return 'Phase 1: Retail Chart Surfer ($10K - $1M)';
    case 'PHASE_2_CONSOLE':
      return 'Phase 2: Independent Prop Desk ($1M - $10M)';
    case 'PHASE_3_BOTS':
      return 'Phase 3: Quantitative Fund & Bots ($10M - $100M)';
    case 'PHASE_4_PORTFOLIO':
      return 'Phase 4: Sovereign Portfolio Manager ($100M+)';
  }
}

export class SaveManager {
  public static async saveCareer(state: {
    account: AccountState;
    currentLevelId: string;
    playerProgress: number;
    openPosition: {
      side: PositionSide;
      lots: number;
      entryPrice: number;
      entryTimestamp: string;
      entryCandleIdx: number;
    } | null;
    tradeHistory: TradeRecord[];
    shopState?: TerminalShopState;
    settings?: {
      crtEnabled?: boolean;
      masterVolume?: number;
      musicVolume?: number;
      sfxVolume?: number;
    };
  }): Promise<SaveState> {
    const phase = getPhaseForEquity(state.account.equity, state.account.cash_balance);
    const saveState: SaveState = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      account: state.account,
      phase,
      currentLevelId: state.currentLevelId,
      playerProgress: state.playerProgress,
      openPosition: state.openPosition,
      tradeHistory: state.tradeHistory,
      shopState: state.shopState,
      settings: {
        crtEnabled: state.settings?.crtEnabled ?? true,
        masterVolume: state.settings?.masterVolume ?? 0.7,
        musicVolume: state.settings?.musicVolume ?? 0.35,
        sfxVolume: state.settings?.sfxVolume ?? 0.55,
      },
    };

    // 1. Client LocalStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveState));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // 2. Remote / Backend File Sync (if in browser with backend available)
    if (typeof window !== 'undefined' && window.location?.port && window.location.port !== '3000') {
      try {
        await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: saveState }),
        }).catch(() => {});
      } catch (e) {
        // Backend may be offline, localStorage remains authoritative fallback
      }
    }

    return saveState;
  }

  public static async loadCareer(): Promise<SaveState | null> {
    // 1. Try backend save first if backend port is defined
    if (typeof window !== 'undefined' && window.location?.port && window.location.port !== '3000') {
      try {
        const res = await fetch('/api/save').catch(() => null);
        if (res && res.ok) {
          const body = await res.json();
          if (body.has_save && body.data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(body.data));
            return body.data as SaveState;
          }
        }
      } catch (e) {
        // Fallback to local
      }
    }

    // 2. Check LocalStorage
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        return JSON.parse(item) as SaveState;
      }
    } catch (e) {
      console.warn('LocalStorage read failed:', e);
    }

    return null;
  }

  public static hasLocalSave(): boolean {
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return false;
    }
  }

  public static async deleteCareer(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    if (typeof window !== 'undefined' && window.location?.port && window.location.port !== '3000') {
      try {
        await fetch('/api/save/delete', { method: 'POST' }).catch(() => {});
      } catch (e) {}
    }
  }
}
