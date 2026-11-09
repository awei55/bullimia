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
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
    <div class="w-full max-w-3xl bg-terminal-panel border border-terminal-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-terminal-border flex items-center justify-between bg-terminal-surface">
        <div class="flex items-center space-x-2">
          <History class="w-5 h-5 text-neon-cyan" />
          <h2 class="text-base font-bold font-mono tracking-wide text-terminal-textBright">
            MT5 TRADE EXECUTION RECORD ({$tradeHistory.length} TRADES)
          </h2>
        </div>
        <button on:click={onClose} class="text-terminal-muted hover:text-terminal-textBright transition">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Trade Ledger Table -->
      <div class="flex-1 overflow-y-auto p-4">
        {#if $tradeHistory.length === 0}
          <div class="py-12 text-center text-terminal-muted font-mono text-sm">
            NO TRADES EXECUTED YET. PRESS SPACEBAR TO FLIP & TRADE.
          </div>
        {:else}
          <table class="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr class="border-b border-terminal-border text-terminal-muted uppercase">
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
                <tr class="border-b border-terminal-border/50 hover:bg-terminal-surface transition">
                  <td class="py-2.5 px-3 text-terminal-muted">{trade.id}</td>
                  <td class="py-2.5 px-3 font-bold text-terminal-textBright">{trade.ticker}</td>
                  <td class="py-2.5 px-3">
                    {#if trade.side === 'BULL'}
                      <span class="text-bull flex items-center">
                        <TrendingUp class="w-3 h-3 mr-1 inline" /> BULL
                      </span>
                    {:else if trade.side === 'BEAR'}
                      <span class="text-bear flex items-center">
                        <TrendingDown class="w-3 h-3 mr-1 inline" /> BEAR
                      </span>
                    {:else}
                      <span class="text-neon-cyan">FLAT</span>
                    {/if}
                  </td>
                  <td class="py-2.5 px-3">{trade.lots} L</td>
                  <td class="py-2.5 px-3">${trade.entry_price.toFixed(2)}</td>
                  <td class="py-2.5 px-3">${trade.exit_price.toFixed(2)}</td>
                  <td class="py-2.5 px-3 text-right font-bold {trade.is_win ? 'text-bull' : 'text-bear'}">
                    {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3 border-t border-terminal-border bg-terminal-surface flex justify-end">
        <button
          on:click={onClose}
          class="px-4 py-1.5 rounded bg-terminal-border hover:bg-terminal-borderLight text-terminal-text text-xs font-mono transition"
        >
          CLOSE
        </button>
      </div>
    </div>
  </div>
{/if}
