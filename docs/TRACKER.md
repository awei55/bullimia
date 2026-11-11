# 📋 BULLIMIA: Engineering & Progression Tracker

> **Zero-Patchwork Standard**: Every component is planned, validated against financial & game architectural principles, implemented with reusable primitives, and tested against automated suites.

---

## 🧭 Milestone & Component Status Tracker

| Component / Epic | Target Phase | Status | Test Coverage | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1 Prototype Archive** | Phase 1 | ✅ Completed | Verified | Moved to `loop-demo/` with standalone Pygame and HTML5 runners. |
| **Quant Kernel (Layer 1)** | Core | ✅ Completed | 13/13 Pytest (1.48s) | Pure math deterministic accounting (BULL, BEAR, FLAT Cash, margin, lots, commissions, dev warps). |
| **Market Data Fabric (Layer 2)** | Core | ✅ Completed | Verified | Historical replay across 8 assets, random epoch slicing, ATR log scaling. |
| **FastAPI + WebSocket Server** | Core | ✅ Completed | 100% Pass | Local streaming API on port 8000 with `/api/save`, `/api/dev/warp`, `/api/dev/godmode`. |
| **PixiJS 8 Autoscroller (Layer 3)** | Core | ✅ Completed | E2E Playwright | 60+ FPS WebGL candlestick rendering, Fog of War corridor, Monte Carlo volatility surface fan. |
| **Procedural Synthwave Audio** | Core | ✅ Completed | Verified | Dynamic Web Audio synthesizer modulated by PnL velocity, lot size, and margin tension. |
| **Svelte 5 UI Primitives (Layer 4)** | Core | ✅ Completed | 7/7 Vitest | HUD ribbon, quick asset selector, MT5 trade ledger, liquidation modal. |
| **Tauri v2 Desktop Shell** | Core | ✅ Completed | Verified | Native desktop configuration (1280x800). |
| **Git & GitHub Remote** | Infrastructure | ✅ Completed | Synced | Live at `https://github.com/awei55/bullimia`. |
| **UX: Start Screen & Navigation** | UX / Metagame | ✅ Completed | E2E Verified | Cyberpunk terminal start screen with active save detection, Start New, Resume, Options, Dev Console. |
| **UX: Options Modal** | UX / Metagame | ✅ Completed | E2E Verified | Master/Music/SFX volume mixing, CRT scanline shader toggle, purge career save option. |
| **UX: Dev Console (Phase Warper)** | Developer Tool | ✅ Completed | 100% Pass | Instant warps to $1M, $10M, $100M, custom capital injection, God Mode toggle, force save. |
| **Persistent Save State System** | Core / Meta | ✅ Completed | 3/3 Unit + E2E | Dual persistence (`localStorage` + `backend/saves/career_save.json`), resumes open positions and progress. |
| **Phase-Based View Routing** | Metagame | ✅ Completed | E2E Verified | Early: Chart Autoscroller; Midgame ($1M-$10M): Trade Desk; Late ($10M-$100M): Bot Studio; Endgame ($100M+): Portfolio Manager. |
| **Genesis Tutorial ($1K Start)** | Metagame / Narrative | ✅ Completed | 9/9 Vitest + E2E | Clean cold start with $1,000 USD on NVDA, bottom ticker locked, high-level tabs hidden. |
| **Uncle Gordon Benefactor Wire** | Metagame / Narrative | ✅ Completed | 9/9 Vitest + E2E | Encrypted pager transmission triggered by 120s survival, $5K profit, or $100 crisis; injects +$9,000 and unlocks multi-asset switching. |
| **Macro News Alert Feed** | Market Microstructure | ✅ Completed | 9/9 Vitest + E2E | Flashing yellow neon warning banner unlocked at $100,000 for impending $\ge 2.5\times$ ATR volatility shocks in the Fog of War. |
| **Offline Static Fallback Resilience** | Infrastructure | ✅ Completed | E2E Verified | Zero-dependency resilience: static datasets bundled into `public/data/` so frontend runs even if backend is paused. |
| **Domain Decoupling & Architecture Spec** | Architecture | ✅ Completed | Locked in `ARCHITECTURE.md` | Formal Hexagonal & Modifier Pipeline specifications ensuring characters, difficulties, market events, and minigames plug in without modifying the core quant kernel. |
| **AI Context Memory Architecture** | System / Agent | ✅ Completed | Verified | 5-tier context memory architecture (`AGENTS.md`, `GEMINI.md`, `TRACKER.md`, `DATA_CATALOG.md`, `GAME_DESIGN_MEMORY.md`, `.agents/rules/`, `.agents/skills/bullimia-core/`) ensuring automatic memory retention and context loading across all chat sessions. |
| **TradeContext Modifier Pipeline** | Layer 1/2 Architecture | ✅ Completed | 38/38 Unit Tests (100% Pass) | Pure functional modifier pipeline resolving Colocation Tiers, Venue Routing, and Minigame Buffs into immutable `TradeContext`. Supported in Python Kernel & TypeScript. |
| **Terminal Infrastructure Shop** | Phase 2 Desk | ✅ Completed | 4/4 Vitest + Build Verified | Upgradable colocation (Retail Fiber, Microwave Link $150K, Secaucus NY4 $500K, Chicago CME $1.2M) and Asset Licenses (Commodities $250K, Global FX $500K, Crypto $750K). |
| **IB Distraction Minigames** | Phase 2 Metagame | ✅ Completed | 3/3 Vitest + Build Verified | Cognitive micro-puzzles (Pitchbook Alignment 15s timer, SEC Compliance Wash Blotter, LBO Debt Waterfall) with tiered bounties ($25K, $150K, $500K) running while tape autoscrolls. |
| **Time Dilation & Tactical Controls** | Phase 2 Engine | ✅ Completed | Verified | 0.5x, 1x, 2x, 5x speed controls with hotkeys (`[`, `]`, `\`) and `SPACE + ESC` neutral cash flattening. |
| **Indie Vector Art & Galloping Cycles (Layer 3)** | Graphics / Animation | ✅ Completed | 60+ FPS WebGL | Handcrafted vector Bull (4-leg gallop kinematics, golden metallic curved horns, glowing emerald eye, flapping red Wall Street tie, swishing tail, lightning arcs) & Bear (inverted underside run, grizzly shaggy coat, crimson cyber visor, glowing claws). Centered camera horizontally (`screenW * 0.5`). |
| **Dynamic Monte Carlo Brownian Fan (Layer 3)** | Market Microstructure | ✅ Completed | 60+ FPS WebGL | Dynamic 20-path stochastic Brownian motion fan fanning smoothly into Fog of War with periodic 1.2s recalibration cycles, $\pm 1\sigma / \pm 2\sigma$ probability cones, and glowing terminal beads. |
| **MT5 Trade Connection Lines & Position PnL (Layer 3)** | Visual Microstructure | ✅ Completed | Verified | Historical MT5-style trade vectors with buy/sell entry triangles, exit markers, and realized PnL badges, plus live floating position PnL badge near character with entry-tracking dotted laser trail. |
| **Futuristic Cel-Shaded Arcade UI Overhaul (Layer 4)** | Metagame UX / UI | ✅ Completed | Build Verified | Replaced generic AI UI with high-contrast cel-shaded panels, chamfered `cyber-clip` geometry, pixel game typography (`Press Start 2P`, `Silkscreen`, `Chakra Petch`), and arcade tactile feedback across HUD, modals, ticker bar, and all 4 phase views. |
| **Instantaneous 60 FPS Quant Sync & Multiplier Calibration** | Core Engine / Microstructure | ✅ Completed | 38/38 Unit + 9/9 E2E (100% Pass) | Eliminated 600ms update lag and network race conditions with synchronous 60 FPS in-memory mark-to-market. Calibrated per-asset multipliers (1.0 for equities, 0.1 for BTC). Added 200ms tap deadzone for crisp 1-lot position flips, and added live formatted PnL text directly to character badge. |
| **Genesis Microlots & 'Dead Broke' Tutorial Death** | Metagame / Risk Management | ✅ Completed | 44/44 Unit Tests (17 Pytest + 27 Vitest) | Microlot (0.01) default in Genesis Tutorial with $0.50 min ticket commissions, suppression of margin calls prior to $10k (liquidation only on equity <= 0: "DEAD BROKE"), post-$10k lot sizing toggle (0.01 MICRO vs 1.00 STD), and distinct "DEAD BROKE" vs "MARGIN CALLED" game over screens. |

---

## 📐 Architecture & Style Guide Compliance Audit

### Game Architecture Standards (Clean Game-Loop / Service Architecture)
1. **Single Source of Truth**:
   - `QuantKernel` in Python and Svelte reactive stores (`account`, `currentLevel`, `tradeHistory`) form the definitive state layer.
   - Graphics (PixiJS canvas) and DOM UI (Svelte) are pure consumers/presenters that dispatch actions via typed events.
2. **Decoupled Engine Loop**:
   - Game tick, physics, camera lerping, and Fog of War rendering run independently of UI component lifecycle.
3. **Save State Determinism**:
   - Save states serialize pure data: account state, active open position (side, lots, entry price, candle index), player progress, trade history, and phase.
   - Restoring a save state resets the simulation clock and reconstructs the engine state deterministically without forcing unwanted orders.
4. **Style Conventions**:
   - TypeScript strict mode compliance.
   - CSS: Tailwind atomic utility classes with scoped terminal theme extensions.
   - Reusable UI component abstractions (`StartScreen`, `OptionsModal`, `DevConsoleModal`, `TradeConsoleView`, `BotStudioView`, `PortfolioManagerView`).

---

## 📝 Change Log & Verification History
- **2026-11-09**: Archived prototype to `loop-demo/`.
- **2026-11-09**: Built Layer 1 Quant Kernel in Python + Pytest test suite (11 passed).
- **2026-11-09**: Built Layer 3 & 4 Svelte 5 + PixiJS 8 engine + Vitest suite (4 passed).
- **2026-11-09**: Validated end-to-end via headless Playwright browser test (0 errors, screenshot verified).
- **2026-11-09**: Established remote repository on GitHub: `awei55/bullimia`.
- **2026-11-10**: Implemented Start Screen, Options Modal, Dev Console ($10M/$100M skip), Save State Persistence, and Phase-based View Routing.
- **2026-11-10**: Verified all 20 automated tests passing (13 backend + 7 frontend) and full Playwright E2E UX test with 0 errors across all 4 phase views.
- **2026-11-10**: Resolved premature Benefactor trigger bug. Added `isTradingActive` lifecycle gating so zero popups or orders fire while on the Start Screen. Rebuilt Start Screen button to simple bold "START" ($1,000 cold start on NVDA). Implemented distinct Uncle Gordon messages tailored to each of the 3 triggers (120s survival, $5,000 profit run, or $100 crisis). Verified 100% pass across Pytest (13), Vitest (10), and Playwright E2E.
- **2026-11-10**: Completed Architectural Decoupling & Metagame Extensibility Audit. Authored `docs/ARCHITECTURE.md` establishing the 5 Architectural Commandments, Hexagonal Domain Boundary, and Modifier Pipeline Pattern (DifficultyProfile, CharacterArchetype, MarketEvent, MinigameReward -> TradeContext -> QuantKernel). Core financial engine is formally locked and insulated against regressions.
- **2026-11-10**: Engineered and deployed 5-Tier AI Context Memory Architecture:
  1. `AGENTS.md` & `GEMINI.md` at project root for automatic hierarchical context bootstrap in every session.
  2. `docs/TRACKER.md` as the living project state ledger.
  3. `docs/DATA_CATALOG.md` capturing all generated datasets, level schemas, and API endpoints.
  4. `docs/GAME_DESIGN_MEMORY.md` capturing 4-phase game mechanics, Uncle Gordon benefactor triggers, and formulas.
  5. `.agents/rules/bullimia.md` & `.agents/skills/bullimia-core/SKILL.md` providing progressive operational runbooks for future agents. All 23 unit tests verified (13 Pytest + 10 Vitest).
- **2026-11-10**: Engineered Phase 2 Independent Prop Desk ($1M - $10M) according to the Master Blueprint & Decoupled Architectural Manifesto:
  1. **TradeContext Modifier Pipeline**: Implemented pure modifier evaluation (`resolveTradeContext`) in TypeScript and integrated `spread_multiplier` and `commission_rate` into `backend/bullimia_quant/kernel.py`. Total automated unit test suite expanded from 23 to 38 tests (14 Pytest + 24 Vitest, 100% passing).
  2. **Terminal Infrastructure Shop**: Added upgradable colocation tiers (Retail Fiber 45ms $\rightarrow$ Dedicated Microwave 12ms $\rightarrow$ Secaucus NY4 0.8ms $\rightarrow$ Chicago CME 4ms) and asset class licenses (Commodities $250K, Global FX $500K, Crypto $750K) with persistent save support.
  3. **IB Distraction Minigames**: Built interactive cognitive micro-puzzles (`Pitchbook Alignment`, `SEC Compliance Wash Audit`, `LBO Debt Waterfall`) with 15-25s ticking timers awarding tiered cash bonuses ($25,000, $150,000, $500,000) while live candlesticks autoscroll uninterrupted in the background.
  4. **Tactical Time Dilation & Flattening**: Integrated 0.5x, 1x, 2x, 5x speed dilation with global hotkeys (`[`, `]`, `\`) and `SPACE + ESC` cash flattening. Verified zero-warning production build with `npm run build` (`babf614`).
- **2026-11-10**: Restored and Elevated Full Indie Arcade Aesthetic & WebGL Dynamics:
  1. **Camera Framing**: Centered the character horizontally on screen (`targetCamX = playerX - screenW * 0.5`), balancing historical candlestick trajectory with future Fog of War projection.
  2. **Indie Vector Character Art**: Handcrafted vector graphics with animated galloping run cycles for Bull (4-leg kinematics, golden metallic horns, glowing emerald eye, flapping red Wall Street tie, swishing tail, lightning arcs) and Bear (underside gallop, grizzly shaggy coat, crimson cyber visor, glowing claws).
  3. **Dynamic Monte Carlo Brownian Fan**: Restored 20-path stochastic Brownian motion volatility surface fan extending smoothly into the Fog of War with periodic 1.2s recalibration cycles, $\pm 1\sigma / \pm 2\sigma$ probability cones, and glowing terminal beads.
  4. **Parallax Game Background & Particle FX System**: Implemented 4-layer parallax environment (distant twinkling starfield, far cityscape with flashing aviation beacons, mid skyscraper skyline with glowing windows, retro perspective ground grid) and particle effects (hoof sparks, golden spinning `$` coins, steam puffs, lightning arcs).
  5. **MT5 Trade Lines & Floating Position PnL**: Restored MT5 trade connection vectors (dashed green/red lines, `▲ BUY`/`▼ SELL` entry triangles, exit circles, realized PnL badges) and a floating live position PnL badge following the character with an entry-tracking dotted laser beam.
  6. **Cel-Shaded Cyberpunk UI & Pixel Typography**: Completely purged generic AI UI styling across all components (`HUD`, `StartScreen`, `AssetTickerBar`, `GameOverModal`, `BenefactorModal`, `TradeLogModal`, `OptionsModal`, `DevConsoleModal`, `IBMinigameModal`, `NewsAlertBanner`, `TradeConsoleView`, `BotStudioView`, `PortfolioManagerView`). Implemented chamfered `cyber-clip` geometry, pixel fonts (`Press Start 2P`, `Silkscreen`, `Chakra Petch`), and high-contrast cel-shaded borders and dropshadows. All 38 tests verified (14 Pytest + 24 Vitest), 8/8 Playwright E2E steps verified with 0 errors, and production build confirmed (`vite build` 9.54s) (`bf94784`).
- **2026-11-10**: Margin Call Liquidation Death Animation, Audio Overhaul & UI Polish:
  1. **Post-Margin Call Restart Fix**: Re-wired `GameOverModal` restart trigger to `handleStartNewCareer`, properly resetting engine character state, deleting career saves, resetting capital to $1,000 on NVDA, and re-enabling `isTradingActive = true`. Verified across 9 Playwright E2E steps.
  2. **Spacebar Particle Charge Fix**: Eliminated the rogue line connecting to top-left (0,0) by removing erroneous PIXI graphics arc calls; replaced with energetic electric sparks, nostril steam puffs, kinetic rumble vibration, and pitch modulation.
  3. **Purged Meta-Text & Spoilers**: Removed all "SINGLE ASSET TUTORIAL REGIME // Uncle Gordon is watching" banners; bottom asset selector bar remains cleanly hidden until Uncle Gordon wires capital.
  4. **Purged AI Header Badges**: Removed redundant descriptive header badges from the top of the start screen.
  5. **Procedural Audio FX Enhancements**: Built dedicated synthesized sound effects for winning trades (C-major ascending arpeggio + high coin ping), losing trades (gritty downward crunch + dissonant minor buzz), and margin call liquidation (catastrophic noise burst explosion + deep sub-bass drop).
  6. **Character Liquidation Death Animation**: Added WebGL death sequence upon margin call: character explodes into a shower of 110 sparks, tumbles and spins downward off the screen with gravity, violent screen shake, and delayed modal appearance (`952581c`).
- **2026-11-11**: Core Quant Calculation Desync Fix, 60 FPS Sync & Asset Multiplier Calibration:
  1. **Instantaneous 60 FPS Mark-to-Market**: Purged the artificial 600ms candle integer gate (`currentIdx !== this.lastExecutedCandleIdx`) and network blocking from the WebGL render loop. Mark-to-market now runs synchronously in local memory at 60 FPS (~5 microseconds per frame), matching instantaneous candlestick terrain with zero lag.
  2. **Eliminated Network Latency & Order Race Conditions**: `executeOrder` now executes immediately in memory with 0ms latency, updating Cash balance, PnL, Win/Loss, and position states synchronously, followed by non-blocking background sync with the backend.
  3. **Spacebar Tap Deadzone**: Added a 200ms tap deadzone. Quick key taps (<200ms) guarantee a clean **1-lot** order execution, completely eliminating accidental 4x-6x leverage on simple position flips. Prolonged holds (>200ms) scale smoothly up to 100 lots.
  4. **Asset Contract Multiplier Calibration**: Replaced the hardcoded `* 10` multiplier with each asset's catalog multiplier (`1.0` for NVDA/equities, `0.1` for BTC-USD, `2.0` for SPY). Dollar price movements now produce exact, intuitive PnL ($1 move on 1 lot NVDA = $1.00 PnL).
  5. **Live Floating Position PnL Badge Text**: Added a dynamic `PIXI.Text` element directly into the live floating badge tracking the character, rendering real-time formatted PnL (e.g. `+$4.50`, `-$2.10`) directly above the running Bull/Bear. Verified 100% pass across all 38 unit tests and 9/9 Playwright E2E steps with 0 console errors.
- **2026-11-11**: Genesis Microlot Sizing (0.01) & 'Dead Broke' Tutorial Liquidation:
  1. **Tutorial Death Condition Refactor**: Replaced "Margin Call" in the Genesis Tutorial ($1,000 start) with "Dead Broke". Because novice players have no concept of maintenance margin yet, margin calls are completely suppressed prior to $10,000 / Uncle Gordon's wire. Total liquidation occurs exclusively if equity hits zero or below (`equity <= 0`).
  2. **Microlot (0.01) Sizing by Default**: Starting a new career sets lot sizing to `MICROLOT` mode (0.01 base lots up to 0.50 lots on max spacebar hold). This eliminates the aggressive 10% notional volatility per dollar move on small accounts and protects against accidental wipeout in early gameplay.
  3. **High Retail Comparative Commissions**: Implemented a retail binary options / retail broker fee curve: a minimum ticket commission of $0.50 per trade (`max(0.50, lots * commission_rate)`), penalizing reckless overtrading while keeping risk controlled.
  4. **Post-$10K Lot Sizing Switcher**: Crossing $10,000 or receiving Uncle Gordon's wire unlocks the HUD Lot Sizing toggle button, allowing seamless switching between `0.01 MICRO` and `1.00 STD` modes.
  5. **Contextual Game Over Screen**: `GameOverModal` dynamically renders `DEAD BROKE` with skull iconography and tutorial retry button when wiped out in early trading, or `MARGIN CALLED` with prop desk liquidation warning when wiped out above $10k.
  6. **Automated Verification**: Expanded test suites to 44 total unit tests (17 Pytest + 27 Vitest, 100% passing). Verified production bundle build (`vite build` in 10.00s) and full Playwright E2E pipeline.
