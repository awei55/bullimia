# 🛤️ BULLIMIA DEV TRACK ARCHITECTURE

> **Document Status**: Active Standard  
> **Core Objective**: Ensure Bullimia expands into a scalable, multiplatform commercial indie production without accumulating technical debt or requiring full codebase refactors when adding content.

---

## 1. Architectural Philosophy: The 4 Autonomous Tracks

To scale Bullimia from an arcade prototype into a full indie release (Steam, Steam Deck, Web, macOS), development is partitioned into **four decoupled tracks**. Each track owns a specific problem domain, directory boundary, and interface contract.

```
+-----------------------------------------------------------------------------------------------+
|                                  TRACK 3: NARRATIVE & WORLD                                   |
|   Uncle Gordon Transmissions  |  Macro News Alerts  |  Historical Crisis Boss Epochs (2008/2020)  |
+-----------------------------------------------------------------------------------------------+
                                                ^
                                                | Subscribes to Domain Events
                                                v
+-----------------------------------------------------------------------------------------------+
|                               TRACK 2: ECONOMY & METAPROGRESSION                              |
|   Capital Horizon ($1K-$100M) | Shop Upgrades | Modifier Pipeline | Baskets | Restructuring   |
+-----------------------------------------------------------------------------------------------+
         ^                                                              ^
         | Provides TradeContext                                        | Dispatches Orders
         v                                                              v
+---------------------------------------------------+  +----------------------------------------+
|             TRACK 4: SYSTEMS & QUANT              |  |         TRACK 1: CORE LOOP & FEEL       |
| Pure Rust Quant Kernel (Tauri IPC / Native)       |  | Modular PixiJS 8 Autoscroller (WebGL)   |
| Double-Entry Solvency | Saves | Platform Shell    |  | Kinematics | Deadzones | Parallax | FX  |
+---------------------------------------------------+  +----------------------------------------+
```

---

## 2. Track Specifications & Ownership Boundaries

### 🏎️ Track 1: Core Loop & Game Feel (Second-to-Second)
* **Domain**: The 3-second kinetic trading loop, game feel, tactile feedback, and WebGL rendering.
* **Directory Boundary**: `src/lib/engine/`
  - `core/`: Coordinate mapping, candle interpolation, simulation clock.
  - `input/`: Keyboard polling, tap deadzones (<200ms vs hold), Spacebar lot charging, Escape flattening.
  - `actors/`: Bull & Bear vector kinematics, galloping run cycles, death explosion particles.
  - `overlays/`: Fog of War corridor, 20-path Monte Carlo Brownian fan, MT5 historical trade vectors, live PnL badge.
  - `fx/`: Multi-layer parallax background, sparks, steam, sound effect triggers.
* **Inviolable Contract**:
  - Track 1 is a **pure consumer** of financial state (`account`, `quotes`, `currentLevel`).
  - **Zero Financial Math**: Never calculate PnL, margin, or liquidation thresholds inside graphics code.
  - Input actions strictly dispatch commands (`executeOrder`, `setFlatten`) into the state layer.

---

### 📈 Track 2: Economy & Metaprogression (Minute-to-Hour)
* **Domain**: Capital progression ($1K $\rightarrow$ $100M+), lot sizing curves, terminal shop upgrades, synthetic basket pairs, creditor restructuring, and sovereign credit.
* **Directory Boundary**: `src/lib/stores/`, `src/lib/progression/`, `src-tauri/src/quant/`
  - `trading.ts`: Reactive Svelte state orchestration and level loading.
  - `modifier_pipeline.ts`: Composable modifier evaluation (Tiers, Licenses, Buffs $\rightarrow$ `TradeContext`).
  - `terminal_shop.ts`: Colocation latency and asset class licensing.
  - `synthetic_basket.ts`: Statistical arbitrage and L2 liquidity depth.
  - `creditor_restructuring.ts`: Chapter 11 debt facilities and interest schedules.
  - `portfolio.ts`: Sovereign credit facilities, PE buyouts, and OTC derivatives.
* **Inviolable Contract**:
  - Upgrades and modifiers are **pure functions** that produce an immutable `TradeContext`.
  - Adding a new upgrade or asset never touches the WebGL rendering code.

---

### 📰 Track 3: Narrative & World-Building (The Campaign)
* **Domain**: Uncle Gordon "The Barracuda" dialogues, satirical Wall Street world-building, macro news telemetry, and historical crisis epochs (e.g. 2008 Lehman Crash, 2020 COVID Liquidity Bazooka, 2021 Meme Mania).
* **Directory Boundary**: `src/lib/narrative/`, `src/lib/components/*Modal.svelte`
  - `BenefactorModal.svelte`: Encrypted pager modal for Uncle Gordon wires.
  - `NewsAlertBanner.svelte`: 3-candle Fog of War volatility warning alerts.
  - `CreditorRestructuringModal.svelte`: Senior creditor bailout negotiation.
* **Inviolable Contract**:
  - **Event-Driven Pub/Sub**: The narrative layer listens to state events (`onEquityCrossed`, `onDrawdownLimit`, `onEpochEnd`).
  - The Quant Kernel and Core Engine **never call narrative dialogues directly**.

---

### 🦀 Track 4: Systems, Quant Kernel & Publishing Infrastructure
* **Domain**: Headless deterministic accounting engine, Tauri v2 native desktop shell, local save persistence, cross-platform builds (Windows, macOS, Linux/Steam Deck), and Steamworks SDK integration.
* **Directory Boundary**: `src-tauri/`, `src/lib/services/`
  - `src-tauri/src/quant/`: Pure deterministic Rust quant kernel (`kernel.rs`, `models.rs`, `tests.rs`).
  - `src-tauri/src/commands.rs`: Tauri IPC command endpoints for orders, mark-to-market, dev warps, and native saves.
  - `src/lib/services/save_manager.ts`: Dual-persistence coordinator (localStorage + filesystem save).
* **Inviolable Contract**:
  - **Zero Runtime Python**: The entire game runs standalone without external processes, servers, or network ports.
  - **100% Determinism**: Given the same sequence of price ticks and orders, the Rust kernel outputs the identical ledger across all platforms.

---

## 3. Extensibility Guide: How to Add Features Without Refactors

| Feature to Add | Owning Track | Exact Files to Touch | Files Forbidden to Touch |
| :--- | :--- | :--- | :--- |
| **New Market Asset** (e.g. WTI Crude) | Track 2 & 4 | Add JSON to `public/data/`, add multiplier in `kernel.rs` & `DATA_CATALOG.md` | `pixi_game.ts`, `HUD.svelte`, `BenefactorModal.svelte` |
| **New Narrative Benefactor** | Track 3 | Add trigger listener in `narrative/` & modal in `components/` | `kernel.rs`, `pixi_game.ts` |
| **New Terminal Shop Upgrade** | Track 2 | Add item in `terminal_shop.ts` & modifier in `modifier_pipeline.ts` | `pixi_game.ts`, `kernel.rs` |
| **New Visual Particle Effect** | Track 1 | Add emitter in `engine/fx/particles.ts` | `trading.ts`, `kernel.rs`, `save_manager.ts` |
| **New Platform SDK** (e.g. Steam) | Track 4 | Add Rust crate in `src-tauri/Cargo.toml` & Tauri command in `commands.rs` | All `src/lib/` frontend UI |
