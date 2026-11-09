<script lang="ts">
  import { benefactorState } from '../stores/trading';
  import { DollarSign, Radio, Check, Unlock, UserCheck } from 'lucide-svelte';

  function handleDismiss() {
    benefactorState.update((s) => ({ ...s, activeDialog: null }));
  }
</script>

{#if $benefactorState.activeDialog}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none crt-overlay">
    <div class="w-full max-w-lg bg-terminal-panel border-2 border-neon-amber rounded-xl shadow-2xl p-6 flex flex-col font-mono text-xs">
      <!-- Pager Header -->
      <div class="flex items-center justify-between pb-3 border-b border-terminal-border mb-4">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full bg-neon-amber animate-ping"></div>
          <span class="text-neon-amber font-bold tracking-widest uppercase">
            {$benefactorState.activeDialog.title || 'ENCRYPTED TRANSMISSION // UNCLE GORDON'}
          </span>
        </div>
        <span class="text-[10px] text-terminal-muted">CH-77 • QUANTUM LINK</span>
      </div>

      <!-- Caller ID Card -->
      <div class="flex items-center space-x-3 bg-terminal-surface border border-terminal-border rounded-lg p-3 mb-4">
        <div class="w-12 h-12 rounded-full bg-neon-amber/20 border border-neon-amber flex items-center justify-center text-neon-amber">
          <UserCheck class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-terminal-textBright">GORDON "THE BARRACUDA"</h3>
          <p class="text-[10px] text-terminal-muted">Senior Managing Partner • Hedge Fund Benefactor</p>
        </div>
      </div>

      <!-- Dialogue Message -->
      <div class="bg-terminal-bg border border-terminal-border rounded-lg p-4 mb-4 text-terminal-text leading-relaxed text-xs">
        <p class="mb-2 italic">
          "{$benefactorState.activeDialog.message}"
        </p>
      </div>

      <!-- Wire Amount & Unlock Badges -->
      <div class="grid grid-cols-2 gap-3 mb-5">
        <div class="bg-bull/15 border border-bull/40 rounded-lg p-2.5 text-center">
          <span class="text-[10px] text-terminal-muted uppercase block">CAPITAL INJECTED</span>
          <span class="text-base font-bold text-bull text-glow-bull flex items-center justify-center mt-0.5">
            <DollarSign class="w-4 h-4 mr-0.5" /> +$9,000.00
          </span>
        </div>

        <div class="bg-neon-cyan/15 border border-neon-cyan/40 rounded-lg p-2.5 text-center">
          <span class="text-[10px] text-terminal-muted uppercase block">SYSTEM UNLOCKED</span>
          <span class="text-xs font-bold text-neon-cyan flex items-center justify-center mt-1">
            <Unlock class="w-3.5 h-3.5 mr-1" /> ASSET SWITCHER (1-8)
          </span>
        </div>
      </div>

      <!-- Action Button -->
      <button
        on:click={handleDismiss}
        class="w-full py-3 rounded-lg bg-neon-amber hover:bg-amber-400 text-black font-bold tracking-wider text-xs shadow-lg shadow-neon-amber/30 transition flex items-center justify-center space-x-2 uppercase"
      >
        <Check class="w-4 h-4" />
        <span>ACCEPT WIRE & START TRADING ASSETS</span>
      </button>
    </div>
  </div>
{/if}
