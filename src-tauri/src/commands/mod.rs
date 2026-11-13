use crate::backup::backup::{BackupManager, BackupRecord};
use crate::database::Database;
use crate::processing::classification::{NoteClassifier, RuleDefinition};
use crate::processing::{RefinementEngine, RefinementOptions, RefinementResult};
use crate::repositories::dictionary::{DictionaryEntry, DictionaryRepository};
use crate::repositories::manuscripts::{Manuscript, ManuscriptRepository, ManuscriptVersion};
use crate::repositories::notes::{ImportSummary, Note, NoteCategory, NoteImportItem, NoteRepository};
use crate::repositories::vault::VaultRepository;
use crate::security::vault::{DecryptedVaultItem, VaultManager, VaultStatus};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::State;

pub struct AppState {
    pub db: Mutex<Database>,
    pub vault_manager: Arc<VaultManager>,
    pub refinement_engine: RefinementEngine,
    pub app_dir: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_manuscripts: i64,
    pub total_words: i64,
    pub total_notes: i64,
    pub total_categorized_notes: i64,
    pub unclassified_notes: i64,
    pub pinned_notes: i64,
    pub sensitive_notes_count: i64,
    pub recent_manuscripts: Vec<Manuscript>,
    pub recent_notes: Vec<Note>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResultItem {
    pub item_type: String, // "manuscript" or "note"
    pub id: String,
    pub title: String,
    pub category: String,
    pub snippet: String,
    pub updated_at: String,
}

// ==========================================
// MANUSCRIPTS COMMANDS
// ==========================================

#[tauri::command]
pub fn get_manuscripts(state: State<AppState>, include_archived: bool) -> Result<Vec<Manuscript>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    ManuscriptRepository::list(&db.conn, include_archived).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_manuscript(state: State<AppState>, id: String) -> Result<Manuscript, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    ManuscriptRepository::get_by_id(&db.conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_manuscript(
    state: State<AppState>,
    title: String,
    author: String,
    category: String,
    content: String,
) -> Result<Manuscript, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    ManuscriptRepository::create(&db.conn, &title, &author, &category, &content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_manuscript(
    state: State<AppState>,
    id: String,
    title: String,
    author: String,
    category: String,
    description: String,
    tags: String,
    refined_content: String,
    create_new_version: bool,
) -> Result<Manuscript, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    ManuscriptRepository::update(
        &db.conn,
        &id,
        &title,
        &author,
        &category,
        &description,
        &tags,
        &refined_content,
        create_new_version,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_manuscript_raw(state: State<AppState>, id: String, raw_content: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    ManuscriptRepository::update_raw_content(&db.conn, &id, &raw_content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_manuscript(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    ManuscriptRepository::delete(&db.conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_archive_manuscript(state: State<AppState>, id: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    ManuscriptRepository::toggle_archive(&db.conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_manuscript_versions(state: State<AppState>, id: String) -> Result<Vec<ManuscriptVersion>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    ManuscriptRepository::get_versions(&db.conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn restore_manuscript_version(
    state: State<AppState>,
    id: String,
    version_number: i32,
) -> Result<Manuscript, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    ManuscriptRepository::restore_version(&db.conn, &id, version_number).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn refine_manuscript(
    state: State<AppState>,
    manuscript_id: String,
    raw_text: String,
    options: RefinementOptions,
) -> Result<RefinementResult, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let (protected, ignored) =
        DictionaryRepository::get_protected_and_ignored(&db.conn).unwrap_or((HashSet::new(), HashSet::new()));
    let result = state
        .refinement_engine
        .refine(&manuscript_id, &raw_text, &options, &protected, &ignored);
    Ok(result)
}

// ==========================================
// NOTES COMMANDS
// ==========================================

#[tauri::command]
pub fn get_notes(
    state: State<AppState>,
    category_id: Option<String>,
    include_archived: bool,
    include_sensitive: bool,
    search_query: Option<String>,
) -> Result<Vec<Note>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    // If vault is locked, force include_sensitive = false
    let sensitive_allowed = include_sensitive && state.vault_manager.is_unlocked();
    NoteRepository::list(
        &db.conn,
        category_id.as_deref(),
        include_archived,
        sensitive_allowed,
        search_query.as_deref(),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_note(state: State<AppState>, id: String) -> Result<Note, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let note = NoteRepository::get_by_id(&db.conn, &id).map_err(|e| e.to_string())?;
    if note.sensitive && !state.vault_manager.is_unlocked() {
        return Err("Catatan terkunci di dalam Sensitive Vault".to_string());
    }
    Ok(note)
}

#[tauri::command]
pub fn create_note(
    state: State<AppState>,
    title: String,
    content: String,
    category_id: String,
    tags: String,
    source: String,
    sensitive: bool,
) -> Result<Note, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    NoteRepository::create(&db.conn, &title, &content, &category_id, &tags, &source, sensitive)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_note(
    state: State<AppState>,
    id: String,
    title: String,
    content: String,
    category_id: String,
    tags: String,
    sensitive: bool,
) -> Result<Note, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    NoteRepository::update(&db.conn, &id, &title, &content, &category_id, &tags, sensitive)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_note(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    NoteRepository::delete(&db.conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_pin_note(state: State<AppState>, id: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    NoteRepository::toggle_pin(&db.conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_archive_note(state: State<AppState>, id: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    NoteRepository::toggle_archive(&db.conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_note_categories(state: State<AppState>) -> Result<Vec<NoteCategory>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    NoteRepository::list_categories(&db.conn).map_err(|e| e.to_string())
}

// ==========================================
// CLASSIFICATION & IMPORT COMMANDS
// ==========================================

#[tauri::command]
pub fn classify_note_content(
    state: State<AppState>,
    title: String,
    content: String,
) -> Result<crate::processing::classification::ClassificationResult, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .conn
        .prepare("SELECT id, name, category_id, keywords, regex_pattern, priority, enabled, case_sensitive FROM classification_rules WHERE enabled = 1 ORDER BY priority DESC")
        .map_err(|e| e.to_string())?;

    let rules = stmt
        .query_map([], |r| {
            let kws_str: String = r.get(3)?;
            let kws: Vec<String> = kws_str.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect();
            Ok(RuleDefinition {
                id: r.get(0)?,
                name: r.get(1)?,
                category_id: r.get(2)?,
                keywords: kws,
                regex_pattern: r.get(4)?,
                priority: r.get(5)?,
                enabled: r.get::<_, i32>(6)? != 0,
                case_sensitive: r.get::<_, i32>(7)? != 0,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    let classifier = NoteClassifier::new(rules);
    Ok(classifier.classify(&title, &content))
}

#[tauri::command]
pub fn batch_import_notes(
    state: State<AppState>,
    items: Vec<NoteImportItem>,
    skip_duplicates: bool,
) -> Result<ImportSummary, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let total = items.len();
    let mut imported = 0;
    let mut duplicates = 0;
    let mut sensitive_count = 0;

    // Load classifier
    let mut stmt = db
        .conn
        .prepare("SELECT id, name, category_id, keywords, regex_pattern, priority, enabled, case_sensitive FROM classification_rules WHERE enabled = 1 ORDER BY priority DESC")
        .map_err(|e| e.to_string())?;

    let rules: Vec<RuleDefinition> = stmt
        .query_map([], |r| {
            let kws_str: String = r.get(3)?;
            let kws: Vec<String> = kws_str.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect();
            Ok(RuleDefinition {
                id: r.get(0)?,
                name: r.get(1)?,
                category_id: r.get(2)?,
                keywords: kws,
                regex_pattern: r.get(4)?,
                priority: r.get(5)?,
                enabled: r.get::<_, i32>(6)? != 0,
                case_sensitive: r.get::<_, i32>(7)? != 0,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    let classifier = NoteClassifier::new(rules);

    for item in items {
        if skip_duplicates && NoteRepository::is_duplicate(&db.conn, &item.title, &item.content).unwrap_or(false) {
            duplicates += 1;
            continue;
        }

        let classification = classifier.classify(&item.title, &item.content);
        if classification.is_sensitive {
            sensitive_count += 1;
        }

        let _ = NoteRepository::create(
            &db.conn,
            &item.title,
            &item.content,
            &classification.category_id,
            "",
            &item.source,
            classification.is_sensitive,
        );
        imported += 1;
    }

    Ok(ImportSummary {
        total,
        imported,
        duplicates,
        sensitive_detected: sensitive_count,
    })
}

// ==========================================
// VAULT COMMANDS
// ==========================================

#[tauri::command]
pub fn get_vault_status(state: State<AppState>) -> Result<VaultStatus, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let is_init = VaultRepository::is_initialized(&db.conn).unwrap_or(false);
    let is_unlocked = state.vault_manager.is_unlocked();
    Ok(VaultStatus {
        is_initialized: is_init,
        is_unlocked,
    })
}

#[tauri::command]
pub fn initialize_vault(state: State<AppState>, master_password: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    VaultRepository::initialize_vault(&db.conn, &state.vault_manager, &master_password)
}

#[tauri::command]
pub fn unlock_vault(state: State<AppState>, master_password: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    VaultRepository::unlock_vault(&db.conn, &state.vault_manager, &master_password)
}

#[tauri::command]
pub fn lock_vault(state: State<AppState>) -> Result<(), String> {
    state.vault_manager.lock();
    Ok(())
}

#[tauri::command]
pub fn get_vault_items(state: State<AppState>) -> Result<Vec<DecryptedVaultItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    VaultRepository::list_decrypted_items(&db.conn, &state.vault_manager)
}

#[tauri::command]
pub fn save_vault_item(
    state: State<AppState>,
    id: Option<String>,
    title: String,
    content: String,
    category: String,
    tags: String,
) -> Result<DecryptedVaultItem, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    VaultRepository::save_item(
        &db.conn,
        &state.vault_manager,
        id.as_deref(),
        &title,
        &content,
        &category,
        &tags,
    )
}

#[tauri::command]
pub fn delete_vault_item(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    VaultRepository::delete_item(&db.conn, &id)
}

// ==========================================
// DICTIONARY COMMANDS
// ==========================================

#[tauri::command]
pub fn get_dictionary_entries(state: State<AppState>) -> Result<Vec<DictionaryEntry>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    DictionaryRepository::list(&db.conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_dictionary_entry(
    state: State<AppState>,
    word: String,
    definition: String,
    category: String,
    protected: bool,
    ignored: bool,
) -> Result<DictionaryEntry, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    DictionaryRepository::add(&db.conn, &word, &definition, &category, protected, ignored)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_dictionary_entry(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    DictionaryRepository::delete(&db.conn, &id).map_err(|e| e.to_string())
}

// ==========================================
// BACKUP COMMANDS
// ==========================================

#[tauri::command]
pub fn create_backup(state: State<AppState>, backup_type: String) -> Result<BackupRecord, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let backup_dir = state.app_dir.join("backups");
    BackupManager::create_backup(&db.conn, &backup_dir, &backup_type)
}

#[tauri::command]
pub fn get_backup_history(state: State<AppState>) -> Result<Vec<BackupRecord>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    BackupManager::list_backups(&db.conn).map_err(|e| e.to_string())
}

// ==========================================
// DASHBOARD & GLOBAL SEARCH
// ==========================================

#[tauri::command]
pub fn get_dashboard_stats(state: State<AppState>) -> Result<DashboardStats, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = &db.conn;

    let total_manuscripts: i64 = conn
        .query_row("SELECT COUNT(*) FROM manuscripts WHERE archived = 0", [], |r| r.get(0))
        .unwrap_or(0);

    let total_notes: i64 = conn
        .query_row("SELECT COUNT(*) FROM notes WHERE archived = 0 AND sensitive = 0", [], |r| r.get(0))
        .unwrap_or(0);

    let unclassified: i64 = conn
        .query_row("SELECT COUNT(*) FROM notes WHERE category_id = 'cat_unclass' AND archived = 0", [], |r| r.get(0))
        .unwrap_or(0);

    let pinned: i64 = conn
        .query_row("SELECT COUNT(*) FROM notes WHERE pinned = 1 AND archived = 0", [], |r| r.get(0))
        .unwrap_or(0);

    let sensitive_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM notes WHERE sensitive = 1", [], |r| r.get(0))
        .unwrap_or(0);

    let mut total_words: i64 = 0;
    let mut stmt = conn.prepare("SELECT refined_content FROM manuscripts WHERE archived = 0").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| r.get::<_, String>(0)).map_err(|e| e.to_string())?;
    for row in rows {
        if let Ok(c) = row {
            total_words += c.split_whitespace().count() as i64;
        }
    }

    let recent_manuscripts = ManuscriptRepository::list(conn, false).unwrap_or_default();
    let recent_notes = NoteRepository::list(conn, None, false, false, None).unwrap_or_default();

    Ok(DashboardStats {
        total_manuscripts,
        total_words,
        total_notes,
        total_categorized_notes: total_notes - unclassified,
        unclassified_notes: unclassified,
        pinned_notes: pinned,
        sensitive_notes_count: sensitive_count,
        recent_manuscripts: recent_manuscripts.into_iter().take(5).collect(),
        recent_notes: recent_notes.into_iter().take(6).collect(),
    })
}

#[tauri::command]
pub fn global_search(state: State<AppState>, query: String) -> Result<Vec<SearchResultItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let clean_q = query.trim();
    if clean_q.is_empty() {
        return Ok(Vec::new());
    }

    let mut results = Vec::new();
    let conn = &db.conn;

    // Search Manuscripts
    let mut stmt_m = conn
        .prepare(
            "SELECT id, title, category, refined_content, updated_at
             FROM manuscripts
             WHERE archived = 0 AND (title LIKE ?1 OR refined_content LIKE ?1 OR tags LIKE ?1)
             LIMIT 20",
        )
        .map_err(|e| e.to_string())?;

    let pattern = format!("%{}%", clean_q);
    let m_rows = stmt_m
        .query_map(params![pattern], |r| {
            let content: String = r.get(3)?;
            let snippet = if content.len() > 100 {
                format!("{}...", &content[..content.char_indices().nth(100).map(|(i, _)| i).unwrap_or(content.len())])
            } else {
                content
            };
            Ok(SearchResultItem {
                item_type: "manuscript".to_string(),
                id: r.get(0)?,
                title: r.get(1)?,
                category: r.get(2)?,
                snippet,
                updated_at: r.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    for r in m_rows {
        if let Ok(item) = r {
            results.push(item);
        }
    }

    // Search Notes (hide sensitive if vault locked)
    let sensitive_clause = if state.vault_manager.is_unlocked() { "" } else { "AND sensitive = 0" };
    let n_sql = format!(
        "SELECT id, title, category_id, content, updated_at
         FROM notes
         WHERE archived = 0 {} AND (title LIKE ?1 OR content LIKE ?1 OR tags LIKE ?1)
         LIMIT 20",
        sensitive_clause
    );

    let mut stmt_n = conn.prepare(&n_sql).map_err(|e| e.to_string())?;
    let n_rows = stmt_n
        .query_map(params![pattern], |r| {
            let content: String = r.get(3)?;
            let snippet = if content.len() > 100 {
                format!("{}...", &content[..content.char_indices().nth(100).map(|(i, _)| i).unwrap_or(content.len())])
            } else {
                content
            };
            Ok(SearchResultItem {
                item_type: "note".to_string(),
                id: r.get(0)?,
                title: r.get(1)?,
                category: r.get(2)?,
                snippet,
                updated_at: r.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    for r in n_rows {
        if let Ok(item) = r {
            results.push(item);
        }
    }

    Ok(results)
}
