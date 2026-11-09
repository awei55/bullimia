<script lang="ts">
  import { account, resetCareer } from '../stores/trading';
  import { Trophy, ShieldAlert, RotateCcw } from 'lucide-svelte';

  export let onRestart: () => void = () => {};

  async function handleRestart() {
    await resetCareer(10000.0);
    onRestart();
  }
</script>

{#if $account.is_margin_called}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
    <div class="w-full max-w-md bg-terminal-panel border-2 border-bear rounded-lg shadow-2xl p-6 text-center animate-bounce-short">
      <div class="w-16 h-16 rounded-full bg-bear/20 border border-bear/50 mx-auto flex items-center justify-center text-bear mb-4">
        <ShieldAlert class="w-9 h-9" />
      </div>
      <h2 class="text-2xl font-bold font-mono tracking-wider text-bear text-glow-bear uppercase mb-2">
        MARGIN CALL // LIQUIDATED
      </h2>
      <p class="text-sm font-mono text-terminal-muted mb-6">
        Your position equity breached maintenance margin requirements. The exchange liquidated your account.
      </p>

      <div class="bg-terminal-surface border border-terminal-border rounded p-3 mb-6 text-xs font-mono text-left">
        <div class="flex justify-between py-1 text-terminal-muted">
          <span>FINAL EQUITY:</span>
          <span class="text-bear font-bold">${$account.equity.toLocaleString()}</span>
        </div>
        <div class="flex justify-between py-1 text-terminal-muted">
          <span>TOTAL TRADES:</span>
          <span class="text-terminal-text">{$account.trade_count}</span>
        </div>
        <div class="flex justify-between py-1 text-terminal-muted">
          <span>COMMISSIONS PAID:</span>
          <span class="text-terminal-text">${$account.total_commission_paid.toLocaleString()}</span>
        </div>
      </div>

      <button
        on:click={handleRestart}
        class="w-full py-3 rounded bg-bear hover:bg-bear-dark text-white font-mono font-bold tracking-wider text-sm shadow-lg shadow-bear/30 transition flex items-center justify-center space-x-2"
      >
        <RotateCcw class="w-4 h-4" />
        <span>RESTART CAREER ($10,000)</span>
      </button>
    </div>
  </div>
{/if}
