# 🛡️ BULLIMIA AGENT CODING STANDARDS & ENGINEERING INVARIANTS

> **Standard Authority**: Mandatory for all AI agents, human engineers, and subagents operating in `bullimia`.  
> **Core Mandate**: *Zero-Patchwork Standard. Every modification must be planned, strictly adhere to domain decoupling, maintain type safety, and pass the complete automated verification suite before completion.*

---

## 1. The Zero-Patchwork Standard

1. **Understand Before Modifying**:
   - Never implement a "quick fix" that patches a symptom without understanding root cause causation.
   - Trace data flows end-to-end: User Input $\rightarrow$ Engine Dispatch $\rightarrow$ Quant Evaluation $\rightarrow$ State Store $\rightarrow$ Reactive Presentation.
2. **No Orphaned Logic or Duplicate Math**:
   - Math equations (e.g. bid-ask crossing, spread calculation, PnL, margin utilization) have exactly **one authoritative source of truth**.
   - UI views (`HUD.svelte`, `TradeConsoleView.svelte`) and WebGL components (`pixi_game.ts`) must **never calculate their own PnL or margin**. They strictly display values emitted by the Quant Engine.
3. **No Dead or Commented-Out Sprawl**:
   - Dead code, deprecated endpoints, or obsolete hacks must be deleted cleanly, not left commented out.

---

## 2. Inviolable Architectural Boundaries (The 4 Tracks)

Always respect the 4-Track Architecture defined in `docs/DEV_TRACKS.md`:

```
Track 1 (Core Loop / WebGL)  <-- Pure Consumer --  Track 2 (Economy / Stores)
                                                           |
Track 3 (Narrative / UI)     <-- Pub/Sub Events --+        | Evaluates TradeContext
                                                           v
Track 4 (Rust Quant Kernel)  <-- Pure Math Invariant -----+
```

### Prohibited Cross-Track Imports
- ❌ **Forbidden**: Importing PixiJS, Web Audio, or Svelte DOM APIs into the Quant Kernel (`src-tauri/src/quant/` or core math).
- ❌ **Forbidden**: Importing PixiJS graphics into Svelte stores (`src/lib/stores/`).
- ❌ **Forbidden**: Direct mutual dependencies between Svelte components. All inter-component communication happens via typed Svelte stores or event dispatchers.

---

## 3. Financial & Simulation Invariants

Every financial calculation must uphold these immutable laws:

1. **Double-Entry Balance Invariant**:
   $$\text{Equity} = \text{Cash Balance} + \text{Unrealized PnL}$$
   $$\text{Free Margin} = \text{Equity} - \text{Margin Used}$$
2. **Bid/Ask Spread Crossing**:
   - Long (`BULL`) enters at **Ask**, exits at **Bid**.
   - Short (`BEAR`) enters at **Bid**, exits at **Ask**.
   - Neutral Cash (`FLAT`) exits current position at opposing quote and zeroes out open lots.
3. **Solvency Tiers**:
   - **Genesis (< $10,000)**: Margin calls suppressed. Liquidation occurs exclusively at $\text{Equity} \le 0$ ("DEAD BROKE").
   - **Prop Desk ($10K – $10M)**: Margin call triggers when $\text{Equity} \le \text{Margin Used} \times \text{Maintenance Margin Rate}$ ($50\%$).
   - **Hedge Fund ($10M – $100M)**: Margin call replaced by **Chapter 11 Creditor Restructuring** ($5M rescue cash injection, SOFR+650bps compounding debt).
   - **Sovereign ($100M+)**: **Too Big To Fail**. Margin calls permanently disabled.

---

## 4. WebGL, DOM & Input Hygiene

1. **Spacebar Ghost-Click Defense**:
   - Whenever Spacebar is pressed, call `e.preventDefault()` and proactively blur any active DOM element (`(document.activeElement as HTMLElement)?.blur()`).
   - Spacebar is reserved exclusively for the core gameplay mechanic (position flip and lot charge). It must never accidentally trigger focused HTML buttons.
2. **Deadzones on Kinetic Inputs**:
   - Keyboard taps $<200\text{ms}$ execute exact **1-lot** (or 0.01 microlot) orders.
   - Continuous holds $>200\text{ms}$ smoothly charge order size up to 100 lots with exponential ramping ($\text{progress}^{1.4}$).
3. **Viewport & Canvas Resizing**:
   - Never use `display: none` on the WebGL container canvas when switching views, as it collapses internal WebGL buffer dimensions to $0\times 0$.
   - Use non-collapsing hidden styles (`w-0 h-0 opacity-0 pointer-events-none absolute`). Always bind a `ResizeObserver` to re-calibrate camera projection on resize.
4. **File Size Budget**:
   - No single TypeScript/Svelte source file may exceed **400 lines**.
   - Monolithic files must be decomposed into single-responsibility sub-modules under their respective track directory.

---

## 5. Verification & Test-Before-Push Protocol

Before any code modification is committed or considered complete:

1. **Execute All Unit Tests**:
   ```powershell
   npm test
   ```
   - Must pass 100% of Rust tests (`cargo test --manifest-path src-tauri/Cargo.toml`).
   - Must pass 100% of frontend tests (`npx vitest run`).
2. **Verify Production Compilation**:
   ```powershell
   npm run build
   ```
   - Must build with **zero TypeScript errors** and **zero Vite warnings**.
3. **Document in Ledger**:
   - Record what changed, which track was touched, and the test pass counts in `docs/TRACKER.md`.
