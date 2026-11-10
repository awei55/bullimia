<script lang="ts">
  import { account, wireUncleGordonCapital } from '../stores/trading';
  import { X, Terminal, Zap, Shield, ShieldAlert, DollarSign, FastForward, Save, Radio } from 'lucide-svelte';

  export let isOpen = false;
  export let onClose: () => void = () => {};
  export let onWarpEquity: (equity: number) => Promise<void> = async () => {};
  export let onForceSave: () => Promise<void> = async () => {};

  let customEquityInput = '';
  let godModeEnabled = false;
  let statusMessage = '';

  async function handleWarp(amount: number) {
    await onWarpEquity(amount);
    statusMessage = `Warped equity to $${amount.toLocaleString()}`;
    setTimeout(() => (statusMessage = ''), 3000);
  }

  function handleTriggerWire() {
    wireUncleGordonCapital('profit');
    statusMessage = 'Triggered Uncle Gordon wire transmission (+$9,000)!';
    setTimeout(() => (statusMessage = ''), 3000);
  }

  async function handleCustomInject() {
    const val = parseFloat(customEquityInput.replace(/[^0-9.]/g, ''));
    if (!isNaN(val) && val > 0) {
      await onWarpEquity(val);
      statusMessage = `Injected capital: $${val.toLocaleString()}`;
      customEquityInput = '';
      setTimeout(() => (statusMessage = ''), 3000);
    }
  }

  async function toggleGodMode() {
    godModeEnabled = !godModeEnabled;
    try {
      await fetch('/api/dev/godmode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: godModeEnabled }),
      });
      statusMessage = `God mode ${godModeEnabled ? 'ENABLED (Zero Margin Calls)' : 'DISABLED'}`;
      setTimeout(() => (statusMessage = ''), 3000);
    } catch (e) {
      console.warn('God mode toggle failed on backend');
    }
  }

  async function handleManualSave() {
    await onForceSave();
    statusMessage = 'Career state saved to disk & localStorage!';
    setTimeout(() => (statusMessage = ''), 3000);
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none crt-overlay">
    <div class="w-full max-w-lg cel-panel border-4 border-black p-0 shadow-[8px_8px_0_#000] cyber-clip overflow-hidden flex flex-col font-chakra">
      <!-- Header -->
      <div class="px-5 py-3.5 border-b-2 border-black flex items-center justify-between bg-[#101622]">
        <div class="flex items-center space-x-2">
          <Terminal class="w-5 h-5 text-neon-cyan" />
          <h2 class="text-sm font-black pixel-text tracking-wide text-neon-cyan uppercase">
            DEV CONSOLE // PHASE & BALANCE WARPER
          </h2>
        </div>
        <button on:click={onClose} class="cel-btn p-1 bg-terminal-surface hover:bg-terminal-border text-white cursor-pointer">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4 text-xs bg-[#0a0e17]">
        {#if statusMessage}
          <div class="bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan px-3 py-2 text-center pixel-text text-[9px] shadow-[2px_2px_0_#000]">
            {statusMessage}
          </div>
        {/if}

        <!-- Quick Phase Warps -->
        <div>
          <span class="pixel-text text-[9px] text-terminal-muted block mb-2 font-bold uppercase">
            RAPID PHASE WARP
          </span>
          <div class="grid grid-cols-1 gap-2">
            <!-- Phase 4: 100M -->
            <button
              type="button"
              on:click={() => handleWarp(100000000)}
              class="w-full py-2.5 px-3 cel-btn bg-terminal-surface hover:bg-terminal-border text-neon-cyan flex items-center justify-between cursor-pointer font-bold"
            >
              <div class="flex items-center space-x-2">
                <Zap class="w-4 h-4 text-neon-cyan" />
                <span class="pixel-text text-[9px]">WARP TO $100,000,000</span>
              </div>
              <span class="text-[10px] text-terminal-muted">PHASE 4: SOVEREIGN DESK</span>
            </button>

            <!-- Phase 3: 10M -->
            <button
              type="button"
              on:click={() => handleWarp(10000000)}
              class="w-full py-2.5 px-3 cel-btn bg-terminal-surface hover:bg-terminal-border text-neon-amber flex items-center justify-between cursor-pointer font-bold"
            >
              <div class="flex items-center space-x-2">
                <Zap class="w-4 h-4 text-neon-amber" />
                <span class="pixel-text text-[9px]">WARP TO $10,000,000</span>
              </div>
              <span class="text-[10px] text-terminal-muted">PHASE 3: QUANT BOTS</span>
            </button>

            <!-- Phase 2: 1M -->
            <button
              type="button"
              on:click={() => handleWarp(1000000)}
              class="w-full py-2.5 px-3 cel-btn bg-terminal-surface hover:bg-terminal-border text-bull flex items-center justify-between cursor-pointer font-bold"
            >
              <div class="flex items-center space-x-2">
                <Zap class="w-4 h-4 text-bull" />
                <span class="pixel-text text-[9px]">WARP TO $1,000,000</span>
              </div>
              <span class="text-[10px] text-terminal-muted">PHASE 2: PROP DESK</span>
            </button>

            <!-- News Alerts: 100K -->
            <button
              type="button"
              on:click={() => handleWarp(100000)}
              class="w-full py-2.5 px-3 cel-btn bg-terminal-surface hover:bg-terminal-border text-neon-amber flex items-center justify-between cursor-pointer font-bold"
            >
              <div class="flex items-center space-x-2">
                <Radio class="w-4 h-4 text-neon-amber" />
                <span class="pixel-text text-[9px]">WARP TO $100,000</span>
              </div>
              <span class="text-[10px] text-terminal-muted">UNLOCK NEWS ALERTS</span>
            </button>

            <!-- Uncle Gordon Wire: +$9K -->
            <button
              type="button"
              on:click={handleTriggerWire}
              class="w-full py-2.5 px-3 cel-btn bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan flex items-center justify-between cursor-pointer font-bold"
            >
              <div class="flex items-center space-x-2">
                <DollarSign class="w-4 h-4 text-neon-cyan" />
                <span class="pixel-text text-[9px]">TRIGGER UNCLE GORDON WIRE</span>
              </div>
              <span class="text-[10px] text-terminal-muted">+$9,000 & MULTI-ASSET</span>
            </button>

            <!-- Trigger Margin Call (Liquidation Test) -->
            <button
              type="button"
              on:click={() => handleWarp(0)}
              class="w-full py-2.5 px-3 cel-btn bg-bear/20 hover:bg-bear/30 text-bear flex items-center justify-between cursor-pointer font-bold border-2 border-bear/40"
            >
              <div class="flex items-center space-x-2">
                <ShieldAlert class="w-4 h-4 text-bear" />
                <span class="pixel-text text-[9px]">TRIGGER MARGIN CALL</span>
              </div>
              <span class="text-[10px] text-terminal-muted">TEST LIQUIDATION</span>
            </button>

            <!-- Reset to $1K -->
            <button
              type="button"
              on:click={() => handleWarp(1000)}
              class="w-full py-2 px-3 cel-btn bg-terminal-surface hover:bg-terminal-border text-terminal-muted flex items-center justify-between cursor-pointer"
            >
              <span class="pixel-text text-[9px]">RESET TO $1,000</span>
              <span class="text-[10px] text-terminal-muted">GENESIS COLD START</span>
            </button>
          </div>
        </div>

        <!-- Custom Capital Injection -->
        <div class="pt-3 border-t-2 border-black">
          <span class="pixel-text text-[9px] text-terminal-muted block mb-2 font-bold uppercase">
            CUSTOM CAPITAL INJECTION ($)
          </span>
          <div class="flex space-x-2">
            <input
              type="text"
              bind:value={customEquityInput}
              placeholder="e.g. 25000000"
              class="flex-1 bg-black text-white border-2 border-black px-3 py-1.5 focus:outline-none focus:border-neon-cyan font-chakra"
            />
            <button
              type="button"
              on:click={handleCustomInject}
              class="px-4 py-1.5 cel-btn bg-neon-cyan hover:brightness-110 text-black font-black pixel-text text-[9px] flex items-center space-x-1 cursor-pointer"
            >
              <DollarSign class="w-3.5 h-3.5" />
              <span>INJECT</span>
            </button>
          </div>
        </div>

        <!-- Testing Utilities (God Mode & Force Save) -->
        <div class="pt-3 border-t-2 border-black grid grid-cols-2 gap-2">
          <button
            type="button"
            on:click={toggleGodMode}
            class="py-2.5 px-3 cel-btn flex items-center justify-center space-x-2 font-black pixel-text text-[9px] cursor-pointer {godModeEnabled ? 'bg-bull text-black' : 'bg-terminal-surface text-terminal-muted'}"
          >
            <Shield class="w-4 h-4" />
            <span>GOD MODE: {godModeEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            on:click={handleManualSave}
            class="py-2.5 px-3 cel-btn bg-terminal-surface hover:bg-terminal-border text-white flex items-center justify-center space-x-2 font-black pixel-text text-[9px] cursor-pointer"
          >
            <Save class="w-4 h-4 text-neon-cyan" />
            <span>FORCE SAVE</span>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 border-t-2 border-black bg-[#101622] flex justify-end">
        <button
          type="button"
          on:click={onClose}
          class="px-4 py-2 cel-btn bg-terminal-surface hover:bg-terminal-border text-white pixel-text text-xs cursor-pointer"
        >
          CLOSE
        </button>
      </div>
    </div>
  </div>
{/if}
