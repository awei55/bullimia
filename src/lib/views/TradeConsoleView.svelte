<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { account, quotes, currentLevel, executeOrder, timeDilation } from '../stores/trading';
  import {
    terminalShopState,
    selectedVenue,
    buyColocation,
    buyLicense,
    getActiveTradeContext,
  } from '../stores/terminal_shop';
  import {
    minigameState,
    openMinigame,
  } from '../stores/minigame';
  import {
    syntheticBasket,
    marketDepth,
    setBasketPair,
    updateSyntheticTick,
    executeBasketTrade,
    generateDynamicMarketDepth,
    type BasketPosition,
  } from '../stores/synthetic_basket';
  import {
    COLOCATION_TIERS,
    VENUE_SPECS,
    ASSET_LICENSES,
  } from '../engine/modifier_pipeline';
  import {
    Shield,
    Zap,
    TrendingUp,
    Layers,
    Cpu,
    ArrowUpDown,
    ShoppingBag,
    Award,
    Briefcase,
    Activity,
    CheckCircle2,
    Clock,
    FastForward,
    GitCompare,
    BarChart3,
  } from 'lucide-svelte';

  export let onFlatten: () => void = () => {};
  export let onSwitchAsset: (ticker: string) => void = () => {};

  let activeTab: 'DOCKET' | 'BASKET' | 'SHOP' = 'DOCKET';
  let orderLots = 10;
  let basketLots = 10;
  let selectedHedge = 'AMD';
  let hedgeRatio = 1.0;

  $: activeContext = getActiveTradeContext();
  $: currentColocSpec = COLOCATION_TIERS[$terminalShopState.currentColocation];

  // Update dynamic market depth and synthetic basket ticks on quote changes
  $: if ($quotes.price) {
    generateDynamicMarketDepth($quotes.price, $quotes.spread, $currentLevel?.avg_atr_pct ?? 0.02);
    updateSyntheticTick($quotes.price);
  }

  // Sync primary asset when current level changes
  $: if ($currentLevel && $syntheticBasket.primaryTicker !== $currentLevel.ticker) {
    setBasketPair($currentLevel.ticker, selectedHedge, hedgeRatio);
  }

  function handleQuickBuy() {
    if (!$currentLevel) return;
    executeOrder(
      $currentLevel.ticker,
      'BULL',
      orderLots,
      $quotes.price,
      new Date().toISOString(),
      $currentLevel.avg_atr_pct
    );
  }

  function handleQuickSell() {
    if (!$currentLevel) return;
    executeOrder(
      $currentLevel.ticker,
      'BEAR',
      orderLots,
      $quotes.price,
      new Date().toISOString(),
      $currentLevel.avg_atr_pct
    );
  }

  function handleHedgeSelect(ticker: string) {
    selectedHedge = ticker;
    if ($currentLevel) {
      setBasketPair($currentLevel.ticker, ticker, hedgeRatio);
    }
  }

  function setSpeed(speed: number) {
    timeDilation.set(speed);
  }
</script>

