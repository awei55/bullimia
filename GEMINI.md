# 🤖 BULLIMIA WORKSPACE RULES & AGENT DIRECTIVE

See [AGENTS.md](file:///D:/GitRepos/bullimia/AGENTS.md) for full working memory and context protocols.

## Core Mandates
1. **Always Read `docs/TRACKER.md` First**: Ingest current project status, phase goals, and test pass counts before modifying code.
2. **Always Update `docs/TRACKER.md` Last**: Record every feature, fix, architectural decision, and test result.
3. **Decoupled Architecture (`docs/ARCHITECTURE.md`)**: Keep the pure financial engine (`backend/bullimia_quant/kernel.py`) isolated from UI, sound, and graphics.
4. **Automated Verification**: Run `npm test` (Pytest + Vitest) before completing any turn.
