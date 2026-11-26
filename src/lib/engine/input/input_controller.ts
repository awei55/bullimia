import { get } from 'svelte/store';
import {
  account,
  chargedLots,
  chargeProgress,
  isCharging,
  isTradingActive,
  lotMode,
  timeDilation,
  triggerHeadlineAlert,
} from '../../stores/trading';
import { soundEngine } from '../../audio/soundtrack';

export interface InputCallbacks {
  onFlipPosition: (lots: number) => void;
  onFlatten: () => void;
  onChargeUpdate?: (progress: number) => void;
}

export class EngineInputController {
  public spaceHeld: boolean = false;
  public chargeStartTime: number = 0;

  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyup: ((e: KeyboardEvent) => void) | null = null;
  private callbacks: InputCallbacks;

  constructor(callbacks: InputCallbacks) {
    this.callbacks = callbacks;
    this.setupListeners();
  }

  private setupListeners() {
    this.boundKeydown = (e: KeyboardEvent) => {
      const targetTag = (document.activeElement?.tagName || '').toLowerCase();
      if (['input', 'textarea'].includes(targetTag)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();

        if (e.repeat) return;
        if (!get(isTradingActive)) return;

        soundEngine.resume();
        this.spaceHeld = true;
        this.chargeStartTime = performance.now();
        isCharging.set(true);
        chargeProgress.set(0.0);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();

        if (!get(isTradingActive)) return;

        const acc = get(account);
        const isUnlocked = acc.high_watermark >= 1_000_000 || acc.equity >= 1_000_000;
        if (isUnlocked) {
          if (acc.side !== 'FLAT') {
            this.callbacks.onFlatten();
          }
        } else {
          triggerHeadlineAlert(
            "INSTITUTIONAL PRIVILEGE LOCKED: 'FLAT CASH (ESC)' UNLOCKS AT $1,000,000 INDEPENDENT PROP DESK",
            4000
          );
        }
      } else if (e.key === '[') {
        timeDilation.update((v) => Math.max(0.5, v * 0.5));
      } else if (e.key === ']') {
        timeDilation.update((v) => Math.min(5.0, v * 2.0));
      } else if (e.key === '\\') {
        timeDilation.set(1.0);
      }
    };

    this.boundKeyup = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();

        if (!this.spaceHeld) return;
        this.spaceHeld = false;
        isCharging.set(false);

        const holdDuration = performance.now() - this.chargeStartTime;
        let lots: number;

        // 200ms Tap Deadzone: crisp 1-lot order on quick taps
        if (holdDuration < 200) {
          const mode = get(lotMode);
          lots = mode === 'MICROLOT' ? 0.01 : 1.0;
        } else {
          lots = get(chargedLots);
        }

        chargeProgress.set(0.0);
        this.callbacks.onFlipPosition(lots);
      }
    };

    window.addEventListener('keydown', this.boundKeydown);
    window.addEventListener('keyup', this.boundKeyup);
  }

  public updateCharge() {
    if (this.spaceHeld) {
      const elapsed = (performance.now() - this.chargeStartTime) / 1000.0;
      // 1.4s for full 100-lot charge
      const progress = Math.min(1.0, elapsed / 1.4);
      chargeProgress.set(progress);
      if (this.callbacks.onChargeUpdate) {
        this.callbacks.onChargeUpdate(progress);
      }
    }
  }

  public reset() {
    this.spaceHeld = false;
    this.chargeStartTime = 0;
    isCharging.set(false);
    chargeProgress.set(0.0);
  }

  public destroy() {
    if (this.boundKeydown) {
      window.removeEventListener('keydown', this.boundKeydown);
    }
    if (this.boundKeyup) {
      window.removeEventListener('keyup', this.boundKeyup);
    }
  }
}
