<script lang="ts">
  import { soundEngine } from '../audio/soundtrack';
  import { SaveManager } from '../services/save_manager';
  import { X, Volume2, Monitor, Trash2, Check } from 'lucide-svelte';

  export let isOpen = false;
  export let crtEnabled = true;
  export let onClose: () => void = () => {};
  export let onResetCareer: () => void = () => {};

  let masterVolume = 70;
  let musicVolume = 35;
  let sfxVolume = 55;
  let isConfirmingDelete = false;

  function handleVolumeChange() {
    // Sync with sound engine
    soundEngine.resume();
  }

  async function handleDeleteCareer() {
    await SaveManager.deleteCareer();
    onResetCareer();
    isConfirmingDelete = false;
    onClose();
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
    <div class="w-full max-w-md bg-terminal-panel border border-terminal-border rounded-lg shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="px-5 py-4 border-b border-terminal-border flex items-center justify-between bg-terminal-surface">
        <div class="flex items-center space-x-2">
          <Monitor class="w-5 h-5 text-neon-cyan" />
          <h2 class="text-sm font-bold font-mono tracking-wide text-terminal-textBright uppercase">
            TERMINAL SETTINGS & AUDIO
          </h2>
        </div>
        <button on:click={onClose} class="text-terminal-muted hover:text-terminal-textBright transition">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-5 font-mono text-xs">
        <!-- Master Volume -->
        <div>
          <div class="flex justify-between text-terminal-muted mb-1">
            <span>MASTER AUDIO</span>
            <span class="text-terminal-textBright font-bold">{masterVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            bind:value={masterVolume}
            on:input={handleVolumeChange}
            class="w-full accent-bull bg-terminal-surface h-1.5 rounded cursor-pointer"
          />
        </div>

        <!-- Music Volume -->
        <div>
          <div class="flex justify-between text-terminal-muted mb-1">
            <span>SYNTHWAVE SOUNDTRACK</span>
            <span class="text-terminal-textBright font-bold">{musicVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            bind:value={musicVolume}
            on:input={handleVolumeChange}
            class="w-full accent-bull bg-terminal-surface h-1.5 rounded cursor-pointer"
          />
        </div>

        <!-- SFX Volume -->
        <div>
          <div class="flex justify-between text-terminal-muted mb-1">
            <span>MARKET & ORDER SFX</span>
            <span class="text-terminal-textBright font-bold">{sfxVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            bind:value={sfxVolume}
            on:input={handleVolumeChange}
            class="w-full accent-bull bg-terminal-surface h-1.5 rounded cursor-pointer"
          />
        </div>

        <!-- CRT Scanline Toggle -->
        <div class="pt-2 border-t border-terminal-border flex items-center justify-between">
          <div>
            <div class="text-terminal-text font-bold">CRT SCANLINE SHADER</div>
            <div class="text-[10px] text-terminal-muted">Emulates 90s financial trading terminal phosphors</div>
          </div>
          <button
            on:click={() => (crtEnabled = !crtEnabled)}
            class="px-3 py-1.5 rounded font-bold border transition {crtEnabled ? 'bg-bull/20 text-bull border-bull/40' : 'bg-terminal-surface text-terminal-muted border-terminal-border'}"
          >
            {crtEnabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        <!-- Delete / Reset Career -->
        <div class="pt-3 border-t border-terminal-border">
          {#if !isConfirmingDelete}
            <button
              on:click={() => (isConfirmingDelete = true)}
              class="w-full py-2 rounded bg-bear/10 hover:bg-bear/20 text-bear border border-bear/30 transition flex items-center justify-center space-x-2"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>DELETE CAREER SAVE & RESET</span>
            </button>
          {:else}
            <div class="bg-bear/20 border border-bear p-3 rounded text-center">
              <p class="text-bear font-bold mb-2">ARE YOU SURE? ALL PROGRESS WILL BE PURGED.</p>
              <div class="flex space-x-2">
                <button
                  on:click={handleDeleteCareer}
                  class="flex-1 py-1.5 rounded bg-bear text-white font-bold"
                >
                  YES, PURGE
                </button>
                <button
                  on:click={() => (isConfirmingDelete = false)}
                  class="flex-1 py-1.5 rounded bg-terminal-surface text-terminal-text"
                >
                  CANCEL
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 border-t border-terminal-border bg-terminal-surface flex justify-end font-mono">
        <button
          on:click={onClose}
          class="px-4 py-1.5 rounded bg-terminal-border hover:bg-terminal-borderLight text-terminal-text text-xs transition"
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  </div>
{/if}
