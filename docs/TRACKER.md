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
