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
  <div class="flex items-center justify-between pb-4 border-b border-terminal-border mb-6">
    <div>
      <span class="text-xs text-neon-amber font-bold tracking-widest uppercase flex items-center">
        <Bot class="w-4 h-4 mr-1.5" /> PHASE 3 // QUANTITATIVE BOT STUDIO & ALGORITHMIC DESK ($10M+)
      </span>
      <h1 class="text-2xl font-bold font-display text-terminal-textBright">AUTONOMOUS QUANTITATIVE BOTS</h1>
    </div>

    <!-- Creditor Restructuring Status -->
    <div class="bg-terminal-surface border border-bull/40 rounded-lg px-4 py-2 text-right">
      <span class="text-[10px] text-terminal-muted uppercase block">CREDITOR MARGIN STATUS</span>
      <span class="text-xs text-bull font-bold flex items-center justify-end">
        <CheckCircle2 class="w-3.5 h-3.5 mr-1" /> SOLVENT // MULTI-VENUE POOLING
      </span>
    </div>
  </div>

  <!-- Bot Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    {#each bots as bot}
      <div class="bg-terminal-panel border border-terminal-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-terminal-textBright">{bot.name}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold {bot.active ? 'bg-bull/20 text-bull border border-bull/40' : 'bg-terminal-surface text-terminal-muted border border-terminal-border'}">
              {bot.active ? 'RUNNING' : 'PAUSED'}
            </span>
          </div>
          <div class="text-[11px] text-terminal-muted mb-4 bg-terminal-surface p-2 rounded border border-terminal-border">
            TRIGGER: <span class="text-neon-cyan">{bot.trigger}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs mb-4">
            <div>
              <span class="text-[10px] text-terminal-muted block">TRADES:</span>
              <span class="font-bold text-terminal-text">{bot.trades}</span>
            </div>
            <div>
              <span class="text-[10px] text-terminal-muted block">TOTAL P&L:</span>
              <span class="font-bold text-bull">+${bot.pnl.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          on:click={() => toggleBot(bot.id)}
          class="w-full py-2 rounded text-xs font-bold border transition flex items-center justify-center space-x-2 {bot.active ? 'bg-bear/20 hover:bg-bear/30 border-bear text-bear' : 'bg-bull/20 hover:bg-bull/30 border-bull text-bull'}"
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
  <div class="bg-terminal-panel border border-terminal-border rounded-xl p-5">
    <h3 class="text-sm font-bold text-neon-cyan uppercase mb-2 flex items-center">
      <Network class="w-4 h-4 mr-2" /> 15-MINUTE DELAYED REAL-TIME DATA STREAM
    </h3>
    <p class="text-xs text-terminal-muted leading-relaxed mb-4">
      Your quantitative bots execute asynchronously across NYSE, NASDAQ, CME, and ECN networks.
      Margin calls stop being instant death after $10,000,000; catastrophic breaches trigger creditor restructuring with compounding interest schedules.
    </p>
    <div class="flex items-center space-x-4 text-xs">
      <span class="text-terminal-muted">FEED HEALTH: <strong class="text-bull">STREAMING (15m Delayed)</strong></span>
      <span class="text-terminal-muted">COLLATERAL POOL: <strong class="text-terminal-text">${$account.equity.toLocaleString()}</strong></span>
    </div>
  </div>
</div>
