<script lang="ts">
  import { currentLevel, account, benefactorState } from '../stores/trading';
  import { Search, TrendingUp, Percent, DollarSign, Lock, Zap } from 'lucide-svelte';

  export let onSelectAsset: (ticker: string) => void = () => {};
  export let onCustomTicker: (ticker: string) => void = () => {};

  const presets = [
    { key: '1', ticker: 'NVDA', label: 'NVDA' },
    { key: '2', ticker: 'TSLA', label: 'TSLA' },
    { key: '3', ticker: 'BTC-USD', label: 'BTC' },
    { key: '4', ticker: 'SPY', label: 'SPY' },
    { key: '5', ticker: 'GME', label: 'GME' },
    { key: '6', ticker: 'AAPL', label: 'AAPL' },
    { key: '7', ticker: 'AMD', label: 'AMD' },
    { key: '8', ticker: 'QQQ', label: 'QQQ' },
  ];

  let customInput = '';
  let isFetching = false;

  async function handleCustomSubmit() {
    if (!customInput.trim() || isFetching || !$benefactorState.assetBarUnlocked) return;
    const ticker = customInput.trim().toUpperCase();
    isFetching = true;
    try {
      await onCustomTicker(ticker);
      customInput = '';
    } finally {
      isFetching = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!$benefactorState.assetBarUnlocked) return;
    if (['input', 'textarea'].includes((document.activeElement?.tagName || '').toLowerCase())) {
      return;
    }
    const match = presets.find((p) => p.key === e.key);
    if (match) {
      onSelectAsset(match.ticker);
    }
  }

  window.addEventListener('keydown', handleKeydown);
</script>

<footer class="h-14 bg-[#090d16] border-t-2 border-black px-4 flex items-center justify-between select-none z-10 shadow-[0_-3px_0_#000] font-chakra">
  {#if !$benefactorState.assetBarUnlocked}
    <!-- Locked Initial Single-Asset Regime -->
    <div class="flex items-center space-x-2 text-xs">
      <Lock class="w-4 h-4 text-neon-amber" />
      <span class="pixel-text text-[10px] text-neon-amber font-bold">SINGLE ASSET TUTORIAL REGIME</span>
      <span class="text-terminal-muted text-[11px] hidden sm:inline">• Surf NVDA to reach $5,000 or trade for 120s // Uncle Gordon is watching</span>
    </div>

    <!-- Career Stats -->
    <div class="flex items-center space-x-4 text-xs font-chakra">
      <div class="flex items-center space-x-1.5 px-2 py-1 bg-black/40 border border-black">
        <TrendingUp class="w-3.5 h-3.5 text-bull" />
        <span class="pixel-text text-[9px] text-terminal-muted">TRADES:</span>
        <strong class="text-white">{$account.trade_count}</strong>
      </div>
      <div class="flex items-center space-x-1.5 px-2 py-1 bg-black/40 border border-black">
        <Percent class="w-3.5 h-3.5 text-neon-amber" />
        <span class="pixel-text text-[9px] text-terminal-muted">WIN:</span>
        <strong class="text-neon-amber">{$account.win_rate_pct}%</strong>
      </div>
    </div>
  {:else}
    <!-- Asset Quick-Keys (Chunky Cel-Shaded Keypad) -->
    <div class="flex items-center space-x-1.5 overflow-x-auto py-1">
      {#each presets as p}
        <button
          type="button"
          on:click={() => onSelectAsset(p.ticker)}
          class="flex items-center space-x-1 px-3 py-1.5 cel-btn cursor-pointer transition {
            $currentLevel?.ticker === p.ticker
              ? 'bg-bull text-black font-black'
              : 'bg-terminal-surface hover:bg-terminal-border text-terminal-muted hover:text-white'
          }"
        >
          <span class="text-[9px] pixel-text px-1 py-0.2 bg-black text-neon-cyan border border-black">{p.key}</span>
          <span class="pixel-text text-[10px] tracking-wider">{p.label}</span>
        </button>
      {/each}
    </div>

    <!-- Custom Ticker Input & Stats -->
    <div class="flex items-center space-x-4 pl-4 border-l-2 border-black">
      <div class="hidden lg:flex items-center space-x-3 text-xs font-chakra">
        <div class="flex items-center space-x-1 px-2 py-0.5 bg-black/50 border border-black">
          <TrendingUp class="w-3.5 h-3.5 text-bull" />
          <span class="pixel-text text-[9px] text-terminal-muted">TRADES:</span>
          <strong class="text-white">{$account.trade_count}</strong>
        </div>
        <div class="flex items-center space-x-1 px-2 py-0.5 bg-black/50 border border-black">
          <Percent class="w-3.5 h-3.5 text-neon-amber" />
          <span class="pixel-text text-[9px] text-terminal-muted">WIN:</span>
          <strong class="text-neon-amber">{$account.win_rate_pct}%</strong>
        </div>
        <div class="flex items-center space-x-1 px-2 py-0.5 bg-black/50 border border-black">
          <DollarSign class="w-3.5 h-3.5 text-neon-cyan" />
          <span class="pixel-text text-[9px] text-terminal-muted">PEAK:</span>
          <strong class="text-neon-cyan">${$account.high_watermark.toLocaleString()}</strong>
        </div>
      </div>

      <!-- Custom ticker input -->
      <form on:submit|preventDefault={handleCustomSubmit} class="flex items-center space-x-1">
        <input
          type="text"
          placeholder="TICKER..."
          bind:value={customInput}
          class="w-24 px-2 py-1 bg-black text-neon-cyan border border-black text-xs font-chakra uppercase focus:outline-none focus:border-neon-cyan"
        />
        <button
          type="submit"
          disabled={isFetching}
          class="p-1 cel-btn bg-terminal-surface hover:bg-terminal-border text-neon-cyan cursor-pointer"
        >
          <Search class="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  {/if}
</footer>
