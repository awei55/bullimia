<script lang="ts">
  import { creditorRestructuringState, closeCreditorModal, repayCreditorDebt } from '../stores/creditor_restructuring';
  import { account } from '../stores/trading';
  import { AlertTriangle, ShieldAlert, DollarSign, CheckCircle2, ArrowRight } from 'lucide-svelte';

  $: notice = $creditorRestructuringState.activeNotice;
  let customRepayAmount = 1000000;

  function handleAccept() {
    closeCreditorModal();
  }

  function handleQuickRepay() {
    repayCreditorDebt(customRepayAmount);
  }
</script>

{#if $creditorRestructuringState.isModalOpen && notice}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="max-w-xl w-full bg-terminal-panel border-3 border-neon-amber cel-panel cyber-clip shadow-[8px_8px_0px_#000] p-6 font-mono select-none animate-in fade-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="flex items-center space-x-3 pb-3 border-b-2 border-neon-amber/50 mb-4">
        <div class="p-2 bg-neon-amber/20 border-2 border-neon-amber text-neon-amber cyber-clip-sm">
          <ShieldAlert class="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <span class="text-[10px] text-neon-amber font-pixel uppercase tracking-widest block">
            CHAPTER 11 SENIOR CREDITOR FACILITY
          </span>
          <h2 class="text-base font-bold text-terminal-textBright font-chakra">
            {notice.title}
          </h2>
        </div>
      </div>

      <!-- Consortium Message -->
      <div class="p-3.5 bg-terminal-surface border-2 border-terminal-border mb-4 text-xs font-chakra leading-relaxed text-terminal-text cel-card cyber-clip-sm">
        <p class="text-neon-amber font-bold mb-2 font-pixel text-[10px]">
          CONSORTIUM MEMORANDUM: {notice.consortium}
        </p>
        <p class="text-terminal-muted mb-2">
          Your multi-venue trading operations have breached maintenance margin thresholds. Because your fund controls over $10,000,000 in notional flow, standard retail liquidation has been <strong class="text-bull">SUPERSEDED</strong>.
        </p>
        <p class="text-terminal-muted">
          The Senior Creditor Consortium has injected emergency rescue liquidity into your trading pool under a senior secured debt note with compounding daily interest.
        </p>
      </div>

      <!-- Financial Terms Docket -->
      <div class="grid grid-cols-2 gap-3 mb-5 font-mono text-xs">
        <div class="bg-terminal-bg p-3 border-2 border-bull/60 cel-card cyber-clip-sm">
          <span class="text-[9px] text-terminal-muted block font-pixel">RESCUE CAPITAL INJECTED:</span>
          <span class="text-lg font-bold text-bull font-mono">+${notice.rescueCash.toLocaleString()}</span>
        </div>

        <div class="bg-terminal-bg p-3 border-2 border-bear/60 cel-card cyber-clip-sm">
          <span class="text-[9px] text-terminal-muted block font-pixel">NEW OUTSTANDING DEBT:</span>
          <span class="text-lg font-bold text-bear font-mono">${notice.debtAdded.toLocaleString()}</span>
        </div>

        <div class="bg-terminal-bg p-3 border-2 border-neon-amber/60 cel-card cyber-clip-sm">
          <span class="text-[9px] text-terminal-muted block font-pixel">INTEREST RATE SCHEDULE:</span>
          <span class="text-base font-bold text-neon-amber font-mono">{notice.interestRate.toFixed(2)}% (SOFR + 650 bps)</span>
        </div>

        <div class="bg-terminal-bg p-3 border-2 border-neon-cyan/60 cel-card cyber-clip-sm">
          <span class="text-[9px] text-terminal-muted block font-pixel">CONSECUTIVE BREACH COUNT:</span>
          <span class="text-base font-bold text-neon-cyan font-mono">BREACH #{notice.breachCount}</span>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center space-x-3">
        <button
          on:click={handleAccept}
          class="flex-1 py-3 bg-neon-amber text-black font-pixel font-bold text-xs uppercase hover:brightness-110 active:translate-y-0.5 transition shadow-[4px_4px_0px_#000] cel-btn flex items-center justify-center space-x-2"
        >
          <span>ACCEPT TERMS & RESUME TRADING</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
{/if}
