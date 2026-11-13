use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteCategory {
    pub id: String,
    pub name: String,
    pub description: String,
    pub color: String,
    pub priority: i32,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub category_id: String,
    pub category_name: Option<String>,
    pub category_color: Option<String>,
    pub tags: String,
    pub source: String,
    pub created_at: String,
    pub updated_at: String,
    pub archived: bool,
    pub pinned: bool,
    pub sensitive: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteImportItem {
    pub title: String,
    pub content: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportSummary {
    pub total: usize,
    pub imported: usize,
    pub duplicates: usize,
    pub sensitive_detected: usize,
}

pub struct NoteRepository;

impl NoteRepository {
    pub fn create(
        conn: &Connection,
        title: &str,
        content: &str,
        category_id: &str,
        tags: &str,
        source: &str,
        sensitive: bool,
    ) -> Result<Note> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO notes (id, title, content, category_id, tags, source, created_at, updated_at, archived, pinned, sensitive)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7, 0, 0, ?8)",
            params![id, title, content, category_id, tags, source, now, if sensitive { 1 } else { 0 }],
        )?;

        Self::get_by_id(conn, &id)
    }

    pub fn get_by_id(conn: &Connection, id: &str) -> Result<Note> {
        conn.query_row(
            "SELECT n.id, n.title, n.content, n.category_id, c.name, c.color, n.tags, n.source, n.created_at, n.updated_at, n.archived, n.pinned, n.sensitive
             FROM notes n
             LEFT JOIN note_categories c ON n.category_id = c.id
             WHERE n.id = ?1",
            params![id],
            |r| {
                Ok(Note {
                    id: r.get(0)?,
                    title: r.get(1)?,
                    content: r.get(2)?,
                    category_id: r.get(3)?,
                    category_name: r.get(4)?,
                    category_color: r.get(5)?,
                    tags: r.get(6)?,
                    source: r.get(7)?,
                    created_at: r.get(8)?,
                    updated_at: r.get(9)?,
                    archived: r.get::<_, i32>(10)? != 0,
                    pinned: r.get::<_, i32>(11)? != 0,
                    sensitive: r.get::<_, i32>(12)? != 0,
                })
            },
        )
    }

    pub fn list(
        conn: &Connection,
        category_id: Option<&str>,
        include_archived: bool,
        include_sensitive: bool,
        search_query: Option<&str>,
    ) -> Result<Vec<Note>> {
        let mut sql = String::from(
            "SELECT n.id, n.title, n.content, n.category_id, c.name, c.color, n.tags, n.source, n.created_at, n.updated_at, n.archived, n.pinned, n.sensitive
             FROM notes n
             LEFT JOIN note_categories c ON n.category_id = c.id
             WHERE 1=1 ",
        );

        if !include_archived {
            sql.push_str("AND n.archived = 0 ");
        }

        if !include_sensitive {
            sql.push_str("AND n.sensitive = 0 ");
        }

        if let Some(cat) = category_id {
            if !cat.is_empty() && cat != "all" {
                sql.push_str(&format!("AND n.category_id = '{}' ", cat.replace('\'', "''")));
            }
        }

        if let Some(q) = search_query {
            let clean_q = q.trim();
            if !clean_q.is_empty() {
                let escaped = clean_q.replace('\'', "''");
                sql.push_str(&format!(
                    "AND (n.title LIKE '%{}%' OR n.content LIKE '%{}%' OR n.tags LIKE '%{}%') ",
                    escaped, escaped, escaped
                ));
            }
        }

        sql.push_str("ORDER BY n.pinned DESC, n.updated_at DESC");

        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map([], |r| {
            Ok(Note {
                id: r.get(0)?,
                title: r.get(1)?,
                content: r.get(2)?,
                category_id: r.get(3)?,
                category_name: r.get(4)?,
                category_color: r.get(5)?,
                tags: r.get(6)?,
                source: r.get(7)?,
                created_at: r.get(8)?,
                updated_at: r.get(9)?,
                archived: r.get::<_, i32>(10)? != 0,
                pinned: r.get::<_, i32>(11)? != 0,
                sensitive: r.get::<_, i32>(12)? != 0,
            })
        })?;

        let mut list = Vec::new();
        for row in rows {
            list.push(row?);
        }
        Ok(list)
    }

    pub fn update(
        conn: &Connection,
        id: &str,
        title: &str,
        content: &str,
        category_id: &str,
        tags: &str,
        sensitive: bool,
    ) -> Result<Note> {
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE notes
             SET title = ?1, content = ?2, category_id = ?3, tags = ?4, sensitive = ?5, updated_at = ?6
             WHERE id = ?7",
            params![title, content, category_id, tags, if sensitive { 1 } else { 0 }, now, id],
        )?;

        Self::get_by_id(conn, id)
    }

    pub fn delete(conn: &Connection, id: &str) -> Result<()> {
        conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn toggle_pin(conn: &Connection, id: &str) -> Result<bool> {
        let current = Self::get_by_id(conn, id)?;
        let new_state = if current.pinned { 0 } else { 1 };
        conn.execute("UPDATE notes SET pinned = ?1 WHERE id = ?2", params![new_state, id])?;
        Ok(new_state != 0)
    }

    pub fn toggle_archive(conn: &Connection, id: &str) -> Result<bool> {
        let current = Self::get_by_id(conn, id)?;
        let new_state = if current.archived { 0 } else { 1 };
        conn.execute("UPDATE notes SET archived = ?1 WHERE id = ?2", params![new_state, id])?;
        Ok(new_state != 0)
    }

    pub fn list_categories(conn: &Connection) -> Result<Vec<NoteCategory>> {
        let mut stmt = conn.prepare(
            "SELECT id, name, description, color, priority, created_at
             FROM note_categories ORDER BY priority DESC",
        )?;
        let rows = stmt.query_map([], |r| {
            Ok(NoteCategory {
                id: r.get(0)?,
                name: r.get(1)?,
                description: r.get(2)?,
                color: r.get(3)?,
                priority: r.get(4)?,
                created_at: r.get(5)?,
            })
        })?;

        let mut list = Vec::new();
        for row in rows {
            list.push(row?);
        }
        Ok(list)
    }

    pub fn is_duplicate(conn: &Connection, title: &str, content: &str) -> Result<bool> {
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM notes WHERE title = ?1 AND content = ?2",
            params![title, content],
            |r| r.get(0),
        )?;
        Ok(count > 0)
    }
}
