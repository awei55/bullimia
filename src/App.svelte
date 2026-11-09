<script lang="ts">
  import { onMount } from 'svelte';
  import HUD from './lib/components/HUD.svelte';
  import AssetTickerBar from './lib/components/AssetTickerBar.svelte';
  import TradeLogModal from './lib/components/TradeLogModal.svelte';
  import GameOverModal from './lib/components/GameOverModal.svelte';
  import StartScreen from './lib/components/StartScreen.svelte';
  import OptionsModal from './lib/components/OptionsModal.svelte';
  import DevConsoleModal from './lib/components/DevConsoleModal.svelte';
  import BenefactorModal from './lib/components/BenefactorModal.svelte';
  import NewsAlertBanner from './lib/components/NewsAlertBanner.svelte';

  import TradeConsoleView from './lib/views/TradeConsoleView.svelte';
  import BotStudioView from './lib/views/BotStudioView.svelte';
  import PortfolioManagerView from './lib/views/PortfolioManagerView.svelte';

  import { BullimiaPixiEngine } from './lib/engine/pixi_game';
  import {
    loadLevel,
    currentLevel,
    tradeHistory,
    account,
    benefactorState,
    initWebSocket,
    resetCareer,
    wireUncleGordonCapital,
    triggerHeadlineAlert,
    isTradingActive,
  } from './lib/stores/trading';
  import { soundEngine } from './lib/audio/soundtrack';
  import { SaveManager, getPhaseForEquity } from './lib/services/save_manager';
  import type { SaveState } from './lib/types';

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

  let elapsedTradingSeconds = 0;
  let timerInterval: any = null;
  let autoSaveInterval: any = null;

  onMount(async () => {
    // 1. Initialize WebSocket & Sound Engine
    initWebSocket();
    soundEngine.init();

    // 2. Initialize PixiJS Engine onto permanently mounted canvas container
    if (canvasContainer) {
      engine = new BullimiaPixiEngine(canvasContainer);
      await engine.init();

      // Load initial tutorial asset (NVDA)
      try {
        const levelData = await loadLevel('NVDA', false);
        engine.setLevel(levelData);
      } catch (e) {
        console.error('Failed to load initial level:', e);
      }

      tradeHistory.subscribe((trades) => {
        if (engine) engine.setTrades(trades);
      });
    }

    // 3. Global Hotkeys (`~` for dev console, `T` for epoch, `M` for mute)
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

    // 4. Timer for Uncle Gordon 120s Trigger
    timerInterval = setInterval(() => {
      if (!inStartMenu && $isTradingActive) {
        elapsedTradingSeconds += 1;
        if (elapsedTradingSeconds >= 120 && !$benefactorState.hasTriggeredWire) {
          wireUncleGordonCapital('time');
        }
      }
    }, 1000);

    // 5. Periodic Auto-Save
    autoSaveInterval = setInterval(() => {
      if (!inStartMenu && engine && $currentLevel) {
        triggerSave();
      }
    }, 10000);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeys);
      clearInterval(timerInterval);
      clearInterval(autoSaveInterval);
      if (engine) engine.destroy();
    };
  });

  async function handleStartNewCareer() {
    await SaveManager.deleteCareer();
    await resetCareer(1000.0); // Genesis Tutorial starts with $1,000 USD
    elapsedTradingSeconds = 0;
    activeView = 'CHART';
    inStartMenu = false;
    isTradingActive.set(true);

    if (engine) {
      const data = await loadLevel('NVDA', false);
      engine.setLevel(data);
    }
  }

  async function handleResumeCareer(save: SaveState) {
    account.set(save.account);
    tradeHistory.set(save.tradeHistory || []);
    crtEnabled = save.settings?.crtEnabled ?? true;

    // Check if wire was previously unlocked
    if (save.account.equity >= 10000.0) {
      benefactorState.update((s) => ({
        ...s,
        hasTriggeredWire: true,
        assetBarUnlocked: true,
        newsAlertsUnlocked: save.account.equity >= 100000.0,
      }));
    }

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
    isTradingActive.set(true);

    if (engine) {
      const levelId = save.currentLevelId || 'NVDA';
      const levelData = await loadLevel(levelId, false);
      engine.setLevel(levelData, save.playerProgress, save.openPosition);
    }
  }

  async function triggerSave() {
    if (!engine || !$currentLevel) return;
    const progress = engine.getPlayerProgress();

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
    isTradingActive.set(false);
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
      const data = await loadLevel(ticker, false);
      engine.setLevel(data);
      await triggerSave();
    } catch (e) {
      alert(`Could not load market data for ticker "${ticker}".`);
    }
  }

  async function handleWarpEquity(amount: number) {
    // Call backend warp if available
    try {
      await fetch('/api/dev/warp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equity: amount }),
      });
    } catch (e) {}

    // Update account directly
    account.update((acc) => {
      acc.cash_balance = amount;
      acc.equity = amount;
      acc.free_margin = amount;
      if (amount > acc.high_watermark) acc.high_watermark = amount;
      acc.is_millionaire = amount >= 1000000.0;
      acc.is_margin_called = false;
      return acc;
    });

    // Unlock benefactor features automatically if warped past milestones
    if (amount >= 10000.0) {
      benefactorState.update((s) => ({
        ...s,
        hasTriggeredWire: true,
        assetBarUnlocked: true,
        newsAlertsUnlocked: amount >= 100000.0,
      }));
    }

    if (amount >= 100000.0 && amount < 1000000.0) {
      triggerHeadlineAlert('⚡ BREAKING: MACRO VOLATILITY ALERTS UNLOCKED ($100,000 MILESTONE REACHED)');
    }

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
</script>

