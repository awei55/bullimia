# 🎮 BULLIMIA GAME DESIGN MEMORY & PROGRESSION RULES

> **Purpose**: Deep design memory for all game mechanics, narrative progression triggers, economic calibration, and upcoming features.  
> **Location**: `docs/GAME_DESIGN_MEMORY.md`

---

## 1. Core Progression Philosophy & The 4 Phases

Bullimia is not a typical clicker or static chart tool. It is an **interactive financial simulator disguised as an addictive arcade rhythm game**, systematically introducing real quant concepts as capital scales from $1,000 to $100,000,000+:

```
$1,000                $10,000             $1,000,000            $10,000,000           $100,000,000+
  |                      |                    |                     |                     |
  +--- GENESIS START ----+--- ASSET UNLOCK ---+--- PROP DESK -------+--- BOT STUDIO ------+--- SOVEREIGN EMPIRE
  (Pure Binary Options)  (Multi-Asset Ticker) (Time Dilation, Baskets)(Node-Graph Algobots) (Live Delayed Feeds, OTC)
```

### Phase 1: Retail Chart Surfer ($1,000 $\rightarrow$ $1,000,000)
- **Controls**: Binary options rhythm. Pressing `UP` buys BULL, `DOWN` sells BEAR.
- **Order Sizing**: Holding `SPACE` charges order lots from 1 up to 100 lots with kinetic screen shake and sound pitch modulation.
- **Terrain**: Autoscrolling candlestick geometry rendered in WebGL at 60+ FPS.
- **Fog of War**: Future candles are shrouded. A glowing corridor illuminates the current Bid/Ask spread, with Monte Carlo volatility fans projected into the fog.
- **MT5 Historical Trade Lines**: Completed trades draw connecting lines across entry/exit points (green for wins, red for losses).

### Phase 2: Independent Prop Desk ($1,000,000 $\rightarrow$ $10,000,000)
- **Unlocks**:
  - `SPACE + ESC` Neutral Cash Flattening: Exits position without reversing into the opposite side.
  - Time Dilation controls: 0.5x (slow-motion analysis), 1x, 2x, 5x fast forward.
  - Multi-window split docking: Trade 2 to 4 assets concurrently.
  - Synthetic Basket Pairing: Synthesize custom pairs (e.g., Long NVDA / Short AMD) rendered as unified spread charts.
  - Cognitive Distraction Minigames: Pitchbook audits and compliance checks that award cash multipliers to distract from market stress.

### Phase 3: Quantitative Fund & Bots ($10,000,000 $\rightarrow$ $100,000,000)
- **Unlocks**:
  - Visual Node-Graph Bot Studio: Drag-and-drop indicators (RSI, Bollinger, MACD, Volume Delta) into automated execution bots.
  - Leveraged Flow & Prime Brokerage: Access to liquidity venues, lower spreads, and custom execution routing.
  - Debt Restructuring: Margin call is no longer instant death; creditors offer debt pools with daily interest payments.

### Phase 4: Sovereign Portfolio Manager ($100,000,000+)
- **Unlocks**:
  - 15-minute delayed live market feeds for idle algorithmic trading.
  - Sovereign lines of credit (margin calls permanently disabled; replaced by credit ratings and debt restructuring).
  - Private Equity and OTC Desks for dark pool block orders.

---

## 2. The Genesis Tutorial Sequence ($1,000 Start)

The game start experience must follow this strict script:

1. **Cold Start**:
   - The player starts with exactly **$1,000.00 USD**.
   - Asset is fixed to **NVDA**.
   - Bottom asset selector bar is locked and invisible.
   - High-level tabs (Trade Desk, Bot Studio, Portfolio) are hidden.
   - The start menu button is a clean, bold **"START"**.

2. **The Mysterious Benefactor (Uncle Gordon)**:
   - Uncle Gordon monitors your trading and sends an encrypted pager transmission when **any one of three triggers** fires:
     - **Survival Trigger (120 seconds)**: The player survives 2 minutes of continuous trading without blowing up.
     - **Profit Trigger ($5,000 equity)**: The player turns $1,000 into $5,000 through skill.
     - **Bailout Trigger ($100 equity)**: The player takes heavy losses and is down to their last $100.
   - **The Action**:
     - Simulation pauses.
     - A cyber-pager modal displays custom dialogue tailored to the specific trigger reason.
     - Uncle Gordon wires **+$9,000.00 USD** directly into the player's cash balance (bringing capital to ~$10,000+).
     - Uncle Gordon unlocks the **Multi-Asset Selector Bar**, recommending AAPL or EUR/USD.

