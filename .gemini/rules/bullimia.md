# Bullimia Development & Architecture Rules

## Master Vision & Reference
- Always consult `docs/GRAND_VISION_ROADMAP.md` and `docs/SYSTEM_ARCHITECTURE.md` before designing or implementing any gameplay, financial, or technical feature.
- Adhere strictly to the 4-Phase Progression:
  1. Phase 1: Retail Arcade Tutorial ($10K -> $1M)
  2. Phase 2: Independent Prop Trader ($1M -> $10M)
  3. Phase 3: Quantitative Hedge Fund & Algorithmic Era ($10M -> $100M)
  4. Phase 4: Institutional Endgame ($100M+)

## Zero-Patchwork Engineering Standard
1. **Decoupled Architecture**: Maintain strict separation between the Deterministic Financial Kernel (pure math, no UI), Market Data Fabric, Autoscroller Core, and Metagame UI Shell.
2. **Deterministic Verification**: All financial accounting (PnL, mark-to-market floating equity, spreads, commissions, margin requirements, interest schedules) must be verified with headless unit/invariant tests.
3. **No Monolithic Hacks**: When adding complex UI features (multi-window docking, node-graph bot studio, L2/L3 order book), use battle-tested, modular libraries (e.g. SvelteFlow/ReactFlow, FlexLayout/GoldenLayout, PixiJS) rather than brittle ad-hoc implementations.
4. **Agent Oversight**: When undertaking major architectural transitions, invoke the `bullimia-architect` subagent to audit specifications, component boundaries, and testing gates.
