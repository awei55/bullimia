<script lang="ts">
  import { account } from '../stores/trading';
  import { Landmark, ShieldCheck, Briefcase, FileText, TrendingUp, Building2, ChevronRight } from 'lucide-svelte';

  const creditFacilities = [
    { facility: 'Federal Reserve Primary Dealer Repo', limit: 250000000, drawn: 35000000, rate: '4.25% SOFR' },
    { facility: 'ECB Bilateral Liquidity Facility', limit: 150000000, drawn: 0, rate: '3.75% ESTR' },
  ];

  const peTargets = [
    { name: 'Secaucus NY4 High-Speed Fiber Backbone', cost: 42000000, ebitda: '+14% / yr', status: 'ACQUIRED' },
    { name: 'Apex Clearing Wholesale Internalizer', cost: 75000000, ebitda: '+22% / yr', status: 'AVAILABLE' },
  ];
</script>

<div class="h-full w-full flex flex-col bg-terminal-bg p-6 font-mono select-none overflow-y-auto crt-overlay">
  <!-- Header -->
  <div class="flex items-center justify-between pb-4 border-b-2 border-terminal-border mb-6">
    <div>
      <span class="text-[9px] text-neon-cyan font-pixel tracking-widest uppercase flex items-center">
        <Landmark class="w-4 h-4 mr-1.5" /> PHASE 4 // INSTITUTIONAL SOVEREIGN PORTFOLIO ($100M+)
      </span>
      <h1 class="text-xl font-bold font-pixel text-terminal-textBright mt-1">MACRO CAPITAL & SOVEREIGN DESK</h1>
    </div>

    <!-- Too Big To Fail Badge -->
    <div class="bg-bull/20 border-2 border-bull cel-card cyber-clip-sm px-4 py-2 text-right shadow-[3px_3px_0px_#000]">
      <span class="text-[9px] text-terminal-muted uppercase font-pixel block">SYSTEMIC SOLVENCY STATUS</span>
      <span class="text-xs text-bull font-bold font-chakra flex items-center justify-end text-glow-bull">
        <ShieldCheck class="w-4 h-4 mr-1" /> TOO BIG TO FAIL // NO MARGIN CALLS
      </span>
    </div>
  </div>

  <!-- Key Metrics Row -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div class="bg-terminal-panel border-2 border-terminal-border cel-card cyber-clip-sm p-4 shadow-[4px_4px_0px_#000]">
      <span class="text-[9px] text-terminal-muted font-pixel block mb-1">TOTAL ASSETS (AUM)</span>
      <span class="text-xl font-bold text-bull font-mono">${$account.equity.toLocaleString()}</span>
    </div>

    <div class="bg-terminal-panel border-2 border-terminal-border cel-card cyber-clip-sm p-4 shadow-[4px_4px_0px_#000]">
      <span class="text-[9px] text-terminal-muted font-pixel block mb-1">CREDIT CAPACITY</span>
      <span class="text-xl font-bold text-neon-cyan font-mono">$400,000,000</span>
    </div>

    <div class="bg-terminal-panel border-2 border-terminal-border cel-card cyber-clip-sm p-4 shadow-[4px_4px_0px_#000]">
      <span class="text-[9px] text-terminal-muted font-pixel block mb-1">IMPACT ABSORPTION</span>
      <span class="text-xl font-bold text-neon-amber font-mono">99.8% (TIER 1 LP)</span>
    </div>

    <div class="bg-terminal-panel border-2 border-terminal-border cel-card cyber-clip-sm p-4 shadow-[4px_4px_0px_#000]">
      <span class="text-[9px] text-terminal-muted font-pixel block mb-1">SYSTEMIC LEVERAGE</span>
      <span class="text-xl font-bold text-terminal-text font-mono">1.25x</span>
    </div>
  </div>

  <!-- Central Bank Credit Facilities & PE Tabs -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <!-- Credit Facilities -->
    <div class="bg-terminal-panel border-2 border-terminal-border cel-panel cyber-clip p-5 shadow-[4px_4px_0px_#000]">
      <h2 class="text-sm font-bold text-terminal-textBright uppercase mb-3 flex items-center font-pixel">
        <Landmark class="w-4 h-4 mr-2 text-neon-cyan" /> CENTRAL BANK CREDIT FACILITIES
      </h2>
      <div class="space-y-3">
        {#each creditFacilities as f}
          <div class="bg-terminal-surface border-2 border-terminal-border p-3 text-xs cel-card cyber-clip-sm font-chakra">
            <div class="flex justify-between font-bold text-terminal-text mb-1">
              <span>{f.facility}</span>
              <span class="text-neon-cyan font-mono">{f.rate}</span>
            </div>
            <div class="flex justify-between text-terminal-muted text-[11px] font-mono">
              <span>DRAWN: ${f.drawn.toLocaleString()}</span>
              <span>LIMIT: ${f.limit.toLocaleString()}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Private Equity & Vendor Acquisitions -->
    <div class="bg-terminal-panel border-2 border-terminal-border cel-panel cyber-clip p-5 shadow-[4px_4px_0px_#000]">
      <h2 class="text-sm font-bold text-terminal-textBright uppercase mb-3 flex items-center font-pixel">
        <Briefcase class="w-4 h-4 mr-2 text-neon-amber" /> PRIVATE EQUITY INFRASTRUCTURE
      </h2>
      <div class="space-y-3">
        {#each peTargets as pe}
          <div class="bg-terminal-surface border-2 border-terminal-border p-3 text-xs flex justify-between items-center cel-card cyber-clip-sm font-chakra">
            <div>
              <div class="font-bold text-terminal-text">{pe.name}</div>
              <div class="text-[11px] text-terminal-muted font-mono">COST: ${pe.cost.toLocaleString()} • EBITDA: {pe.ebitda}</div>
            </div>
            <span class="px-2.5 py-1 text-[9px] font-pixel font-bold border-2 shadow-[2px_2px_0px_#000] {pe.status === 'ACQUIRED' ? 'bg-bull/20 text-bull border-bull' : 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan'}">
              {pe.status}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
