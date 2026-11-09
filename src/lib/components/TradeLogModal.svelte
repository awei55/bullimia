<script lang="ts">
  import { tradeHistory } from '../stores/trading';
  import { X, TrendingUp, TrendingDown, History } from 'lucide-svelte';

  export let isOpen = false;
  export let onClose: () => void = () => {};

  function formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(val);
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none crt-overlay">
    <div class="w-full max-w-3xl cel-panel border-4 border-black p-0 shadow-[8px_8px_0_#000] cyber-clip overflow-hidden flex flex-col max-h-[80vh] font-chakra">
      <!-- Modal Header -->
      <div class="px-5 py-3.5 border-b-2 border-black flex items-center justify-between bg-[#101622]">
        <div class="flex items-center space-x-2">
          <History class="w-5 h-5 text-neon-cyan" />
          <h2 class="text-sm font-black pixel-text tracking-wide text-white">
            MT5 TRADE EXECUTION RECORD ({$tradeHistory.length} TRADES)
          </h2>
        </div>
        <button on:click={onClose} class="cel-btn p-1 bg-terminal-surface hover:bg-terminal-border text-white cursor-pointer">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Trade Ledger Table -->
      <div class="flex-1 overflow-y-auto p-4 bg-[#0a0e17]">
        {#if $tradeHistory.length === 0}
          <div class="py-12 text-center text-terminal-muted pixel-text text-[10px]">
            NO TRADES EXECUTED YET. TAP SPACE TO FLIP & RIDE THE TAPE.
          </div>
        {:else}
          <table class="w-full text-left font-chakra text-xs border-collapse">
            <thead>
              <tr class="border-b-2 border-black text-terminal-muted pixel-text text-[9px] uppercase">
                <th class="py-2 px-3">#</th>
                <th class="py-2 px-3">ASSET</th>
                <th class="py-2 px-3">SIDE</th>
                <th class="py-2 px-3">LOTS</th>
                <th class="py-2 px-3">ENTRY</th>
                <th class="py-2 px-3">EXIT</th>
                <th class="py-2 px-3 text-right">NET P&L</th>
              </tr>
            </thead>
            <tbody>
              {#each [...$tradeHistory].reverse() as trade}
                <tr class="border-b border-black/40 hover:bg-black/30 transition">
                  <td class="py-2 px-3 text-terminal-muted">{trade.id}</td>
                  <td class="py-2 px-3 font-bold text-white pixel-text text-[10px]">{trade.ticker}</td>
                  <td class="py-2 px-3 font-bold">
                    {#if trade.side === 'BULL'}
                      <span class="text-bull flex items-center">
                        <TrendingUp class="w-3 h-3 mr-1 inline" /> LONG
                      </span>
                    {:else if trade.side === 'BEAR'}
                      <span class="text-bear flex items-center">
                        <TrendingDown class="w-3 h-3 mr-1 inline" /> SHORT
                      </span>
                    {:else}
                      <span class="text-neon-cyan">FLAT</span>
                    {/if}
                  </td>
                  <td class="py-2 px-3 font-bold">{trade.lots} L</td>
                  <td class="py-2 px-3">${trade.entry_price.toFixed(2)}</td>
                  <td class="py-2 px-3">${trade.exit_price.toFixed(2)}</td>
                  <td class="py-2 px-3 text-right font-black {trade.is_win ? 'text-bull' : 'text-bear'}">
                    {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3 border-t-2 border-black bg-[#101622] flex justify-end">
        <button
          type="button"
          on:click={onClose}
          class="px-4 py-2 cel-btn bg-terminal-surface hover:bg-terminal-border text-white text-xs pixel-text cursor-pointer"
        >
          CLOSE
        </button>
      </div>
    </div>
  </div>
{/if}
