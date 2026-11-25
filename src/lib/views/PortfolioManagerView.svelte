<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { account } from '../stores/trading';
  import {
    sovereignPortfolioState,
    drawCredit,
    repayCredit,
    buyPETarget,
    distributePEDividends,
    underwriteOTCContract,
    tickOTCContracts,
    type CreditFacility,
    type PETarget,
    type OTCDerivative,
  } from '../stores/portfolio';
  import {
    Landmark,
    ShieldCheck,
    Briefcase,
    FileText,
    TrendingUp,
    Building2,
    DollarSign,
    Zap,
    Clock,
    ArrowDownRight,
    ArrowUpRight,
    CheckCircle2,
    AlertTriangle,
    Coins,
  } from 'lucide-svelte';

  let activeTab: 'CREDIT' | 'PE' | 'OTC' = 'CREDIT';
  let otcTimer: any = null;
  let peDividendTimer: any = null;

  onMount(() => {
    // 1. Tick OTC contracts every second
    otcTimer = setInterval(() => {
      tickOTCContracts();
    }, 1000);

    // 2. Distribute PE dividends every 12 seconds
    peDividendTimer = setInterval(() => {
      distributePEDividends();
    }, 12000);
  });

  onDestroy(() => {
    if (otcTimer) clearInterval(otcTimer);
    if (peDividendTimer) clearInterval(peDividendTimer);
  });

  function handleDraw(facilityId: string, amount: number) {
    drawCredit(facilityId, amount);
  }

  function handleRepay(facilityId: string, amount: number) {
    repayCredit(facilityId, amount);
  }

  function handleAcquirePE(targetId: string) {
    buyPETarget(targetId);
  }

  function handleUnderwrite(contractId: string) {
    underwriteOTCContract(contractId);
  }
</script>

