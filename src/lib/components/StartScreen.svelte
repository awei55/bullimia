<script lang="ts">
  import { onMount } from 'svelte';
  import { SaveManager, getPhaseTitle } from '../services/save_manager';
  import type { SaveState } from '../types';
  import { Play, RotateCcw, Settings, Terminal, TrendingUp, Trophy, ArrowRight, Zap, ShieldAlert } from 'lucide-svelte';

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

<div class="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 select-none crt-overlay">
  <div class="w-full max-w-xl cel-panel cyber-clip rounded-none p-8 text-center relative animate-in fade-in zoom-in-95 duration-200">
    <!-- Ambient Arcade Glows -->
    <div class="absolute -top-24 -left-24 w-60 h-60 bg-bull/15 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -right-24 w-60 h-60 bg-bear/15 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Arcade Header Banner -->
    <div class="mb-6">
      <div class="inline-flex items-center space-x-2 px-3 py-1 bg-black/60 border border-neon-cyan/40 text-[9px] pixel-text text-neon-cyan tracking-widest uppercase mb-3">
        <Zap class="w-3 h-3 text-neon-cyan animate-pulse" />
        <span>CYBER-FINANCIAL 2D AUTOSCROLLER</span>
      </div>

      <!-- Giant Pixel Game Title -->
      <h1 class="text-4xl sm:text-5xl font-black pixel-title tracking-tight text-white flex items-center justify-center space-x-1 my-2">
        <span class="text-bull">BULL</span><span class="text-bear">IMIA</span>
      </h1>
      
      <p class="text-[11px] pixel-text text-neon-amber mt-2 tracking-wide uppercase">
        SURF THE TAPE • FLIP AT THE SPREAD • ESCAPE LIQUIDATION
      </p>
    </div>

    <!-- Active Save Card (If Exists) -->
    {#if savedGame}
      <div class="cel-card p-4 mb-6 text-left relative overflow-hidden border-2 border-bull">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[9px] pixel-text uppercase tracking-widest text-bull font-bold flex items-center">
            <TrendingUp class="w-3.5 h-3.5 mr-1.5" /> ACTIVE CAREER DETECTED // RESUME AVAILABLE
          </span>
          <span class="text-[9px] pixel-text text-terminal-muted">
            {new Date(savedGame.timestamp).toLocaleDateString()}
          </span>
        </div>
        <div class="flex items-baseline justify-between">
          <div>
            <div class="text-2xl font-black font-chakra text-bull text-glow-bull">
              {formatCurrency(savedGame.account.equity)}
            </div>
            <div class="text-[10px] pixel-text text-terminal-muted mt-0.5">
              {getPhaseTitle(savedGame.phase)}
            </div>
          </div>
          {#if savedGame.openPosition && savedGame.openPosition.side !== 'FLAT'}
            <div class="text-right">
              <span class="px-2.5 py-1 text-[10px] pixel-text font-bold {savedGame.openPosition.side === 'BULL' ? 'bg-bull text-black' : 'bg-bear text-white'} border border-black shadow-[2px_2px_0px_#000]">
                {savedGame.openPosition.side} {savedGame.openPosition.lots}L
              </span>
              <div class="text-[10px] font-mono text-neon-cyan mt-1.5">
                ON {savedGame.currentLevelId}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Main Arcade Buttons -->
    <div class="space-y-3 font-chakra">
      {#if savedGame}
        <button
          type="button"
          on:click={() => onResume(savedGame)}
          class="w-full py-3.5 cel-btn bg-bull hover:brightness-110 text-black font-black tracking-wider text-sm flex items-center justify-center space-x-2 cursor-pointer uppercase"
        >
          <Play class="w-4 h-4 fill-black" />
          <span>RESUME GAME ({formatCurrency(savedGame.account.equity)})</span>
          <ArrowRight class="w-4 h-4 ml-1" />
        </button>

        <button
          type="button"
          on:click={onStartNew}
          class="w-full py-2.5 cel-btn bg-terminal-surface hover:bg-terminal-border text-terminal-text text-xs flex items-center justify-center space-x-2 cursor-pointer uppercase"
        >
          <RotateCcw class="w-3.5 h-3.5 text-neon-amber" />
          <span>NEW RUN ($1,000 GENESIS START)</span>
        </button>
      {:else}
        <button
          type="button"
          on:click={onStartNew}
          class="w-full py-4 cel-btn bg-bull hover:brightness-110 text-black font-black tracking-widest text-base flex items-center justify-center space-x-2 cursor-pointer uppercase shadow-[4px_4px_0px_#000]"
        >
          <Play class="w-5 h-5 fill-black" />
          <span class="pixel-text font-bold">START GAME ($1,000 USD)</span>
          <ArrowRight class="w-5 h-5 ml-1" />
        </button>
      {/if}

      <!-- Options & Dev Console Grid -->
      <div class="grid grid-cols-2 gap-2 pt-2">
        <button
          type="button"
          on:click={onOpenOptions}
          class="py-2.5 cel-btn bg-terminal-surface hover:bg-terminal-border text-terminal-text text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <Settings class="w-3.5 h-3.5 text-terminal-muted" />
          <span class="pixel-text text-[10px]">SETTINGS</span>
        </button>

        <button
          type="button"
          on:click={onOpenDevConsole}
          class="py-2.5 cel-btn bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <Terminal class="w-3.5 h-3.5 text-neon-cyan" />
          <span class="pixel-text text-[10px]">DEV WARP</span>
        </button>
      </div>
    </div>

    <!-- Footer Arcade Tag -->
    <div class="mt-6 pt-4 border-t border-black text-[9px] pixel-text text-terminal-muted flex justify-between">
      <span>TAP [SPACE] FLIP • HOLD [SPACE] LOTS</span>
      <span class="text-neon-cyan">v2.1 INDIE ARCADE</span>
    </div>
  </div>
</div>
