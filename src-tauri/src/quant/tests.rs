#[cfg(test)]
mod tests {
    use crate::quant::kernel::QuantKernel;
    use crate::quant::models::PositionSide;

    #[test]
    fn test_initial_account_state() {
        let kernel = QuantKernel::new(1000.0);
        let acc = &kernel.account;

        assert_eq!(acc.cash_balance, 1000.0);
        assert_eq!(acc.equity, 1000.0);
        assert_eq!(acc.side, PositionSide::FLAT);
        assert_eq!(acc.open_lots, 0.0);
        assert_eq!(acc.entry_price, 0.0);
        assert_eq!(acc.unrealized_pnl, 0.0);
        assert_eq!(acc.margin_used, 0.0);
        assert_eq!(acc.free_margin, 1000.0);
        assert_eq!(acc.margin_level_pct, 999.0);
        assert_eq!(acc.trade_count, 0);
        assert_eq!(acc.high_watermark, 1000.0);
        assert!(!acc.is_margin_called);
        assert!(!acc.is_millionaire);
    }

    #[test]
    fn test_bull_order_execution_and_mark_to_market() {
        let mut kernel = QuantKernel::new(1000.0);
        let current_price = 100.0;

        let res = kernel.execute_order("NVDA", PositionSide::BULL, 1.0, current_price, "2026-11-10T12:00:00Z", 0.02, 1.0, None);
        let acc = &res.account;

        // Commission paid on open ($1.00)
        assert_eq!(acc.cash_balance, 999.0);
        assert_eq!(acc.total_commission_paid, 1.0);
        assert_eq!(acc.side, PositionSide::BULL);
        assert_eq!(acc.open_lots, 1.0);
        // Bought at Ask (price + half spread)
        assert!(acc.entry_price > current_price);

        // Immediate mark to market at Bid produces small negative unrealized PnL (the spread)
        assert!(acc.unrealized_pnl < 0.0);
        assert!(acc.equity < 999.0);
        assert!(acc.margin_used > 0.0);
        assert!(acc.free_margin < acc.equity);
        assert!(!acc.is_margin_called);
    }

    #[test]
    fn test_bull_profitable_exit() {
        let mut kernel = QuantKernel::new(1000.0);
        kernel.execute_order("NVDA", PositionSide::BULL, 1.0, 100.0, "2026-11-10T12:00:00Z", 0.02, 1.0, None);

        // Price rises from 100 to 110
        let exit_res = kernel.execute_order("NVDA", PositionSide::FLAT, 0.0, 110.0, "2026-11-10T12:05:00Z", 0.02, 1.0, None);
        let acc = &exit_res.account;

        assert_eq!(acc.side, PositionSide::FLAT);
        assert_eq!(acc.open_lots, 0.0);
        assert_eq!(acc.unrealized_pnl, 0.0);
        assert_eq!(acc.margin_used, 0.0);

        // Equity must be higher than starting $1000
        assert!(acc.equity > 1000.0);
        assert_eq!(acc.cash_balance, acc.equity);
        assert_eq!(acc.trade_count, 1);
        assert_eq!(acc.winning_trades, 1);
        assert_eq!(acc.losing_trades, 0);
        assert_eq!(acc.win_rate_pct, 100.0);

        let closed = exit_res.closed_trade.expect("Must have closed trade");
        assert!(closed.pnl > 0.0);
        assert!(closed.is_win);
        assert_eq!(closed.exit_price, exit_res.quotes.bid);
    }

