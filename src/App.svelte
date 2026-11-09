<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import HUD from './lib/components/HUD.svelte';
  import AssetTickerBar from './lib/components/AssetTickerBar.svelte';
  import TradeLogModal from './lib/components/TradeLogModal.svelte';
  import GameOverModal from './lib/components/GameOverModal.svelte';
  import StartScreen from './lib/components/StartScreen.svelte';
  import OptionsModal from './lib/components/OptionsModal.svelte';
  import DevConsoleModal from './lib/components/DevConsoleModal.svelte';
  import TradeConsoleView from './lib/views/TradeConsoleView.svelte';
  import BotStudioView from './lib/views/BotStudioView.svelte';
  import PortfolioManagerView from './lib/views/PortfolioManagerView.svelte';

  import { BullimiaPixiEngine } from './lib/engine/pixi_game';
  import { loadLevel, currentLevel, tradeHistory, account, initWebSocket, resetCareer } from './lib/stores/trading';
  import { soundEngine } from './lib/audio/soundtrack';
  import { SaveManager, getPhaseForEquity } from './lib/services/save_manager';
  import type { SaveState, GamePhase } from './lib/types';

  let canvasContainer: HTMLDivElement;
  let engine: BullimiaPixiEngine | null = null;

  // UX & Routing State
  let inStartMenu = true;
  let activeView: 'CHART' | 'CONSOLE' | 'BOTS' | 'PORTFOLIO' = 'CHART';
  let crtEnabled = true;

  // Modals
  let isTradeLogOpen = false;
  let isOptionsOpen = false;
  let isDevConsoleOpen = false;

  let autoSaveInterval: any = null;

  onMount(async () => {
    // 1. WebSocket & Sound Engine
    initWebSocket();
    soundEngine.init();

    // 2. Global Hotkeys (`~` for dev console, `T` for epoch, `M` for mute)
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((document.activeElement?.tagName || '').toLowerCase())) {
        return;
      }
      if (e.key === '`' || e.key === '~') {
        isDevConsoleOpen = !isDevConsoleOpen;
      } else if (e.key === 't' || e.key === 'T') {
        handleJumpEpoch();
      } else if (e.key === 'm' || e.key === 'M') {
        soundEngine.toggleMute();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);

    // 3. Periodic Auto-Save (Every 8 seconds)
    autoSaveInterval = setInterval(() => {
      if (!inStartMenu && engine && $currentLevel) {
        triggerSave();
      }
    }, 8000);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeys);
      clearInterval(autoSaveInterval);
      if (engine) engine.destroy();
    };
  });

  async function initEngineIfNeeded() {
    if (!engine && canvasContainer) {
      engine = new BullimiaPixiEngine(canvasContainer);
      await engine.init();
      tradeHistory.subscribe((trades) => {
        if (engine) engine.setTrades(trades);
      });
    }
  }

  async function handleStartNewCareer() {
    await SaveManager.deleteCareer();
    await resetCareer(10000.0);
    activeView = 'CHART';
    inStartMenu = false;

    // Small delay for DOM mount of canvasContainer
    setTimeout(async () => {
      await initEngineIfNeeded();
      const initialData = await loadLevel('NVDA', false);
      if (engine) engine.setLevel(initialData);
    }, 50);
  }

  async function handleResumeCareer(save: SaveState) {
    account.set(save.account);
    tradeHistory.set(save.tradeHistory || []);
    crtEnabled = save.settings?.crtEnabled ?? true;

    // Route to appropriate view based on phase
    if (save.phase === 'PHASE_4_PORTFOLIO') {
      activeView = 'PORTFOLIO';
    } else if (save.phase === 'PHASE_3_BOTS') {
      activeView = 'BOTS';
    } else if (save.phase === 'PHASE_2_CONSOLE') {
      activeView = 'CONSOLE';
    } else {
      activeView = 'CHART';
    }

    inStartMenu = false;

    setTimeout(async () => {
      await initEngineIfNeeded();
      const levelId = save.currentLevelId || 'NVDA';
      const levelData = await loadLevel(levelId, false);
      if (engine) {
        engine.setLevel(levelData, save.playerProgress, save.openPosition);
      }
    }, 50);
  }

  async function triggerSave() {
    if (!engine || !$currentLevel) return;
    const progress = engine.getPlayerProgress();
    const currentSide = engine.getCurrentSide();

    let openPosition = null;
    if ($account.side !== 'FLAT' && $account.open_lots > 0) {
      openPosition = {
        side: $account.side,
        lots: $account.open_lots,
        entryPrice: $account.entry_price,
        entryTimestamp: $account.entry_timestamp,
        entryCandleIdx: Math.floor(progress),
      };
    }

    await SaveManager.saveCareer({
      account: $account,
      currentLevelId: $currentLevel.ticker,
      playerProgress: progress,
      openPosition,
      tradeHistory: $tradeHistory,
      settings: { crtEnabled },
    });
  }

  async function handleOpenMenu() {
    await triggerSave();
    inStartMenu = true;
  }

  async function handleSelectAsset(ticker: string) {
    if (!engine) return;
    try {
      const data = await loadLevel(ticker, false);
      engine.setLevel(data);
      await triggerSave();
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
      await triggerSave();
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
      await triggerSave();
    } catch (e) {
      alert(`Could not download market data for ticker "${ticker}". Check symbol and try again.`);
    }
  }

  async function handleWarpEquity(amount: number) {
    const res = await fetch('/api/dev/warp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equity: amount }),
    });
    if (res.ok) {
      const data = await res.json();
      account.set(data.account);

      // Auto-switch view based on equity tier
      if (amount >= 100000000) {
        activeView = 'PORTFOLIO';
      } else if (amount >= 10000000) {
        activeView = 'BOTS';
      } else if (amount >= 1000000) {
        activeView = 'CONSOLE';
      } else {
        activeView = 'CHART';
      }

      await triggerSave();
    }
  }
