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
