<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { account, quotes, currentLevel } from '../stores/trading';
  import {
    botStudioState,
    toggleBot,
    createBot,
    deleteBot,
    tickBots,
    type SignalType,
    type ActionType,
    type QuantBot,
  } from '../stores/bot_studio';
  import {
    repayCreditorDebt,
  } from '../stores/creditor_restructuring';
  import {
    Cpu,
    Play,
    Pause,
    Bot,
    Network,
    AlertTriangle,
    CheckCircle2,
    Plus,
    Trash2,
    DollarSign,
    Zap,
    Layers,
    ShieldAlert,
    TrendingUp,
    TrendingDown,
    Activity,
    Settings2,
    X,
  } from 'lucide-svelte';

  let isCreateModalOpen = false;
  let newBotName = 'Alpha-Scalper Delta';
  let newBotTicker = 'NVDA';
  let newBotSignal: SignalType = 'EMA_CROSS';
  let newBotAction: ActionType = 'BUY_BULL';
  let newBotLots = 25;

  let botTickInterval: any = null;

  onMount(() => {
    // Run bot algorithmic simulation loop every 3.5 seconds
    botTickInterval = setInterval(() => {
      tickBots($quotes.price);
    }, 3500);
  });

  onDestroy(() => {
    if (botTickInterval) clearInterval(botTickInterval);
  });

  function handleDeployBot() {
    createBot(newBotName, newBotTicker, newBotSignal, newBotAction, newBotLots);
    isCreateModalOpen = false;
    newBotName = `Bot-${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  function handleRepayDebt(amount: number) {
    repayCreditorDebt(amount);
  }
</script>

<div class="h-full w-full flex flex-col bg-terminal-bg p-5 font-mono select-none overflow-y-auto crt-overlay">
  <!-- Desk Header -->
  <div class="flex items-center justify-between pb-4 border-b-2 border-terminal-border mb-4">
    <div>
      <span class="text-[9px] text-neon-amber font-pixel tracking-widest uppercase flex items-center">
        <Bot class="w-4 h-4 mr-1.5" /> PHASE 3 // QUANTITATIVE BOT STUDIO & ALGORITHMIC DESK ($10M+)
      </span>
      <h1 class="text-xl font-bold font-pixel text-terminal-textBright mt-1">AUTONOMOUS QUANTITATIVE BOTS</h1>
    </div>

    <!-- Right Controls: Deploy Bot Button & Solvency Status -->
    <div class="flex items-center space-x-3">
      <button
        on:click={() => (isCreateModalOpen = true)}
        class="px-3.5 py-2 bg-neon-cyan text-black font-pixel font-bold text-xs flex items-center space-x-1.5 cel-btn shadow-[3px_3px_0px_#000] hover:brightness-110 active:translate-y-0.5 transition"
      >
        <Plus class="w-4 h-4" />
        <span>DEPLOY NEW ALGO</span>
      </button>

      <!-- Creditor Restructuring Status Badge -->
      {#if $account.isInRestructuring}
        <div class="bg-bear/20 border-2 border-bear cel-card cyber-clip-sm px-3.5 py-1.5 text-right shadow-[3px_3px_0px_#000] animate-pulse">
          <span class="text-[8px] text-bear uppercase font-pixel block">CREDITOR MARGIN STATUS</span>
          <span class="text-xs text-bear font-bold font-chakra flex items-center justify-end">
            <ShieldAlert class="w-3.5 h-3.5 mr-1" /> CHAPTER 11 RESTRUCTURING
          </span>
        </div>
      {:else}
        <div class="bg-terminal-surface border-2 border-bull cel-card cyber-clip-sm px-3.5 py-1.5 text-right shadow-[3px_3px_0px_#000]">
          <span class="text-[8px] text-terminal-muted uppercase font-pixel block">CREDITOR MARGIN STATUS</span>
          <span class="text-xs text-bull font-bold font-chakra flex items-center justify-end">
            <CheckCircle2 class="w-3.5 h-3.5 mr-1" /> SOLVENT // AAA RATINGS
          </span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Chapter 11 Creditor Restructuring Repayment Docket (Appears when in restructuring) -->
  {#if $account.isInRestructuring}
    <div class="mb-5 p-4 bg-bear/10 border-2 border-bear cel-panel cyber-clip shadow-[4px_4px_0px_#000]">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-2 text-bear font-pixel text-xs font-bold">
          <ShieldAlert class="w-4 h-4 animate-pulse" />
          <span>CHAPTER 11 CREDITOR DEBT SERVICE DOCKET (BREACH #{$account.restructuringBreachCount ?? 1})</span>
        </div>
        <span class="text-[10px] text-neon-amber font-mono font-bold">
          COMPOUNDING RATE: {$account.debtInterestRate?.toFixed(2) ?? 11.75}% (SOFR + 650 bps)
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-xs font-chakra">
        <div class="p-2.5 bg-terminal-bg border border-terminal-border">
          <span class="text-[9px] text-terminal-muted font-pixel block">OUTSTANDING CREDITOR DEBT:</span>
          <span class="text-base font-bold text-bear font-mono">${($account.restructuringDebt ?? 0).toLocaleString()}</span>
        </div>

        <div class="p-2.5 bg-terminal-bg border border-terminal-border">
          <span class="text-[9px] text-terminal-muted font-pixel block">CURRENT CASH RESERVES:</span>
          <span class="text-base font-bold text-terminal-text font-mono">${$account.cash_balance.toLocaleString()}</span>
        </div>

        <div class="p-2.5 bg-terminal-bg border border-terminal-border flex flex-col justify-center">
          <span class="text-[9px] text-terminal-muted font-pixel block mb-1">DEBT REPAYMENT:</span>
          <div class="flex items-center space-x-1.5 font-pixel text-[9px]">
            <button
              on:click={() => handleRepayDebt(1000000)}
              class="px-2 py-1 bg-bull text-black font-bold hover:brightness-110 cel-btn"
            >
              -$1.0M
            </button>
            <button
              on:click={() => handleRepayDebt(5000000)}
              class="px-2 py-1 bg-bull text-black font-bold hover:brightness-110 cel-btn"
            >
              -$5.0M
            </button>
            <button
              on:click={() => handleRepayDebt($account.restructuringDebt ?? 0)}
              class="px-2 py-1 bg-neon-amber text-black font-bold hover:brightness-110 cel-btn"
            >
              PAY ALL
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Quantitative Bot Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
    {#each $botStudioState.bots as bot}
      <div class="bg-terminal-panel border-2 border-terminal-border cel-card cyber-clip-sm p-4 flex flex-col justify-between shadow-[4px_4px_0px_#000]">
        <div>
          <!-- Bot Header -->
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-terminal-textBright font-chakra truncate pr-2">{bot.name}</span>
            <span class="px-2 py-0.5 text-[8px] font-pixel font-bold border-2 shadow-[2px_2px_0px_#000] {bot.active ? 'bg-bull/20 text-bull border-bull' : 'bg-terminal-surface text-terminal-muted border-terminal-border'}">
              {bot.active ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>

          <!-- Signal Node & Action Badges -->
          <div class="space-y-1.5 mb-3 text-[10px] font-chakra">
            <div class="p-1.5 bg-terminal-surface border border-terminal-border flex justify-between items-center">
              <span class="text-terminal-muted font-pixel text-[8px]">SIGNAL NODE:</span>
              <span class="text-neon-cyan font-bold font-mono">{bot.signalType} ({bot.ticker})</span>
            </div>
            <div class="p-1.5 bg-terminal-surface border border-terminal-border flex justify-between items-center">
              <span class="text-terminal-muted font-pixel text-[8px]">EXECUTION:</span>
              <span class="text-neon-amber font-bold font-mono">{bot.actionType} ({bot.lotSize}L)</span>
            </div>
          </div>

          <!-- Live Telemetry Stats -->
          <div class="grid grid-cols-3 gap-2 text-xs mb-3 font-chakra">
            <div>
              <span class="text-[8px] text-terminal-muted block font-pixel">TRADES:</span>
              <span class="font-bold text-terminal-text font-mono text-[11px]">{bot.tradesCount}</span>
            </div>
            <div>
              <span class="text-[8px] text-terminal-muted block font-pixel">WIN RATE:</span>
              <span class="font-bold text-bull font-mono text-[11px]">{bot.winRatePct}%</span>
            </div>
            <div>
              <span class="text-[8px] text-terminal-muted block font-pixel">REALIZED P&L:</span>
              <span class="font-bold {bot.realizedPnl >= 0 ? 'text-bull' : 'text-bear'} font-mono text-[11px]">
                {bot.realizedPnl >= 0 ? '+' : ''}${Math.round(bot.realizedPnl).toLocaleString()}
              </span>
            </div>
          </div>

          <!-- Latest Execution Event Log -->
          <div class="p-2 bg-terminal-bg border border-terminal-border text-[9px] font-mono text-terminal-muted truncate mb-3">
            LOG: <span class="text-terminal-textBright">{bot.lastLog ?? 'Awaiting market trigger...'}</span>
          </div>
        </div>

        <!-- Bot Footer Actions -->
        <div class="flex items-center space-x-2 pt-2 border-t border-terminal-border">
          <button
            on:click={() => toggleBot(bot.id)}
            class="flex-1 py-2 text-xs font-pixel font-bold border-2 transition cel-btn cyber-clip-sm shadow-[2px_2px_0px_#000] flex items-center justify-center space-x-1.5 {bot.active ? 'bg-bear/25 hover:bg-bear/40 border-bear text-bear' : 'bg-bull/25 hover:bg-bull/40 border-bull text-bull'}"
          >
            {#if bot.active}
              <Pause class="w-3.5 h-3.5" />
              <span>PAUSE</span>
            {:else}
              <Play class="w-3.5 h-3.5" />
              <span>ENGAGE</span>
            {/if}
          </button>

          <button
            on:click={() => deleteBot(bot.id)}
            class="p-2 bg-terminal-surface hover:bg-bear/20 border-2 border-terminal-border hover:border-bear text-terminal-muted hover:text-bear transition cel-btn shadow-[2px_2px_0px_#000]"
            title="Delete Bot"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    {/each}
  </div>

  <!-- 15-Minute Delayed Stream & Institutional Macro Feed Banner -->
  <div class="bg-terminal-panel border-2 border-terminal-border cel-panel cyber-clip p-4 shadow-[4px_4px_0px_#000]">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-xs font-bold text-neon-cyan uppercase flex items-center font-pixel">
        <Network class="w-4 h-4 mr-2" /> 15-MINUTE DELAYED REAL-TIME DATA STREAM // ECN AGGREGATOR
      </h3>
      <span class="text-[9px] font-mono text-bull bg-bull/15 border border-bull px-2 py-0.5 font-bold">
        LATENCY BUFFER: 900 SECONDS
      </span>
    </div>
    <p class="text-xs text-terminal-muted leading-relaxed mb-3 font-chakra">
      Your quantitative algorithms ingest continuous ticker ticks across lit and dark liquidity pools. In Phase 3 ($10M+), retail margin liquidations are permanently replaced by senior Chapter 11 restructuring facilities.
    </p>
    <div class="flex items-center space-x-6 text-xs font-chakra">
      <span class="text-terminal-muted">FEED HEALTH: <strong class="text-bull font-pixel text-[9px]">STREAMING (ACTIVE)</strong></span>
      <span class="text-terminal-muted">ALGO ACCUMULATED P&L: <strong class="text-bull font-mono font-bold">+${$botStudioState.totalBotPnl.toLocaleString()}</strong></span>
      <span class="text-terminal-muted">FUND EQUITY POOL: <strong class="text-terminal-text font-mono font-bold">${$account.equity.toLocaleString()}</strong></span>
    </div>
  </div>

  <!-- Modal: Create / Deploy Algorithmic Bot -->
  {#if isCreateModalOpen}
    <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-terminal-panel border-3 border-neon-cyan cel-panel cyber-clip shadow-[8px_8px_0px_#000] p-6 font-mono select-none">
        <div class="flex items-center justify-between pb-3 border-b-2 border-neon-cyan mb-4">
          <div class="flex items-center space-x-2">
            <Settings2 class="w-5 h-5 text-neon-cyan" />
            <h2 class="text-sm font-bold text-terminal-textBright font-pixel uppercase">DEPLOY QUANTITATIVE BOT</h2>
          </div>
          <button on:click={() => (isCreateModalOpen = false)} class="text-terminal-muted hover:text-terminal-text">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3.5 text-xs font-chakra mb-5">
          <!-- Bot Name -->
          <div>
            <label for="bot-name-input" class="text-[9px] text-terminal-muted font-pixel block mb-1">BOT STRATEGY IDENTIFIER:</label>
            <input
              id="bot-name-input"
              type="text"
              bind:value={newBotName}
              class="w-full bg-terminal-bg border-2 border-terminal-border px-3 py-1.5 text-terminal-text font-mono focus:border-neon-cyan focus:outline-none"
            />
          </div>

          <!-- Target Asset -->
          <div>
            <label for="bot-ticker-select" class="text-[9px] text-terminal-muted font-pixel block mb-1">TARGET MARKET TICKER:</label>
            <select
              id="bot-ticker-select"
              bind:value={newBotTicker}
              class="w-full bg-terminal-bg border-2 border-terminal-border px-3 py-1.5 text-terminal-text font-mono focus:border-neon-cyan focus:outline-none"
            >
              {#each ['NVDA', 'TSLA', 'SPY', 'QQQ', 'BTC-USD', 'AMD', 'AAPL', 'GME'] as t}
                <option value={t}>{t}</option>
              {/each}
            </select>
          </div>

          <!-- Signal Node -->
          <div>
            <label for="bot-signal-select" class="text-[9px] text-terminal-muted font-pixel block mb-1">TRIGGER SIGNAL NODE:</label>
            <select
              id="bot-signal-select"
              bind:value={newBotSignal}
              class="w-full bg-terminal-bg border-2 border-terminal-border px-3 py-1.5 text-terminal-text font-mono focus:border-neon-cyan focus:outline-none"
            >
              <option value="EMA_CROSS">9/21 Exponential Moving Average Golden Cross</option>
              <option value="RSI_OVERSOLD">Relative Strength Index Oversold (&lt; 30)</option>
              <option value="RSI_OVERBOUGHT">Relative Strength Index Overbought (&gt; 70)</option>
              <option value="BOLLINGER_BREAKOUT">Bollinger Bands Volatility Squeeze Breakout</option>
              <option value="VOLUME_SPIKE">Volume Delta Surge (&gt; 2.5x ATR)</option>
              <option value="MACRO_NEWS">Macro Volatility Shock Corridor</option>
            </select>
          </div>

          <!-- Action Node -->
          <div>
            <label for="bot-action-select" class="text-[9px] text-terminal-muted font-pixel block mb-1">EXECUTION ACTION NODE:</label>
            <select
              id="bot-action-select"
              bind:value={newBotAction}
              class="w-full bg-terminal-bg border-2 border-terminal-border px-3 py-1.5 text-terminal-text font-mono focus:border-neon-cyan focus:outline-none"
            >
              <option value="BUY_BULL">Directional Long (BUY BULL)</option>
              <option value="SELL_BEAR">Directional Short (SELL BEAR)</option>
              <option value="MEAN_REVERT">Statistical Mean-Revert Scalp</option>
            </select>
          </div>

          <!-- Lot Sizing -->
          <div>
            <span class="text-[9px] text-terminal-muted font-pixel block mb-1">ORDER SIZING (LOTS):</span>
            <div class="grid grid-cols-4 gap-1.5 font-mono">
              {#each [10, 25, 50, 100] as l}
                <button
                  type="button"
                  on:click={() => (newBotLots = l)}
                  class="py-1 border-2 text-center font-bold cel-btn {newBotLots === l ? 'bg-neon-cyan/25 border-neon-cyan text-neon-cyan shadow-[2px_2px_0px_#000]' : 'bg-terminal-bg border-terminal-border text-terminal-muted'}"
                >
                  {l}L
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Deploy Button -->
        <button
          on:click={handleDeployBot}
          class="w-full py-3 bg-neon-cyan text-black font-pixel font-bold text-xs uppercase hover:brightness-110 active:translate-y-0.5 transition shadow-[4px_4px_0px_#000] cel-btn"
        >
          INITIALIZE & DEPLOY BOT TO FEED
        </button>
      </div>
    </div>
  {/if}
</div>
