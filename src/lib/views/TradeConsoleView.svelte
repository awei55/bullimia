<script lang="ts">
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
    COLOCATION_TIERS,
    VENUE_SPECS,
    ASSET_LICENSES,
    type ColocationTierId,
    type VenueTypeId,
    type AssetLicenseId,
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
  } from 'lucide-svelte';

  export let onFlatten: () => void = () => {};

  let activeTab: 'DOCKET' | 'SHOP' = 'DOCKET';
  let orderLots = 10;

  $: activeContext = getActiveTradeContext();
  $: currentColocSpec = COLOCATION_TIERS[$terminalShopState.currentColocation];

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

  function setSpeed(speed: number) {
    timeDilation.set(speed);
  }
</script>

<div class="h-full w-full flex flex-col bg-terminal-panel border-l border-terminal-border p-4 font-mono select-none overflow-y-auto">
  <!-- Desk Header -->
  <div class="flex items-center justify-between pb-3 border-b border-terminal-border mb-3">
    <div>
      <span class="text-[10px] text-bull font-bold tracking-widest uppercase flex items-center">
        <Cpu class="w-3.5 h-3.5 mr-1" /> PHASE 2 // INDEPENDENT PROP DESK
      </span>
      <h2 class="text-sm font-bold text-terminal-textBright">INSTITUTIONAL TRADE CONSOLE</h2>
    </div>

    <!-- Active Latency Badge -->
    <span class="px-2 py-0.5 rounded text-[10px] bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
      {currentColocSpec.latencyMs}ms ({currentColocSpec.name})
    </span>
  </div>

  <!-- IB Distraction Opportunity Banner (when available) -->
  {#if $minigameState.isAvailable && $minigameState.activeGame}
    <div class="mb-3 p-2.5 rounded-lg bg-neon-amber/20 border border-neon-amber text-neon-amber flex items-center justify-between animate-pulse">
      <div class="flex items-center space-x-2 text-xs font-bold">
        <Briefcase class="w-4 h-4 text-neon-amber" />
        <span>IB DEAL: {$minigameState.activeGame.title} (+${$minigameState.activeGame.payout.toLocaleString()})</span>
      </div>
      <button
        on:click={openMinigame}
        class="px-3 py-1 rounded bg-neon-amber text-terminal-bg text-xs font-bold hover:brightness-110 shadow-lg cursor-pointer"
      >
        EXECUTE DEAL
      </button>
    </div>
  {/if}

  <!-- View Mode Tabs (Docket vs Terminal Shop) -->
  <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
    <button
      on:click={() => (activeTab = 'DOCKET')}
      class="py-1.5 rounded border text-center transition font-bold flex items-center justify-center space-x-1.5 {activeTab === 'DOCKET' ? 'bg-terminal-surface border-bull text-bull' : 'bg-terminal-bg border-terminal-border text-terminal-muted hover:text-terminal-text'}"
    >
      <Activity class="w-3.5 h-3.5" />
      <span>TACTICAL DOCKET</span>
    </button>

    <button
      on:click={() => (activeTab = 'SHOP')}
      class="py-1.5 rounded border text-center transition font-bold flex items-center justify-center space-x-1.5 {activeTab === 'SHOP' ? 'bg-terminal-surface border-neon-cyan text-neon-cyan' : 'bg-terminal-bg border-terminal-border text-terminal-muted hover:text-terminal-text'}"
    >
      <ShoppingBag class="w-3.5 h-3.5" />
      <span>TERMINAL SHOP</span>
    </button>
  </div>

  {#if activeTab === 'DOCKET'}
    <!-- 1. Venue Routing Selector -->
    <div class="mb-3">
      <span class="text-[10px] uppercase text-terminal-muted block mb-1 font-bold">EXECUTION VENUE ROUTING</span>
      <div class="grid grid-cols-3 gap-2 text-xs">
        {#each Object.values(VENUE_SPECS) as v}
          <button
            on:click={() => ($selectedVenue = v.id)}
            class="py-1.5 px-1.5 rounded border text-center transition {$selectedVenue === v.id ? 'bg-bull/20 border-bull text-bull font-bold' : 'bg-terminal-surface border-terminal-border text-terminal-muted'}"
          >
            <div class="font-bold text-[11px] truncate">{v.name.split(' ')[0]}</div>
            <div class="text-[9px] opacity-75">${v.commissionPerLot.toFixed(2)}/L • {v.spreadMultiplier}x</div>
          </button>
        {/each}
      </div>
    </div>

    <!-- 2. Order Ticket Controls -->
    <div class="bg-terminal-surface border border-terminal-border rounded-lg p-3 mb-3">
      <span class="text-[10px] uppercase text-terminal-muted block mb-2 font-bold">TACTICAL ORDER TICKET</span>
      
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs text-terminal-text">ORDER SIZE:</span>
        <div class="flex items-center space-x-1">
          {#each [1, 5, 10, 25, 50, 100] as l}
            <button
              on:click={() => (orderLots = l)}
              class="px-2 py-1 rounded text-[11px] border {orderLots === l ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan font-bold' : 'bg-terminal-panel border-terminal-border text-terminal-muted'}"
            >
              {l}L
            </button>
          {/each}
        </div>
      </div>

      <!-- Quick Buy / Sell Buttons -->
      <div class="grid grid-cols-2 gap-2 mb-2">
        <button
          on:click={handleQuickBuy}
          class="py-2.5 rounded bg-bull/20 hover:bg-bull/30 border border-bull text-bull font-bold text-xs transition flex items-center justify-center space-x-1"
        >
          <span>BUY / LONG ({orderLots}L)</span>
        </button>

        <button
          on:click={handleQuickSell}
          class="py-2.5 rounded bg-bear/20 hover:bg-bear/30 border border-bear text-bear font-bold text-xs transition flex items-center justify-center space-x-1"
        >
          <span>SELL / SHORT ({orderLots}L)</span>
        </button>
      </div>

      <!-- Neutral Flatten Button -->
      <button
        on:click={onFlatten}
        class="w-full py-2 rounded bg-terminal-panel hover:bg-terminal-border border border-neon-cyan/40 text-neon-cyan text-xs font-bold transition flex items-center justify-center space-x-2"
      >
        <Shield class="w-3.5 h-3.5" />
        <span>FLATTEN TO 100% CASH (SPACE + ESC)</span>
      </button>
    </div>

    <!-- 3. Time Dilation Controls -->
    <div class="bg-terminal-surface border border-terminal-border rounded-lg p-2.5 mb-3">
      <span class="text-[10px] uppercase text-terminal-muted block mb-1.5 font-bold">SIMULATION SPEED DILATION</span>
      <div class="grid grid-cols-4 gap-1.5 text-xs">
        {#each [0.5, 1.0, 2.0, 5.0] as spd}
          <button
            on:click={() => setSpeed(spd)}
            class="py-1 rounded border text-center font-bold {$timeDilation === spd ? 'bg-neon-amber/20 border-neon-amber text-neon-amber' : 'bg-terminal-panel border-terminal-border text-terminal-muted'}"
          >
            {spd}x
          </button>
        {/each}
      </div>
    </div>

    <!-- 4. Live Market Depth Ladder -->
    <div class="bg-terminal-surface border border-terminal-border rounded-lg p-3 flex-1 flex flex-col justify-between">
      <div>
        <span class="text-[10px] uppercase text-terminal-muted block mb-2 font-bold">LEVEL 2 LIQUIDITY DEPTH</span>
        <div class="space-y-1 text-[11px]">
          <!-- Asks -->
          <div class="flex justify-between text-bear/80">
            <span>{($quotes.ask + 0.15).toFixed(2)}</span>
            <span>450 L</span>
          </div>
          <div class="flex justify-between text-bear font-bold">
            <span>{$quotes.ask.toFixed(2)} (ASK)</span>
            <span>1,200 L</span>
          </div>
          <!-- Spread -->
          <div class="py-1 px-2 rounded bg-terminal-bg text-center text-[10px] text-neon-cyan my-1 border border-terminal-border">
            SPREAD: {$quotes.spread.toFixed(2)} • MULTIPLIER: {activeContext.effectiveSpreadMultiplier}x
          </div>
          <!-- Bids -->
          <div class="flex justify-between text-bull font-bold">
            <span>{$quotes.bid.toFixed(2)} (BID)</span>
            <span>1,850 L</span>
          </div>
          <div class="flex justify-between text-bull/80">
            <span>{($quotes.bid - 0.15).toFixed(2)}</span>
            <span>620 L</span>
          </div>
        </div>
      </div>

      <!-- Infrastructure Status -->
      <div class="pt-2 border-t border-terminal-border mt-2 text-[10px] text-terminal-muted flex justify-between">
        <span>SERVER: SEC-NY4</span>
        <span class="text-bull font-bold">0 JITTER // {currentColocSpec.latencyMs}ms</span>
      </div>
    </div>

  {:else}
    <!-- Tab 2: Terminal Infrastructure Shop -->
    <div class="space-y-3">
      <!-- Colocation Upgrades -->
      <div class="bg-terminal-surface border border-terminal-border rounded-lg p-3">
        <span class="text-[10px] uppercase text-neon-cyan block mb-2 font-bold">
          EXCHANGE COLOCATION UPGRADES
        </span>
        <div class="space-y-2">
          {#each Object.values(COLOCATION_TIERS) as c}
            <div class="p-2.5 rounded bg-terminal-panel border border-terminal-border flex items-center justify-between text-xs">
              <div>
                <div class="font-bold text-terminal-text">{c.name}</div>
                <div class="text-[10px] text-terminal-muted">{c.description}</div>
                <div class="text-[10px] text-neon-cyan">LATENCY: {c.latencyMs}ms • SPREAD: {c.spreadMultiplier}x</div>
              </div>

              {#if $terminalShopState.currentColocation === c.id}
                <span class="px-2.5 py-1 rounded text-[10px] font-bold bg-bull/20 text-bull border border-bull/40">
                  EQUIPPED
                </span>
              {:else}
                <button
                  on:click={() => buyColocation(c.id)}
                  class="px-2.5 py-1 rounded text-[10px] font-bold bg-terminal-surface hover:bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan transition"
                >
                  UPGRADE (${c.cost.toLocaleString()})
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Asset Class Licenses -->
      <div class="bg-terminal-surface border border-terminal-border rounded-lg p-3">
        <span class="text-[10px] uppercase text-neon-amber block mb-2 font-bold">
          ASSET CLASS LICENSES
        </span>
        <div class="space-y-2">
          {#each Object.values(ASSET_LICENSES) as lic}
            <div class="p-2.5 rounded bg-terminal-panel border border-terminal-border flex items-center justify-between text-xs">
              <div>
                <div class="font-bold text-terminal-text">{lic.name}</div>
                <div class="text-[10px] text-terminal-muted">{lic.description}</div>
                <div class="text-[10px] text-neon-amber">ASSETS: {lic.assets.join(', ')}</div>
              </div>

              {#if $terminalShopState.ownedLicenses.includes(lic.id)}
                <span class="px-2.5 py-1 rounded text-[10px] font-bold bg-bull/20 text-bull border border-bull/40">
                  ACQUIRED
                </span>
              {:else}
                <button
                  on:click={() => buyLicense(lic.id)}
                  class="px-2.5 py-1 rounded text-[10px] font-bold bg-terminal-surface hover:bg-neon-amber/20 border border-neon-amber/40 text-neon-amber transition"
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
