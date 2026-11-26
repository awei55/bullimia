use crate::quant::models::{AccountState, OrderExecutionResult, PositionSide, Quotes, TradeRecord};

pub fn get_asset_multiplier(ticker: &str) -> f64 {
    match ticker {
        "NVDA" | "AAPL" | "AMD" | "TSLA" | "GME" => 1.0,
        "SPY" => 2.0,
        "QQQ" => 1.5,
        "BTC-USD" | "BTC_2021" => 0.1,
        _ => 1.0,
    }
}

#[derive(Debug, Clone)]
pub struct QuantKernel {
    pub account: AccountState,
    pub trade_history: Vec<TradeRecord>,
    pub commission_per_lot: f64,
    pub margin_rate: f64,
    pub contract_multiplier: f64,
    pub maintenance_margin_rate: f64,
    pub god_mode: bool,
    pub has_unlocked_margin: bool,
    custom_multiplier: bool,
    next_trade_id: u64,
}

impl Default for QuantKernel {
    fn default() -> Self {
        Self::new(1000.0)
    }
}

impl QuantKernel {
    pub fn new(starting_cash: f64) -> Self {
        Self {
            account: AccountState::new(starting_cash),
            trade_history: Vec::new(),
            commission_per_lot: 1.0,
            margin_rate: 0.02,
            contract_multiplier: 1.0,
            maintenance_margin_rate: 0.50,
            god_mode: false,
            has_unlocked_margin: starting_cash >= 10000.0,
            custom_multiplier: false,
            next_trade_id: 1,
        }
    }

    pub fn with_config(
        starting_cash: f64,
        commission_per_lot: f64,
        margin_rate: f64,
        contract_multiplier: f64,
        maintenance_margin_rate: f64,
    ) -> Self {
        let custom_mult = contract_multiplier != 1.0;
        Self {
            account: AccountState::new(starting_cash),
            trade_history: Vec::new(),
            commission_per_lot,
            margin_rate,
            contract_multiplier,
            maintenance_margin_rate,
            god_mode: false,
            has_unlocked_margin: starting_cash >= 10000.0,
            custom_multiplier: custom_mult,
            next_trade_id: 1,
        }
    }

    pub fn set_equity(&mut self, new_equity: f64) {
        self.account.cash_balance = new_equity;
        self.account.equity = new_equity;
        self.account.free_margin = new_equity;
        if new_equity > self.account.high_watermark {
            self.account.high_watermark = new_equity;
        }
        if new_equity >= 1_000_000.0 {
            self.account.is_millionaire = true;
        }
        if new_equity >= 10_000.0 {
            self.has_unlocked_margin = true;
        }
        self.account.is_margin_called = false;
        self.account.death_reason = None;
    }

    pub fn calculate_spread(&self, current_price: f64, atr_pct: f64, spread_multiplier: f64) -> f64 {
        let spread_pct = (atr_pct * 0.05).clamp(0.0005, 0.005);
        let base_spread = current_price * spread_pct;
        let effective = base_spread * spread_multiplier.max(0.2);
        (effective * 10000.0).round() / 10000.0
    }

    pub fn get_quotes(&self, price: f64, atr_pct: f64, spread_multiplier: f64) -> Quotes {
        let spread = self.calculate_spread(price, atr_pct, spread_multiplier);
        let half = spread / 2.0;
        let bid = ((price - half) * 10000.0).round() / 10000.0;
        let ask = ((price + half) * 10000.0).round() / 10000.0;
        Quotes { price, bid, ask, spread }
    }

