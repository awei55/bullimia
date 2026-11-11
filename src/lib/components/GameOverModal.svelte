<script lang="ts">
  import { account } from '../stores/trading';
  import { ShieldAlert, RotateCcw, Skull } from 'lucide-svelte';

  export let onRestart: () => void = () => {};

  let showModal = false;
  let isRestarting = false;

  $: if ($account.is_margin_called) {
    const timer = setTimeout(() => {
      showModal = true;
    }, 600);
  } else {
    showModal = false;
  }

  $: isDeadBroke = $account.death_reason === 'DEAD_BROKE' || (!$account.death_reason && $account.high_watermark < 10000);

  async function handleRestart() {
    if (isRestarting) return;
    isRestarting = true;
    try {
      showModal = false;
      await onRestart();
    } finally {
      isRestarting = false;
    }
  }
</script>

{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none crt-overlay">
    <div class="w-full max-w-md cel-panel border-4 border-bear p-6 text-center shadow-[6px_6px_0px_#000] cyber-clip animate-in zoom-in-95 duration-200">
      <div class="w-16 h-16 rounded-none bg-bear text-white mx-auto flex items-center justify-center mb-4 border-2 border-black shadow-[3px_3px_0_#000]">
        {#if isDeadBroke}
          <Skull class="w-10 h-10" />
        {:else}
          <ShieldAlert class="w-10 h-10" />
        {/if}
      </div>

      <h2 class="text-xl sm:text-2xl font-black pixel-title text-bear text-glow-bear uppercase mb-2">
        {isDeadBroke ? 'DEAD BROKE' : 'MARGIN CALLED'}
      </h2>
      <p class="text-[11px] pixel-text text-terminal-muted mb-6 leading-relaxed">
        {#if isDeadBroke}
          Account wiped out to zero. You ran out of cash on retail streets.
        {:else}
          Equity breached maintenance margin. Exchange forcibly liquidated your book.
        {/if}
      </p>

      <div class="cel-card p-4 mb-6 text-xs text-left space-y-1.5 font-chakra border-2 border-black">
        <div class="flex justify-between py-1 text-terminal-muted">
          <span class="pixel-text text-[9px]">FINAL EQUITY:</span>
          <span class="text-bear font-bold">${$account.equity.toLocaleString()}</span>
        </div>
        <div class="flex justify-between py-1 text-terminal-muted">
          <span class="pixel-text text-[9px]">TOTAL TRADES:</span>
          <span class="text-white font-bold">{$account.trade_count}</span>
        </div>
        <div class="flex justify-between py-1 text-terminal-muted">
          <span class="pixel-text text-[9px]">COMMISSIONS:</span>
          <span class="text-white font-bold">${$account.total_commission_paid.toLocaleString()}</span>
        </div>
      </div>

      <button
        on:click={handleRestart}
        class="w-full py-3.5 cel-btn bg-bear hover:brightness-110 text-white font-black pixel-text text-xs flex items-center justify-center space-x-2 cursor-pointer uppercase shadow-[4px_4px_0_#000]"
      >
        <RotateCcw class="w-4 h-4" />
        <span>{isDeadBroke ? 'RETRY TUTORIAL ($1,000 START)' : 'RESTART RUN ($1,000 START)'}</span>
      </button>
    </div>
  </div>
{/if}
