<script lang="ts">
  import { account, quotes, currentLevel, timeDilation } from '../stores/trading';
  import { soundEngine } from '../audio/soundtrack';
  import { Volume2, VolumeX, History, FastForward, Play, ShieldAlert, Trophy } from 'lucide-svelte';

  export let onOpenTradeLog: () => void = () => {};
  export let onJumpEpoch: () => void = () => {};

  let isMuted = false;

  function toggleAudio() {
    isMuted = soundEngine.toggleMute();
  }

  function cycleSpeed() {
    timeDilation.update((s) => {
      if (s === 1.0) return 2.0;
      if (s === 2.0) return 5.0;
      if (s === 5.0) return 0.5;
      return 1.0;
    });
  }

  function formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(val);
  }
</script>

<header class="h-16 bg-terminal-panel border-b border-terminal-border px-4 flex items-center justify-between select-none z-10 shadow-lg">
  <!-- Left: Asset Info & Career Milestone -->
  <div class="flex items-center space-x-4">
    <div class="flex flex-col">
      <div class="flex items-center space-x-2">
        <span class="text-xs uppercase tracking-widest text-terminal-muted font-bold">ASSET</span>
        {#if $account.is_millionaire}
          <span class="flex items-center text-xs font-bold px-2 py-0.5 rounded bg-neon-amber/20 text-neon-amber border border-neon-amber/40">
            <Trophy class="w-3 h-3 mr-1 inline" /> MILLIONAIRE
          </span>
        {/if}
      </div>
      <div class="flex items-baseline space-x-2">
        <h1 class="text-xl font-bold font-mono tracking-tight text-terminal-textBright">
          {$currentLevel ? $currentLevel.ticker : 'LOADING...'}
        </h1>
        <span class="text-xs text-terminal-muted font-mono truncate max-w-[140px]">
          {$currentLevel ? $currentLevel.name : ''}
        </span>
      </div>
    </div>

    <!-- Position Badge -->
    <div class="pl-4 border-l border-terminal-border flex flex-col">
      <span class="text-[10px] uppercase tracking-wider text-terminal-muted">POSITION</span>
      <div class="flex items-center space-x-1.5 mt-0.5">
        {#if $account.side === 'BULL'}
          <span class="px-2 py-0.5 text-xs font-bold rounded bg-bull/20 text-bull border border-bull/40 text-glow-bull animate-pulse">
            ▲ LONG {$account.open_lots}L
          </span>
        {:else if $account.side === 'BEAR'}
          <span class="px-2 py-0.5 text-xs font-bold rounded bg-bear/20 text-bear border border-bear/40 text-glow-bear animate-pulse">
            ▼ SHORT {$account.open_lots}L
          </span>
        {:else}
          <span class="px-2 py-0.5 text-xs font-bold rounded bg-terminal-surface text-neon-cyan border border-neon-cyan/30">
            ● 100% CASH
          </span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Center: Financial Telemetry (Equity, Cash, Floating PnL) -->
  <div class="flex items-center space-x-6">
    <!-- Total Equity -->
    <div class="flex flex-col items-center">
      <span class="text-[10px] uppercase tracking-wider text-terminal-muted">TOTAL EQUITY</span>
      <span class="text-xl font-bold font-mono tracking-tight {$account.equity >= 10000 ? 'text-bull text-glow-bull' : 'text-bear text-glow-bear'}">
        {formatCurrency($account.equity)}
      </span>
    </div>

    <!-- Floating Unrealized PnL -->
    <div class="flex flex-col items-center">
      <span class="text-[10px] uppercase tracking-wider text-terminal-muted">UNREALIZED P&L</span>
      <span class="text-base font-bold font-mono {$account.unrealized_pnl >= 0 ? 'text-bull' : 'text-bear'}">
        {$account.unrealized_pnl >= 0 ? '+' : ''}{formatCurrency($account.unrealized_pnl)}
      </span>
    </div>

    <!-- Settled Cash -->
    <div class="flex flex-col items-center hidden sm:flex">
      <span class="text-[10px] uppercase tracking-wider text-terminal-muted">SETTLED CASH</span>
      <span class="text-sm font-mono text-terminal-text">
        {formatCurrency($account.cash_balance)}
      </span>
    </div>

    <!-- Quotes & Spread -->
    <div class="flex flex-col items-end border-l border-terminal-border pl-4 hidden md:flex">
      <div class="flex items-center space-x-2 text-xs font-mono">
        <span class="text-terminal-muted">BID:</span>
        <span class="text-terminal-text font-bold">{$quotes.bid.toFixed(2)}</span>
        <span class="text-terminal-muted ml-2">ASK:</span>
        <span class="text-terminal-text font-bold">{$quotes.ask.toFixed(2)}</span>
      </div>
      <span class="text-[10px] text-neon-cyan font-mono mt-0.5">
        SPREAD: {$quotes.spread.toFixed(2)}
      </span>
    </div>
  </div>

  <!-- Right: Controls, Speed, Sound, Log -->
  <div class="flex items-center space-x-2">
    <!-- Time Dilation Button -->
    <button
      on:click={cycleSpeed}
      class="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-terminal-surface hover:bg-terminal-border text-terminal-text border border-terminal-border transition text-xs font-mono"
      title="Toggle Time Speed (0.5x, 1x, 2x, 5x)"
    >
      <FastForward class="w-3.5 h-3.5 text-neon-cyan" />
      <span>{$timeDilation}x</span>
    </button>

    <!-- Random Epoch Jump Button -->
    <button
      on:click={onJumpEpoch}
      class="px-2.5 py-1.5 rounded bg-terminal-surface hover:bg-terminal-border text-terminal-text border border-terminal-border transition text-xs font-mono"
      title="Jump to Random Epoch (T)"
    >
      🎲 EPOCH
    </button>

    <!-- Trade History Ledger -->
    <button
      on:click={onOpenTradeLog}
      class="p-1.5 rounded bg-terminal-surface hover:bg-terminal-border text-terminal-text border border-terminal-border transition"
      title="Open MT5 Trade Ledger"
    >
      <History class="w-4 h-4 text-terminal-muted hover:text-terminal-textBright" />
    </button>

    <!-- Audio Mute Toggle -->
    <button
      on:click={toggleAudio}
      class="p-1.5 rounded bg-terminal-surface hover:bg-terminal-border text-terminal-text border border-terminal-border transition"
      title={isMuted ? 'Unmute Procedural Audio' : 'Mute Audio'}
    >
      {#if isMuted}
        <VolumeX class="w-4 h-4 text-terminal-muted" />
      {:else}
        <Volume2 class="w-4 h-4 text-bull" />
      {/if}
    </button>
  </div>
</header>