    pub fn update_mark_to_market(
        &mut self,
        current_price: f64,
        atr_pct: f64,
        spread_multiplier: f64,
    ) -> &AccountState {
        let quotes = self.get_quotes(current_price, atr_pct, spread_multiplier);
        let bid = quotes.bid;
        let ask = quotes.ask;

        if self.account.side == PositionSide::FLAT || self.account.open_lots == 0.0 {
            self.account.unrealized_pnl = 0.0;
            self.account.equity = self.account.cash_balance;
            self.account.margin_used = 0.0;
            self.account.free_margin = self.account.cash_balance;
            self.account.margin_level_pct = 999.0;
        } else if self.account.side == PositionSide::BULL {
            // Long position marked to market at BID
            let price_delta = bid - self.account.entry_price;
            self.account.unrealized_pnl = price_delta * self.account.open_lots * self.contract_multiplier;
            self.account.equity = self.account.cash_balance + self.account.unrealized_pnl;
            self.account.margin_used = self.account.open_lots * self.account.entry_price * self.contract_multiplier * self.margin_rate;
            self.account.free_margin = self.account.equity - self.account.margin_used;
            self.account.margin_level_pct = if self.account.margin_used > 0.0 {
                (self.account.equity / self.account.margin_used) * 100.0
            } else {
                999.0
            };
        } else if self.account.side == PositionSide::BEAR {
            // Short position marked to market at ASK
            let price_delta = self.account.entry_price - ask;
            self.account.unrealized_pnl = price_delta * self.account.open_lots * self.contract_multiplier;
            self.account.equity = self.account.cash_balance + self.account.unrealized_pnl;
            self.account.margin_used = self.account.open_lots * self.account.entry_price * self.contract_multiplier * self.margin_rate;
            self.account.free_margin = self.account.equity - self.account.margin_used;
            self.account.margin_level_pct = if self.account.margin_used > 0.0 {
                (self.account.equity / self.account.margin_used) * 100.0
            } else {
                999.0
            };
        }

        if self.account.equity > self.account.high_watermark {
            self.account.high_watermark = self.account.equity;
        }

        if self.account.equity >= 1_000_000.0 {
            self.account.is_millionaire = true;
        }

        if self.account.equity >= 10_000.0 || self.account.high_watermark >= 10_000.0 {
            self.has_unlocked_margin = true;
        }

        // Solvency Invariants Check
        if !self.god_mode {
            // Phase 4 ($100M+): Sovereign Too Big To Fail -> Zero margin calls permanently
            if self.account.high_watermark >= 100_000_000.0 || self.account.equity >= 100_000_000.0 {
                self.account.is_margin_called = false;
                self.account.death_reason = None;
            }
            // Phase 3 ($10M - $100M): Creditor Restructuring with rescue capital
            else if self.account.high_watermark >= 10_000_000.0
                || self.account.equity >= 10_000_000.0
                || self.account.is_in_restructuring
            {
                let is_breach = if self.account.equity <= 0.0 {
                    true
                } else if self.account.margin_used > 0.0
                    && self.account.equity <= (self.account.margin_used * self.maintenance_margin_rate)
                {
                    true
                } else {
                    false
                };

                if is_breach {
                    self.trigger_creditor_restructuring(5_000_000.0);
                }
            } else if self.has_unlocked_margin {
                // Post-$10k: Standard Margin Call active
                if self.account.equity <= 0.0 {
                    self.account.is_margin_called = true;
                    self.account.death_reason = Some("DEAD_BROKE".to_string());
                } else if self.account.margin_used > 0.0
                    && self.account.equity <= (self.account.margin_used * self.maintenance_margin_rate)
                {
                    self.account.is_margin_called = true;
                    self.account.death_reason = Some("MARGIN_CALL".to_string());
                }
            } else {
                // Genesis Tutorial (< $10k): ONLY Dead Broke! Margin calls suppressed
                if self.account.equity <= 0.0 {
                    self.account.is_margin_called = true;
                    self.account.death_reason = Some("DEAD_BROKE".to_string());
                }
            }
        }

        self.account.round_precision();
        &self.account
    }

    pub fn trigger_creditor_restructuring(&mut self, rescue_capital: f64) {
        self.account.is_in_restructuring = true;
        self.account.restructuring_breach_count += 1;
        let penalty_markup = 1.10; // 10% senior restructuring fee
        let debt_addition = rescue_capital * penalty_markup;
        self.account.restructuring_debt += debt_addition;
        // Base: SOFR (5.25%) + 650 bps (6.5%) = 11.75% + 3.0% per additional breach
        self.account.debt_interest_rate_pct = 11.75 + (self.account.restructuring_breach_count - 1) as f64 * 3.0;

        // Inject rescue cash
        self.account.cash_balance += rescue_capital;
        self.account.equity += rescue_capital;
        self.account.free_margin += rescue_capital;
        self.account.is_margin_called = false;
        self.account.death_reason = None;
    }

    pub fn repay_restructuring_debt(&mut self, amount: f64) -> f64 {
        if !self.account.is_in_restructuring || self.account.restructuring_debt <= 0.0 {
            return 0.0;
        }
        let available_cash = self.account.cash_balance.max(0.0);
        let repay_amt = amount.min(self.account.restructuring_debt).min(available_cash);

        self.account.cash_balance -= repay_amt;
        self.account.equity -= repay_amt;
        self.account.free_margin -= repay_amt;
        self.account.restructuring_debt -= repay_amt;

        if self.account.restructuring_debt <= 0.01 {
            self.account.restructuring_debt = 0.0;
            self.account.is_in_restructuring = false;
        }

        self.account.round_precision();
        repay_amt
    }

