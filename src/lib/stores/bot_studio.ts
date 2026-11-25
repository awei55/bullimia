import { writable, get } from 'svelte/store';
import { account, quotes, currentLevel } from './trading';
import { soundEngine } from '../audio/soundtrack';

export type SignalType =
  | 'EMA_CROSS'
  | 'RSI_OVERSOLD'
  | 'RSI_OVERBOUGHT'
  | 'BOLLINGER_BREAKOUT'
  | 'VOLUME_SPIKE'
  | 'MACRO_NEWS';

export type ActionType =
  | 'BUY_BULL'
  | 'SELL_BEAR'
  | 'MEAN_REVERT';

export interface QuantBot {
  id: string;
  name: string;
  ticker: string;
  active: boolean;
  signalType: SignalType;
  actionType: ActionType;
  lotSize: number;
  tradesCount: number;
  realizedPnl: number;
  unrealizedPnl: number;
  winCount: number;
  lossCount: number;
  winRatePct: number;
  lastTriggerTime?: string;
  lastLog?: string;
  activeTrade?: {
    side: 'BULL' | 'BEAR';
    lots: number;
    entryPrice: number;
  } | null;
}

export interface BotStudioState {
  bots: QuantBot[];
  isDelayedStreamLive: boolean;
  streamLatencySec: number; // 15-minute simulated delay = 900s
  totalBotPnl: number;
  totalBotTrades: number;
}

const initialBots: QuantBot[] = [
  {
    id: 'bot-alpha-mom',
    name: 'Alpha-Momentum Trend Surfer',
    ticker: 'NVDA',
    active: true,
    signalType: 'EMA_CROSS',
    actionType: 'BUY_BULL',
    lotSize: 25,
    tradesCount: 142,
    realizedPnl: 482000,
    unrealizedPnl: 0,
    winCount: 94,
    lossCount: 48,
    winRatePct: 66.2,
    lastTriggerTime: '12m ago',
    lastLog: 'LONG NVDA @ $122.40 (9/21 EMA Golden Cross)',
    activeTrade: null,
  },
  {
    id: 'bot-mean-rev',
    name: 'Mean-Reversion Statistical Scalper',
    ticker: 'TSLA',
    active: false,
    signalType: 'RSI_OVERSOLD',
    actionType: 'MEAN_REVERT',
    lotSize: 50,
    tradesCount: 89,
    realizedPnl: 215000,
    unrealizedPnl: 0,
    winCount: 58,
    lossCount: 31,
    winRatePct: 65.2,
    lastTriggerTime: '1h ago',
    lastLog: 'REVERT TSLA @ $212.10 (RSI < 28 Overextended)',
    activeTrade: null,
  },
  {
    id: 'bot-macro-skew',
    name: 'Cross-Asset Volatility Arbitrage',
    ticker: 'BTC-USD',
    active: true,
    signalType: 'BOLLINGER_BREAKOUT',
    actionType: 'BUY_BULL',
    lotSize: 10,
    tradesCount: 210,
    realizedPnl: 1140000,
    unrealizedPnl: 0,
    winCount: 148,
    lossCount: 62,
    winRatePct: 70.5,
    lastTriggerTime: '4m ago',
    lastLog: 'LONG BTC-USD @ $64,150 (Upper Band Squeeze Breakout)',
    activeTrade: null,
  },
];

const initialState: BotStudioState = {
  bots: initialBots,
  isDelayedStreamLive: true,
  streamLatencySec: 900,
  totalBotPnl: 1837000,
  totalBotTrades: 441,
};

export const botStudioState = writable<BotStudioState>(initialState);

export function toggleBot(botId: string) {
  botStudioState.update((s) => {
    const updated = s.bots.map((b) => {
      if (b.id === botId) {
        const nextActive = !b.active;
        if (nextActive) soundEngine.playOrderExecuted('BULL', b.lotSize);
        return { ...b, active: nextActive };
      }
      return b;
    });
    return { ...s, bots: updated };
  });
}

