<script lang="ts">
  import { activeNewsAlert } from '../stores/trading';
  import { AlertTriangle, Zap } from 'lucide-svelte';
</script>

{#if $activeNewsAlert}
  <div class="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-pulse">
    <div class="cel-panel px-6 py-2.5 bg-black/95 border-2 border-neon-amber shadow-[4px_4px_0px_#000] flex items-center space-x-3 text-xs font-mono font-bold text-neon-amber cyber-clip-sm">
      <Zap class="w-5 h-5 text-neon-amber animate-bounce" />
      <span class="tracking-widest uppercase font-pixel text-[11px] text-neon-amber text-glow-amber">
        {$activeNewsAlert.headline}
      </span>
      <AlertTriangle class="w-5 h-5 text-neon-amber animate-bounce" />
    </div>
  </div>
{/if}

<style>
  .text-glow-amber {
    text-shadow: 0 0 10px rgba(255, 209, 102, 0.8), 0 0 20px rgba(255, 209, 102, 0.4);
  }
</style>
