<script lang="ts">
  import { minigameState, dismissMinigame, submitMinigameSuccess } from '../stores/minigame';
  import { account } from '../stores/trading';
  import { Briefcase, Clock, AlertTriangle, CheckCircle2, XCircle, TrendingUp, ShieldAlert, Award } from 'lucide-svelte';

  // Pitchbook state
  let evEbitda = 12;
  let targetEvEbitda = 14;
  let pe = 18;
  let targetPe = 22;
  let peg = 1.2;
  let targetPeg = 1.5;

  // Compliance state: 5 blotter items, 2 suspicious (#2 and #4)
  const blotter = [
    { id: 1, time: '14:22:01', ticker: 'NVDA', lots: 10, type: 'LIT_BUY', counterparty: 'Vanguard', isWash: false },
    { id: 2, time: '14:22:04', ticker: 'NVDA', lots: 85, type: 'CROSS_WASH', counterparty: 'Self-Dealing // NY4', isWash: true },
    { id: 3, time: '14:22:15', ticker: 'SPY', lots: 25, type: 'LIT_SELL', counterparty: 'BlackRock', isWash: false },
    { id: 4, time: '14:22:29', ticker: 'BTC-USD', lots: 99, type: 'SPOOF_QUOTE', counterparty: 'Unregistered Prop Desk', isWash: true },
    { id: 5, time: '14:22:40', ticker: 'AAPL', lots: 15, type: 'LIT_BUY', counterparty: 'Fidelity', isWash: false },
  ];
  let selectedBlotterIds: number[] = [];

  function toggleBlotter(id: number) {
    if (selectedBlotterIds.includes(id)) {
      selectedBlotterIds = selectedBlotterIds.filter((x) => x !== id);
    } else {
      if (selectedBlotterIds.length < 2) {
        selectedBlotterIds = [...selectedBlotterIds, id];
      }
    }
  }

  // LBO state
  let seniorDebtPct = 50;
  let mezzDebtPct = 15;

  $: totalDebtPct = seniorDebtPct + mezzDebtPct;
  $: sponsorEquityPct = 100 - totalDebtPct;
  $: isLboBalanced = totalDebtPct >= 65 && totalDebtPct <= 70 && seniorDebtPct >= 50;

  $: isPitchbookAligned =
    Math.abs(evEbitda - targetEvEbitda) <= 1 &&
    Math.abs(pe - targetPe) <= 1 &&
    Math.abs(peg - targetPeg) <= 0.2;

  $: isComplianceSolved =
    selectedBlotterIds.length === 2 &&
    selectedBlotterIds.includes(2) &&
    selectedBlotterIds.includes(4);

  function handleComplete() {
    submitMinigameSuccess();
  }
</script>

