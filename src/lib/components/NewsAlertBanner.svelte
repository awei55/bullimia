<script lang="ts">
  import { activeNewsAlert } from '../stores/trading';
  import { AlertTriangle, Zap } from 'lucide-svelte';
</script>

{#if $activeNewsAlert}
  <div class="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-pulse">
    <div class="px-5 py-2.5 rounded-lg bg-black/90 border-2 border-neon-amber shadow-2xl shadow-neon-amber/40 flex items-center space-x-3 text-xs font-mono font-bold text-neon-amber text-glow-amber">
      <Zap class="w-5 h-5 animate-bounce" />
      <span class="tracking-wider uppercase">{$activeNewsAlert.headline}</span>
      <AlertTriangle class="w-5 h-5 animate-bounce" />
    </div>
  </div>
{/if}

<style>
  .text-glow-amber {
    text-shadow: 0 0 10px rgba(255, 209, 102, 0.8), 0 0 20px rgba(255, 209, 102, 0.4);
  }
</style>