<div class="h-full w-full flex flex-col bg-terminal-panel border-l-2 border-terminal-border p-3 font-mono select-none overflow-y-auto">
  <!-- Desk Header -->
  <div class="flex items-center justify-between pb-2.5 border-b-2 border-terminal-border mb-2.5">
    <div>
      <span class="text-[9px] text-bull font-pixel tracking-widest uppercase flex items-center">
        <Cpu class="w-3.5 h-3.5 mr-1" /> PHASE 2 // INDEPENDENT PROP DESK
      </span>
      <h2 class="text-sm font-bold text-terminal-textBright font-chakra">INSTITUTIONAL TRADE CONSOLE</h2>
    </div>

    <!-- Active Latency Badge -->
    <span class="px-2.5 py-0.5 text-[9px] bg-neon-cyan/20 text-neon-cyan border-2 border-neon-cyan font-pixel shadow-[2px_2px_0px_#000]">
      {currentColocSpec.latencyMs}ms ({currentColocSpec.name})
    </span>
  </div>

  <!-- IB Distraction Opportunity Banner (when available) -->
  {#if $minigameState.isAvailable && $minigameState.activeGame}
    <div class="mb-2.5 p-2.5 bg-neon-amber/25 border-2 border-neon-amber text-neon-amber flex items-center justify-between animate-pulse cel-card cyber-clip-sm shadow-[3px_3px_0px_#000]">
      <div class="flex items-center space-x-2 text-xs font-bold font-chakra">
        <Briefcase class="w-4 h-4 text-neon-amber" />
        <span>IB DEAL: {$minigameState.activeGame.title} (+${$minigameState.activeGame.payout.toLocaleString()})</span>
      </div>
      <button
        on:click={openMinigame}
        class="px-2.5 py-1 bg-neon-amber text-black text-xs font-pixel font-bold hover:brightness-110 shadow-[2px_2px_0px_#000] cursor-pointer cel-btn"
      >
        EXECUTE DEAL
      </button>
    </div>
  {/if}

  <!-- View Mode Tabs (Docket vs Synthetic Basket vs Terminal Shop) -->
  <div class="grid grid-cols-3 gap-1.5 mb-2.5 text-xs">
    <button
      on:click={() => (activeTab = 'DOCKET')}
      class="py-1.5 border-2 text-center transition font-bold font-pixel text-[10px] flex items-center justify-center space-x-1 cel-btn cyber-clip-sm {activeTab === 'DOCKET' ? 'bg-terminal-surface border-bull text-bull shadow-[2px_2px_0px_#000]' : 'bg-terminal-bg border-terminal-border text-terminal-muted hover:text-terminal-text'}"
    >
      <Activity class="w-3 h-3" />
      <span>DOCKET</span>
    </button>

    <button
      on:click={() => (activeTab = 'BASKET')}
      class="py-1.5 border-2 text-center transition font-bold font-pixel text-[10px] flex items-center justify-center space-x-1 cel-btn cyber-clip-sm {activeTab === 'BASKET' ? 'bg-terminal-surface border-neon-amber text-neon-amber shadow-[2px_2px_0px_#000]' : 'bg-terminal-bg border-terminal-border text-terminal-muted hover:text-terminal-text'}"
    >
      <GitCompare class="w-3 h-3" />
      <span>BASKET</span>
    </button>

    <button
      on:click={() => (activeTab = 'SHOP')}
      class="py-1.5 border-2 text-center transition font-bold font-pixel text-[10px] flex items-center justify-center space-x-1 cel-btn cyber-clip-sm {activeTab === 'SHOP' ? 'bg-terminal-surface border-neon-cyan text-neon-cyan shadow-[2px_2px_0px_#000]' : 'bg-terminal-bg border-terminal-border text-terminal-muted hover:text-terminal-text'}"
    >
      <ShoppingBag class="w-3 h-3" />
      <span>SHOP</span>
    </button>
  </div>

  {#if activeTab === 'DOCKET'}
    <!-- 1. Venue Routing Selector -->
    <div class="mb-2.5">
      <span class="text-[9px] uppercase text-terminal-muted block mb-1 font-pixel font-bold">EXECUTION VENUE ROUTING</span>
      <div class="grid grid-cols-3 gap-1.5 text-xs">
        {#each Object.values(VENUE_SPECS) as v}
          <button
            on:click={() => ($selectedVenue = v.id)}
            class="py-1 px-1 border-2 text-center transition cel-card cyber-clip-sm {$selectedVenue === v.id ? 'bg-bull/20 border-bull text-bull font-bold shadow-[2px_2px_0px_#000]' : 'bg-terminal-surface border-terminal-border text-terminal-muted'}"
          >
            <div class="font-bold text-[10px] font-chakra truncate">{v.name.split(' ')[0]}</div>
            <div class="text-[8px] opacity-75 font-mono">${v.commissionPerLot.toFixed(2)}/L • {v.spreadMultiplier}x</div>
          </button>
        {/each}
      </div>
    </div>

    <!-- 2. Order Ticket Controls -->
    <div class="bg-terminal-surface border-2 border-terminal-border cel-card cyber-clip-sm p-2.5 mb-2.5">
      <span class="text-[9px] uppercase text-terminal-muted block mb-1.5 font-pixel font-bold">TACTICAL ORDER TICKET</span>
      
      <div class="flex items-center justify-between mb-2 font-chakra">
        <span class="text-xs text-terminal-text font-bold">ORDER SIZE:</span>
        <div class="flex items-center space-x-1 font-mono">
          {#each [1, 5, 10, 25, 50, 100] as l}
            <button
              on:click={() => (orderLots = l)}
              class="px-1.5 py-0.5 text-[10px] border-2 font-bold cel-btn {orderLots === l ? 'bg-neon-cyan/25 border-neon-cyan text-neon-cyan shadow-[2px_2px_0px_#000]' : 'bg-terminal-panel border-terminal-border text-terminal-muted'}"
            >
              {l}L
            </button>
          {/each}
        </div>
      </div>

      <!-- Quick Buy / Sell Buttons -->
      <div class="grid grid-cols-2 gap-2 mb-2 font-pixel text-xs">
        <button
          on:click={handleQuickBuy}
          class="py-2 bg-bull/25 hover:bg-bull/40 border-2 border-bull text-bull font-bold transition flex items-center justify-center space-x-1 cel-btn cyber-clip-sm shadow-[2px_2px_0px_#000]"
        >
          <span>BUY / LONG ({orderLots}L)</span>
        </button>

        <button
          on:click={handleQuickSell}
          class="py-2 bg-bear/25 hover:bg-bear/40 border-2 border-bear text-bear font-bold transition flex items-center justify-center space-x-1 cel-btn cyber-clip-sm shadow-[2px_2px_0px_#000]"
        >
          <span>SELL / SHORT ({orderLots}L)</span>
        </button>
      </div>

      <!-- Neutral Flatten Button -->
      <button
        type="button"
        on:click={(e) => {
          onFlatten();
          e.currentTarget.blur();
        }}
        class="w-full py-1.5 bg-terminal-panel hover:bg-terminal-border border-2 border-neon-cyan/60 text-neon-cyan text-xs font-bold font-chakra transition flex items-center justify-center space-x-2 cel-btn cyber-clip-sm shadow-[2px_2px_0px_#000] cursor-pointer"
        title="Neutral Cash Flattening: Exits position without reversing (ESC)"
      >
        <Shield class="w-3.5 h-3.5" />
        <span>FLATTEN TO 100% CASH (ESC)</span>
      </button>
    </div>

    <!-- 3. Time Dilation Controls -->
    <div class="bg-terminal-surface border-2 border-terminal-border cel-card cyber-clip-sm p-2 mb-2.5">
      <span class="text-[9px] uppercase text-terminal-muted block mb-1 font-pixel font-bold">SIMULATION SPEED DILATION</span>
      <div class="grid grid-cols-4 gap-1 text-xs font-chakra font-bold">
        {#each [0.5, 1.0, 2.0, 5.0] as spd}
          <button
            on:click={() => setSpeed(spd)}
            class="py-1 border-2 text-center cel-btn {$timeDilation === spd ? 'bg-neon-amber/25 border-neon-amber text-neon-amber shadow-[2px_2px_0px_#000]' : 'bg-terminal-panel border-terminal-border text-terminal-muted'}"
          >
            {spd}x
          </button>
        {/each}
      </div>
    </div>

    <!-- 4. Dynamic Level 2 Liquidity Depth Ladder -->
    <div class="bg-terminal-surface border-2 border-terminal-border cel-card cyber-clip-sm p-2.5 flex-1 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[9px] uppercase text-terminal-muted font-pixel font-bold flex items-center">
            <BarChart3 class="w-3 h-3 mr-1 text-neon-cyan" /> DYNAMIC LEVEL 2 DEPTH
          </span>
          <span class="text-[9px] font-mono {$marketDepth.imbalanceRatio > 1.05 ? 'text-bull' : $marketDepth.imbalanceRatio < 0.95 ? 'text-bear' : 'text-terminal-muted'}">
            IMBALANCE: {$marketDepth.imbalanceRatio.toFixed(2)}x
          </span>
        </div>

        <div class="space-y-0.5 text-[10px] font-mono">
          <!-- Asks (descending from level 5 down to 1) -->
          {#each [...$marketDepth.asks].reverse() as ask}
            <div class="relative flex justify-between items-center px-1.5 py-0.5 border-l-2 border-bear/60 bg-bear/5 overflow-hidden">
              <div class="absolute right-0 top-0 bottom-0 bg-bear/15 transition-all" style="width: {ask.depthPct}%"></div>
              <span class="relative z-10 text-bear font-bold">{ask.price.toFixed(2)}</span>
              <span class="relative z-10 text-terminal-muted text-[9px]">{ask.lots} L</span>
            </div>
          {/each}

          <!-- Spread Divider -->
          <div class="py-0.5 px-2 bg-terminal-bg text-center text-[9px] text-neon-cyan my-1 border-2 border-terminal-border font-pixel">
            SPREAD: {$quotes.spread.toFixed(2)} • VENUE: {$selectedVenue.toUpperCase()}
          </div>

          <!-- Bids (level 1 down to 5) -->
          {#each $marketDepth.bids as bid}
            <div class="relative flex justify-between items-center px-1.5 py-0.5 border-l-2 border-bull/60 bg-bull/5 overflow-hidden">
              <div class="absolute right-0 top-0 bottom-0 bg-bull/15 transition-all" style="width: {bid.depthPct}%"></div>
              <span class="relative z-10 text-bull font-bold">{bid.price.toFixed(2)}</span>
              <span class="relative z-10 text-terminal-muted text-[9px]">{bid.lots} L</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Infrastructure Status -->
      <div class="pt-2 border-t-2 border-terminal-border mt-2 text-[9px] text-terminal-muted flex justify-between font-chakra">
        <span>COLOCATION: {currentColocSpec.name}</span>
        <span class="text-bull font-bold font-pixel text-[8px]">0 JITTER // {currentColocSpec.latencyMs}ms</span>
      </div>
    </div>

  {:else if activeTab === 'BASKET'}
    <!-- Tab 2: Synthetic Basket Pairing & Statistical Arbitrage -->
    <div class="space-y-2.5">
      <!-- Pair Selector & Configuration -->
      <div class="bg-terminal-surface border-2 border-terminal-border cel-card cyber-clip-sm p-3">
        <span class="text-[9px] uppercase text-neon-amber block mb-2 font-pixel font-bold flex items-center">
          <GitCompare class="w-3.5 h-3.5 mr-1" /> SYNTHETIC BASKET PAIRING DESK
        </span>

        <div class="grid grid-cols-2 gap-2 text-xs mb-3 font-chakra">
          <div>
            <span class="text-[9px] text-terminal-muted block font-pixel">PRIMARY LEG (LONG):</span>
            <div class="p-1.5 bg-terminal-panel border-2 border-bull text-bull font-bold font-mono">
              {$syntheticBasket.primaryTicker} (${$syntheticBasket.primaryPrice.toFixed(2)})
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-[9px] text-terminal-muted font-pixel">HEDGE LEG (SHORT):</span>
              <button
                type="button"
                on:click={() => onSwitchAsset(selectedHedge)}
                class="text-[8px] text-neon-cyan hover:underline font-mono"
                title="Switch active chart to {selectedHedge}"
              >
                [LOAD {selectedHedge}]
              </button>
            </div>
            <div class="flex items-center space-x-1 mt-0.5">
              {#each ['AMD', 'TSLA', 'SPY', 'QQQ'] as hed}
                <button
                  on:click={() => handleHedgeSelect(hed)}
                  class="flex-1 py-1 text-[10px] border-2 font-bold cel-btn font-mono {selectedHedge === hed ? 'bg-neon-amber/25 border-neon-amber text-neon-amber shadow-[2px_2px_0px_#000]' : 'bg-terminal-panel border-terminal-border text-terminal-muted'}"
                >
                  {hed}
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Spread Telemetry & Z-Score Gauge -->
        <div class="bg-terminal-panel border-2 border-terminal-border p-2.5 mb-3 font-mono">
          <div class="flex justify-between items-center text-xs mb-1">
            <span class="text-terminal-muted">SPREAD DELTA:</span>
            <span class="font-bold text-terminal-textBright text-sm">
              {$syntheticBasket.currentSpread >= 0 ? '+' : ''}{$syntheticBasket.currentSpread.toFixed(2)}
            </span>
          </div>

          <div class="flex justify-between items-center text-[10px] text-terminal-muted mb-2">
            <span>MEAN: {$syntheticBasket.spreadMean.toFixed(2)}</span>
            <span>STD DEV: ±{$syntheticBasket.spreadStdDev.toFixed(2)}</span>
            <span class="font-bold font-pixel text-[9px] {Math.abs($syntheticBasket.zScore) >= 1.5 ? 'text-neon-amber animate-pulse' : 'text-neon-cyan'}">
              Z: {$syntheticBasket.zScore.toFixed(2)}σ
            </span>
          </div>

          <!-- Visual Z-Score Corridor -->
          <div class="w-full bg-terminal-bg h-3 border border-terminal-border relative flex items-center">
            <!-- Center Equilibrium line -->
            <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-terminal-muted/40"></div>
            <!-- Z score marker -->
            <div
              class="absolute h-full w-2 border border-black shadow-[1px_1px_0px_#000] {Math.abs($syntheticBasket.zScore) >= 1.5 ? 'bg-neon-amber' : 'bg-neon-cyan'}"
              style="left: {Math.max(5, Math.min(95, 50 + $syntheticBasket.zScore * 18))}%"
            ></div>
          </div>
          <div class="flex justify-between text-[8px] text-terminal-muted mt-1 font-pixel">
            <span>-2.0σ SPREAD CHEAP</span>
            <span>MEAN (0.0σ)</span>
            <span>+2.0σ SPREAD RICH</span>
          </div>
        </div>

        <!-- Active Basket Position Status -->
        {#if $syntheticBasket.activePosition}
          <div class="p-2.5 bg-bull/10 border-2 border-bull text-xs cel-card cyber-clip-sm mb-3 font-chakra">
            <div class="flex justify-between font-bold text-terminal-text mb-1">
              <span>POSITION: {$syntheticBasket.activePosition.side} ({$syntheticBasket.activePosition.lots}L)</span>
              <span class="{$syntheticBasket.unrealizedPnl >= 0 ? 'text-bull' : 'text-bear'} font-mono font-bold">
                {$syntheticBasket.unrealizedPnl >= 0 ? '+' : ''}${$syntheticBasket.unrealizedPnl.toFixed(2)}
              </span>
            </div>
            <div class="text-[10px] text-terminal-muted font-mono flex justify-between">
              <span>ENTRY SPREAD: {$syntheticBasket.activePosition.entrySpread.toFixed(2)}</span>
              <span>LIVE SPREAD: {$syntheticBasket.currentSpread.toFixed(2)}</span>
            </div>
          </div>
        {/if}

        <!-- Basket Order Lots & Actions -->
        <div class="flex items-center justify-between mb-2 font-chakra">
          <span class="text-xs text-terminal-text font-bold">BASKET SIZING:</span>
          <div class="flex items-center space-x-1 font-mono">
            {#each [5, 10, 25, 50] as l}
              <button
                on:click={() => (basketLots = l)}
                class="px-2 py-0.5 text-[10px] border-2 font-bold cel-btn {basketLots === l ? 'bg-neon-amber/25 border-neon-amber text-neon-amber shadow-[2px_2px_0px_#000]' : 'bg-terminal-panel border-terminal-border text-terminal-muted'}"
              >
                {l}L
              </button>
            {/each}
          </div>
        </div>

        <!-- Spread Execution Buttons -->
        <div class="grid grid-cols-2 gap-2 mb-2 font-pixel text-xs">
          <button
            on:click={() => executeBasketTrade('LONG_SPREAD', basketLots)}
            class="py-2.5 bg-bull/25 hover:bg-bull/40 border-2 border-bull text-bull font-bold transition flex items-center justify-center space-x-1 cel-btn cyber-clip-sm shadow-[2px_2px_0px_#000]"
          >
            <span>LONG SPREAD (+A / -B)</span>
          </button>

          <button
            on:click={() => executeBasketTrade('SHORT_SPREAD', basketLots)}
            class="py-2.5 bg-bear/25 hover:bg-bear/40 border-2 border-bear text-bear font-bold transition flex items-center justify-center space-x-1 cel-btn cyber-clip-sm shadow-[2px_2px_0px_#000]"
          >
            <span>SHORT SPREAD (-A / +B)</span>
          </button>
        </div>

        {#if $syntheticBasket.activePosition}
          <button
            on:click={() => executeBasketTrade('FLATTEN')}
            class="w-full py-2 bg-terminal-panel hover:bg-terminal-border border-2 border-neon-amber text-neon-amber text-xs font-bold font-chakra transition flex items-center justify-center space-x-2 cel-btn cyber-clip-sm shadow-[2px_2px_0px_#000]"
          >
            <Shield class="w-3.5 h-3.5" />
            <span>FLATTEN SYNTHETIC SPREAD POSITION</span>
          </button>
        {/if}
      </div>

      <!-- Basket Analytics -->
      <div class="p-2.5 bg-terminal-surface border-2 border-terminal-border text-[10px] font-chakra text-terminal-muted flex justify-between">
        <span>BASKET TRADES: <strong class="text-terminal-text font-mono">{$syntheticBasket.basketTradeCount}</strong></span>
        <span>REALIZED SPREAD P&L: <strong class="{$syntheticBasket.realizedPnl >= 0 ? 'text-bull' : 'text-bear'} font-mono">${$syntheticBasket.realizedPnl.toFixed(2)}</strong></span>
      </div>
    </div>

  {:else}
    <!-- Tab 3: Terminal Infrastructure Shop -->
    <div class="space-y-3">
      <!-- Colocation Upgrades -->
      <div class="bg-terminal-surface border-2 border-terminal-border cel-card cyber-clip-sm p-3">
        <span class="text-[9px] uppercase text-neon-cyan block mb-2 font-pixel font-bold">
          EXCHANGE COLOCATION UPGRADES
        </span>
        <div class="space-y-2">
          {#each Object.values(COLOCATION_TIERS) as c}
            <div class="p-2 bg-terminal-panel border-2 border-terminal-border flex items-center justify-between text-xs">
              <div>
                <div class="font-bold text-terminal-text font-chakra">{c.name}</div>
                <div class="text-[9px] text-terminal-muted">{c.description}</div>
                <div class="text-[9px] text-neon-cyan font-mono">LATENCY: {c.latencyMs}ms • SPREAD: {c.spreadMultiplier}x</div>
              </div>

              {#if $terminalShopState.currentColocation === c.id}
                <span class="px-2 py-0.5 text-[8px] font-pixel font-bold bg-bull/20 text-bull border-2 border-bull shadow-[2px_2px_0px_#000]">
                  EQUIPPED
                </span>
              {:else}
                <button
                  on:click={() => buyColocation(c.id)}
                  class="px-2 py-0.5 text-[8px] font-pixel font-bold bg-terminal-surface hover:bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan transition cel-btn shadow-[2px_2px_0px_#000]"
                >
                  UPGRADE (${c.cost.toLocaleString()})
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Asset Class Licenses -->
      <div class="bg-terminal-surface border-2 border-terminal-border cel-card cyber-clip-sm p-3">
        <span class="text-[9px] uppercase text-neon-amber block mb-2 font-pixel font-bold">
          ASSET CLASS LICENSES
        </span>
        <div class="space-y-2">
          {#each Object.values(ASSET_LICENSES) as lic}
            <div class="p-2 bg-terminal-panel border-2 border-terminal-border flex items-center justify-between text-xs">
              <div>
                <div class="font-bold text-terminal-text font-chakra">{lic.name}</div>
                <div class="text-[9px] text-terminal-muted">{lic.description}</div>
                <div class="text-[9px] text-neon-amber font-mono">ASSETS: {lic.assets.join(', ')}</div>
              </div>

              {#if $terminalShopState.ownedLicenses.includes(lic.id)}
                <span class="px-2 py-0.5 text-[8px] font-pixel font-bold bg-bull/20 text-bull border-2 border-bull shadow-[2px_2px_0px_#000]">
                  ACQUIRED
                </span>
              {:else}
                <button
                  on:click={() => buyLicense(lic.id)}
                  class="px-2 py-0.5 text-[8px] font-pixel font-bold bg-terminal-surface hover:bg-neon-amber/20 border-2 border-neon-amber text-neon-amber transition cel-btn shadow-[2px_2px_0px_#000]"
                >
                  PURCHASE (${lic.cost.toLocaleString()})
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