    #[test]
    fn test_bear_profitable_exit() {
        let mut kernel = QuantKernel::with_config(10000.0, 1.0, 0.02, 10.0, 0.5);
        kernel.execute_order("TSLA", PositionSide::BEAR, 5.0, 100.0, "2024-01-02", 0.02, 1.0, None);

        // Price drops from 100 to 90 (profitable for short)
        let exit_res = kernel.execute_order("TSLA", PositionSide::FLAT, 5.0, 90.0, "2024-01-05", 0.02, 1.0, None);
        let acc = &exit_res.account;

        assert_eq!(acc.side, PositionSide::FLAT);
        assert!(acc.cash_balance > 10000.0);
        assert_eq!(acc.trade_count, 1);
        assert_eq!(acc.winning_trades, 1);

        let closed = exit_res.closed_trade.expect("Must have closed trade");
        assert!(closed.pnl > 0.0);
        assert!(closed.is_win);
    }

    #[test]
    fn test_reversal_flips_position() {
        let mut kernel = QuantKernel::with_config(10000.0, 1.0, 0.02, 10.0, 0.5);
        kernel.execute_order("SPY", PositionSide::BULL, 10.0, 500.0, "2024-01-02", 0.02, 1.0, None);
        assert_eq!(kernel.account.side, PositionSide::BULL);

        // Reversal: Directly order BEAR
        let flip_res = kernel.execute_order("SPY", PositionSide::BEAR, 20.0, 505.0, "2024-01-03", 0.02, 1.0, None);
        let acc = &flip_res.account;

        assert_eq!(acc.side, PositionSide::BEAR);
        assert_eq!(acc.open_lots, 20.0);
        assert_eq!(acc.trade_count, 1);
        assert!(flip_res.closed_trade.is_some());
    }

    #[test]
    fn test_margin_call_trigger() {
        let mut kernel = QuantKernel::with_config(1000.0, 1.0, 0.02, 100.0, 0.5);
        kernel.execute_order("BTC", PositionSide::BULL, 50.0, 100.0, "2024-01-01", 0.05, 1.0, None);

        // Massive crash from 100 to 50
        kernel.update_mark_to_market(50.0, 0.05, 1.0);
        assert!(kernel.account.is_margin_called);
        assert_eq!(kernel.account.death_reason, Some("DEAD_BROKE".to_string()));
    }

    #[test]
    fn test_tutorial_dead_broke_and_suppressed_margin_call() {
        let mut kernel = QuantKernel::with_config(1000.0, 1.0, 0.02, 1.0, 0.5);
        assert!(!kernel.has_unlocked_margin);

        // Buy 100 lots at $100 -> Commission $100, cash $900. Margin used = 200, maintenance margin = 100
        kernel.execute_order("NVDA", PositionSide::BULL, 100.0, 100.0, "2024-01-01", 0.001, 1.0, None);

        // Adverse movement to 91.6: equity drops below maintenance margin, but > 0
        kernel.update_mark_to_market(91.6, 0.001, 1.0);
        assert!(kernel.account.equity > 0.0);
        assert!(kernel.account.equity < kernel.account.margin_used * 0.5);
        assert!(!kernel.account.is_margin_called);
        assert_eq!(kernel.account.death_reason, None);

        // Total wipeout: price drops to 80.0 -> equity <= 0
        kernel.update_mark_to_market(80.0, 0.001, 1.0);
        assert!(kernel.account.equity <= 0.0);
        assert!(kernel.account.is_margin_called);
        assert_eq!(kernel.account.death_reason, Some("DEAD_BROKE".to_string()));
    }

    #[test]
    fn test_post_10k_margin_call_liquidation() {
        let mut kernel = QuantKernel::with_config(10000.0, 1.0, 0.02, 1.0, 0.5);
        kernel.has_unlocked_margin = true;

        kernel.execute_order("NVDA", PositionSide::BULL, 100.0, 100.0, "2024-01-01", 0.001, 1.0, None);
        kernel.account.cash_balance = 1000.0;
        kernel.update_mark_to_market(90.5, 0.001, 1.0);

        assert!(kernel.account.equity > 0.0);
        assert!(kernel.account.is_margin_called);
        assert_eq!(kernel.account.death_reason, Some("MARGIN_CALL".to_string()));
    }