<main class="w-screen h-screen flex flex-col bg-terminal-bg text-terminal-text overflow-hidden relative {crtEnabled ? 'crt-overlay' : ''}">
  <!-- Top HUD Navigation Ribbon -->
  {#if !inStartMenu}
    <HUD
      {activeView}
      onChangeView={(v) => (activeView = v)}
      onOpenMenu={handleOpenMenu}
      onOpenDevConsole={() => (isDevConsoleOpen = true)}
      onOpenOptions={() => (isOptionsOpen = true)}
      onOpenTradeLog={() => (isTradeLogOpen = true)}
      onJumpEpoch={handleJumpEpoch}
    />
  {/if}

  <!-- Main Game Workspace (Always Mounted in DOM) -->
  <div class="flex-1 w-full relative overflow-hidden flex">
    <!-- Flashing Yellow News Alerts -->
    <NewsAlertBanner />

    <!-- 1. Chart View / Split Autoscroller (Canvas Container NEVER Unmounted) -->
    <div
      class="relative transition-all duration-300 {activeView === 'CHART' ? 'w-full h-full' : activeView === 'CONSOLE' ? 'w-7/12 h-full' : 'hidden'}"
    >
      <div bind:this={canvasContainer} class="w-full h-full relative overflow-hidden bg-terminal-bg"></div>
    </div>

    <!-- 2. Phase 2: Complete Trade Console Right Pane (Unlocked at $1M) -->
    {#if activeView === 'CONSOLE'}
      <div class="w-5/12 h-full border-l border-terminal-border">
        <TradeConsoleView
          onFlatten={() => engine?.flattenToCash()}
          onSwitchAsset={handleSelectAsset}
        />
      </div>
    {/if}

    <!-- 3. Phase 3: Bot Studio Full View (Unlocked at $10M) -->
    {#if activeView === 'BOTS'}
      <div class="w-full h-full">
        <BotStudioView />
      </div>
    {/if}

    <!-- 4. Phase 4: Portfolio Manager Full View (Unlocked at $100M) -->
    {#if activeView === 'PORTFOLIO'}
      <div class="w-full h-full">
        <PortfolioManagerView />
      </div>
    {/if}
  </div>

  <!-- Bottom Asset Ticker Quick-Bar (Shown when on Chart/Console during active gameplay) -->
  {#if !inStartMenu && (activeView === 'CHART' || activeView === 'CONSOLE')}
    <AssetTickerBar
      onSelectAsset={handleSelectAsset}
      onCustomTicker={handleCustomTicker}
    />
  {/if}

  <!-- Start Screen Overlay (z-40 overlay on top of canvas) -->
  {#if inStartMenu}
    <StartScreen
      onStartNew={handleStartNewCareer}
      onResume={handleResumeCareer}
      onOpenOptions={() => (isOptionsOpen = true)}
      onOpenDevConsole={() => (isDevConsoleOpen = true)}
    />
  {/if}

  <!-- Modals -->
  {#if !inStartMenu && $isTradingActive}
    <BenefactorModal />
  {/if}

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
