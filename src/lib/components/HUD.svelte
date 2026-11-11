<script lang="ts">
  import { account, quotes, currentLevel, timeDilation, lotMode, toggleLotMode, benefactorState } from '../stores/trading';
  import { soundEngine } from '../audio/soundtrack';
  import { Volume2, VolumeX, History, FastForward, Trophy, Terminal, Settings, Home, LayoutDashboard, Bot, Landmark, Zap } from 'lucide-svelte';

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

<header class="h-16 bg-[#090d16] border-b-2 border-black px-4 flex items-center justify-between select-none z-10 shadow-[0_4px_0_#000] font-chakra">
  <!-- Left: Arcade Home Button, Asset Title & Mode Badge -->
  <div class="flex items-center space-x-3">
    <!-- Home / Menu Button -->
    <button
      on:click={onOpenMenu}
      class="p-2 cel-btn bg-terminal-surface hover:bg-terminal-border text-neon-cyan cursor-pointer"
      title="Save & Return to Main Menu"
    >
      <Home class="w-4 h-4 text-neon-cyan" />
    </button>

    <!-- Asset Telemetry Block -->
    <div class="flex flex-col">
      <div class="flex items-center space-x-1.5">
        <span class="text-[9px] pixel-text text-terminal-muted font-bold">ASSET:</span>
        {#if $account.equity >= 100000000}
          <span class="px-1.5 py-0.2 text-[8px] pixel-text font-bold bg-neon-cyan text-black border border-black">
            SOVEREIGN
          </span>
        {:else if $account.equity >= 10000000}
          <span class="px-1.5 py-0.2 text-[8px] pixel-text font-bold bg-neon-amber text-black border border-black">
            QUANT FUND
          </span>
        {:else if $account.equity >= 1000000}
          <span class="px-1.5 py-0.2 text-[8px] pixel-text font-bold bg-bull text-black border border-black">
            PROP DESK
          </span>
        {/if}
      </div>

      <div class="flex items-baseline space-x-2">
        <h1 class="text-xl font-black pixel-text text-white tracking-wider">
          {$currentLevel ? $currentLevel.ticker : 'LOADING...'}
        </h1>
        <span class="text-[10px] text-terminal-muted truncate max-w-[110px] hidden sm:inline">
          {$currentLevel ? $currentLevel.name : ''}
        </span>
      </div>
    </div>

    <!-- Active Position Badge -->
    <div class="pl-3 border-l-2 border-black flex flex-col hidden sm:flex">
      <span class="text-[8px] pixel-text text-terminal-muted">SIDE</span>
      <div class="flex items-center space-x-1 mt-0.5">
        {#if $account.side === 'BULL'}
          <span class="px-2 py-0.5 text-[10px] pixel-text font-bold bg-bull text-black border border-black shadow-[2px_2px_0_#000] animate-pulse">
            ▲ LONG {$account.open_lots < 1 ? $account.open_lots.toFixed(2) : $account.open_lots}L
          </span>
        {:else if $account.side === 'BEAR'}
          <span class="px-2 py-0.5 text-[10px] pixel-text font-bold bg-bear text-white border border-black shadow-[2px_2px_0_#000] animate-pulse">
            ▼ SHORT {$account.open_lots < 1 ? $account.open_lots.toFixed(2) : $account.open_lots}L
          </span>
        {:else}
          <span class="px-2 py-0.5 text-[10px] pixel-text font-bold bg-terminal-surface text-neon-cyan border border-black">
            ● FLAT CASH
          </span>
        {/if}
      </div>
    </div>

    <!-- Lot Sizing Switcher (Microlots vs Standard Lots) -->
    <div class="pl-3 border-l-2 border-black flex flex-col hidden md:flex">
      <span class="text-[8px] pixel-text text-terminal-muted">LOT SIZING</span>
      <div class="mt-0.5">
        {#if $benefactorState.hasTriggeredWire || $account.equity >= 10000}
          <button
            on:click={toggleLotMode}
            class="px-2 py-0.5 text-[10px] pixel-text font-bold cel-btn transition cursor-pointer {$lotMode === 'MICROLOT' ? 'bg-neon-cyan text-black hover:bg-neon-cyan/80' : 'bg-neon-amber text-black hover:bg-neon-amber/80'}"
            title="Toggle Lot Sizing: Microlot (0.01) vs Standard Lot (1.00)"
          >
            {$lotMode === 'MICROLOT' ? '0.01 MICRO' : '1.00 STD'}
          </button>
        {:else}
          <span
            class="px-2 py-0.5 text-[10px] pixel-text font-bold bg-terminal-surface text-terminal-muted border border-black"
            title="Microlot mode locked in Genesis Tutorial until $10k unlock"
          >
            🔒 0.01 MICRO
          </span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Center: Financial Telemetry & Phase Switchers -->
  <div class="flex items-center space-x-6">
    <!-- View Switcher Tabs (Unlocked at $1M+) -->
    {#if $account.equity >= 1000000}
      <div class="flex items-center space-x-1 bg-black p-1 border-2 border-black cyber-clip-sm">
        <button
          on:click={() => onChangeView('CHART')}
          class="px-2.5 py-1 text-[10px] pixel-text font-bold transition {activeView === 'CHART' ? 'bg-neon-cyan text-black' : 'text-terminal-muted hover:text-white'}"
        >
          CHART
        </button>

        <button
          on:click={() => onChangeView('CONSOLE')}
          class="px-2.5 py-1 text-[10px] pixel-text font-bold transition {activeView === 'CONSOLE' ? 'bg-bull text-black' : 'text-terminal-muted hover:text-white'}"
        >
          PROP DESK
        </button>

        {#if $account.equity >= 10000000}
          <button
            on:click={() => onChangeView('BOTS')}
            class="px-2.5 py-1 text-[10px] pixel-text font-bold transition {activeView === 'BOTS' ? 'bg-neon-amber text-black' : 'text-terminal-muted hover:text-white'}"
          >
            BOTS
          </button>
        {/if}

        {#if $account.equity >= 100000000}
          <button
            on:click={() => onChangeView('PORTFOLIO')}
            class="px-2.5 py-1 text-[10px] pixel-text font-bold transition {activeView === 'PORTFOLIO' ? 'bg-neon-cyan text-black' : 'text-terminal-muted hover:text-white'}"
          >
            PORTFOLIO
          </button>
        {/if}
      </div>
    {/if}

    <!-- Total Equity Plate -->
    <div class="flex flex-col items-center px-3 py-1 bg-black/60 border border-black cyber-clip-sm">
      <span class="text-[8px] pixel-text text-terminal-muted">TOTAL EQUITY</span>
      <span class="text-lg sm:text-xl font-black font-chakra tracking-tight {$account.equity >= 10000 ? 'text-bull text-glow-bull' : 'text-bear text-glow-bear'}">
        {formatCurrency($account.equity)}
      </span>
    </div>

    <!-- Floating Unrealized PnL Plate -->
    <div class="flex flex-col items-center px-3 py-1 bg-black/60 border border-black cyber-clip-sm hidden md:flex">
      <span class="text-[8px] pixel-text text-terminal-muted">LIVE P&L</span>
      <span class="text-sm font-bold font-chakra {$account.unrealized_pnl >= 0 ? 'text-bull' : 'text-bear'}">
        {$account.unrealized_pnl >= 0 ? '+' : ''}{formatCurrency($account.unrealized_pnl)}
      </span>
    </div>

    <!-- Live Bid / Ask / Spread -->
    <div class="flex flex-col items-end border-l-2 border-black pl-4 hidden lg:flex">
      <div class="flex items-center space-x-2 text-[11px] font-chakra font-bold">
        <span class="text-terminal-muted">BID:</span>
        <span class="text-bull">{$quotes.bid.toFixed(2)}</span>
        <span class="text-terminal-muted ml-1">ASK:</span>
        <span class="text-bear">{$quotes.ask.toFixed(2)}</span>
      </div>
      <span class="text-[9px] pixel-text text-neon-cyan mt-0.5">
        SPD: ${$quotes.spread.toFixed(2)}
      </span>
    </div>
  </div>

  <!-- Right: Arcade Speed, Random Epoch, Dev, Ledger, Settings, Sound -->
  <div class="flex items-center space-x-2">
    <!-- Time Dilation Button -->
    <button
      on:click={cycleSpeed}
      class="flex items-center space-x-1 px-2.5 py-1.5 cel-btn bg-terminal-surface hover:bg-terminal-border text-xs cursor-pointer"
      title="Toggle Time Speed (0.5x, 1x, 2x, 5x)"
    >
      <FastForward class="w-3.5 h-3.5 text-neon-cyan" />
      <span class="pixel-text text-[9px] text-neon-cyan">{$timeDilation}X</span>
    </button>

    <!-- Random Epoch Jump Button -->
    <button
      on:click={onJumpEpoch}
      class="px-2.5 py-1.5 cel-btn bg-terminal-surface hover:bg-terminal-border text-xs cursor-pointer"
      title="Jump to Random Epoch (T)"
    >
      <span class="pixel-text text-[9px] text-neon-amber">🎲 EPOCH</span>
    </button>

    <!-- Dev Console Button -->
    <button
      on:click={onOpenDevConsole}
      class="px-2.5 py-1.5 cel-btn bg-neon-cyan/25 hover:bg-neon-cyan/35 text-neon-cyan text-xs font-bold cursor-pointer"
      title="Open Dev Console (~)"
    >
      <Terminal class="w-3.5 h-3.5 inline mr-1" />
      <span class="pixel-text text-[9px]">DEV</span>
    </button>

    <!-- Trade History Ledger -->
    <button
      on:click={onOpenTradeLog}
      class="p-1.5 cel-btn bg-terminal-surface hover:bg-terminal-border text-terminal-text cursor-pointer"
      title="Open MT5 Trade Ledger"
    >
      <History class="w-4 h-4 text-neon-cyan" />
    </button>

    <!-- Options Button -->
    <button
      on:click={onOpenOptions}
      class="p-1.5 cel-btn bg-terminal-surface hover:bg-terminal-border text-terminal-text cursor-pointer"
      title="Settings & Audio Options"
    >
      <Settings class="w-4 h-4 text-terminal-muted hover:text-white" />
    </button>

    <!-- Audio Mute Toggle -->
    <button
      on:click={toggleAudio}
      class="p-1.5 cel-btn bg-terminal-surface hover:bg-terminal-border text-terminal-text cursor-pointer"
      title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
    >
      {#if isMuted}
        <VolumeX class="w-4 h-4 text-terminal-muted" />
      {:else}
        <Volume2 class="w-4 h-4 text-bull" />
      {/if}
    </button>
  </div>
</header>
