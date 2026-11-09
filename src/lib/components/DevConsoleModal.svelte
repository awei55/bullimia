<script lang="ts">
  import { account, wireUncleGordonCapital } from '../stores/trading';
  import { X, Terminal, Zap, Shield, DollarSign, FastForward, Save, Radio } from 'lucide-svelte';

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
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
    <div class="w-full max-w-lg bg-terminal-panel border border-neon-cyan/50 rounded-xl shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="px-5 py-4 border-b border-terminal-border flex items-center justify-between bg-terminal-surface">
        <div class="flex items-center space-x-2">
          <Terminal class="w-5 h-5 text-neon-cyan" />
          <h2 class="text-sm font-bold font-mono tracking-wide text-neon-cyan uppercase">
            DEV CONSOLE // PHASE & BALANCE WARPER
          </h2>
        </div>
        <button on:click={onClose} class="text-terminal-muted hover:text-terminal-textBright transition">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-5 font-mono text-xs">
        {#if statusMessage}
          <div class="bg-neon-cyan/15 border border-neon-cyan text-neon-cyan px-3 py-2 rounded text-center animate-pulse">
            {statusMessage}
          </div>
        {/if}

        <!-- Quick Phase Warps -->
        <div>
          <span class="text-[10px] uppercase tracking-wider text-terminal-muted block mb-2 font-bold">
            RAPID PHASE WARP (TESTING SPECIFICATIONS)
          </span>
          <div class="grid grid-cols-1 gap-2">
            <!-- Phase 4: 100M -->
            <button
              on:click={() => handleWarp(100000000)}
              class="w-full py-2.5 px-3 rounded bg-terminal-surface hover:bg-terminal-border border border-neon-purple/50 text-neon-cyan flex items-center justify-between transition font-bold"
            >
              <div class="flex items-center space-x-2">
                <Zap class="w-4 h-4 text-neon-cyan" />
                <span>WARP TO $100,000,000</span>
              </div>
              <span class="text-[10px] text-terminal-muted">PHASE 4: PORTFOLIO MANAGER</span>
            </button>

            <!-- Phase 3: 10M -->
            <button
              on:click={() => handleWarp(10000000)}
              class="w-full py-2.5 px-3 rounded bg-terminal-surface hover:bg-terminal-border border border-neon-amber/40 text-neon-amber flex items-center justify-between transition font-bold"
            >
              <div class="flex items-center space-x-2">
                <Zap class="w-4 h-4 text-neon-amber" />
                <span>WARP TO $10,000,000</span>
              </div>
              <span class="text-[10px] text-terminal-muted">PHASE 3: QUANT BOT STUDIO</span>
            </button>

            <!-- Phase 2: 1M -->
            <button
              on:click={() => handleWarp(1000000)}
              class="w-full py-2.5 px-3 rounded bg-terminal-surface hover:bg-terminal-border border border-bull/40 text-bull flex items-center justify-between transition font-bold"
            >
              <div class="flex items-center space-x-2">
                <Zap class="w-4 h-4 text-bull" />
                <span>WARP TO $1,000,000</span>
              </div>
              <span class="text-[10px] text-terminal-muted">PHASE 2: TRADE CONSOLE</span>
            </button>

            <!-- News Alerts: 100K -->
            <button
              on:click={() => handleWarp(100000)}
              class="w-full py-2.5 px-3 rounded bg-terminal-surface hover:bg-terminal-border border border-neon-amber/30 text-neon-amber flex items-center justify-between transition font-bold"
            >
              <div class="flex items-center space-x-2">
                <Radio class="w-4 h-4 text-neon-amber" />
                <span>WARP TO $100,000</span>
              </div>
              <span class="text-[10px] text-terminal-muted">PHASE 1: MACRO NEWS ALERTS</span>
            </button>

            <!-- Uncle Gordon Wire: +$9K -->
            <button
              on:click={handleTriggerWire}
              class="w-full py-2.5 px-3 rounded bg-terminal-surface hover:bg-terminal-border border border-neon-cyan/40 text-neon-cyan flex items-center justify-between transition font-bold"
            >
              <div class="flex items-center space-x-2">
                <DollarSign class="w-4 h-4 text-neon-cyan" />
                <span>TRIGGER UNCLE GORDON WIRE</span>
              </div>
              <span class="text-[10px] text-terminal-muted">INJECT $9,000 & UNLOCK ASSETS</span>
            </button>

            <!-- Reset to $1K -->
            <button
              on:click={() => handleWarp(1000)}
              class="w-full py-2 px-3 rounded bg-terminal-surface hover:bg-terminal-border border border-terminal-border text-terminal-muted flex items-center justify-between transition"
            >
              <span>RESET TO $1,000</span>
              <span class="text-[10px] text-terminal-muted">GENESIS COLD START</span>
            </button>
          </div>
        </div>

        <!-- Custom Capital Injection -->
        <div class="pt-2 border-t border-terminal-border">
          <span class="text-[10px] uppercase tracking-wider text-terminal-muted block mb-2 font-bold">
            CUSTOM CAPITAL INJECTION ($)
          </span>
          <div class="flex space-x-2">
            <input
              type="text"
              bind:value={customEquityInput}
              placeholder="e.g. 25000000"
              class="flex-1 bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-terminal-text focus:outline-none focus:border-neon-cyan font-mono"
            />
            <button
              on:click={handleCustomInject}
              class="px-4 py-2 rounded bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/40 font-bold transition flex items-center space-x-1"
            >
              <DollarSign class="w-4 h-4" />
              <span>INJECT</span>
            </button>
          </div>
        </div>

        <!-- Testing Utilities (God Mode & Force Save) -->
        <div class="pt-2 border-t border-terminal-border grid grid-cols-2 gap-3">
          <button
            on:click={toggleGodMode}
            class="py-2.5 px-3 rounded border transition flex items-center justify-center space-x-2 font-bold {godModeEnabled ? 'bg-bull/20 text-bull border-bull' : 'bg-terminal-surface text-terminal-muted border-terminal-border'}"
          >
            <Shield class="w-4 h-4" />
            <span>GOD MODE: {godModeEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            on:click={handleManualSave}
            class="py-2.5 px-3 rounded bg-terminal-surface hover:bg-terminal-border text-terminal-text border border-terminal-border transition flex items-center justify-center space-x-2 font-bold"
          >
            <Save class="w-4 h-4 text-neon-cyan" />
            <span>FORCE SAVE NOW</span>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 border-t border-terminal-border bg-terminal-surface flex justify-end font-mono">
        <button
          on:click={onClose}
          class="px-4 py-1.5 rounded bg-terminal-border hover:bg-terminal-borderLight text-terminal-text text-xs transition"
        >
          CLOSE
        </button>
      </div>
    </div>
  </div>
{/if}