export function createBot(
  name: string,
  ticker: string,
  signalType: SignalType,
  actionType: ActionType,
  lotSize: number = 25
): QuantBot {
  const newBot: QuantBot = {
    id: `bot-${Date.now()}`,
    name,
    ticker,
    active: true,
    signalType,
    actionType,
    lotSize,
    tradesCount: 0,
    realizedPnl: 0,
    unrealizedPnl: 0,
    winCount: 0,
    lossCount: 0,
    winRatePct: 0,
    lastTriggerTime: 'Just now',
    lastLog: `INITIALIZED ${name} on ${ticker}`,
    activeTrade: null,
  };

  botStudioState.update((s) => ({
    ...s,
    bots: [...s.bots, newBot],
  }));

  soundEngine.playOrderExecuted('BULL', lotSize);
  return newBot;
}

export function deleteBot(botId: string) {
  botStudioState.update((s) => ({
    ...s,
    bots: s.bots.filter((b) => b.id !== botId),
  }));
}

export function tickBots(priceOverride?: number) {
  botStudioState.update((s) => {
    let totalAddedPnl = 0;
    const now = new Date().toLocaleTimeString();

    const updatedBots = s.bots.map((bot) => {
      if (!bot.active) return bot;

      // Probability of algorithmic trigger per tick cycle (~25% chance of trade execution when running)
      const trigger = Math.random() < 0.25;
      if (!trigger) return bot;

      // Close active position if open, or open new one
      if (bot.activeTrade) {
        // Settle active trade
        const isWin = Math.random() < 0.68; // 68% algo win rate baseline
        const pointMove = (Math.random() * 2.5 + 0.5) * (isWin ? 1 : -0.8);
        const tradePnl = Number((pointMove * bot.activeTrade.lots * 10.0).toFixed(2));
        const commission = bot.activeTrade.lots * 1.0;
        const netPnl = tradePnl - commission;

        bot.realizedPnl += netPnl;
        bot.tradesCount += 1;
        if (netPnl > 0) bot.winCount += 1;
        else bot.lossCount += 1;

        bot.winRatePct = Number(((bot.winCount / bot.tradesCount) * 100).toFixed(1));
        bot.lastTriggerTime = now;
        bot.lastLog = `CLOSED ${bot.activeTrade.side} on ${bot.ticker}: ${netPnl >= 0 ? '+' : ''}$${netPnl.toLocaleString()} (${isWin ? 'PROFIT TARGET' : 'STOP LOSS'})`;
        bot.activeTrade = null;
        bot.unrealizedPnl = 0;

        totalAddedPnl += netPnl;
      } else {
        // Open new trade based on action type
        const side: 'BULL' | 'BEAR' = bot.actionType === 'SELL_BEAR' ? 'BEAR' : bot.actionType === 'BUY_BULL' ? 'BULL' : (Math.random() > 0.5 ? 'BULL' : 'BEAR');
        const estPrice = priceOverride ?? 125.0;
        bot.activeTrade = { side, lots: bot.lotSize, entryPrice: estPrice };
        bot.lastTriggerTime = now;
        bot.lastLog = `FIRED ${bot.signalType} -> ${side} ${bot.lotSize}L on ${bot.ticker} @ $${estPrice.toFixed(2)}`;
      }

      return bot;
    });

    if (totalAddedPnl !== 0) {
      account.update((acc) => {
        acc.cash_balance += totalAddedPnl;
        acc.equity += totalAddedPnl;
        acc.free_margin += totalAddedPnl;
        acc.trade_count += 1;
        if (totalAddedPnl > 0) acc.winning_trades += 1;
        else acc.losing_trades += 1;
        return acc;
      });

      if (totalAddedPnl > 0) {
        soundEngine.playWin(totalAddedPnl);
      } else {
        soundEngine.playLoss(totalAddedPnl);
      }
    }

    const totalPnl = updatedBots.reduce((sum, b) => sum + b.realizedPnl, 0);
    const totalTrades = updatedBots.reduce((sum, b) => sum + b.tradesCount, 0);

    return {
      ...s,
      bots: updatedBots,
      totalBotPnl: totalPnl,
      totalBotTrades: totalTrades,
    };
  });
}
