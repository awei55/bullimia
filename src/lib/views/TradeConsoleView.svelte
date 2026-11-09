<script lang="ts">
  import { account, quotes, currentLevel, executeOrder } from '../stores/trading';
  import { Shield, Zap, TrendingUp, Layers, Cpu, ArrowUpDown } from 'lucide-svelte';

  export let onFlatten: () => void = () => {};
  export let onSwitchAsset: (ticker: string) => void = () => {};

  let selectedVenue = 'LIT_EXCHANGE';
  let orderLots = 10;

  function handleQuickBuy() {
    if (!$currentLevel) return;
    executeOrder($currentLevel.ticker, 'BULL', orderLots, $quotes.price, new Date().toISOString(), $currentLevel.avg_atr_pct);
  }

  function handleQuickSell() {
    if (!$currentLevel) return;
    executeOrder($currentLevel.ticker, 'BEAR', orderLots, $quotes.price, new Date().toISOString(), $currentLevel.avg_atr_pct);
  }
</script>

<div class="h-full w-full flex flex-col bg-terminal-panel border-l border-terminal-border p-4 font-mono select-none overflow-y-auto">
  <!-- Desk Header -->
  <div class="flex items-center justify-between pb-3 border-b border-terminal-border mb-4">
    <div>
      <span class="text-[10px] text-bull font-bold tracking-widest uppercase flex items-center">
        <Cpu class="w-3.5 h-3.5 mr-1" /> PHASE 2 // INDEPENDENT PROP DESK
      </span>
      <h2 class="text-sm font-bold text-terminal-textBright">INSTITUTIONAL TRADE CONSOLE</h2>
    </div>
    <span class="px-2 py-0.5 rounded text-[10px] bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
      0.8ms LATENCY (NY4 COLOCATED)
    </span>
  </div>

  <!-- Venue Routing Selector -->
  <div class="mb-4">
    <span class="text-[10px] uppercase text-terminal-muted block mb-1.5 font-bold">EXECUTION VENUE ROUTING</span>
    <div class="grid grid-cols-3 gap-2 text-xs">
      <button
        on:click={() => (selectedVenue = 'LIT_EXCHANGE')}
        class="py-2 px-2 rounded border text-center transition {selectedVenue === 'LIT_EXCHANGE' ? 'bg-bull/20 border-bull text-bull font-bold' : 'bg-terminal-surface border-terminal-border text-terminal-muted'}"
      >
        <div class="font-bold">LIT EXCH</div>
        <div class="text-[9px] opacity-75">Lowest Latency</div>
      </button>

      <button
        on:click={() => (selectedVenue = 'DARK_POOL')}
        class="py-2 px-2 rounded border text-center transition {selectedVenue === 'DARK_POOL' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan font-bold' : 'bg-terminal-surface border-terminal-border text-terminal-muted'}"
      >
        <div class="font-bold">DARK POOL</div>
        <div class="text-[9px] opacity-75">Zero Market Impact</div>
      </button>

      <button
        on:click={() => (selectedVenue = 'INTERNALIZER')}
        class="py-2 px-2 rounded border text-center transition {selectedVenue === 'INTERNALIZER' ? 'bg-neon-amber/20 border-neon-amber text-neon-amber font-bold' : 'bg-terminal-surface border-terminal-border text-terminal-muted'}"
      >
        <div class="font-bold">INTERNALIZER</div>
        <div class="text-[9px] opacity-75">Sub-Penny Impr.</div>
      </button>
    </div>
  </div>

  <!-- Order Ticket Controls -->
  <div class="bg-terminal-surface border border-terminal-border rounded-lg p-3 mb-4">
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

  <!-- Live Market Depth Ladder -->
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
          SPREAD: {$quotes.spread.toFixed(2)}
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
    <div class="pt-3 border-t border-terminal-border mt-3 text-[10px] text-terminal-muted flex justify-between">
      <span>SERVER: SEC-NY4</span>
      <span class="text-bull font-bold">COLOCATED // 0 JITTER</span>
    </div>
  </div>
</div>