<div class="h-full w-full flex flex-col bg-terminal-bg p-5 font-mono select-none overflow-y-auto crt-overlay">
  <!-- Header -->
  <div class="flex items-center justify-between pb-4 border-b-2 border-terminal-border mb-5">
    <div>
      <span class="text-[9px] text-neon-cyan font-pixel tracking-widest uppercase flex items-center">
        <Landmark class="w-4 h-4 mr-1.5" /> PHASE 4 // INSTITUTIONAL SOVEREIGN PORTFOLIO ($100M+)
      </span>
      <h1 class="text-xl font-bold font-pixel text-terminal-textBright mt-1">MACRO CAPITAL & SOVEREIGN DESK</h1>
    </div>

    <!-- Too Big To Fail Badge -->
    <div class="bg-bull/20 border-2 border-bull cel-card cyber-clip-sm px-4 py-2 text-right shadow-[3px_3px_0px_#000]">
      <span class="text-[8px] text-terminal-muted uppercase font-pixel block">SYSTEMIC SOLVENCY STATUS</span>
      <span class="text-xs text-bull font-bold font-chakra flex items-center justify-end text-glow-bull">
        <ShieldCheck class="w-4 h-4 mr-1" /> TOO BIG TO FAIL // ZERO MARGIN CALLS
      </span>
    </div>
  </div>

  <!-- Key Metrics Row -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-3.5 mb-5 font-mono">
    <div class="bg-terminal-panel border-2 border-terminal-border cel-card cyber-clip-sm p-3.5 shadow-[4px_4px_0px_#000]">
      <span class="text-[8px] text-terminal-muted font-pixel block mb-1">TOTAL ASSETS (AUM)</span>
      <span class="text-lg font-bold text-bull">${$account.equity.toLocaleString()}</span>
    </div>

    <div class="bg-terminal-panel border-2 border-terminal-border cel-card cyber-clip-sm p-3.5 shadow-[4px_4px_0px_#000]">
      <span class="text-[8px] text-terminal-muted font-pixel block mb-1">CREDIT DRAWN / CAPACITY</span>
      <span class="text-lg font-bold text-neon-cyan">
        ${($sovereignPortfolioState.totalCreditDrawn / 1e6).toFixed(1)}M / ${($sovereignPortfolioState.totalCreditLimit / 1e6).toFixed(0)}M
      </span>
    </div>

    <div class="bg-terminal-panel border-2 border-terminal-border cel-card cyber-clip-sm p-3.5 shadow-[4px_4px_0px_#000]">
      <span class="text-[8px] text-terminal-muted font-pixel block mb-1">PE DIVIDENDS ACCRUED</span>
      <span class="text-lg font-bold text-neon-amber">+${$sovereignPortfolioState.totalDividendsReceived.toLocaleString()}</span>
    </div>

    <div class="bg-terminal-panel border-2 border-terminal-border cel-card cyber-clip-sm p-3.5 shadow-[4px_4px_0px_#000]">
      <span class="text-[8px] text-terminal-muted font-pixel block mb-1">OTC PREMIUMS COLLECTED</span>
      <span class="text-lg font-bold text-terminal-text">+${$sovereignPortfolioState.totalOTCPremiums.toLocaleString()}</span>
    </div>
  </div>

  <!-- Sovereign Mode Tabs (Credit Facilities vs Private Equity vs OTC Desk) -->
  <div class="grid grid-cols-3 gap-2 mb-4 text-xs">
    <button
      on:click={() => (activeTab = 'CREDIT')}
      class="py-2 border-2 text-center transition font-bold font-pixel text-[10px] flex items-center justify-center space-x-1.5 cel-btn cyber-clip-sm {activeTab === 'CREDIT' ? 'bg-terminal-surface border-neon-cyan text-neon-cyan shadow-[2px_2px_0px_#000]' : 'bg-terminal-panel border-terminal-border text-terminal-muted hover:text-terminal-text'}"
    >
      <Landmark class="w-3.5 h-3.5" />
      <span>CENTRAL BANK CREDIT</span>
    </button>

    <button
      on:click={() => (activeTab = 'PE')}
      class="py-2 border-2 text-center transition font-bold font-pixel text-[10px] flex items-center justify-center space-x-1.5 cel-btn cyber-clip-sm {activeTab === 'PE' ? 'bg-terminal-surface border-neon-amber text-neon-amber shadow-[2px_2px_0px_#000]' : 'bg-terminal-panel border-terminal-border text-terminal-muted hover:text-terminal-text'}"
    >
      <Briefcase class="w-3.5 h-3.5" />
      <span>PRIVATE EQUITY ASSETS</span>
    </button>

    <button
      on:click={() => (activeTab = 'OTC')}
      class="py-2 border-2 text-center transition font-bold font-pixel text-[10px] flex items-center justify-center space-x-1.5 cel-btn cyber-clip-sm {activeTab === 'OTC' ? 'bg-terminal-surface border-bull text-bull shadow-[2px_2px_0px_#000]' : 'bg-terminal-panel border-terminal-border text-terminal-muted hover:text-terminal-text'}"
    >
      <FileText class="w-3.5 h-3.5" />
      <span>OTC DERIVATIVES DESK</span>
    </button>
  </div>

  <!-- Tab 1: Central Bank Credit Facilities -->
  {#if activeTab === 'CREDIT'}
    <div class="bg-terminal-panel border-2 border-terminal-border cel-panel cyber-clip p-5 shadow-[4px_4px_0px_#000]">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-bold text-terminal-textBright uppercase flex items-center font-pixel">
            <Landmark class="w-4 h-4 mr-2 text-neon-cyan" /> STANDING SOVEREIGN REPO & BILATERAL CREDIT
          </h2>
          <p class="text-xs text-terminal-muted font-chakra mt-1">
            Primary dealer credit access allowing instant liquidity injection directly into cash reserves at SOFR / ESTR benchmark rates.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each $sovereignPortfolioState.creditFacilities as fac}
          <div class="bg-terminal-surface border-2 border-terminal-border p-4 cel-card cyber-clip-sm font-chakra flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start font-bold text-terminal-text mb-2">
                <span class="text-sm">{fac.name}</span>
                <span class="text-neon-cyan font-mono text-xs font-bold px-2 py-0.5 bg-neon-cyan/15 border border-neon-cyan">
                  {fac.rate}
                </span>
              </div>

              <!-- Facility Usage Bar -->
              <div class="w-full bg-terminal-bg h-2.5 border border-terminal-border mb-2 relative overflow-hidden">
                <div
                  class="bg-neon-cyan h-full transition-all"
                  style="width: {(fac.drawn / fac.limit) * 100}%"
                ></div>
              </div>

              <div class="flex justify-between text-terminal-muted text-xs font-mono mb-4">
                <span>DRAWN: ${fac.drawn.toLocaleString()}</span>
                <span>AVAILABLE: ${(fac.limit - fac.drawn).toLocaleString()}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-2 pt-3 border-t border-terminal-border font-pixel text-[10px]">
              <div class="flex space-x-1">
                <button
                  on:click={() => handleDraw(fac.id, 10000000)}
                  disabled={fac.drawn + 10000000 > fac.limit}
                  class="flex-1 py-2 bg-neon-cyan text-black font-bold hover:brightness-110 disabled:opacity-40 cel-btn shadow-[2px_2px_0px_#000]"
                >
                  +10M DRAW
                </button>
                <button
                  on:click={() => handleDraw(fac.id, 25000000)}
                  disabled={fac.drawn + 25000000 > fac.limit}
                  class="flex-1 py-2 bg-neon-cyan text-black font-bold hover:brightness-110 disabled:opacity-40 cel-btn shadow-[2px_2px_0px_#000]"
                >
                  +25M DRAW
                </button>
              </div>

              <div class="flex space-x-1">
                <button
                  on:click={() => handleRepay(fac.id, 10000000)}
                  disabled={fac.drawn <= 0 || $account.cash_balance < 10000000}
                  class="flex-1 py-2 bg-terminal-bg hover:bg-terminal-border text-neon-cyan border border-neon-cyan font-bold disabled:opacity-40 cel-btn shadow-[2px_2px_0px_#000]"
                >
                  -10M REPAY
                </button>
                <button
                  on:click={() => handleRepay(fac.id, 25000000)}
                  disabled={fac.drawn <= 0 || $account.cash_balance < 25000000}
                  class="flex-1 py-2 bg-terminal-bg hover:bg-terminal-border text-neon-cyan border border-neon-cyan font-bold disabled:opacity-40 cel-btn shadow-[2px_2px_0px_#000]"
                >
                  -25M REPAY
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

  <!-- Tab 2: Private Equity Infrastructure Targets -->
  {:else if activeTab === 'PE'}
    <div class="bg-terminal-panel border-2 border-terminal-border cel-panel cyber-clip p-5 shadow-[4px_4px_0px_#000]">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-bold text-terminal-textBright uppercase flex items-center font-pixel">
            <Briefcase class="w-4 h-4 mr-2 text-neon-amber" /> PRIVATE EQUITY INFRASTRUCTURE ACQUISITIONS
          </h2>
          <p class="text-xs text-terminal-muted font-chakra mt-1">
            Acquire critical financial market plumbing and telecommunications vendors. Yields recurring EBITDA cash dividends distributed directly to fund equity.
          </p>
        </div>
        <button
          on:click={() => distributePEDividends()}
          class="px-3 py-1.5 bg-neon-amber text-black font-pixel font-bold text-[10px] hover:brightness-110 cel-btn shadow-[2px_2px_0px_#000] flex items-center space-x-1"
        >
          <Coins class="w-3.5 h-3.5" />
          <span>COLLECT DIVIDENDS</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each $sovereignPortfolioState.peTargets as pe}
          <div class="bg-terminal-surface border-2 border-terminal-border p-4 cel-card cyber-clip-sm font-chakra flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h3 class="font-bold text-terminal-text text-sm">{pe.name}</h3>
                  <p class="text-[11px] text-neon-cyan mt-0.5">{pe.perkDescription}</p>
                </div>
                <span class="px-2.5 py-1 text-[9px] font-pixel font-bold border-2 shadow-[2px_2px_0px_#000] {pe.status === 'ACQUIRED' ? 'bg-bull/20 text-bull border-bull' : 'bg-terminal-bg text-terminal-muted border-terminal-border'}">
                  {pe.status}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2 text-xs font-mono bg-terminal-bg p-2.5 border border-terminal-border my-3">
                <div>
                  <span class="text-[8px] text-terminal-muted block font-pixel">COST:</span>
                  <span class="font-bold text-terminal-text">${(pe.cost / 1e6).toFixed(0)}M</span>
                </div>
                <div>
                  <span class="text-[8px] text-terminal-muted block font-pixel">EBITDA YIELD:</span>
                  <span class="font-bold text-bull font-mono">+{pe.ebitdaYieldPct}%/yr</span>
                </div>
                <div>
                  <span class="text-[8px] text-terminal-muted block font-pixel">PAID TO DATE:</span>
                  <span class="font-bold text-neon-amber font-mono">${(pe.totalDividendsPaid / 1e3).toFixed(0)}k</span>
                </div>
              </div>
            </div>

            {#if pe.status === 'AVAILABLE'}
              <button
                on:click={() => handleAcquirePE(pe.id)}
                disabled={$account.cash_balance < pe.cost}
                class="w-full py-2.5 bg-neon-amber text-black font-pixel font-bold text-xs hover:brightness-110 disabled:opacity-40 cel-btn shadow-[3px_3px_0px_#000] transition"
              >
                ACQUIRE ASSET (${(pe.cost / 1e6).toFixed(0)}M USD)
              </button>
            {:else}
              <div class="w-full py-2 bg-bull/15 border-2 border-bull text-bull text-center font-pixel text-[10px] font-bold">
                OPERATIONAL // DIVIDEND CASH FLOWING
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

  <!-- Tab 3: OTC Derivatives Underwriting Desk -->
  {:else}
    <div class="bg-terminal-panel border-2 border-terminal-border cel-panel cyber-clip p-5 shadow-[4px_4px_0px_#000]">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-bold text-terminal-textBright uppercase flex items-center font-pixel">
            <FileText class="w-4 h-4 mr-2 text-bull" /> BILATERAL OTC DERIVATIVES UNDERWRITING DESK
          </h2>
          <p class="text-xs text-terminal-muted font-chakra mt-1">
            Underwrite bespoke variance swaps, sovereign catastrophe debt, and volatility corridors with Tier-1 institutional counterparties. Collect upfront premiums immediately into cash.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {#each $sovereignPortfolioState.otcContracts as otc}
          <div class="bg-terminal-surface border-2 border-terminal-border p-4 cel-card cyber-clip-sm font-chakra flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold text-terminal-textBright font-chakra">{otc.name}</span>
                <span class="px-2 py-0.5 text-[8px] font-pixel font-bold border-2 shadow-[2px_2px_0px_#000] {otc.status === 'UNDERWRITTEN' ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan animate-pulse' : otc.status === 'SETTLED_PROFIT' ? 'bg-bull/20 text-bull border-bull' : otc.status === 'SETTLED_LOSS' ? 'bg-bear/20 text-bear border-bear' : 'bg-terminal-bg text-terminal-muted border-terminal-border'}">
                  {otc.status}
                </span>
              </div>

              <div class="text-[10px] text-terminal-muted mb-3 font-chakra">
                COUNTERPARTY: <strong class="text-neon-cyan">{otc.counterparty}</strong>
              </div>

              <div class="p-2.5 bg-terminal-bg border border-terminal-border text-[10px] text-terminal-muted mb-3 font-chakra leading-relaxed">
                CONDITION: <span class="text-terminal-text">{otc.condition}</span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
                <div>
                  <span class="text-[8px] text-terminal-muted block font-pixel">NOTIONAL:</span>
                  <span class="font-bold text-terminal-text">${(otc.notional / 1e6).toFixed(0)}M</span>
                </div>
                <div>
                  <span class="text-[8px] text-terminal-muted block font-pixel">PREMIUM:</span>
                  <span class="font-bold text-bull">+${(otc.premium / 1e6).toFixed(1)}M</span>
                </div>
              </div>
            </div>

            <!-- Action / Countdown Button -->
            {#if otc.status === 'OFFERED'}
              <button
                on:click={() => handleUnderwrite(otc.id)}
                class="w-full py-2.5 bg-bull text-black font-pixel font-bold text-xs hover:brightness-110 cel-btn shadow-[3px_3px_0px_#000] transition"
              >
                UNDERWRITE (+${(otc.premium / 1e6).toFixed(1)}M)
              </button>
            {:else if otc.status === 'UNDERWRITTEN'}
              <div class="w-full py-2 bg-neon-cyan/15 border-2 border-neon-cyan text-neon-cyan text-center font-mono text-xs font-bold flex items-center justify-center space-x-1.5">
                <Clock class="w-3.5 h-3.5 animate-spin" />
                <span>EXPIRY: {otc.remainingSeconds}s REMAINING</span>
              </div>
            {:else if otc.status === 'SETTLED_PROFIT'}
              <div class="w-full py-2 bg-bull/20 border-2 border-bull text-bull text-center font-pixel text-[10px] font-bold">
                MATURED // 100% PREMIUM RETAINED
              </div>
            {:else}
              <div class="w-full py-2 bg-bear/20 border-2 border-bear text-bear text-center font-pixel text-[10px] font-bold">
                BREACHED // COLLATERAL SETTLED
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
