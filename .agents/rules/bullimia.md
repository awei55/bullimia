# Bullimia Engineering Rules & Autonomous Context Memory

## 1. Context Memory Protocol
- **Primary Instruction**: At the beginning of every turn, read `docs/TRACKER.md` to establish the exact state of features, tests, and pending milestones.
- **Architectural Boundary**: Review `docs/ARCHITECTURE.md`. Ensure that financial accounting (`QuantKernel`) remains strictly decoupled from UI, graphics, and metagame modifiers.
- **Data & Design Specifications**: Consult `docs/DATA_CATALOG.md` for dataset formats, ATR logarithmic scaling, and API schemas; consult `docs/GAME_DESIGN_MEMORY.md` for progression milestones and narrative triggers.

## 2. Zero-Patchwork Quality Standards
- No quick temporary workarounds that create technical debt.
- All core calculations must be covered by headless unit tests (`backend/tests/` and `src/lib/stores/*.test.ts`).
- Any new features must update `docs/TRACKER.md` with milestone status and test results.
