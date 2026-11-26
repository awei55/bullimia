use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum PositionSide {
    FLAT,
    BULL,
    BEAR,
}

impl Default for PositionSide {
    fn default() -> Self {
        PositionSide::FLAT
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeRecord {
    pub id: u64,
    pub ticker: String,
    pub side: PositionSide,
    pub entry_price: f64,
    pub exit_price: f64,
    pub lots: f64,
    pub entry_timestamp: String,
    pub exit_timestamp: String,
    pub pnl: f64,
    pub commission_paid: f64,
    pub is_win: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountState {
    pub cash_balance: f64,
    pub equity: f64,
    pub side: PositionSide,
    pub open_lots: f64,
    pub entry_price: f64,
    pub entry_timestamp: String,
    pub unrealized_pnl: f64,
    pub margin_used: f64,
    pub free_margin: f64,
    pub margin_level_pct: f64,
    pub total_commission_paid: f64,
    pub trade_count: u32,
    pub winning_trades: u32,
    pub losing_trades: u32,
    pub win_rate_pct: f64,
    pub is_margin_called: bool,
    pub is_millionaire: bool,
    pub high_watermark: f64,
    pub death_reason: Option<String>,
    pub is_in_restructuring: bool,
    pub restructuring_debt: f64,
    pub debt_interest_rate_pct: f64,
    pub restructuring_breach_count: u32,
}

impl Default for AccountState {
    fn default() -> Self {
        Self::new(1000.0)
    }
}

impl AccountState {
    pub fn new(starting_cash: f64) -> Self {
        Self {
            cash_balance: starting_cash,
            equity: starting_cash,
            side: PositionSide::FLAT,
            open_lots: 0.0,
            entry_price: 0.0,
            entry_timestamp: String::new(),
            unrealized_pnl: 0.0,
            margin_used: 0.0,
            free_margin: starting_cash,
            margin_level_pct: 999.0,
            total_commission_paid: 0.0,
            trade_count: 0,
            winning_trades: 0,
            losing_trades: 0,
            win_rate_pct: 0.0,
            is_margin_called: false,
            is_millionaire: starting_cash >= 1_000_000.0,
            high_watermark: starting_cash,
            death_reason: None,
            is_in_restructuring: false,
            restructuring_debt: 0.0,
            debt_interest_rate_pct: 11.75,
            restructuring_breach_count: 0,
        }
    }

    pub fn round_precision(&mut self) {
        self.cash_balance = (self.cash_balance * 100.0).round() / 100.0;
        self.equity = (self.equity * 100.0).round() / 100.0;
        self.open_lots = (self.open_lots * 100.0).round() / 100.0;
        self.entry_price = (self.entry_price * 10000.0).round() / 10000.0;
        self.unrealized_pnl = (self.unrealized_pnl * 100.0).round() / 100.0;
        self.margin_used = (self.margin_used * 100.0).round() / 100.0;
        self.free_margin = (self.free_margin * 100.0).round() / 100.0;
        self.margin_level_pct = (self.margin_level_pct * 10.0).round() / 10.0;
        self.total_commission_paid = (self.total_commission_paid * 100.0).round() / 100.0;
        self.high_watermark = (self.high_watermark * 100.0).round() / 100.0;
        self.restructuring_debt = (self.restructuring_debt * 100.0).round() / 100.0;
        self.debt_interest_rate_pct = (self.debt_interest_rate_pct * 100.0).round() / 100.0;
        self.win_rate_pct = if self.trade_count > 0 {
            ((self.winning_trades as f64 / self.trade_count as f64) * 1000.0).round() / 10.0
        } else {
            0.0
        };
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quotes {
    pub price: f64,
    pub bid: f64,
    pub ask: f64,
    pub spread: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderExecutionResult {
    pub account: AccountState,
    pub closed_trade: Option<TradeRecord>,
    pub quotes: Quotes,
}
