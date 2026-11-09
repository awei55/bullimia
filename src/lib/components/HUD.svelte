<script lang="ts">
  import { account, quotes, currentLevel, timeDilation } from '../stores/trading';
  import { soundEngine } from '../audio/soundtrack';
  import { Volume2, VolumeX, History, FastForward, Trophy, Terminal, Settings, Home, LayoutDashboard, Bot, Landmark } from 'lucide-svelte';

  export let activeView: 'CHART' | 'CONSOLE' | 'BOTS' | 'PORTFOLIO' = 'CHART';
  export let onChangeView: (view: 'CHART' | 'CONSOLE' | 'BOTS' | 'PORTFOLIO') => void = () => {};
  export let onOpenMenu: () => void = () => {};
  export let onOpenDevConsole: () => void = () => {};
  export let onOpenOptions: () => void = () => {};
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

<header class="h-16 bg-terminal-panel border-b border-terminal-border px-4 flex items-center justify-between select-none z-10 shadow-lg font-mono">
  <!-- Left: Home / Asset Info & Career Milestone -->
  <div class="flex items-center space-x-3">
    <!-- Home / Menu Button -->
    <button
      on:click={onOpenMenu}
      class="p-2 rounded bg-terminal-surface hover:bg-terminal-border text-terminal-muted hover:text-terminal-textBright border border-terminal-border transition"
      title="Save & Return to Main Menu"
    >
      <Home class="w-4 h-4 text-neon-cyan" />
    </button>

    <div class="flex flex-col">
      <div class="flex items-center space-x-2">
        <span class="text-[10px] uppercase tracking-widest text-terminal-muted font-bold">ASSET</span>
        {#if $account.equity >= 100000000}
          <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40">
            SOVEREIGN
          </span>
        {:else if $account.equity >= 10000000}
          <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-neon-amber/20 text-neon-amber border border-neon-amber/40">
            QUANT FUND
          </span>
        {:else if $account.equity >= 1000000}
          <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-bull/20 text-bull border border-bull/40">
            PROP TRADER
          </span>
        {/if}
      </div>
      <div class="flex items-baseline space-x-2">
        <h1 class="text-xl font-bold tracking-tight text-terminal-textBright">
          {$currentLevel ? $currentLevel.ticker : 'LOADING...'}
        </h1>
        <span class="text-xs text-terminal-muted truncate max-w-[120px] hidden sm:inline">
          {$currentLevel ? $currentLevel.name : ''}
        </span>
      </div>
    </div>

    <!-- Position Badge -->
    <div class="pl-3 border-l border-terminal-border flex flex-col hidden sm:flex">
      <span class="text-[9px] uppercase tracking-wider text-terminal-muted">POSITION</span>
      <div class="flex items-center space-x-1 mt-0.5">
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

  <!-- Center: Financial Telemetry & Phase View Tabs -->
  <div class="flex items-center space-x-6">
    <!-- View Switcher Tabs (Only unlocked if player has reached Phase 2: $1,000,000+) -->
    {#if $account.equity >= 1000000}
      <div class="flex items-center space-x-1 bg-terminal-surface p-1 rounded-lg border border-terminal-border">
        <!-- Chart View -->
        <button
          on:click={() => onChangeView('CHART')}
          class="px-2.5 py-1 rounded text-xs transition {activeView === 'CHART' ? 'bg-terminal-border text-neon-cyan font-bold shadow' : 'text-terminal-muted hover:text-terminal-text'}"
        >
          CHART
        </button>

        <!-- Console View (Phase 2+) -->
        <button
          on:click={() => onChangeView('CONSOLE')}
          class="px-2.5 py-1 rounded text-xs transition {activeView === 'CONSOLE' ? 'bg-terminal-border text-bull font-bold shadow' : 'text-terminal-muted hover:text-terminal-text'}"
        >
          DESK
        </button>

        <!-- Bot Studio View (Phase 3+) -->
        {#if $account.equity >= 10000000}
          <button
            on:click={() => onChangeView('BOTS')}
            class="px-2.5 py-1 rounded text-xs transition {activeView === 'BOTS' ? 'bg-terminal-border text-neon-amber font-bold shadow' : 'text-terminal-muted hover:text-terminal-text'}"
          >
            BOTS
          </button>
        {/if}

        <!-- Portfolio Manager View (Phase 4+) -->
        {#if $account.equity >= 100000000}
          <button
            on:click={() => onChangeView('PORTFOLIO')}
            class="px-2.5 py-1 rounded text-xs transition {activeView === 'PORTFOLIO' ? 'bg-terminal-border text-neon-cyan font-bold shadow' : 'text-terminal-muted hover:text-terminal-text'}"
          >
            PORTFOLIO
          </button>
        {/if}
      </div>
    {/if}

    <!-- Total Equity -->
    <div class="flex flex-col items-center">
      <span class="text-[9px] uppercase tracking-wider text-terminal-muted">TOTAL EQUITY</span>
      <span class="text-xl font-bold tracking-tight {$account.equity >= 10000 ? 'text-bull text-glow-bull' : 'text-bear text-glow-bear'}">
        {formatCurrency($account.equity)}
      </span>
    </div>

    <!-- Floating Unrealized PnL -->
    <div class="flex flex-col items-center hidden md:flex">
      <span class="text-[9px] uppercase tracking-wider text-terminal-muted">UNREALIZED P&L</span>
      <span class="text-sm font-bold {$account.unrealized_pnl >= 0 ? 'text-bull' : 'text-bear'}">
        {$account.unrealized_pnl >= 0 ? '+' : ''}{formatCurrency($account.unrealized_pnl)}
      </span>
    </div>

    <!-- Quotes & Spread -->
    <div class="flex flex-col items-end border-l border-terminal-border pl-4 hidden lg:flex">
      <div class="flex items-center space-x-2 text-xs">
        <span class="text-terminal-muted">BID:</span>
        <span class="text-terminal-text font-bold">{$quotes.bid.toFixed(2)}</span>
        <span class="text-terminal-muted ml-1">ASK:</span>
        <span class="text-terminal-text font-bold">{$quotes.ask.toFixed(2)}</span>
      </div>
      <span class="text-[10px] text-neon-cyan mt-0.5">
        SPREAD: {$quotes.spread.toFixed(2)}
      </span>
    </div>
  </div>

  <!-- Right: Controls, Speed, Dev, Options, Sound, Log -->
  <div class="flex items-center space-x-2">
    <!-- Time Dilation Button -->
    <button
      on:click={cycleSpeed}
      class="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-terminal-surface hover:bg-terminal-border text-terminal-text border border-terminal-border transition text-xs"
      title="Toggle Time Speed (0.5x, 1x, 2x, 5x)"
    >
      <FastForward class="w-3.5 h-3.5 text-neon-cyan" />
      <span>{$timeDilation}x</span>
    </button>

    <!-- Random Epoch Jump Button -->
    <button
      on:click={onJumpEpoch}
      class="px-2.5 py-1.5 rounded bg-terminal-surface hover:bg-terminal-border text-terminal-text border border-terminal-border transition text-xs"
      title="Jump to Random Epoch (T)"
    >
      🎲 EPOCH
    </button>

    <!-- Dev Console Button -->
    <button
      on:click={onOpenDevConsole}
      class="px-2.5 py-1.5 rounded bg-neon-cyan/15 hover:bg-neon-cyan/25 text-neon-cyan border border-neon-cyan/40 transition text-xs font-bold"
      title="Open Dev Console (~ / Backtick)"
    >
      <Terminal class="w-3.5 h-3.5 inline mr-1" />DEV
    </button>

    <!-- Trade History Ledger -->
    <button
      on:click={onOpenTradeLog}
      class="p-1.5 rounded bg-terminal-surface hover:bg-terminal-border text-terminal-text border border-terminal-border transition"
      title="Open MT5 Trade Ledger"
    >
      <History class="w-4 h-4 text-terminal-muted hover:text-terminal-textBright" />
    </button>

    <!-- Options Button -->
    <button
      on:click={onOpenOptions}
      class="p-1.5 rounded bg-terminal-surface hover:bg-terminal-border text-terminal-text border border-terminal-border transition"
      title="Settings & Audio Options"
    >
      <Settings class="w-4 h-4 text-terminal-muted hover:text-terminal-textBright" />
    </button>

    <!-- Audio Mute Toggle -->
    <button
      on:click={toggleAudio}
      class="p-1.5 rounded bg-terminal-surface hover:bg-terminal-border text-terminal-text border border-terminal-border transition"
      title={isMuted ? 'Unmute Procedural Audio (M)' : 'Mute Audio (M)'}
    >
      {#if isMuted}
        <VolumeX class="w-4 h-4 text-terminal-muted" />
      {:else}
        <Volume2 class="w-4 h-4 text-bull" />
      {/if}
    </button>
  </div>
</header>
