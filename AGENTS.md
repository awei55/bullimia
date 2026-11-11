# 🤖 BULLIMIA AGENT WORKING MEMORY & CONTEXT ARCHITECTURE

> **AUTOMATIC INJECTION CONTRACT**: This document is the master memory and instruction anchor for any AI agent operating in this repository. It is active in every session and across every turn.

---

## 1. 🧠 MANDATORY CONTEXT BOOTSTRAP PROTOCOL (Every Chat / Every Turn)

Whenever you begin a task, respond to a user request, or resume development in this repository, you **MUST** follow this bootstrap sequence:

1. **Step 1: Ingest Living Project State (`docs/TRACKER.md`)**
   - Read or consult [docs/TRACKER.md](file:///D:/GitRepos/bullimia/docs/TRACKER.md).
   - This file contains the authoritative record of active milestones, completed features, known issues, test pass rates, and the chronological changelog.
   - **Rule**: If you add, modify, or fix any component, you **MUST** update [docs/TRACKER.md](file:///D:/GitRepos/bullimia/docs/TRACKER.md) before concluding your turn.

2. **Step 2: Respect the Sealed Architectural Boundary (`docs/ARCHITECTURE.md`)**
   - Review [docs/ARCHITECTURE.md](file:///D:/GitRepos/bullimia/docs/ARCHITECTURE.md).
   - **Zero-Presentation Rule**: `backend/bullimia_quant/kernel.py` and core client-side accounting math are pure, headless domain logic. Never mix DOM, Svelte components, PixiJS graphics, or Web Audio into financial math.
   - **Modifier Pipeline**: Difficulties, character archetypes, market shocks, and minigame rewards plug in as composable modifiers evaluated into `TradeContext`, never hardcoded if/else branches in the kernel.

3. **Step 3: Consult Master Design & Data Catalogs**
   - [docs/DATA_CATALOG.md](file:///D:/GitRepos/bullimia/docs/DATA_CATALOG.md): Complete index of all 8 asset datasets, 6 historical event epochs, ATR log scaling formulas, and WebSocket/REST schemas.
   - [docs/GAME_DESIGN_MEMORY.md](file:///D:/GitRepos/bullimia/docs/GAME_DESIGN_MEMORY.md): Deep memory of the 4-phase progression, the Genesis Tutorial ($1K start), Uncle Gordon's 3-trigger wire (+$9K), macro news alert system, and endgame autotrading.
   - [docs/GRAND_VISION_ROADMAP.md](file:///D:/GitRepos/bullimia/docs/GRAND_VISION_ROADMAP.md): High-level trajectory from Retail Arcade to Sovereign Quant Empire.
   - [docs/PROGRESSION_AND_UNLOCKS.md](file:///D:/GitRepos/bullimia/docs/PROGRESSION_AND_UNLOCKS.md): Terminal shop upgrades, colocation, minigames, and licensing.

---

## 2. 🏛️ SYSTEM MAP & KEY ARTIFACTS

```
D:/GitRepos/bullimia/
├── AGENTS.md                          # Master Agent Working Memory (THIS FILE)
├── GEMINI.md                          # Parallel root rule anchor
├── docs/
│   ├── TRACKER.md                     # Living milestone, test coverage & change ledger (MUST UPDATE)
│   ├── ARCHITECTURE.md                # 5-Layer Hexagonal Architecture & Modifier Pipeline
│   ├── DATA_CATALOG.md                # Generated datasets, candle schemas & API endpoints
│   ├── GAME_DESIGN_MEMORY.md          # 4-Phase mechanics, narrative triggers & formulas
│   ├── GRAND_VISION_ROADMAP.md        # Long-term macro trajectory ($1K -> $100M+)
│   └── PROGRESSION_AND_UNLOCKS.md     # Shop, venue licensing, and minigame specs
├── backend/
│   ├── bullimia_quant/
│   │   ├── kernel.py                  # Layer 1: Pure Quant Accounting Kernel (Headless)
│   │   └── streaming.py               # Layer 2: Fast WebSocket streaming server
│   ├── server.py                      # FastAPI REST & WebSocket server (port 8000)
│   └── tests/                         # Pytest test suite (13/13 passing)
├── src/
│   ├── App.svelte                     # Main UI orchestrator & view router
│   ├── lib/
│   │   ├── stores/trading.ts          # Reactive Svelte stores & event fabric
│   │   ├── engine/pixi_game.ts        # Layer 3: PixiJS 8 WebGL autoscroller (60+ FPS)
│   │   ├── audio/soundtrack.ts        # Procedural synthwave audio engine
│   │   ├── services/save_manager.ts   # Dual persistence (localStorage + backend JSON)
│   │   └── components/                # Modular UI primitives (HUD, modals, views)
├── public/data/                       # Bundled static market datasets (NVDA, AAPL, BTC, etc.)
└── .agents/
    ├── rules/bullimia.md              # Project-specific development rules
    └── skills/bullimia-core/          # Progressive workspace skill & runbooks
```

---

## 3. 🎯 CRITICAL GAMEPLAY CONSTRAINTS & CORE LOOP

1. **Genesis Start ($1,000 USD)**:
   - Starting a new game opens directly into the autoscroller with exactly **$1,000 USD** on **NVDA**.
   - No asset switcher bar, no macro news alerts, no phase navigation tabs are visible.
   - The start button is a single, clean **"START"** button.

2. **Uncle Gordon Benefactor Transmission**:
   - Triggers when the player hits **any one of three conditions**:
     - *Survival*: Trades for 120 continuous seconds.
     - *Profit Run*: Equity reaches $\ge \$5,000$.
     - *Crisis Bailout*: Equity drops $\le \$100$ (down to last $100).
   - Pauses simulation, displays narrative pager modal tailored to the specific trigger reason, wires **+$9,000 USD**, unlocks the multi-asset switcher (AAPL, EUR/USD, etc.), and activates the demo mechanics.

3. **$100,000 Macro News Alerts**:
   - Flashing yellow neon banner warning 3 candles ahead of any $\ge 2.5\times$ ATR volatility spike in the Fog of War.

4. **Phase Transitions & View Routing**:
   - **Early ($1K - $1M)**: Interactive Candlestick Autoscroller.
   - **Midgame ($1M - $10M)**: Multi-window Trade Desk with `SPACE + ESC` cash flattening and time dilation.
   - **Late ($10M - $100M)**: Visual Node-Graph Bot Studio.
   - **Endgame ($100M+)**: Sovereign Portfolio Manager with 15-minute delayed live market feeds and credit facilities (margin call death disabled).

5. **Dev Console Warps**:
   - Available via Dev Console modal (`~` key or start menu button) to warp immediately to $100K, $1M, $10M, and $100M for rapid testing.

---

## 4. ⚙️ RAPID BUILD & VERIFICATION RUNBOOK

Always run the automated test suite before reporting completion on any code modification:
```powershell
# 1. Run all unit tests (Pytest + Vitest)
npm test

# 2. Or run backend and frontend independently:
npm run test:backend   # 13 tests in python -m pytest backend/tests -v
npm run test:frontend  # 10 tests in npx vitest run

# 3. Verify production compilation
npm run build          # vite build (compiles Svelte 5 + TypeScript to dist/)

# 4. Optional headless browser end-to-end verification
python tests/test_e2e_playwright.py
```

---

## 5. 📜 GIT COMMIT & SYNC PROTOCOL

The project repository is connected to:
`https://github.com/awei55/bullimia.git` on branch `main`.

Whenever completing a task:
1. Stage all new and modified files (`git add .`).
2. Commit with a descriptive semantic message (`git commit -m "feat: ..."` or `fix: ...`).
3. Push to `origin main` (`git push origin main`).
4. Update `docs/TRACKER.md` with the new commit hash and milestone status.