</script>

<main class="w-screen h-screen flex flex-col bg-terminal-bg text-terminal-text overflow-hidden {crtEnabled ? 'crt-overlay' : ''}">
  {#if inStartMenu}
    <StartScreen
      onStartNew={handleStartNewCareer}
      onResume={handleResumeCareer}
      onOpenOptions={() => (isOptionsOpen = true)}
      onOpenDevConsole={() => (isDevConsoleOpen = true)}
    />
  {:else}
    <!-- Top HUD Navigation Ribbon -->
    <HUD
      {activeView}
      onChangeView={(v) => (activeView = v)}
      onOpenMenu={handleOpenMenu}
      onOpenDevConsole={() => (isDevConsoleOpen = true)}
      onOpenOptions={() => (isOptionsOpen = true)}
      onOpenTradeLog={() => (isTradeLogOpen = true)}
      onJumpEpoch={handleJumpEpoch}
    />

    <!-- Main Workspace Area -->
    <div class="flex-1 w-full relative overflow-hidden flex">
      <!-- 1. Chart View / Split Autoscroller -->
      <div
        class="relative transition-all duration-300 {activeView === 'CHART' ? 'w-full h-full' : activeView === 'CONSOLE' ? 'w-7/12 h-full' : 'hidden'}"
      >
        <div bind:this={canvasContainer} class="w-full h-full relative overflow-hidden bg-terminal-bg"></div>
      </div>

      <!-- 2. Phase 2: Trade Console Right Pane -->
      {#if activeView === 'CONSOLE'}
        <div class="w-5/12 h-full border-l border-terminal-border">
          <TradeConsoleView
            onFlatten={() => engine?.flattenToCash()}
            onSwitchAsset={handleSelectAsset}
          />
        </div>
      {/if}

      <!-- 3. Phase 3: Bot Studio Full View -->
      {#if activeView === 'BOTS'}
        <div class="w-full h-full">
          <BotStudioView />
        </div>
      {/if}

      <!-- 4. Phase 4: Portfolio Manager Full View -->
      {#if activeView === 'PORTFOLIO'}
        <div class="w-full h-full">
          <PortfolioManagerView />
        </div>
      {/if}
    </div>

    <!-- Bottom Asset Ticker Quick-Bar -->
    {#if activeView === 'CHART' || activeView === 'CONSOLE'}
      <AssetTickerBar
        onSelectAsset={handleSelectAsset}
        onCustomTicker={handleCustomTicker}
      />
    {/if}
  {/if}

  <!-- Global Modals -->
  <OptionsModal
    isOpen={isOptionsOpen}
    bind:crtEnabled
    onClose={() => (isOptionsOpen = false)}
    onResetCareer={handleStartNewCareer}
  />

  <DevConsoleModal
    isOpen={isDevConsoleOpen}
    onClose={() => (isDevConsoleOpen = false)}
    onWarpEquity={handleWarpEquity}
    onForceSave={triggerSave}
  />

  <TradeLogModal isOpen={isTradeLogOpen} onClose={() => (isTradeLogOpen = false)} />
  <GameOverModal onRestart={handleJumpEpoch} />
</main>
