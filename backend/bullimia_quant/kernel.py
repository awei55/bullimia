"""
BULLIMIA QUANT KERNEL (Layer 1)
Pure deterministic financial accounting engine with zero UI dependencies.
Implements exact exchange math: Bid/Ask spread crossing, lot sizing, mark-to-market PnL,
commission schedules, margin maintenance, and liquidation invariants.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Dict, Any
import math


class PositionSide(str, Enum):
    FLAT = "FLAT"   # Neutral 100% Cash (Phase 2 unlock: SPACE + ESC)
    BULL = "BULL"   # Long (Buys at Ask, marked at Bid)
    BEAR = "BEAR"   # Short (Sells at Bid, marked at Ask)


@dataclass
class TradeRecord:
    id: int
    ticker: str
    side: PositionSide
    entry_price: float
    exit_price: float
    lots: int
    entry_timestamp: str
    exit_timestamp: str
    pnl: float
    commission_paid: float
    is_win: bool


@dataclass
class AccountState:
    cash_balance: float = 10000.0          # Settled cash
    equity: float = 10000.0                # Cash + Unrealized PnL
    side: PositionSide = PositionSide.FLAT
    open_lots: int = 0
    entry_price: float = 0.0
    entry_timestamp: str = ""
    unrealized_pnl: float = 0.0
    margin_used: float = 0.0
    free_margin: float = 10000.0
    margin_level_pct: float = 999.0
    total_commission_paid: float = 0.0
    trade_count: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    is_margin_called: bool = False
    is_millionaire: bool = False
    high_watermark: float = 10000.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cash_balance": round(self.cash_balance, 2),
            "equity": round(self.equity, 2),
            "side": self.side.value,
            "open_lots": self.open_lots,
            "entry_price": round(self.entry_price, 4),
            "entry_timestamp": self.entry_timestamp,
            "unrealized_pnl": round(self.unrealized_pnl, 2),
            "margin_used": round(self.margin_used, 2),
            "free_margin": round(self.free_margin, 2),
            "margin_level_pct": round(self.margin_level_pct, 1),
            "total_commission_paid": round(self.total_commission_paid, 2),
            "trade_count": self.trade_count,
            "winning_trades": self.winning_trades,
            "losing_trades": self.losing_trades,
            "win_rate_pct": round((self.winning_trades / self.trade_count * 100.0), 1) if self.trade_count > 0 else 0.0,
            "is_margin_called": self.is_margin_called,
            "is_millionaire": self.is_millionaire,
            "high_watermark": round(self.high_watermark, 2),
        }


ASSET_MULTIPLIERS: Dict[str, float] = {
    "NVDA": 1.0,
    "AAPL": 1.0,
    "AMD": 1.0,
    "TSLA": 1.0,
    "GME": 1.0,
    "SPY": 2.0,
    "QQQ": 1.5,
    "BTC-USD": 0.1,
    "BTC_2021": 0.1,
}


class QuantKernel:
    """
    Deterministic Financial Kernel managing multi-asset execution, mark-to-market,
    and portfolio solvency constraints.
    """
    def __init__(
        self,
        starting_cash: float = 1000.0,
        commission_per_lot: float = 1.0,
        margin_rate: float = 0.02,           # 2% margin = 50:1 leverage
        contract_multiplier: float = 1.0,    # 1.0 for equities ($1/pt/lot), calibrated per asset
        maintenance_margin_rate: float = 0.5 # Margin call at 50% maintenance margin
    ):
        self.commission_per_lot = commission_per_lot
        self.margin_rate = margin_rate
        self.contract_multiplier = contract_multiplier
        self.maintenance_margin_rate = maintenance_margin_rate
        self.god_mode: bool = False
        self._custom_multiplier = contract_multiplier != 1.0

        self.account = AccountState(
            cash_balance=starting_cash,
            equity=starting_cash,
            free_margin=starting_cash,
            high_watermark=starting_cash
        )
        self.trade_history: List[TradeRecord] = []
        self._next_trade_id: int = 1

    def set_equity(self, new_equity: float):
        """Dev tool: set equity directly for phase testing (e.g. 1M, 10M, 100M)."""
        self.account.cash_balance = new_equity
        self.account.equity = new_equity
        self.account.free_margin = new_equity
        if new_equity > self.account.high_watermark:
            self.account.high_watermark = new_equity
        if new_equity >= 1000000.0:
            self.account.is_millionaire = True
        self.account.is_margin_called = False

    def restore_state(self, account_data: Dict[str, Any], trades: Optional[List[Dict[str, Any]]] = None):
        """Restores account state from a save file or persistent store."""
        side_val = account_data.get("side", "FLAT")
        side = PositionSide[side_val] if side_val in PositionSide.__members__ else PositionSide.FLAT
        self.account.cash_balance = float(account_data.get("cash_balance", 1000.0))
        self.account.equity = float(account_data.get("equity", 1000.0))
        self.account.side = side
        self.account.open_lots = int(account_data.get("open_lots", 0))
        self.account.entry_price = float(account_data.get("entry_price", 0.0))
        self.account.entry_timestamp = str(account_data.get("entry_timestamp", ""))
        self.account.unrealized_pnl = float(account_data.get("unrealized_pnl", 0.0))
        self.account.margin_used = float(account_data.get("margin_used", 0.0))
        self.account.free_margin = float(account_data.get("free_margin", self.account.cash_balance))
        self.account.margin_level_pct = float(account_data.get("margin_level_pct", 999.0))
        self.account.total_commission_paid = float(account_data.get("total_commission_paid", 0.0))
        self.account.trade_count = int(account_data.get("trade_count", 0))
        self.account.winning_trades = int(account_data.get("winning_trades", 0))
        self.account.losing_trades = int(account_data.get("losing_trades", 0))
        self.account.high_watermark = float(account_data.get("high_watermark", self.account.equity))
        self.account.is_millionaire = self.account.equity >= 1000000.0
        self.account.is_margin_called = False

        if trades:
            self.trade_history.clear()
            for t in trades:
                t_side = PositionSide[t["side"]] if t["side"] in PositionSide.__members__ else PositionSide.FLAT
                self.trade_history.append(
                    TradeRecord(
                        id=int(t.get("id", len(self.trade_history) + 1)),
                        ticker=t.get("ticker", "NVDA"),
                        side=t_side,
                        entry_price=float(t.get("entry_price", 0.0)),
                        exit_price=float(t.get("exit_price", 0.0)),
                        lots=int(t.get("lots", 1)),
                        entry_timestamp=str(t.get("entry_timestamp", "")),
                        exit_timestamp=str(t.get("exit_timestamp", "")),
                        pnl=float(t.get("pnl", 0.0)),
                        commission_paid=float(t.get("commission_paid", 0.0)),
                        is_win=bool(t.get("is_win", False))
                    )
                )
            self._next_trade_id = max([t.id for t in self.trade_history] + [0]) + 1

    def calculate_spread(self, current_price: float, atr_pct: float = 0.02, spread_multiplier: float = 1.0) -> float:
        """
        Dynamically calculates bid-ask spread based on price and asset volatility.
        Base spread is ~0.08% of price, scaling with volatility and modifier pipeline.
        """
        spread_pct = max(0.0005, min(0.005, atr_pct * 0.05))
        base_spread = current_price * spread_pct
        return round(base_spread * max(0.2, spread_multiplier), 4)

    def get_quotes(self, price: float, atr_pct: float = 0.02, spread_multiplier: float = 1.0) -> Dict[str, float]:
        spread = self.calculate_spread(price, atr_pct, spread_multiplier)
        half_spread = spread / 2.0
        bid = round(price - half_spread, 4)
        ask = round(price + half_spread, 4)
        return {"price": price, "bid": bid, "ask": ask, "spread": spread}

    def update_mark_to_market(self, current_price: float, atr_pct: float = 0.02, spread_multiplier: float = 1.0) -> AccountState:
        """
        Recalculates floating unrealized PnL, total equity, and margin levels.
        """
        quotes = self.get_quotes(current_price, atr_pct, spread_multiplier)
        bid = quotes["bid"]
        ask = quotes["ask"]

        if self.account.side == PositionSide.FLAT or self.account.open_lots == 0:
            self.account.unrealized_pnl = 0.0
            self.account.equity = self.account.cash_balance
            self.account.margin_used = 0.0
            self.account.free_margin = self.account.cash_balance
            self.account.margin_level_pct = 999.0
        elif self.account.side == PositionSide.BULL:
            # Long position is marked to market at current BID (what you can sell it for right now)
            price_delta = bid - self.account.entry_price
            self.account.unrealized_pnl = price_delta * self.account.open_lots * self.contract_multiplier
            self.account.equity = self.account.cash_balance + self.account.unrealized_pnl
            self.account.margin_used = self.account.open_lots * self.account.entry_price * self.contract_multiplier * self.margin_rate
            self.account.free_margin = self.account.equity - self.account.margin_used
            self.account.margin_level_pct = (self.account.equity / self.account.margin_used * 100.0) if self.account.margin_used > 0 else 999.0
        elif self.account.side == PositionSide.BEAR:
            # Short position is marked to market at current ASK (what you must pay to buy it back)
            price_delta = self.account.entry_price - ask
            self.account.unrealized_pnl = price_delta * self.account.open_lots * self.contract_multiplier
            self.account.equity = self.account.cash_balance + self.account.unrealized_pnl
            self.account.margin_used = self.account.open_lots * self.account.entry_price * self.contract_multiplier * self.margin_rate
            self.account.free_margin = self.account.equity - self.account.margin_used
            self.account.margin_level_pct = (self.account.equity / self.account.margin_used * 100.0) if self.account.margin_used > 0 else 999.0

        if self.account.equity > self.account.high_watermark:
            self.account.high_watermark = self.account.equity

        if self.account.equity >= 1000000.0:
            self.account.is_millionaire = True

        # Margin Call Check (suppressed if god_mode is active)
        if not self.god_mode:
            if self.account.margin_used > 0 and self.account.equity <= (self.account.margin_used * self.maintenance_margin_rate):
                self.account.is_margin_called = True
            elif self.account.equity <= 0:
                self.account.is_margin_called = True

        return self.account

    def execute_order(
        self,
        ticker: str,
        desired_side: PositionSide,
        lots: int,
        current_price: float,
        timestamp: str,
        atr_pct: float = 0.02,
        spread_multiplier: float = 1.0,
        commission_rate: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Executes order state transition:
        - If already in a position of different side: closes current position first, realizes PnL,
          then opens new position.
        - If FLAT: opens new position.
        - If desired_side is FLAT: closes existing position and stays in cash (SPACE + ESC).
        """
        effective_commission = self.commission_per_lot if commission_rate is None else commission_rate
        if not self._custom_multiplier and ticker in ASSET_MULTIPLIERS:
            self.contract_multiplier = ASSET_MULTIPLIERS[ticker]
        lots = max(1, min(100, lots))
        quotes = self.get_quotes(current_price, atr_pct, spread_multiplier)
        bid = quotes["bid"]
        ask = quotes["ask"]

        closed_trade: Optional[TradeRecord] = None

        # 1. Close existing position if active
        if self.account.side != PositionSide.FLAT and self.account.open_lots > 0:
            if self.account.side == PositionSide.BULL:
                # Sell to close at BID
                exit_price = bid
                realized_pnl = (exit_price - self.account.entry_price) * self.account.open_lots * self.contract_multiplier
            else:
                # Buy to cover at ASK
                exit_price = ask
                realized_pnl = (self.account.entry_price - exit_price) * self.account.open_lots * self.contract_multiplier

            close_commission = effective_commission * self.account.open_lots
            self.account.cash_balance += (realized_pnl - close_commission)
            self.account.total_commission_paid += close_commission

            is_win = realized_pnl > 0
            self.account.trade_count += 1
            if is_win:
                self.account.winning_trades += 1
            else:
                self.account.losing_trades += 1

            closed_trade = TradeRecord(
                id=self._next_trade_id,
                ticker=ticker,
                side=self.account.side,
                entry_price=self.account.entry_price,
                exit_price=exit_price,
                lots=self.account.open_lots,
                entry_timestamp=self.account.entry_timestamp,
                exit_timestamp=timestamp,
                pnl=realized_pnl - close_commission,
                commission_paid=close_commission,
                is_win=is_win
            )
            self._next_trade_id += 1
            self.trade_history.append(closed_trade)

            # Reset open position
            self.account.side = PositionSide.FLAT
            self.account.open_lots = 0
            self.account.entry_price = 0.0
            self.account.entry_timestamp = ""
            self.account.unrealized_pnl = 0.0

        # 2. Open new position if desired_side is not FLAT
        if desired_side != PositionSide.FLAT:
            open_commission = effective_commission * lots
            self.account.cash_balance -= open_commission
            self.account.total_commission_paid += open_commission

            self.account.side = desired_side
            self.account.open_lots = lots
            self.account.entry_timestamp = timestamp

            if desired_side == PositionSide.BULL:
                # Buy to open at ASK
                self.account.entry_price = ask
            elif desired_side == PositionSide.BEAR:
                # Sell to open at BID
                self.account.entry_price = bid

        # 3. Recalculate mark-to-market
        self.update_mark_to_market(current_price, atr_pct, spread_multiplier)

        return {
            "account": self.account.to_dict(),
            "closed_trade": {
                "id": closed_trade.id,
                "ticker": closed_trade.ticker,
                "side": closed_trade.side.value,
                "entry_price": closed_trade.entry_price,
                "exit_price": closed_trade.exit_price,
                "lots": closed_trade.lots,
                "entry_timestamp": closed_trade.entry_timestamp,
                "exit_timestamp": closed_trade.exit_timestamp,
                "pnl": round(closed_trade.pnl, 2),
                "is_win": closed_trade.is_win,
            } if closed_trade else None,
            "quotes": quotes
        }

    def reset_career(self, starting_cash: float = 1000.0):
        self.account = AccountState(
            cash_balance=starting_cash,
            equity=starting_cash,
            free_margin=starting_cash,
            high_watermark=starting_cash
        )
        self.trade_history.clear()
        self._next_trade_id = 1
