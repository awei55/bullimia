<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import HUD from './lib/components/HUD.svelte';
  import AssetTickerBar from './lib/components/AssetTickerBar.svelte';
  import TradeLogModal from './lib/components/TradeLogModal.svelte';
  import GameOverModal from './lib/components/GameOverModal.svelte';
  import { BullimiaPixiEngine } from './lib/engine/pixi_game';
  import { loadLevel, currentLevel, tradeHistory, initWebSocket } from './lib/stores/trading';
  import { soundEngine } from './lib/audio/soundtrack';

  let canvasContainer: HTMLDivElement;
  let engine: BullimiaPixiEngine | null = null;
  let isTradeLogOpen = false;

  onMount(async () => {
    // 1. Initialize WebSocket & Procedural Audio
    initWebSocket();
    soundEngine.init();

    // 2. Initialize PixiJS WebGL Engine
    engine = new BullimiaPixiEngine(canvasContainer);
    await engine.init();

    // 3. Load default initial asset (NVDA)
    try {
      const initialData = await loadLevel('NVDA', false);
      engine.setLevel(initialData);
    } catch (e) {
      console.error('Error loading initial level:', e);
    }

    // 4. Reactive bindings for trades
    const unsubTrades = tradeHistory.subscribe((trades) => {
      if (engine) engine.setTrades(trades);
    });

    // 5. Global Hotkeys (T = Random Epoch, M = Mute)
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((document.activeElement?.tagName || '').toLowerCase())) {
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        handleJumpEpoch();
      } else if (e.key === 'm' || e.key === 'M') {
        soundEngine.toggleMute();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);

    return () => {
      unsubTrades();
      window.removeEventListener('keydown', handleGlobalKeys);
      if (engine) engine.destroy();
    };
  });

  async function handleSelectAsset(ticker: string) {
    if (!engine) return;
    try {
      const data = await loadLevel(ticker, false);
      engine.setLevel(data);
    } catch (e) {
      console.error(`Failed to switch to asset ${ticker}:`, e);
    }
  }

  async function handleJumpEpoch() {
    if (!engine || !$currentLevel) return;
    try {
      const data = await loadLevel($currentLevel.ticker, true);
      engine.setLevel(data);
      soundEngine.playVibrateCharge(0.8);
    } catch (e) {
      console.error('Failed to jump epoch:', e);
    }
  }

  async function handleCustomTicker(ticker: string) {
    if (!engine) return;
    try {
      const res = await fetch(`/api/custom/${ticker}`);
      if (!res.ok) throw new Error('Ticker not found');
      const data = await res.json();
      currentLevel.set(data);
      engine.setLevel(data);
    } catch (e) {
      alert(`Could not download market data for ticker "${ticker}". Check symbol and try again.`);
    }
  }
</script>

<main class="w-screen h-screen flex flex-col bg-terminal-bg text-terminal-text overflow-hidden crt-overlay">
  <!-- Top HUD Ribbon -->
  <HUD
    onOpenTradeLog={() => (isTradeLogOpen = true)}
    onJumpEpoch={handleJumpEpoch}
  />

  <!-- Center PixiJS WebGL Canvas Container -->
  <div bind:this={canvasContainer} class="flex-1 w-full relative overflow-hidden bg-terminal-bg"></div>

  <!-- Bottom Asset Ticker Quick-Bar -->
  <AssetTickerBar
    onSelectAsset={handleSelectAsset}
    onCustomTicker={handleCustomTicker}
  />

  <!-- Modals -->
  <TradeLogModal isOpen={isTradeLogOpen} onClose={() => (isTradeLogOpen = false)} />
  <GameOverModal onRestart={handleJumpEpoch} />
</main>