    #[test]
    fn test_microlot_minimum_ticket_commission() {
        let mut kernel = QuantKernel::with_config(1000.0, 1.0, 0.02, 1.0, 0.5);

        // 0.01 microlot with $1.00 base rate -> 0.01 * 1.0 = $0.01, but min ticket is $0.50
        let res = kernel.execute_order("NVDA", PositionSide::BULL, 0.01, 100.0, "2024-01-01", 0.02, 1.0, None);
        assert_eq!(res.account.total_commission_paid, 0.50);
        assert_eq!(res.account.cash_balance, 999.50);
        assert_eq!(res.account.open_lots, 0.01);
    }

    #[test]
    fn test_millionaire_milestone() {
        let mut kernel = QuantKernel::with_config(950000.0, 1.0, 0.02, 100.0, 0.5);
        kernel.execute_order("NVDA", PositionSide::BULL, 100.0, 100.0, "2024-01-01", 0.02, 1.0, None);
        kernel.update_mark_to_market(110.0, 0.02, 1.0);

        assert!(kernel.account.equity >= 1000000.0);
        assert!(kernel.account.is_millionaire);
    }

    #[test]
    fn test_modifier_pipeline_integration() {
        let mut kernel = QuantKernel::with_config(100000.0, 1.0, 0.02, 10.0, 0.5);

        let base_spread = kernel.calculate_spread(100.0, 0.02, 1.0);
        let ny4_spread = kernel.calculate_spread(100.0, 0.02, 0.70);
        assert!(ny4_spread < base_spread);
        assert_eq!(ny4_spread, ((base_spread * 0.70) * 10000.0).round() / 10000.0);

        let res = kernel.execute_order("NVDA", PositionSide::BULL, 10.0, 100.0, "2024-01-02", 0.02, 0.85, Some(0.75));
        let acc = &res.account;
        assert_eq!(acc.cash_balance, 99992.50);
        assert_eq!(acc.total_commission_paid, 7.50);
        assert_eq!(acc.open_lots, 10.0);
    }

    #[test]
    fn test_creditor_restructuring_post_10m() {
        let mut kernel = QuantKernel::with_config(10000000.0, 1.0, 0.02, 10.0, 0.5);
        kernel.account.high_watermark = 10000000.0;

        kernel.execute_order("NVDA", PositionSide::BULL, 100000.0, 100.0, "2024-01-02", 0.05, 1.0, None);
        kernel.update_mark_to_market(0.50, 0.05, 1.0);

        assert!(!kernel.account.is_margin_called);
        assert_eq!(kernel.account.death_reason, None);
        assert!(kernel.account.is_in_restructuring);
        assert_eq!(kernel.account.restructuring_breach_count, 1);
        assert_eq!(kernel.account.restructuring_debt, 5500000.0);
        assert_eq!(kernel.account.debt_interest_rate_pct, 11.75);

        kernel.accrue_debt_interest(30.0);
        assert!(kernel.account.restructuring_debt > 5500000.0);

        kernel.account.cash_balance = 10000000.0;
        let repaid = kernel.repay_restructuring_debt(6000000.0);
        assert!(repaid > 5500000.0);
        assert_eq!(kernel.account.restructuring_debt, 0.0);
        assert!(!kernel.account.is_in_restructuring);
    }

    #[test]
    fn test_sovereign_too_big_to_fail_post_100m() {
        let mut kernel = QuantKernel::with_config(100000000.0, 1.0, 0.02, 10.0, 0.5);
        kernel.account.high_watermark = 100000000.0;

        kernel.execute_order("NVDA", PositionSide::BULL, 100000.0, 100.0, "2024-01-02", 0.10, 1.0, None);
        kernel.update_mark_to_market(1.0, 0.10, 1.0);

        assert!(!kernel.account.is_margin_called);
        assert_eq!(kernel.account.death_reason, None);
    }
}
