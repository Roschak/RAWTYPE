pub mod backup;
pub mod commands;
pub mod database;
pub mod export;
pub mod processing;
pub mod repositories;
pub mod security;

use commands::AppState;
use database::Database;
use processing::RefinementEngine;
use security::vault::VaultManager;
use std::sync::{Arc, Mutex};
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Determine storage directory in user's app data or local dir
            let app_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::env::current_dir().unwrap().join(".rawtype_data"));

            let db_path = app_dir.join("rawtype.db");
            let db = Database::new(db_path).expect("Failed to initialize database");
            let vault_manager = Arc::new(VaultManager::new());
            let refinement_engine = RefinementEngine::new();

            app.manage(AppState {
                db: Mutex::new(db),
                vault_manager,
                refinement_engine,
                app_dir,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_manuscripts,
            commands::get_manuscript,
            commands::create_manuscript,
            commands::update_manuscript,
            commands::update_manuscript_raw,
            commands::delete_manuscript,
            commands::toggle_archive_manuscript,
            commands::get_manuscript_versions,
            commands::restore_manuscript_version,
            commands::refine_manuscript,
            commands::get_notes,
            commands::get_note,
            commands::create_note,
            commands::update_note,
            commands::delete_note,
            commands::toggle_pin_note,
            commands::toggle_archive_note,
            commands::get_note_categories,
            commands::classify_note_content,
            commands::batch_import_notes,
            commands::get_vault_status,
            commands::initialize_vault,
            commands::unlock_vault,
            commands::lock_vault,
            commands::get_vault_items,
            commands::save_vault_item,
            commands::delete_vault_item,
            commands::get_dictionary_entries,
            commands::add_dictionary_entry,
            commands::delete_dictionary_entry,
            commands::create_backup,
            commands::get_backup_history,
            commands::get_dashboard_stats,
            commands::global_search,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