{#if $minigameState.isOpen && $minigameState.activeGame}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono select-none">
    <div class="w-full max-w-xl bg-terminal-panel border-2 border-neon-amber rounded-xl shadow-[0_0_50px_rgba(255,170,0,0.35)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="bg-neon-amber/15 border-b border-neon-amber/40 p-4 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Briefcase class="w-5 h-5 text-neon-amber animate-pulse" />
          <div>
            <span class="text-[10px] text-neon-amber font-bold tracking-widest uppercase block">
              IB HIGH-FREQUENCY DISTRACTION EVENT
            </span>
            <h2 class="text-sm font-bold text-terminal-textBright">
              {$minigameState.activeGame.title}
            </h2>
          </div>
        </div>

        <!-- Payout Pill -->
        <span class="px-2.5 py-1 rounded bg-bull/20 text-bull border border-bull/40 text-xs font-bold text-glow-bull flex items-center">
          <Award class="w-3.5 h-3.5 mr-1" />
          +${$minigameState.activeGame.payout.toLocaleString()}
        </span>
      </div>

      <!-- Warning: Live Market Running in Background -->
      <div class="bg-bear/20 border-b border-bear/40 px-4 py-2 flex items-center justify-between text-xs text-bear">
        <div class="flex items-center space-x-2">
          <AlertTriangle class="w-4 h-4 animate-bounce" />
          <span><strong>ATTENTION:</strong> Live chart positions are scrolling in background at full speed!</span>
        </div>
        <div class="flex items-center space-x-1 font-bold text-white bg-bear/40 px-2 py-0.5 rounded border border-bear">
          <Clock class="w-3.5 h-3.5" />
          <span>{$minigameState.secondsRemaining}s</span>
        </div>
      </div>

      <!-- Body / Active Puzzle Interface -->
      <div class="p-5 flex-1 space-y-4">
        <p class="text-xs text-terminal-muted leading-relaxed">
          {$minigameState.activeGame.description}
        </p>

        <!-- 1. Pitchbook Alignment -->
        {#if $minigameState.activeGame.id === 'PITCHBOOK'}
          <div class="bg-terminal-surface border border-terminal-border rounded-lg p-4 space-y-3">
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span>EV / EBITDA MULTIPLE:</span>
                <span class={Math.abs(evEbitda - targetEvEbitda) <= 1 ? 'text-bull font-bold' : 'text-neon-amber font-bold'}>
                  {evEbitda}x (TARGET: {targetEvEbitda}x)
                </span>
              </div>
              <input type="range" min="8" max="22" step="1" bind:value={evEbitda} class="w-full accent-neon-amber cursor-pointer" />
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span>PRICE-TO-EARNINGS (P/E):</span>
                <span class={Math.abs(pe - targetPe) <= 1 ? 'text-bull font-bold' : 'text-neon-amber font-bold'}>
                  {pe}x (TARGET: {targetPe}x)
                </span>
              </div>
              <input type="range" min="12" max="32" step="1" bind:value={pe} class="w-full accent-neon-amber cursor-pointer" />
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span>PEG RATIO:</span>
                <span class={Math.abs(peg - targetPeg) <= 0.2 ? 'text-bull font-bold' : 'text-neon-amber font-bold'}>
                  {peg.toFixed(1)}x (TARGET: {targetPeg.toFixed(1)}x)
                </span>
              </div>
              <input type="range" min="0.8" max="2.5" step="0.1" bind:value={peg} class="w-full accent-neon-amber cursor-pointer" />
            </div>
          </div>
        {/if}

        <!-- 2. Compliance Audit -->
        {#if $minigameState.activeGame.id === 'COMPLIANCE'}
          <div class="bg-terminal-surface border border-terminal-border rounded-lg p-3 space-y-1.5 text-xs">
            <span class="text-[10px] text-terminal-muted uppercase block font-bold mb-1">
              CLICK 2 ANOMALOUS WASH / SPOOF TRADES:
            </span>
            {#each blotter as b}
              <button
                type="button"
                on:click={() => toggleBlotter(b.id)}
                class="w-full text-left p-2 rounded border transition flex items-center justify-between {selectedBlotterIds.includes(b.id) ? 'bg-neon-amber/20 border-neon-amber text-neon-amber font-bold' : 'bg-terminal-panel border-terminal-border text-terminal-text hover:bg-terminal-border'}"
              >
                <span>{b.time} • {b.ticker} • {b.lots}L • {b.type}</span>
                <span class="text-[10px] text-terminal-muted">{b.counterparty}</span>
              </button>
            {/each}
          </div>
        {/if}

        <!-- 3. LBO Debt Waterfall -->
        {#if $minigameState.activeGame.id === 'LBO_WATERFALL'}
          <div class="bg-terminal-surface border border-terminal-border rounded-lg p-4 space-y-3">
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span>SENIOR SECURED BANK DEBT:</span>
                <span class="text-neon-cyan font-bold">{seniorDebtPct}% (Target: &ge;50%)</span>
              </div>
              <input type="range" min="30" max="70" step="5" bind:value={seniorDebtPct} class="w-full accent-neon-cyan cursor-pointer" />
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span>MEZZANINE SUBORDINATED NOTES:</span>
                <span class="text-neon-amber font-bold">{mezzDebtPct}%</span>
              </div>
              <input type="range" min="5" max="30" step="5" bind:value={mezzDebtPct} class="w-full accent-neon-amber cursor-pointer" />
            </div>

            <div class="p-2 rounded bg-terminal-panel border border-terminal-border flex justify-between text-xs">
              <span>TOTAL DEBT (LTV): <strong class={totalDebtPct >= 65 && totalDebtPct <= 70 ? 'text-bull' : 'text-bear'}>{totalDebtPct}%</strong> (HURDLE: 65-70%)</span>
              <span>EQUITY: <strong class="text-terminal-text">{sponsorEquityPct}%</strong></span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer Buttons -->
      <div class="bg-terminal-surface border-t border-terminal-border p-4 flex items-center justify-between">
        <button
          type="button"
          on:click={dismissMinigame}
          class="px-4 py-2 rounded text-xs text-terminal-muted hover:text-terminal-text border border-terminal-border transition"
        >
          IGNORE DEAL (RETURN TO TAPE)
        </button>

        {#if $minigameState.activeGame.id === 'PITCHBOOK'}
          <button
            type="button"
            disabled={!isPitchbookAligned}
            on:click={handleComplete}
            class="px-5 py-2.5 rounded text-xs font-bold transition flex items-center space-x-1.5 {isPitchbookAligned ? 'bg-bull text-terminal-bg hover:brightness-110 shadow-lg cursor-pointer' : 'bg-terminal-panel text-terminal-muted border border-terminal-border cursor-not-allowed'}"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>SUBMIT VALUATION DECK</span>
          </button>
        {:else if $minigameState.activeGame.id === 'COMPLIANCE'}
          <button
            type="button"
            disabled={!isComplianceSolved}
            on:click={handleComplete}
            class="px-5 py-2.5 rounded text-xs font-bold transition flex items-center space-x-1.5 {isComplianceSolved ? 'bg-bull text-terminal-bg hover:brightness-110 shadow-lg cursor-pointer' : 'bg-terminal-panel text-terminal-muted border border-terminal-border cursor-not-allowed'}"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>FLAG SUSPICIOUS TRADES</span>
          </button>
        {:else if $minigameState.activeGame.id === 'LBO_WATERFALL'}
          <button
            type="button"
            disabled={!isLboBalanced}
            on:click={handleComplete}
            class="px-5 py-2.5 rounded text-xs font-bold transition flex items-center space-x-1.5 {isLboBalanced ? 'bg-bull text-terminal-bg hover:brightness-110 shadow-lg cursor-pointer' : 'bg-terminal-panel text-terminal-muted border border-terminal-border cursor-not-allowed'}"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>EXECUTE LBO FINANCING</span>
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
