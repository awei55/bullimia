# 🐂 BULLIMIA: Loop Demo (Phase 1 Prototype Archive) 🐻

> This directory contains the original Phase 1 proof-of-concept prototype built in Python (Pygame) and HTML5 Canvas.

---

## 🎮 Running the Demo

### 1. Web Version (HTML5 Canvas + Python Server)
Run the launcher:
```bash
python run_game.py
```
Or double-click `run_game.bat`. This starts the local Python backend server (`server.py`) and opens `index.html` in your default browser.

### 2. Standalone Desktop Version (Pygame)
Run the native Pygame arcade client:
```bash
python run_pygame.py
```

### Controls
- **SPACE (Tap)**: Instant reverse (flip between Bull on top and Bear on bottom).
- **SPACE (Hold)**: Charges lots from 1 to 100 with escalating vibration and visual order counter. Release to execute.
- **1 - 8 (Number Keys)**: Seamlessly switch between assets (`NVDA`, `TSLA`, `BTC-USD`, `SPY`, `GME`, `AAPL`, `AMD`, `QQQ`). Closes existing position at current price without stopping game flow.
- **T**: Jump to a random historical market epoch.
- **R**: Restart career ($10,000 equity reset).
- **M**: Mute/unmute procedural audio.

---

## 📁 Prototype Structure
- `index.html`: Canvas client entry point.
- `js/engine/`: Game loop, camera, particles, Web Audio synthesizer.
- `js/entities/`: Bull/Bear character and candlestick terrain rendering.
- `js/trading/`: Mark-to-market calculations and data managers.
- `run_pygame.py`: Standalone 60 FPS Pygame simulation with logarithmic scaling and MT5 trade lines.
- `server.py`: Local HTTP server with live Yahoo Finance download fallback.
- `data/`: Local cached historical daily candlestick sets.
