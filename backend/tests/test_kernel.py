import pytest
from bullimia_quant.kernel import QuantKernel, PositionSide


def test_initial_account_state():
    kernel = QuantKernel()
    acc = kernel.account
    assert acc.cash_balance == 1000.0
    assert acc.equity == 1000.0
    assert acc.side == PositionSide.FLAT
    assert acc.open_lots == 0
    assert acc.trade_count == 0
    assert not acc.is_margin_called
    assert not acc.is_millionaire


def test_bull_order_execution_and_mark_to_market():
    kernel = QuantKernel(starting_cash=10000.0, commission_per_lot=1.0, contract_multiplier=10.0)
    
    # Enter 10 lots Long on NVDA at $100.00
    res = kernel.execute_order(
        ticker="NVDA",
        desired_side=PositionSide.BULL,
        lots=10,
        current_price=100.0,
        timestamp="2024-01-02",
        atr_pct=0.02
    )
    acc = res["account"]
    quotes = res["quotes"]
    
    # Commission paid = $1 * 10 = $10
    assert acc["cash_balance"] == 9990.0
    assert acc["open_lots"] == 10
    assert acc["side"] == "BULL"
    assert acc["entry_price"] == quotes["ask"]
    
    # Immediate mark-to-market at current Bid reflects the spread cost
    assert acc["unrealized_pnl"] < 0
    assert acc["equity"] < 9990.0


def test_bull_profitable_exit():
    kernel = QuantKernel(starting_cash=10000.0, commission_per_lot=1.0, contract_multiplier=10.0)
    
    # Buy 10 lots at $100
    kernel.execute_order(
        ticker="NVDA",
        desired_side=PositionSide.BULL,
        lots=10,
        current_price=100.0,
        timestamp="2024-01-02",
        atr_pct=0.02
    )
    
    # Price surges to $110.00
    # Close by flipping to FLAT (Neutral)
    res = kernel.execute_order(
        ticker="NVDA",
        desired_side=PositionSide.FLAT,
        lots=10,
        current_price=110.0,
        timestamp="2024-01-05",
        atr_pct=0.02
    )
    
    acc = res["account"]
    closed = res["closed_trade"]
    
    assert closed is not None
    assert closed["is_win"] is True
    assert closed["pnl"] > 0
    assert acc["cash_balance"] > 10000.0
    assert acc["trade_count"] == 1
    assert acc["winning_trades"] == 1
    assert acc["side"] == "FLAT"
    assert acc["open_lots"] == 0


def test_bear_profitable_exit():
    kernel = QuantKernel(starting_cash=10000.0, commission_per_lot=1.0, contract_multiplier=10.0)
    
    # Sell Short 5 lots at $100
    kernel.execute_order(
        ticker="TSLA",
        desired_side=PositionSide.BEAR,
        lots=5,
        current_price=100.0,
        timestamp="2024-01-02",
        atr_pct=0.02
    )
    
    # Price drops to $90.00
    res = kernel.execute_order(
        ticker="TSLA",
        desired_side=PositionSide.FLAT,
        lots=5,
        current_price=90.0,
        timestamp="2024-01-05",
        atr_pct=0.02
    )
    
    closed = res["closed_trade"]
    acc = res["account"]
    
    assert closed is not None
    assert closed["is_win"] is True
    assert closed["pnl"] > 0
    assert acc["cash_balance"] > 10000.0
    assert acc["side"] == "FLAT"


def test_reversal_flips_position():
    kernel = QuantKernel(starting_cash=10000.0, commission_per_lot=1.0, contract_multiplier=10.0)
    
    # Open Bull
    kernel.execute_order("SPY", PositionSide.BULL, 10, 500.0, "2024-01-02")
    assert kernel.account.side == PositionSide.BULL
    
    # Reversal to Bear
    res = kernel.execute_order("SPY", PositionSide.BEAR, 20, 505.0, "2024-01-03")
    assert res["closed_trade"] is not None
    assert res["account"]["side"] == "BEAR"
    assert res["account"]["open_lots"] == 20
    assert res["account"]["trade_count"] == 1


def test_margin_call_trigger():
    # High leverage, massive adverse movement
    kernel = QuantKernel(starting_cash=1000.0, margin_rate=0.02, contract_multiplier=100.0)
    
    # Buy 50 lots at $100
    kernel.execute_order("BTC", PositionSide.BULL, 50, 100.0, "2024-01-01")
    
    # Massive crash to $50
    kernel.update_mark_to_market(50.0, atr_pct=0.05)
    
    assert kernel.account.is_margin_called is True
    assert kernel.account.death_reason == "DEAD_BROKE"


