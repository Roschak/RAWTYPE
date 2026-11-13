use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DictionaryEntry {
    pub id: String,
    pub word: String,
    pub definition: String,
    pub category: String,
    pub protected: bool,
    pub ignored: bool,
}

pub struct DictionaryRepository;

impl DictionaryRepository {
    pub fn add(
        conn: &Connection,
        word: &str,
        definition: &str,
        category: &str,
        protected: bool,
        ignored: bool,
    ) -> Result<DictionaryEntry> {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO dictionary_entries (id, word, definition, category, protected, ignored)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, word, definition, category, if protected { 1 } else { 0 }, if ignored { 1 } else { 0 }],
        )?;

        Ok(DictionaryEntry {
            id,
            word: word.to_string(),
            definition: definition.to_string(),
            category: category.to_string(),
            protected,
            ignored,
        })
    }

    pub fn list(conn: &Connection) -> Result<Vec<DictionaryEntry>> {
        let mut stmt = conn.prepare(
            "SELECT id, word, definition, category, protected, ignored
             FROM dictionary_entries ORDER BY word ASC",
        )?;
        let rows = stmt.query_map([], |r| {
            Ok(DictionaryEntry {
                id: r.get(0)?,
                word: r.get(1)?,
                definition: r.get(2)?,
                category: r.get(3)?,
                protected: r.get::<_, i32>(4)? != 0,
                ignored: r.get::<_, i32>(5)? != 0,
            })
        })?;

        let mut list = Vec::new();
        for row in rows {
            list.push(row?);
        }
        Ok(list)
    }

    pub fn delete(conn: &Connection, id: &str) -> Result<()> {
        conn.execute("DELETE FROM dictionary_entries WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_protected_and_ignored(conn: &Connection) -> Result<(HashSet<String>, HashSet<String>)> {
        let mut protected = HashSet::new();
        let mut ignored = HashSet::new();

        let mut stmt = conn.prepare("SELECT word, protected, ignored FROM dictionary_entries")?;
        let rows = stmt.query_map([], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, i32>(1)? != 0,
                r.get::<_, i32>(2)? != 0,
            ))
        })?;

        for row in rows {
            let (w, is_p, is_i) = row?;
            if is_p {
                protected.insert(w.clone());
                protected.insert(w.to_lowercase());
            }
            if is_i {
                ignored.insert(w.clone());
                ignored.insert(w.to_lowercase());
            }
        }

        Ok((protected, ignored))
    }
}
