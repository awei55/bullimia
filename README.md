# 🐂 BULLIMIA 🐻
### *The 2D Candlestick Autoscroller & Real Market Trading Simulator*

[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Pygame-brightgreen)]()
[![Data Source](https://img.shields.io/badge/Data-Yahoo%20Finance%20%7C%20Historical-blue)]()
[![Starting Score](https://img.shields.io/badge/Starting%20Capital-%2410%2C000%20USD-gold)]()

---

## 🎮 Game Concept & Overview

**Bullimia** is a high-octane 2D rhythm-trading autoscroller where the game world **is** the actual historical Japanese candlestick chart of real financial markets.

You control the twin spirits of Wall Street:
- **The Bull (Long Position):** Gallops across the **top surface** of candlesticks (riding highs and upward closes).
- **The Bear (Short Position):** Slams upside down onto the **underside** of candlesticks (riding wicks and downward plunges).

---

## 📊 MetaTrader 5 (MT5) Trade Lines & Historical Record

- **MT5 Style Trade Lines**:
  - Connects past positions from $(X_{\text{entry}}, Y_{\text{entry}})$ to $(X_{\text{exit}}, Y_{\text{exit}})$.
  - **Green Dashed Lines** for winning trades with entry arrow `▲ BUY` / `▼ SELL`, exit marker, and centered profit badge (`+$450.00`).
  - **Red Dashed Lines** for losing trades with centered loss badge (`-$180.00`).
  - **Live Position Line**: Dotted line tracking from trade entry directly to the character in real time, pulsing with floating unrealized P&L!
- **Historical Record & Chart Pane (Bottom)**:
  - Open-ended candle progress counter: `Candle: 175` • `Trades: 12 (8W/4L)`.
  - Displays the historical chart of all candles traversed so far, overlaid with green and red MT5 trade lines!

---

## 📈 Volatility-Calibrated Logarithmic Scaling (Curing Flat Curves)

- Unlike naive linear scaling (which flattened NVIDIA and other massive multi-year runners into 3px horizontal slivers), Bullimia uses **Volatility-Calibrated Logarithmic Scaling**:
  $$S_{\text{log}} = \frac{48.0}{\max(0.008, \; \text{avg\_atr\_pct})}, \quad y(P) = Y_{\text{anchor}} - \ln\left(\frac{P}{P_0}\right) \times S_{\text{log}}$$
- Calibrated so that an average daily candle body is **35–55 pixels high** and wicks are **55–95 pixels high**, ensuring thrilling, steep, tactile slopes across all assets (NVDA, TSLA, BTC, GME, SPY, AAPL, AMD, QQQ).

---

## 🎲 Random Epoch Drop & Seamless Asset Switching

- **Pick an Asset, Drop into History**: You choose an asset and are dropped into an unpredictable, random historical epoch from its deep 5-year data feed (e.g. `NVDA • 2022-05-18`).
- **Open-Ended Career**: No arbitrary 30-candle levels! The game continues continuously through time until you reach present day, get Margin Called ($0), or hit Millionaire ($1,000,000).
- **Seamless Asset Switching**: Switching assets automatically closes your active position at the current market price, records the trade, etches the MT5 line, and transfers your accumulated career equity into the new asset!

---

## 🌫️ The Fog of War & Quantitative Forecasting

In the real market, **the future is unknown**. Seeing upcoming candles would remove the core psychological risk/reward challenge of trading!

1. **Fog of War (Hidden Future Candles):**
   - Candlesticks ahead of the player character are completely invisible in the dark void.
   - Candlesticks are revealed in real-time *only* as the character gallops through time.
   - The Minimap timeline also covers the future in cyber-fog to prevent peeking ahead.
2. **Glowing Bid-Ask Spread Corridor:**
   - A radiant neon corridor projects forward from the character slicing through the unknown horizon.
   - The beam's vertical thickness represents the live **Bid-Ask spread**:
     - Upper Rail: Current **Ask** price ($P + \text{spread}/2$) in neon green.
     - Lower Rail: Current **Bid** price ($P - \text{spread}/2$) in neon red.
     - Center Laser: Current Mid price in neon cyan.
3. **Monte Carlo Volatility Surface Fan:**
   - 20+ faint, cycling stochastic trajectories fan out ahead into the future based on the ticker's historical volatility ($\sigma$).
   - Displays a $\pm 1\sigma$ and $\pm 2\sigma$ probability cone, showing the quantitative fan of potential price paths without obstructing gameplay navigation.

Every level is a real historical market event—from the explosive **GameStop 2021 Short Squeeze** to the brutal **2020 COVID Waterfall Crash** or the **NVIDIA AI Supercycle**—or **any custom stock, ETF, or crypto ticker** fetched on demand!

---

## 🕹️ Controls & Core Mechanics

| Input | Action | Effect |
| :--- | :--- | :--- |
| **TAP SPACEBAR** | Quick Flip (1 Lot) | Instantly flips character state (Bull $\leftrightarrow$ Bear) with a standard 1-lot order. |
| **HOLD SPACEBAR** | Charge Order Size (1 $\rightarrow$ 100 Lots) | Character enters **violent vibration**, snorts steam puffs, crackling lightning arcs appear, and an illuminated **LOTS counter** ramps up from 1 to 100 over ~2.2 seconds! |
| **RELEASE SPACEBAR** | Execute Charged Flip | Flips state, executes market order crossing the Bid/Ask spread, realizes P&L, deducts commission, and sets the new position size! |
| **MOUSE / TOUCH** | Click & Hold Screen | Works identically to Spacebar for touch screens or mouse-only play. |

---

## 💰 Trading Simulator Engine & Financial Rules

1. **Initial Score & Currency:**
   - Starts at **$10,000.00 USD**.
2. **Bid / Ask Spread Simulation:**
   - Real market slippage! When going **Long (Bull)**, you buy at the **Ask** ($P + \text{spread}/2$). When exiting Long, you sell at the **Bid** ($P - \text{spread}/2$).
   - When going **Short (Bear)**, you sell at the **Bid** ($P - \text{spread}/2$). When covering Short, you buy at the **Ask** ($P + \text{spread}/2$).
3. **Per-Lot Commissions:**
   - A realistic commission of **$1.00 per lot** is deducted on every order entry and exit. Overtrading will rapidly erode capital!
4. **P&L Realization:**
   - **Bull (Long):** Profit = $(\text{Exit Bid} - \text{Entry Ask}) \times \text{Lots} \times \text{Multiplier} - \text{Commission}$.
   - **Bear (Short):** Profit = $(\text{Entry Bid} - \text{Exit Ask}) \times \text{Lots} \times \text{Multiplier} - \text{Commission}$.
5. **Mark-to-Market Floating Equity:**
   - Live tick-by-tick equity is calculated as character scrolls across the intraday trajectory of each candle.
   $$\text{Total Equity} = \text{Cash} + \text{Unrealized P&L}$$
6. **Win & Loss Conditions:**
   - 🚨 **Margin Call:** If total equity drops to **$\le \$0$**, risk control liquidates your account. Game Over!
   - 🏆 **Millionaire:** Grow your initial $10,000 into **$\ge \$1,000,000 USD$** to beat the market and conquer Wall Street!

---

## 🌟 Curated Historical Levels & Live Ticker Search

Pre-packaged offline historical market datasets:
1. `GME_2021` - **GameStop: The Mother of All Short Squeezes** (Jan 2021)
2. `NVDA_2024` - **NVIDIA: The AI Gold Rush** (2023–2024 Supercycle)
3. `SPY_COVID` - **S&P 500: COVID Flash Crash & V-Recovery** (Feb–Aug 2020)
4. `BTC_2021` - **Bitcoin: The $64K Moonshot & Crash** (2020–2021)
5. `TSLA_2020` - **Tesla: The 5-for-1 Split Mania** (2020)
6. `CRASH_2008` - **2008 Great Financial Crisis** (Lehman Brothers collapse)
7. 🔍 **On-Demand Custom Ticker Search:** Type any stock ticker symbol (e.g. `AAPL`, `MSFT`, `AMD`, `PLTR`, `COIN`), pick a timeframe, and the built-in server downloads real data via `yfinance` in seconds!

---

## 🚀 How to Run the Game

### Option 1: Web Version (Flagship Arcade Experience)
Double-click `run_game.bat` or run:
```bash
python run_game.py
```
This boots the local HTTP & Yahoo Finance API server and automatically opens `http://localhost:8000/` in your default browser.

### Option 2: Standalone Pygame Version
Run the native desktop Pygame version directly:
```bash
python run_pygame.py
```
Controls in Pygame:
- `SPACE` (Tap / Hold & Release): Flip Bull / Bear & charge lots
- `R`: Restart current level
- `1` - `4`: Quick-switch between GME, NVDA, SPY, BTC levels
- `ESC`: Exit

---

## 🎨 Indie Art & Procedural Audio Design

- **Graphics:** Neon cyberpunk financial terminal palette, glowing Japanese candlesticks with translucent bodies, 3D wicks, subterranean volume histograms, parallax Wall Street skyline.
- **Characters:**
  - Procedural muscular Wall Street Bull with golden horns, glowing emerald eyes, and red necktie flapping in the wind.
  - Inverted Grizzly Bear with cyber-shades and neon-tipped razor claws.
  - Electric lightning arcs and steam puffs during Spacebar charging.
- **Procedural Web Audio API:**
  - 100% synthesis with zero external audio assets!
  - Harmonious ascending Bull flip chime.
  - Crushing sub-bass Bear flip whoosh.
  - Modulated oscillator pitch-shifting up with lot size during vibration.
  - Crisp cash register "cha-ching" metallic bell on profitable trades.
  - Alternating emergency siren on Margin Calls.
  - Triumphant brass fanfare on Millionaire victory.
  - Dynamic 80s arcade synthwave BGM with kick, snare, hi-hats, and synth bassline!

---

## 📁 Project Structure

```
D:\Caynex\minigames\
├── index.html               # Main Web Game shell & HUD
├── css/
│   └── style.css            # Cyber-finance neon styling & animations
├── js/
│   ├── main.js              # Application bootstrap & lifecycle
│   ├── engine/
│   │   ├── game.js          # 60fps main loop, physics, render pipeline
│   │   ├── camera.js        # Dynamic forward-lead camera & screen shake
│   │   ├── input.js         # Spacebar hold timing & lot calculation
│   │   ├── audio.js         # Web Audio procedural sound synthesizer & BGM
│   │   └── particles.js     # Sparks, coins, dollars, lightning, fireworks
│   ├── entities/
│   │   ├── character.js     # Bull & Bear procedural vector rendering & vibration
│   │   └── candlesticks.js  # Japanese candlesticks geometry & trade entry lines
│   ├── trading/
│   │   ├── simulation.js    # Position management, Bid/Ask spread, lots, P&L
│   │   └── data_manager.js  # Level catalog loader & yfinance API bridge
│   └── ui/
│       ├── hud.js           # Live financial metrics, Bid/Ask quotes, badges
│       ├── minimap.js       # Historical overview chart & progress cursor
│       └── menus.js         # Level selector, custom ticker loader, win/loss modals
├── data/
│   ├── levels_catalog.json  # Catalog of pre-packaged historical market levels
│   ├── level_GME_2021.json  # GameStop short squeeze dataset
│   ├── level_NVDA_2024.json # NVIDIA AI supercycle dataset
│   ├── level_SPY_COVID.json # S&P 500 COVID crash dataset
│   ├── level_BTC_2021.json  # Bitcoin moonshot & crash dataset
│   ├── level_TSLA_2020.json # Tesla split rally dataset
│   └── level_CRASH_2008.json# 2008 Lehman financial crisis dataset
├── server.py                # Python backend (yfinance fetcher + static HTTP server)
├── data_downloader.py       # Standalone historical data fetcher & cache generator
├── run_game.py              # Desktop launcher (boots server + opens browser)
├── run_game.bat             # One-click Windows shortcut
├── run_pygame.py            # Standalone native desktop Pygame version
└── README.md                # Comprehensive documentation
```
