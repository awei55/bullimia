<script lang="ts">
  import { onMount } from 'svelte';
  import { SaveManager, getPhaseTitle } from '../services/save_manager';
  import type { SaveState } from '../types';
  import { Play, RotateCcw, Settings, Terminal, TrendingUp, Trophy, ArrowRight } from 'lucide-svelte';

  export let onStartNew: () => void = () => {};
  export let onResume: (save: SaveState) => void = () => {};
  export let onOpenOptions: () => void = () => {};
  export let onOpenDevConsole: () => void = () => {};

  let savedGame: SaveState | null = null;
  let isLoadingSave = true;

  onMount(async () => {
    savedGame = await SaveManager.loadCareer();
    isLoadingSave = false;
  });

  function formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(val);
  }
</script>

<div class="fixed inset-0 z-40 flex items-center justify-center bg-terminal-bg/95 backdrop-blur-md p-6 select-none crt-overlay">
  <div class="w-full max-w-xl bg-terminal-panel border border-terminal-border rounded-xl shadow-2xl overflow-hidden flex flex-col p-8 text-center relative">
    <!-- Ambient Cyber Glows -->
    <div class="absolute -top-24 -left-24 w-60 h-60 bg-bull/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -right-24 w-60 h-60 bg-bear/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Title Logo & Tagline -->
    <div class="mb-6">
      <div class="flex items-center justify-center space-x-2 text-xs font-mono text-terminal-muted tracking-widest uppercase mb-1">
        <span>EST. 2026</span>
        <span>•</span>
        <span>INSTITUTIONAL QUANT SIMULATOR</span>
      </div>
      <h1 class="text-5xl font-black font-display tracking-tight text-terminal-textBright flex items-center justify-center space-x-2">
        <span class="text-bull text-glow-bull">BULL</span><span class="text-bear text-glow-bear">IMIA</span>
      </h1>
      <p class="text-xs font-mono text-neon-cyan mt-2 tracking-wider uppercase">
        2D Japanese Candlestick Autoscroller // Macro & Microstructure
      </p>
    </div>

    <!-- Saved Career Summary Card (If Exists) -->
    {#if savedGame}
      <div class="bg-terminal-surface border border-bull/40 rounded-lg p-4 mb-6 text-left relative overflow-hidden">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-mono uppercase tracking-widest text-bull font-bold flex items-center">
            <TrendingUp class="w-3.5 h-3.5 mr-1" /> ACTIVE CAREER DETECTED
          </span>
          <span class="text-[10px] font-mono text-terminal-muted">
            {new Date(savedGame.timestamp).toLocaleDateString()}
          </span>
        </div>
        <div class="flex items-baseline justify-between">
          <div>
            <div class="text-2xl font-bold font-mono text-bull text-glow-bull">
              {formatCurrency(savedGame.account.equity)}
            </div>
            <div class="text-xs font-mono text-terminal-muted mt-0.5">
              {getPhaseTitle(savedGame.phase)}
            </div>
          </div>
          {#if savedGame.openPosition && savedGame.openPosition.side !== 'FLAT'}
            <div class="text-right">
              <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold {savedGame.openPosition.side === 'BULL' ? 'bg-bull/20 text-bull border border-bull/40' : 'bg-bear/20 text-bear border border-bear/40'}">
                {savedGame.openPosition.side} {savedGame.openPosition.lots}L @ ${savedGame.openPosition.entryPrice.toFixed(2)}
              </span>
              <div class="text-[10px] font-mono text-terminal-muted mt-1">
                Asset: {savedGame.currentLevelId}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Main Menu Action Buttons -->
    <div class="space-y-3 font-mono">
      {#if savedGame}
        <button
          on:click={() => onResume(savedGame)}
          class="w-full py-3.5 rounded-lg bg-bull hover:bg-bull-dark text-black font-bold tracking-wider text-sm shadow-lg shadow-bull/25 transition flex items-center justify-center space-x-2"
        >
          <Play class="w-4 h-4 fill-black" />
          <span>RESUME CAREER ({formatCurrency(savedGame.account.equity)})</span>
          <ArrowRight class="w-4 h-4 ml-1" />
        </button>
      {/if}

      <button
        on:click={onStartNew}
        class="w-full py-3 rounded-lg {savedGame ? 'bg-terminal-surface hover:bg-terminal-border text-terminal-text border border-terminal-border' : 'bg-bull hover:bg-bull-dark text-black font-bold shadow-lg shadow-bull/25'} text-sm transition flex items-center justify-center space-x-2"
      >
        <RotateCcw class="w-4 h-4" />
        <span>START NEW CAREER ($10,000)</span>
      </button>

      <div class="grid grid-cols-2 gap-3 pt-2">
        <button
          on:click={onOpenOptions}
          class="py-2.5 rounded-lg bg-terminal-surface hover:bg-terminal-border text-terminal-text border border-terminal-border text-xs transition flex items-center justify-center space-x-2"
        >
          <Settings class="w-4 h-4 text-terminal-muted" />
          <span>OPTIONS</span>
        </button>

        <button
          on:click={onOpenDevConsole}
          class="py-2.5 rounded-lg bg-terminal-surface hover:bg-terminal-border text-neon-cyan border border-neon-cyan/40 text-xs transition flex items-center justify-center space-x-2"
        >
          <Terminal class="w-4 h-4 text-neon-cyan" />
          <span>DEV CONSOLE</span>
        </button>
      </div>
    </div>

    <!-- Micro-Footer -->
    <div class="mt-8 text-[11px] font-mono text-terminal-muted flex items-center justify-center space-x-4">
      <span>TAURI v2 + SVELTE 5</span>
      <span>•</span>
      <span>PIXI.JS 8 WEBGL</span>
      <span>•</span>
      <span>PYTHON QUANT</span>
    </div>
  </div>
</div>