def test_tutorial_dead_broke_and_suppressed_margin_call():
    # Genesis Tutorial: $1,000 cash, margin NOT unlocked
    kernel = QuantKernel(starting_cash=1000.0, margin_rate=0.02, contract_multiplier=1.0)
    assert not kernel.has_unlocked_margin
    
    # Buy 100 lots at $100 -> Commission $100, cash $900. Margin used = 200, maintenance margin = 100
    kernel.execute_order("NVDA", PositionSide.BULL, 100, 100.0, "2024-01-01")
    
    # Adverse movement to $91.6: PnL approx -850 -> Equity approx 50 (< 100 maintenance margin, but > 0)
    kernel.update_mark_to_market(91.6, atr_pct=0.001)
    assert kernel.account.equity > 0
    assert kernel.account.equity < kernel.account.margin_used * 0.5
    # Crucial: Player is NOT margin called in tutorial because equity > 0
    assert kernel.account.is_margin_called is False
    assert kernel.account.death_reason is None

    # Total wipeout: price drops to $80 -> Equity < 0
    kernel.update_mark_to_market(80.0, atr_pct=0.001)
    assert kernel.account.equity <= 0
    assert kernel.account.is_margin_called is True
    assert kernel.account.death_reason == "DEAD_BROKE"


def test_post_10k_margin_call_liquidation():
    # After crossing $10k or wire, margin is unlocked
    kernel = QuantKernel(starting_cash=10000.0, margin_rate=0.02, contract_multiplier=1.0)
    kernel.has_unlocked_margin = True
    
    # Buy 100 lots at $100 -> Margin used = 200, maintenance margin = 100
    kernel.execute_order("NVDA", PositionSide.BULL, 100, 100.0, "2024-01-01")
    
    # Adjust cash balance to 1000.0 so drop to 90.5 leaves equity at ~50 (below maintenance margin 100)
    kernel.account.cash_balance = 1000.0
    kernel.update_mark_to_market(90.5, atr_pct=0.001)
    assert kernel.account.equity > 0
    assert kernel.account.is_margin_called is True
    assert kernel.account.death_reason == "MARGIN_CALL"


def test_microlot_minimum_ticket_commission():
    kernel = QuantKernel(starting_cash=1000.0, commission_per_lot=1.0, contract_multiplier=1.0)
    
    # Execute microlot order of 0.01 lots
    # 0.01 lots * $1.00 = $0.01, but minimum ticket fee is $0.50
    res = kernel.execute_order("NVDA", PositionSide.BULL, 0.01, 100.0, "2024-01-01")
    acc = res["account"]
    assert acc["total_commission_paid"] == 0.50
    assert acc["cash_balance"] == 999.50
    assert acc["open_lots"] == 0.01


def test_millionaire_milestone():
    kernel = QuantKernel(starting_cash=950000.0, contract_multiplier=100.0)
    
    # Buy 100 lots at $100
    kernel.execute_order("NVDA", PositionSide.BULL, 100, 100.0, "2024-01-01")
    
    # Price rises to $110 -> PnL = (110 - 100) * 100 * 100 = $100,000 -> Total Equity > $1,000,000
    kernel.update_mark_to_market(110.0, atr_pct=0.02)
    
    assert kernel.account.equity >= 1000000.0
    assert kernel.account.is_millionaire is True


def test_modifier_pipeline_integration():
    """Verify that spread_multiplier and commission_rate modifiers alter execution and spread without breaking solvency invariants."""
    kernel = QuantKernel(starting_cash=100000.0, commission_per_lot=1.0, contract_multiplier=10.0)
    
    # 1. Base spread vs NY4 Colocation tighter spread (0.70x)
    base_spread = kernel.calculate_spread(100.0, atr_pct=0.02, spread_multiplier=1.0)
    ny4_spread = kernel.calculate_spread(100.0, atr_pct=0.02, spread_multiplier=0.70)
    assert ny4_spread < base_spread
    assert ny4_spread == round(base_spread * 0.70, 4)

    # 2. Execute order with Wholesale Internalizer (commission $0.75, spread 0.85x)
    res = kernel.execute_order(
        ticker="NVDA",
        desired_side=PositionSide.BULL,
        lots=10,
        current_price=100.0,
        timestamp="2024-01-02",
        atr_pct=0.02,
        spread_multiplier=0.85,
        commission_rate=0.75
    )
    acc = res["account"]
    # Commission for 10 lots at $0.75 should be exactly $7.50
    assert acc["cash_balance"] == 99992.50
    assert acc["total_commission_paid"] == 7.50
    assert acc["open_lots"] == 10

