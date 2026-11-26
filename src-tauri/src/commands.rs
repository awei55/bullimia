use std::sync::Mutex;
use tauri::State;
use crate::quant::kernel::QuantKernel;
use crate::quant::models::{AccountState, OrderExecutionResult, PositionSide, Quotes};

pub struct QuantState(pub Mutex<QuantKernel>);

#[tauri::command]
pub fn quant_execute_order(
    state: State<'_, QuantState>,
    ticker: String,
    side: String,
    lots: f64,
    current_price: f64,
    timestamp: String,
    atr_pct: Option<f64>,
    spread_multiplier: Option<f64>,
    commission_rate: Option<f64>,
) -> Result<OrderExecutionResult, String> {
    let mut kernel = state.0.lock().map_err(|e| e.to_string())?;
    let desired_side = match side.to_uppercase().as_str() {
        "BULL" => PositionSide::BULL,
        "BEAR" => PositionSide::BEAR,
        _ => PositionSide::FLAT,
    };
    let res = kernel.execute_order(
        &ticker,
        desired_side,
        lots,
        current_price,
        &timestamp,
        atr_pct.unwrap_or(0.02),
        spread_multiplier.unwrap_or(1.0),
        commission_rate,
    );
    Ok(res)
}

#[tauri::command]
pub fn quant_mark_to_market(
    state: State<'_, QuantState>,
    current_price: f64,
    atr_pct: Option<f64>,
    spread_multiplier: Option<f64>,
) -> Result<AccountState, String> {
    let mut kernel = state.0.lock().map_err(|e| e.to_string())?;
    let acc = kernel.update_mark_to_market(
        current_price,
        atr_pct.unwrap_or(0.02),
        spread_multiplier.unwrap_or(1.0),
    );
    Ok(acc.clone())
}

#[tauri::command]
pub fn quant_get_quotes(
    state: State<'_, QuantState>,
    price: f64,
    atr_pct: Option<f64>,
    spread_multiplier: Option<f64>,
) -> Result<Quotes, String> {
    let kernel = state.0.lock().map_err(|e| e.to_string())?;
    Ok(kernel.get_quotes(
        price,
        atr_pct.unwrap_or(0.02),
        spread_multiplier.unwrap_or(1.0),
    ))
}

#[tauri::command]
pub fn quant_get_account(state: State<'_, QuantState>) -> Result<AccountState, String> {
    let kernel = state.0.lock().map_err(|e| e.to_string())?;
    Ok(kernel.account.clone())
}

#[tauri::command]
pub fn quant_reset_career(state: State<'_, QuantState>, starting_cash: Option<f64>) -> Result<AccountState, String> {
    let mut kernel = state.0.lock().map_err(|e| e.to_string())?;
    kernel.reset_career(starting_cash.unwrap_or(1000.0));
    Ok(kernel.account.clone())
}

#[tauri::command]
pub fn quant_set_equity(state: State<'_, QuantState>, equity: f64) -> Result<AccountState, String> {
    let mut kernel = state.0.lock().map_err(|e| e.to_string())?;
    kernel.set_equity(equity);
    Ok(kernel.account.clone())
}

#[tauri::command]
pub fn quant_toggle_godmode(state: State<'_, QuantState>, enabled: bool) -> Result<bool, String> {
    let mut kernel = state.0.lock().map_err(|e| e.to_string())?;
    kernel.god_mode = enabled;
    Ok(kernel.god_mode)
}

#[tauri::command]
pub fn quant_repay_debt(state: State<'_, QuantState>, amount: f64) -> Result<f64, String> {
    let mut kernel = state.0.lock().map_err(|e| e.to_string())?;
    Ok(kernel.repay_restructuring_debt(amount))
}
