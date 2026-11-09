<script lang="ts">
  import { benefactorState } from '../stores/trading';
  import { DollarSign, Radio, Check, Unlock, UserCheck, Zap } from 'lucide-svelte';

  function handleDismiss() {
    benefactorState.update((s) => ({ ...s, activeDialog: null }));
  }
</script>

{#if $benefactorState.activeDialog}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none crt-overlay">
    <div class="w-full max-w-lg cel-panel border-4 border-neon-amber p-6 flex flex-col font-chakra text-xs shadow-[8px_8px_0_#000] cyber-clip animate-in zoom-in-95 duration-200">
      <!-- Pager Header -->
      <div class="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
        <div class="flex items-center space-x-2">
          <div class="w-3.5 h-3.5 bg-neon-amber border border-black animate-ping"></div>
          <span class="pixel-text text-[10px] text-neon-amber font-black tracking-widest uppercase">
            {$benefactorState.activeDialog.title || 'ENCRYPTED PAGER TRANSMISSION'}
          </span>
        </div>
        <span class="pixel-text text-[9px] text-terminal-muted">CH-77 • QUANTUM LINK</span>
      </div>

      <!-- Caller ID Card -->
      <div class="flex items-center space-x-3 cel-card p-3 mb-4 border-2 border-black">
        <div class="w-12 h-12 bg-neon-amber border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0_#000]">
          <UserCheck class="w-7 h-7" />
        </div>
        <div>
          <h3 class="pixel-text text-xs font-black text-white">GORDON "THE BARRACUDA"</h3>
          <p class="text-[10px] text-terminal-muted mt-0.5">Senior Managing Partner • Hedge Fund Benefactor</p>
        </div>
      </div>

      <!-- Dialogue Message -->
      <div class="bg-black/70 border-2 border-black p-4 mb-4 text-terminal-text leading-relaxed text-xs">
        <p class="italic text-[12px] text-neon-cyan leading-relaxed">
          "{$benefactorState.activeDialog.message}"
        </p>
      </div>

      <!-- Wire Amount & Unlock Badges -->
      <div class="grid grid-cols-2 gap-3 mb-5">
        <div class="cel-card p-3 text-center border-2 border-black">
          <span class="pixel-text text-[8px] text-terminal-muted uppercase block">CAPITAL INJECTED</span>
          <span class="text-lg font-black text-bull text-glow-bull flex items-center justify-center mt-1">
            <DollarSign class="w-4 h-4 mr-0.5" /> +$9,000.00
          </span>
        </div>

        <div class="cel-card p-3 text-center border-2 border-black">
          <span class="pixel-text text-[8px] text-terminal-muted uppercase block">SYSTEM UNLOCKED</span>
          <span class="text-[11px] font-black text-neon-cyan flex items-center justify-center mt-1">
            <Unlock class="w-3.5 h-3.5 mr-1 text-neon-amber" /> ASSETS (KEYS 1-8)
          </span>
        </div>
      </div>

      <!-- Action Button -->
      <button
        type="button"
        on:click={handleDismiss}
        class="w-full py-3.5 cel-btn bg-neon-amber hover:brightness-110 text-black font-black pixel-text text-xs flex items-center justify-center space-x-2 uppercase cursor-pointer shadow-[4px_4px_0_#000]"
      >
        <Check class="w-4 h-4" />
        <span>ACCEPT WIRE & START TRADING ASSETS</span>
      </button>
    </div>
  </div>
{/if}
