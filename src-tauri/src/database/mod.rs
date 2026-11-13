pub mod schema;

use rusqlite::{params, Connection, Result};
use std::fs;
use std::path::PathBuf;

pub struct Database {
    pub conn: Connection,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        if let Some(parent) = db_path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        let conn = Connection::open(db_path)?;
        conn.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")?;
        
        let db = Database { conn };
        db.init()?;
        Ok(db)
    }

    pub fn new_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;
        let db = Database { conn };
        db.init()?;
        Ok(db)
    }

    fn init(&self) -> Result<()> {
        self.conn.execute_batch(schema::INIT_SQL)?;

        // Seed default categories if empty
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM note_categories",
            [],
            |r| r.get(0),
        ).unwrap_or(0);

        if count == 0 {
            let now = chrono::Utc::now().to_rfc3339();
            for (id, name, desc, color, prio) in schema::DEFAULT_CATEGORIES {
                self.conn.execute(
                    "INSERT INTO note_categories (id, name, description, color, priority, created_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    params![id, name, desc, color, prio, now],
                )?;
            }
        }

        // Seed default rules if empty
        let rule_count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM classification_rules",
            [],
            |r| r.get(0),
        ).unwrap_or(0);

        if rule_count == 0 {
            for (id, name, cat_id, kws, regex, prio) in schema::DEFAULT_RULES {
                self.conn.execute(
                    "INSERT INTO classification_rules (id, name, category_id, keywords, regex_pattern, priority, enabled, case_sensitive, match_mode)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, 0, 'contains')",
                    params![id, name, cat_id, kws, regex, prio],
                )?;
            }
        }

        Ok(())
    }
}
