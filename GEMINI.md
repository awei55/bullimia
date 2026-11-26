# 🤖 BULLIMIA WORKSPACE RULES & AGENT DIRECTIVE

See [AGENTS.md](file:///D:/GitRepos/bullimia/AGENTS.md) for full working memory and context protocols.

## Core Mandates
1. **Always Read `docs/TRACKER.md` First**: Ingest current project status, phase goals, and test pass counts before modifying code.
2. **Always Update `docs/TRACKER.md` Last**: Record every feature, fix, architectural decision, and test result.
3. **Decoupled 4-Track Architecture (`docs/DEV_TRACKS.md` & `docs/CODING_STANDARDS.md`)**: Keep the pure financial engine (`src-tauri/src/quant/`) strictly isolated from UI, sound, and graphics. Adhere to the Zero-Patchwork Standard.
4. **Automated Verification**: Run `npm test` (Rust `cargo test` + Vitest) before completing any turn.
