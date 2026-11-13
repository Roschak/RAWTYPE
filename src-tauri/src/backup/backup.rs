use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupRecord {
    pub id: String,
    pub backup_path: String,
    pub created_at: String,
    pub backup_type: String,
    pub integrity_status: String,
}

pub struct BackupManager;

impl BackupManager {
    pub fn create_backup(
        conn: &Connection,
        backup_dir: &Path,
        backup_type: &str,
    ) -> Result<BackupRecord, String> {
        let _ = fs::create_dir_all(backup_dir);
        let now = chrono::Utc::now();
        let timestamp = now.format("%Y%m%d_%H%M%S").to_string();
        let file_name = format!("rawtype_backup_{}.db", timestamp);
        let backup_path = backup_dir.join(&file_name);
        let backup_path_str = backup_path.to_string_lossy().to_string();

        // Perform clean atomic snapshot
        let vacuum_sql = format!("VACUUM INTO '{}'", backup_path_str.replace('\'', "''"));
        conn.execute_batch(&vacuum_sql)
            .map_err(|e| format!("Gagal membuat snapshot backup: {}", e))?;

        // Verify integrity of created backup file
        let integrity_status = Self::verify_backup_integrity(&backup_path)
            .unwrap_or_else(|e| format!("Error: {}", e));

        let id = Uuid::new_v4().to_string();
        let created_at = now.to_rfc3339();

        let _ = conn.execute(
            "INSERT INTO backup_history (id, backup_path, created_at, backup_type, integrity_status)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, backup_path_str, created_at, backup_type, integrity_status],
        );

        Ok(BackupRecord {
            id,
            backup_path: backup_path_str,
            created_at,
            backup_type: backup_type.to_string(),
            integrity_status,
        })
    }

    pub fn verify_backup_integrity(backup_path: &Path) -> Result<String, String> {
        if !backup_path.exists() {
            return Err("File backup tidak ditemukan".to_string());
        }

        let test_conn = Connection::open_with_flags(
            backup_path,
            rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
        )
        .map_err(|e| format!("Gagal membuka file backup: {}", e))?;

        let status: String = test_conn
            .query_row("PRAGMA integrity_check;", [], |r| r.get(0))
            .map_err(|e| format!("Gagal verifikasi integritas: {}", e))?;

        Ok(status)
    }

    pub fn list_backups(conn: &Connection) -> Result<Vec<BackupRecord>> {
        let mut stmt = conn.prepare(
            "SELECT id, backup_path, created_at, backup_type, integrity_status
             FROM backup_history ORDER BY created_at DESC",
        )?;
        let rows = stmt.query_map([], |r| {
            Ok(BackupRecord {
                id: r.get(0)?,
                backup_path: r.get(1)?,
                created_at: r.get(2)?,
                backup_type: r.get(3)?,
                integrity_status: r.get(4)?,
            })
        })?;

        let mut list = Vec::new();
        for row in rows {
            list.push(row?);
        }
        Ok(list)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_backup_and_integrity() {
        let temp_dir = std::env::temp_dir().join(format!("rawtype_test_{}", Uuid::new_v4()));
        let _ = fs::create_dir_all(&temp_dir);
        let db_path = temp_dir.join("live.db");
        let conn = Connection::open(&db_path).unwrap();
        conn.execute("CREATE TABLE test (val TEXT);", []).unwrap();
        conn.execute("INSERT INTO test VALUES ('ok');", []).unwrap();

        let backup_rec = BackupManager::create_backup(&conn, &temp_dir, "manual").unwrap();
        assert_eq!(backup_rec.integrity_status, "ok");
        assert!(Path::new(&backup_rec.backup_path).exists());

        let _ = fs::remove_dir_all(temp_dir);
    }
}
