pub mod quant;
pub mod commands;

use std::sync::Mutex;
use quant::kernel::QuantKernel;
use commands::QuantState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(QuantState(Mutex::new(QuantKernel::new(1000.0))))
    .invoke_handler(tauri::generate_handler![
      commands::quant_execute_order,
      commands::quant_mark_to_market,
      commands::quant_get_quotes,
      commands::quant_get_account,
      commands::quant_reset_career,
      commands::quant_set_equity,
      commands::quant_toggle_godmode,
      commands::quant_repay_debt,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