3. **Macro Volatility Alerts ($100,000 Milestone)**:
   - When account equity crosses **$100,000**, the Macro News Feed unlocks.
   - A flashing yellow neon banner appears across the top of the chart 3 candles ahead of any $\ge 2.5\times$ ATR volatility shock concealed in the Fog of War.

---

## 3. Financial Mechanics & Exact Invariants

### 3.1 Solvency Invariants
$$\text{Equity} = \text{Cash Balance} + \text{Unrealized PnL}$$
$$\text{Margin Used} = \text{Lots} \times \text{Entry Price} \times \text{Contract Multiplier} \times \text{Margin Rate}$$
$$\text{Free Margin} = \text{Equity} - \text{Margin Used}$$
$$\text{Margin Level \%} = \frac{\text{Equity}}{\text{Margin Used}} \times 100\%$$

- **Default Parameters**:
  - `marginRate = 0.02` (50:1 leverage).
  - `contractMultiplier = 10.0` ($10 per point).
  - `commissionPerLot = $1.00`.
  - `maintenanceMarginRate = 0.50` (Liquidation triggered when $\text{Equity} \le 50\% \text{ of Margin Used}$ or $\text{Equity} \le 0$).

### 3.2 Bid/Ask Crossing Math
- Long (BULL) opens at **Ask**, marked to market at current **Bid**.
- Short (BEAR) opens at **Bid**, marked to market at current **Ask**.
- Reversals immediately close the open position, deduct closing commission, settle realized PnL to cash, and open the new position.

---

## 4. Indie Visual Style, Kinematics & Presentation Standards

### 4.1 Character Kinematics & Run Cycles
- **Camera Horizon Centering**: The character is centered horizontally on screen (`targetCamX = playerX - screenW * 0.5`), keeping equal focus on the historical candlestick trail and the forward Fog of War corridor.
- **The Bull (Long)**:
  - 4-leg biomechanical galloping run cycle (`legAngle1` through `legAngle4` offset by $\pi/2$ phase shifts).
  - Head bobbing with vertical breathing oscillation (`headBob = Math.sin(t * 8) * 3`).
  - Solid metallic curved horns with specular golden highlights (`0xffd700`).
  - Glowing emerald cyber-optic (`0x00ff88`).
  - Flapping Wall Street red power tie (`0xff2244`) undulating with multi-point sine wave vertices.
  - Articulated swishing tail with tufted tip.
  - High-voltage lightning discharge arcs sparking around the horns when charging lot sizes.
- **The Bear (Short)**:
  - Inverted underside gallop (`scale.y = -1`), racing along the bottom corridor of the tape.
  - Heavy grizzly shaggy coat contour with jagged fur silhouetting.
  - Glowing crimson cyber-visor/shades (`0xff0055`) with high-contrast reflection.
  - Curved razor claws with glowing trail effects.

### 4.2 Dynamic Stochastic Brownian Volatility Fan
- **20-Path Stochastic Fan**: 20 distinct Geometric Brownian Motion paths fan out into the Fog of War, updating continuously every 1.2s.
- **Statistical Probability Cones**: Outer cones filled at $\pm 1\sigma$ and $\pm 2\sigma$ with alpha-faded fills.
- **Glowing Terminal Beads**: Micro-orbs at the terminal tip of each path reflecting future projected price variance.

### 4.3 MT5 Trade Overlays & Floating Position HUD
- **Trade Connection Vectors**: Dashed lines connecting every historical entry to its corresponding exit point (neon emerald for net positive realized PnL, neon crimson for net loss).
- **Entry & Exit Markers**: Solid triangles (`▲ BUY` / `▼ SELL`) at entry candle coordinates; circular targets at closing exit candle coordinates.
- **Midpoint Realized PnL Pills**: High-contrast pill badge at the geometric midpoint displaying settled dollar PnL (`+$1,250.00`).
- **Live Position Floating PnL**: Floating badge positioned beside the character (`playerX + 28, playerY - 24`), updating live ticks with an entry-tracking dotted laser beam connecting back to the initial entry price.

### 4.4 Cel-Shaded Cyberpunk UI & Pixel Typography
- **Typography Matrix**:
  - Headings & Titles: `'Press Start 2P'` (retro 8-bit arcade headers).
  - Data Values & HUD: `'Chakra Petch'` & `'Silkscreen'` (tactile cyber-terminal telemetry).
  - Financial Tables: High-legibility monospaced tables with crisp tabular alignment.
- **Cel-Shaded Geometry**:
  - `cyber-clip`: 45-degree chamfered corners on cards and panels (`polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))`).
  - Solid 2px-3px dark borders with sharp `4px 4px 0 #000` tactile dropshadows (no blurry Gaussian glows).
  - Inset bevel highlights simulating physical backlit arcade buttons and arcade cabinet CRT bezels.
