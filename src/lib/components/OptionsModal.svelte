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
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none crt-overlay">
    <div class="w-full max-w-md cel-panel border-4 border-black p-0 shadow-[8px_8px_0_#000] cyber-clip overflow-hidden flex flex-col font-chakra">
      <!-- Header -->
      <div class="px-5 py-3.5 border-b-2 border-black flex items-center justify-between bg-[#101622]">
        <div class="flex items-center space-x-2">
          <Monitor class="w-5 h-5 text-neon-cyan" />
          <h2 class="text-sm font-black pixel-text tracking-wide text-white uppercase">
            ARCADE SETTINGS & AUDIO
          </h2>
        </div>
        <button on:click={onClose} class="cel-btn p-1 bg-terminal-surface hover:bg-terminal-border text-white cursor-pointer">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4 text-xs bg-[#0a0e17]">
        <!-- Master Volume -->
        <div>
          <div class="flex justify-between text-terminal-muted mb-1 font-bold">
            <span class="pixel-text text-[9px]">MASTER AUDIO:</span>
            <span class="text-white font-chakra">{masterVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            bind:value={masterVolume}
            on:input={handleVolumeChange}
            class="w-full accent-bull bg-black h-2 rounded-none cursor-pointer border border-black"
          />
        </div>

        <!-- Music Volume -->
        <div>
          <div class="flex justify-between text-terminal-muted mb-1 font-bold">
            <span class="pixel-text text-[9px]">SYNTHWAVE SOUNDTRACK:</span>
            <span class="text-white font-chakra">{musicVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            bind:value={musicVolume}
            on:input={handleVolumeChange}
            class="w-full accent-bull bg-black h-2 rounded-none cursor-pointer border border-black"
          />
        </div>

        <!-- SFX Volume -->
        <div>
          <div class="flex justify-between text-terminal-muted mb-1 font-bold">
            <span class="pixel-text text-[9px]">MARKET & ORDER SFX:</span>
            <span class="text-white font-chakra">{sfxVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            bind:value={sfxVolume}
            on:input={handleVolumeChange}
            class="w-full accent-bull bg-black h-2 rounded-none cursor-pointer border border-black"
          />
        </div>

        <!-- CRT Scanline Toggle -->
        <div class="pt-3 border-t-2 border-black flex items-center justify-between">
          <div>
            <div class="pixel-text text-[10px] text-white font-bold">CRT SCANLINE SHADER</div>
            <div class="text-[10px] text-terminal-muted">Emulates 90s arcade CRT phosphors</div>
          </div>
          <button
            on:click={() => (crtEnabled = !crtEnabled)}
            class="px-3 py-1.5 cel-btn font-black pixel-text text-[9px] cursor-pointer {crtEnabled ? 'bg-bull text-black' : 'bg-terminal-surface text-terminal-muted'}"
          >
            {crtEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <!-- Delete / Reset Career -->
        <div class="pt-3 border-t-2 border-black">
          {#if !isConfirmingDelete}
            <button
              on:click={() => (isConfirmingDelete = true)}
              class="w-full py-2.5 cel-btn bg-bear/20 hover:bg-bear/30 text-bear font-black pixel-text text-[9px] flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Trash2 class="w-3.5 h-3.5 text-bear" />
              <span>DELETE SAVE & RESET PROGRESS</span>
            </button>
          {:else}
            <div class="bg-bear/20 border-2 border-bear p-3 text-center shadow-[3px_3px_0_#000]">
              <p class="pixel-text text-[10px] text-bear font-bold mb-2">ARE YOU SURE? CAREER WILL BE ERASED.</p>
              <div class="flex space-x-2">
                <button
                  on:click={handleDeleteCareer}
                  class="flex-1 py-1.5 cel-btn bg-bear text-white font-black pixel-text text-[9px] cursor-pointer"
                >
                  YES, PURGE
                </button>
                <button
                  on:click={() => (isConfirmingDelete = false)}
                  class="flex-1 py-1.5 cel-btn bg-terminal-surface text-white pixel-text text-[9px] cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 border-t-2 border-black bg-[#101622] flex justify-end">
        <button
          on:click={onClose}
          class="px-4 py-2 cel-btn bg-terminal-surface hover:bg-terminal-border text-white pixel-text text-xs cursor-pointer"
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  </div>
{/if}
