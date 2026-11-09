---
name: bullimia-core
description: >-
  Core engineering runbook, testing protocols, dataset management, and decoupled modifier architecture for Bullimia.
  Use whenever developing, refactoring, or testing features across the 4 phases of Bullimia.
---

# Bullimia Core Engineering & Context Runbook

This skill provides operational workflows and architectural patterns for Bullimia.

---

## 1. Quick Verification Commands

```powershell
# Run backend + frontend unit tests:
npm test

# Run backend unit tests (FastAPI & Quant Kernel):
npm run test:backend

# Run frontend unit tests (Stores, SaveManager):
npm run test:frontend

# Verify production Vite build:
npm run build

# Run headless Playwright E2E test suite:
python tests/test_e2e_playwright.py
```

---

## 2. Decoupled Modifier Pipeline Pattern

When adding new mechanics (Difficulties, Character Archetypes, Market Shocks, Minigames), follow the Modifier Pipeline pattern codified in `docs/ARCHITECTURE.md`:

1. **Do NOT touch `backend/bullimia_quant/kernel.py` core math.**
2. **Define the modifier interface in `src/lib/types.ts`:**
   ```typescript
   export interface CharacterArchetype {
     id: string;
     name: string;
     modifiers: {
       commissionDiscountPct?: number;
       spreadReductionPct?: number;
       speedDilationMax?: number;
     };
   }
   ```
3. **Resolve active modifiers into `TradeContext` before executing trades:**
   ```typescript
   export interface TradeContext {
     contractMultiplier: number;
     marginRate: number;
     commissionPerLot: number;
     effectiveSpreadMultiplier: number;
   }
   ```
4. **Pass evaluated `TradeContext` into `execute_order` and `mark_to_market`.**

---

## 3. Dataset Ingestion Workflow

To add a new asset to Bullimia:
1. Generate or format JSON conforming to `docs/DATA_CATALOG.md`.
2. Save file to `public/data/level_{TICKER}.json` and `data/level_{TICKER}.json`.
3. Add entry to `public/data/levels_catalog.json` with `avg_atr_pct`, `log_scale`, `spread_factor`, and `preview_candles`.
4. Test loading via `loadLevel('{TICKER}', true)` in unit tests.

---

## 4. Save State Maintenance

When modifying state schemas:
1. Update `SaveState` interface in `src/lib/types.ts`.
2. Maintain backward-compatible defaults in `src/lib/services/save_manager.ts`.
3. Add unit test coverage in `src/lib/services/save_manager.test.ts`.

---

## 5. Living Documentation Invariant

After completing any feature or bug fix:
1. Update `docs/TRACKER.md` milestone status table and changelog.
2. Commit and push to `origin main` on `https://github.com/awei55/bullimia.git`.