    pub fn accrue_debt_interest(&mut self, elapsed_days: f64) {
        if self.account.is_in_restructuring && self.account.restructuring_debt > 0.0 {
            let daily_rate = (self.account.debt_interest_rate_pct / 100.0) / 365.0;
            let accrued = self.account.restructuring_debt * daily_rate * elapsed_days;
            self.account.restructuring_debt += accrued;
            self.account.round_precision();
        }
    }

    pub fn execute_order(
        &mut self,
        ticker: &str,
        desired_side: PositionSide,
        lots: f64,
        current_price: f64,
        timestamp: &str,
        atr_pct: f64,
        spread_multiplier: f64,
        commission_rate: Option<f64>,
    ) -> OrderExecutionResult {
        let effective_commission = commission_rate.unwrap_or(self.commission_per_lot);
        if !self.custom_multiplier {
            self.contract_multiplier = get_asset_multiplier(ticker);
        }

        let max_lots = if self.account.high_watermark >= 10_000_000.0 || self.account.equity >= 10_000_000.0 {
            100_000.0
        } else {
            100.0
        };
        let valid_lots = lots.clamp(0.01, max_lots);
        let quotes = self.get_quotes(current_price, atr_pct, spread_multiplier);
        let bid = quotes.bid;
        let ask = quotes.ask;

        let mut closed_trade: Option<TradeRecord> = None;

        // 1. Close existing position if active
        if self.account.side != PositionSide::FLAT && self.account.open_lots > 0.0 {
            let (exit_price, realized_pnl) = if self.account.side == PositionSide::BULL {
                let exit = bid;
                let pnl = (exit - self.account.entry_price) * self.account.open_lots * self.contract_multiplier;
                (exit, pnl)
            } else {
                let exit = ask;
                let pnl = (self.account.entry_price - exit) * self.account.open_lots * self.contract_multiplier;
                (exit, pnl)
            };

            let close_commission = (effective_commission * self.account.open_lots).max(0.50);
            self.account.cash_balance += realized_pnl - close_commission;
            self.account.total_commission_paid += close_commission;

            let is_win = realized_pnl > 0.0;
            self.account.trade_count += 1;
            if is_win {
                self.account.winning_trades += 1;
            } else {
                self.account.losing_trades += 1;
            }

            let trade = TradeRecord {
                id: self.next_trade_id,
                ticker: ticker.to_string(),
                side: self.account.side,
                entry_price: self.account.entry_price,
                exit_price,
                lots: self.account.open_lots,
                entry_timestamp: self.account.entry_timestamp.clone(),
                exit_timestamp: timestamp.to_string(),
                pnl: ((realized_pnl - close_commission) * 100.0).round() / 100.0,
                commission_paid: (close_commission * 100.0).round() / 100.0,
                is_win,
            };
            self.next_trade_id += 1;
            self.trade_history.push(trade.clone());
            closed_trade = Some(trade);

            // Reset open position
            self.account.side = PositionSide::FLAT;
            self.account.open_lots = 0.0;
            self.account.entry_price = 0.0;
            self.account.entry_timestamp.clear();
            self.account.unrealized_pnl = 0.0;
        }

        // 2. Open new position if desired_side != FLAT
        if desired_side != PositionSide::FLAT {
            let open_commission = (effective_commission * valid_lots).max(0.50);
            self.account.cash_balance -= open_commission;
            self.account.total_commission_paid += open_commission;

            self.account.side = desired_side;
            self.account.open_lots = valid_lots;
            self.account.entry_timestamp = timestamp.to_string();

            if desired_side == PositionSide::BULL {
                self.account.entry_price = ask;
            } else if desired_side == PositionSide::BEAR {
                self.account.entry_price = bid;
            }
        }

        // 3. Recalculate mark to market
        self.update_mark_to_market(current_price, atr_pct, spread_multiplier);

        OrderExecutionResult {
            account: self.account.clone(),
            closed_trade,
            quotes,
        }
    }

    pub fn reset_career(&mut self, starting_cash: f64) {
        self.account = AccountState::new(starting_cash);
        self.trade_history.clear();
        self.next_trade_id = 1;
        self.has_unlocked_margin = starting_cash >= 10000.0;
    }
}
