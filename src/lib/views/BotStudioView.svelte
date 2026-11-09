<script lang="ts">
  import { account, quotes } from '../stores/trading';
  import { Cpu, Play, Pause, Bot, Network, AlertTriangle, CheckCircle2 } from 'lucide-svelte';

  let bots = [
    { id: 'bot-1', name: 'Alpha-Momentum (NVDA/TSLA)', active: true, trades: 142, pnl: 482000, trigger: '20-EMA Cross + Volume Spikes' },
    { id: 'bot-2', name: 'Mean-Reversion (SPY/Gold)', active: false, trades: 89, pnl: 215000, trigger: 'RSI Divergence < 25' },
    { id: 'bot-3', name: 'Macro-Correlation (BTC/Rates)', active: true, trades: 210, pnl: 1140000, trigger: 'Cross-Asset Volatility Skew' },
  ];

  function toggleBot(botId: string) {
    bots = bots.map((b) => (b.id === botId ? { ...b, active: !b.active } : b));
  }
</script>

<div class="h-full w-full flex flex-col bg-terminal-bg p-6 font-mono select-none overflow-y-auto crt-overlay">
  <!-- Header -->
  <div class="flex items-center justify-between pb-4 border-b-2 border-terminal-border mb-6">
    <div>
      <span class="text-[9px] text-neon-amber font-pixel tracking-widest uppercase flex items-center">
        <Bot class="w-4 h-4 mr-1.5" /> PHASE 3 // QUANTITATIVE BOT STUDIO & ALGORITHMIC DESK ($10M+)
      </span>
      <h1 class="text-xl font-bold font-pixel text-terminal-textBright mt-1">AUTONOMOUS QUANTITATIVE BOTS</h1>
    </div>

    <!-- Creditor Restructuring Status -->
    <div class="bg-terminal-surface border-2 border-bull cel-card cyber-clip-sm px-4 py-2 text-right shadow-[3px_3px_0px_#000]">
      <span class="text-[9px] text-terminal-muted uppercase font-pixel block">CREDITOR MARGIN STATUS</span>
      <span class="text-xs text-bull font-bold font-chakra flex items-center justify-end">
        <CheckCircle2 class="w-3.5 h-3.5 mr-1" /> SOLVENT // MULTI-VENUE POOLING
      </span>
    </div>
  </div>

  <!-- Bot Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    {#each bots as bot}
      <div class="bg-terminal-panel border-2 border-terminal-border cel-card cyber-clip-sm p-4 flex flex-col justify-between shadow-[4px_4px_0px_#000]">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-terminal-textBright font-chakra">{bot.name}</span>
            <span class="px-2 py-0.5 text-[9px] font-pixel font-bold border-2 shadow-[2px_2px_0px_#000] {bot.active ? 'bg-bull/20 text-bull border-bull' : 'bg-terminal-surface text-terminal-muted border-terminal-border'}">
              {bot.active ? 'RUNNING' : 'PAUSED'}
            </span>
          </div>
          <div class="text-[11px] text-terminal-muted mb-4 bg-terminal-surface p-2 border-2 border-terminal-border font-chakra">
            TRIGGER: <span class="text-neon-cyan font-bold">{bot.trigger}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs mb-4 font-chakra">
            <div>
              <span class="text-[9px] text-terminal-muted block font-pixel">TRADES:</span>
              <span class="font-bold text-terminal-text font-mono">{bot.trades}</span>
            </div>
            <div>
              <span class="text-[9px] text-terminal-muted block font-pixel">TOTAL P&L:</span>
              <span class="font-bold text-bull font-mono">+${bot.pnl.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          on:click={() => toggleBot(bot.id)}
          class="w-full py-2.5 text-xs font-pixel font-bold border-2 transition cel-btn cyber-clip-sm shadow-[3px_3px_0px_#000] flex items-center justify-center space-x-2 {bot.active ? 'bg-bear/25 hover:bg-bear/40 border-bear text-bear' : 'bg-bull/25 hover:bg-bull/40 border-bull text-bull'}"
        >
          {#if bot.active}
            <Pause class="w-3.5 h-3.5" />
            <span>PAUSE BOT</span>
          {:else}
            <Play class="w-3.5 h-3.5" />
            <span>ACTIVATE AUTOTRADER</span>
          {/if}
        </button>
      </div>
    {/each}
  </div>

  <!-- 15-Minute Delayed Stream & Restructuring Info Banner -->
  <div class="bg-terminal-panel border-2 border-terminal-border cel-panel cyber-clip p-5 shadow-[4px_4px_0px_#000]">
    <h3 class="text-sm font-bold text-neon-cyan uppercase mb-2 flex items-center font-pixel">
      <Network class="w-4 h-4 mr-2" /> 15-MINUTE DELAYED REAL-TIME DATA STREAM
    </h3>
    <p class="text-xs text-terminal-muted leading-relaxed mb-4 font-chakra">
      Your quantitative bots execute asynchronously across NYSE, NASDAQ, CME, and ECN networks.
      Margin calls stop being instant death after $10,000,000; catastrophic breaches trigger creditor restructuring with compounding interest schedules.
    </p>
    <div class="flex items-center space-x-4 text-xs font-chakra">
      <span class="text-terminal-muted">FEED HEALTH: <strong class="text-bull font-pixel text-[10px]">STREAMING (15m Delayed)</strong></span>
      <span class="text-terminal-muted">COLLATERAL POOL: <strong class="text-terminal-text font-mono font-bold">${$account.equity.toLocaleString()}</strong></span>
    </div>
  </div>
</div>
