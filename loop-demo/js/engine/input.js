// Bullimia Input Controller
// Handles Spacebar hold-to-charge, tap detection, vibration state, and order sizing (1 to 100 lots)

export class InputController {
    constructor() {
        this.isSpaceDown = false;
        this.holdStartTime = 0;
        this.holdDuration = 0;
        this.chargeProgress = 0.0; // 0.0 to 1.0
        this.currentLots = 1;      // 1 to 100
        
        // Tuning: 2.5 seconds to reach max 100 lots
        this.maxChargeTimeMs = 2400;
        
        // Callbacks
        this.onChargeStart = null;
        this.onChargeUpdate = null;
        this.onFlipOrder = null;

        this.initListeners();
    }

    initListeners() {
        window.addEventListener('keydown', (e) => {
            // Spacebar handler
            if (e.code === 'Space' || e.key === ' ') {
                // Prevent browser page scrolling
                e.preventDefault();
                if (!this.isSpaceDown) {
                    this.startHold();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                if (this.isSpaceDown) {
                    this.releaseHold();
                }
            }
        });

        // Also allow Mouse/Touch hold anywhere on screen (for touch devices or mouse play)
        window.addEventListener('pointerdown', (e) => {
            // Don't trigger if clicking on HUD buttons or modals
            if (e.target.closest('button, input, select, .modal, .interactive')) return;
            if (!this.isSpaceDown) {
                this.startHold();
            }
        });

        window.addEventListener('pointerup', (e) => {
            if (this.isSpaceDown) {
                this.releaseHold();
            }
        });

        window.addEventListener('pointercancel', () => {
            if (this.isSpaceDown) {
                this.releaseHold();
            }
        });
    }

    startHold() {
        this.isSpaceDown = true;
        this.holdStartTime = performance.now();
        this.holdDuration = 0;
        this.chargeProgress = 0;
        this.currentLots = 1;

        if (this.onChargeStart) {
            this.onChargeStart();
        }
    }

    update(currentTime) {
        if (!this.isSpaceDown) return;

        this.holdDuration = currentTime - this.holdStartTime;
        // Normalized 0 to 1 progress
        this.chargeProgress = Math.min(1.0, this.holdDuration / this.maxChargeTimeMs);
        
        // Non-linear ramp: starts at 1, smoothly curves up to 100
        // Formula: 1 + 99 * (progress ^ 1.3)
        const charged = 1 + Math.round(99 * Math.pow(this.chargeProgress, 1.25));
        this.currentLots = Math.min(100, Math.max(1, charged));

        if (this.onChargeUpdate) {
            this.onChargeUpdate(this.chargeProgress, this.currentLots);
        }
    }

    releaseHold() {
        if (!this.isSpaceDown) return;
        this.isSpaceDown = false;

        const lotsToExecute = this.currentLots;
        const progress = this.chargeProgress;

        // Reset
        this.chargeProgress = 0;
        this.currentLots = 1;
        this.holdDuration = 0;

        if (this.onFlipOrder) {
            this.onFlipOrder(lotsToExecute, progress);
        }
    }
}
