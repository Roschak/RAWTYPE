use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manuscript {
    pub id: String,
    pub title: String,
    pub author: String,
    pub category: String,
    pub description: String,
    pub tags: String,
    pub original_content: String,
    pub refined_content: String,
    pub created_at: String,
    pub updated_at: String,
    pub version_number: i32,
    pub archived: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManuscriptVersion {
    pub id: String,
    pub manuscript_id: String,
    pub content: String,
    pub version_number: i32,
    pub created_at: String,
}

pub struct ManuscriptRepository;

impl ManuscriptRepository {
    pub fn create(conn: &Connection, title: &str, author: &str, category: &str, content: &str) -> Result<Manuscript> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        
        conn.execute(
            "INSERT INTO manuscripts (id, title, author, category, description, tags, original_content, refined_content, created_at, updated_at, version_number, archived)
             VALUES (?1, ?2, ?3, ?4, '', '', ?5, ?5, ?6, ?6, 1, 0)",
            params![id, title, author, category, content, now],
        )?;

        // Record initial version
        let version_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO manuscript_versions (id, manuscript_id, content, version_number, created_at)
             VALUES (?1, ?2, ?3, 1, ?4)",
            params![version_id, id, content, now],
        )?;

        Self::get_by_id(conn, &id)
    }

    pub fn get_by_id(conn: &Connection, id: &str) -> Result<Manuscript> {
        conn.query_row(
            "SELECT id, title, author, category, description, tags, original_content, refined_content, created_at, updated_at, version_number, archived
             FROM manuscripts WHERE id = ?1",
            params![id],
            |r| {
                Ok(Manuscript {
                    id: r.get(0)?,
                    title: r.get(1)?,
                    author: r.get(2)?,
                    category: r.get(3)?,
                    description: r.get(4)?,
                    tags: r.get(5)?,
                    original_content: r.get(6)?,
                    refined_content: r.get(7)?,
                    created_at: r.get(8)?,
                    updated_at: r.get(9)?,
                    version_number: r.get(10)?,
                    archived: r.get::<_, i32>(11)? != 0,
                })
            },
        )
    }

    pub fn list(conn: &Connection, include_archived: bool) -> Result<Vec<Manuscript>> {
        let query = if include_archived {
            "SELECT id, title, author, category, description, tags, original_content, refined_content, created_at, updated_at, version_number, archived
             FROM manuscripts ORDER BY updated_at DESC"
        } else {
            "SELECT id, title, author, category, description, tags, original_content, refined_content, created_at, updated_at, version_number, archived
             FROM manuscripts WHERE archived = 0 ORDER BY updated_at DESC"
        };

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map([], |r| {
            Ok(Manuscript {
                id: r.get(0)?,
                title: r.get(1)?,
                author: r.get(2)?,
                category: r.get(3)?,
                description: r.get(4)?,
                tags: r.get(5)?,
                original_content: r.get(6)?,
                refined_content: r.get(7)?,
                created_at: r.get(8)?,
                updated_at: r.get(9)?,
                version_number: r.get(10)?,
                archived: r.get::<_, i32>(11)? != 0,
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
        author: &str,
        category: &str,
        description: &str,
        tags: &str,
        refined_content: &str,
        create_new_version: bool,
    ) -> Result<Manuscript> {
        let current = Self::get_by_id(conn, id)?;
        let now = chrono::Utc::now().to_rfc3339();

        let new_version = if create_new_version {
            current.version_number + 1
        } else {
            current.version_number
        };

        conn.execute(
            "UPDATE manuscripts
             SET title = ?1, author = ?2, category = ?3, description = ?4, tags = ?5, refined_content = ?6, updated_at = ?7, version_number = ?8
             WHERE id = ?9",
            params![title, author, category, description, tags, refined_content, now, new_version, id],
        )?;

        if create_new_version {
            let version_id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO manuscript_versions (id, manuscript_id, content, version_number, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![version_id, id, refined_content, new_version, now],
            )?;
        }

        Self::get_by_id(conn, id)
    }

    pub fn update_raw_content(conn: &Connection, id: &str, raw_content: &str) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE manuscripts SET original_content = ?1, updated_at = ?2 WHERE id = ?3",
            params![raw_content, now, id],
        )?;
        Ok(())
    }

    pub fn delete(conn: &Connection, id: &str) -> Result<()> {
        conn.execute("DELETE FROM manuscripts WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn toggle_archive(conn: &Connection, id: &str) -> Result<bool> {
        let current = Self::get_by_id(conn, id)?;
        let new_state = if current.archived { 0 } else { 1 };
        conn.execute("UPDATE manuscripts SET archived = ?1 WHERE id = ?2", params![new_state, id])?;
        Ok(new_state != 0)
    }

    pub fn get_versions(conn: &Connection, manuscript_id: &str) -> Result<Vec<ManuscriptVersion>> {
        let mut stmt = conn.prepare(
            "SELECT id, manuscript_id, content, version_number, created_at
             FROM manuscript_versions WHERE manuscript_id = ?1 ORDER BY version_number DESC",
        )?;
        let rows = stmt.query_map(params![manuscript_id], |r| {
            Ok(ManuscriptVersion {
                id: r.get(0)?,
                manuscript_id: r.get(1)?,
                content: r.get(2)?,
                version_number: r.get(3)?,
                created_at: r.get(4)?,
            })
        })?;

        let mut list = Vec::new();
        for row in rows {
            list.push(row?);
        }
        Ok(list)
    }

    pub fn restore_version(conn: &Connection, manuscript_id: &str, version_number: i32) -> Result<Manuscript> {
        let content: String = conn.query_row(
            "SELECT content FROM manuscript_versions WHERE manuscript_id = ?1 AND version_number = ?2",
            params![manuscript_id, version_number],
            |r| r.get(0),
        )?;

        let current = Self::get_by_id(conn, manuscript_id)?;
        Self::update(
            conn,
            manuscript_id,
            &current.title,
            &current.author,
            &current.category,
            &current.description,
            &current.tags,
            &content,
            true, // Creates a new version preserving audit trail
        )
    }
}
