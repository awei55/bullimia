<script lang="ts">
  import { currentLevel, account } from '../stores/trading';
  import { Search, TrendingUp, Percent, DollarSign } from 'lucide-svelte';

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
    if (!customInput.trim() || isFetching) return;
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

<footer class="h-14 bg-terminal-panel border-t border-terminal-border px-4 flex items-center justify-between select-none z-10">
  <!-- Asset Quick-Keys -->
  <div class="flex items-center space-x-1.5 overflow-x-auto py-1">
    {#each presets as p}
      <button
        on:click={() => onSelectAsset(p.ticker)}
        class="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono transition border {
          $currentLevel?.ticker === p.ticker
            ? 'bg-terminal-surface border-bull text-bull text-glow-bull font-bold'
            : 'bg-terminal-panel border-terminal-border text-terminal-muted hover:text-terminal-text hover:border-terminal-borderLight'
        }"
      >
        <span class="text-[10px] text-neon-cyan px-1 py-0.2 rounded bg-terminal-border/50">{p.key}</span>
        <span>{p.label}</span>
      </button>
    {/each}
  </div>

  <!-- Custom Ticker Input & Stats -->
  <div class="flex items-center space-x-4 pl-4 border-l border-terminal-border">
    <!-- Career Win Rate & Trade Count -->
    <div class="hidden lg:flex items-center space-x-4 text-xs font-mono text-terminal-muted">
      <div class="flex items-center space-x-1">
        <TrendingUp class="w-3.5 h-3.5 text-bull" />
        <span>TRADES: <strong class="text-terminal-textBright">{$account.trade_count}</strong></span>
      </div>
      <div class="flex items-center space-x-1">
        <Percent class="w-3.5 h-3.5 text-neon-amber" />
        <span>WIN: <strong class="text-terminal-textBright">{$account.win_rate_pct}%</strong></span>
      </div>
      <div class="flex items-center space-x-1">
        <DollarSign class="w-3.5 h-3.5 text-neon-cyan" />
        <span>PEAK: <strong class="text-terminal-textBright">${$account.high_watermark.toLocaleString()}</strong></span>
      </div>
    </div>

    <!-- Live Ticker Fetcher -->
    <form on:submit|preventDefault={handleCustomSubmit} class="relative flex items-center">
      <input
        type="text"
        bind:value={customInput}
        placeholder="CUSTOM TICKER..."
        class="w-32 sm:w-40 bg-terminal-bg border border-terminal-border rounded px-2.5 py-1 text-xs font-mono text-terminal-text uppercase placeholder-terminal-muted focus:outline-none focus:border-neon-cyan transition"
      />
      <button
        type="submit"
        disabled={isFetching || !customInput}
        class="absolute right-1 text-terminal-muted hover:text-neon-cyan disabled:opacity-40 transition p-1"
      >
        <Search class="w-3.5 h-3.5" />
      </button>
    </form>
  </div>
</footer>
