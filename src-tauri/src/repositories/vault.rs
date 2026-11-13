use crate::security::vault::{DecryptedVaultItem, VaultManager};
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedVaultEntry {
    pub id: String,
    pub encrypted_payload: Vec<u8>,
    pub nonce: Vec<u8>,
    pub category: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultItemPayload {
    pub title: String,
    pub content: String,
    pub tags: String,
}

pub struct VaultRepository;

impl VaultRepository {
    pub fn is_initialized(conn: &Connection) -> Result<bool> {
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM vault_metadata", [], |r| r.get(0))?;
        Ok(count > 0)
    }

    pub fn initialize_vault(
        conn: &Connection,
        vault_manager: &VaultManager,
        master_password: &str,
    ) -> Result<(), String> {
        if Self::is_initialized(conn).map_err(|e| e.to_string())? {
            return Err("Vault sudah diinisialisasi sebelumnya".to_string());
        }

        let salt = VaultManager::generate_salt();
        let key = VaultManager::derive_key(master_password, &salt)?;
        
        let now = chrono::Utc::now().to_rfc3339();
        let salt_hex = hex::encode(salt);

        conn.execute(
            "INSERT INTO vault_metadata (id, salt, kdf_parameters, encryption_version, created_at)
             VALUES ('vault_meta', ?1, 'Argon2id:m=19456,t=2,p=1', 'AES-256-GCM-v1', ?2)",
            params![salt_hex, now],
        )
        .map_err(|e| e.to_string())?;

        vault_manager.set_unlocked_key(key);

        // Create verification canary entry
        let canary_payload = serde_json::to_vec(&VaultItemPayload {
            title: "__CANARY__".to_string(),
            content: "RAWTYPE_VAULT_CANARY_OK".to_string(),
            tags: "".to_string(),
        })
        .map_err(|e| e.to_string())?;

        let (ciphertext, nonce) = vault_manager.encrypt(&canary_payload)?;
        conn.execute(
            "INSERT INTO encrypted_vault_entries (id, encrypted_payload, nonce, category, created_at, updated_at)
             VALUES ('canary_entry', ?1, ?2, 'SYSTEM', ?3, ?3)",
            params![ciphertext, nonce, now],
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn unlock_vault(
        conn: &Connection,
        vault_manager: &VaultManager,
        master_password: &str,
    ) -> Result<bool, String> {
        let salt_hex: String = conn
            .query_row(
                "SELECT salt FROM vault_metadata WHERE id = 'vault_meta'",
                [],
                |r| r.get(0),
            )
            .map_err(|_| "Vault belum diinisialisasi".to_string())?;

        let salt = hex::decode(salt_hex).map_err(|e| e.to_string())?;
        let key = VaultManager::derive_key(master_password, &salt)?;

        // Try decrypting the canary
        let (canary_ct, canary_nonce): (Vec<u8>, Vec<u8>) = conn
            .query_row(
                "SELECT encrypted_payload, nonce FROM encrypted_vault_entries WHERE id = 'canary_entry'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .map_err(|_| "Metadata verifikasi vault tidak ditemukan".to_string())?;

        vault_manager.set_unlocked_key(key);
        match vault_manager.decrypt(&canary_ct, &canary_nonce) {
            Ok(plaintext) => {
                if let Ok(payload) = serde_json::from_slice::<VaultItemPayload>(&plaintext) {
                    if payload.content == "RAWTYPE_VAULT_CANARY_OK" {
                        return Ok(true);
                    }
                }
                vault_manager.lock();
                Err("Password master salah".to_string())
            }
            Err(_) => {
                vault_manager.lock();
                Err("Password master salah".to_string())
            }
        }
    }

    pub fn save_item(
        conn: &Connection,
        vault_manager: &VaultManager,
        id_opt: Option<&str>,
        title: &str,
        content: &str,
        category: &str,
        tags: &str,
    ) -> Result<DecryptedVaultItem, String> {
        if !vault_manager.is_unlocked() {
            return Err("Vault terkunci! Buka vault terlebih dahulu".to_string());
        }

        let now = chrono::Utc::now().to_rfc3339();
        let payload = VaultItemPayload {
            title: title.to_string(),
            content: content.to_string(),
            tags: tags.to_string(),
        };

        let bytes = serde_json::to_vec(&payload).map_err(|e| e.to_string())?;
        let (encrypted, nonce) = vault_manager.encrypt(&bytes)?;

        let id = match id_opt {
            Some(existing_id) => {
                conn.execute(
                    "UPDATE encrypted_vault_entries
                     SET encrypted_payload = ?1, nonce = ?2, category = ?3, updated_at = ?4
                     WHERE id = ?5",
                    params![encrypted, nonce, category, now, existing_id],
                )
                .map_err(|e| e.to_string())?;
                existing_id.to_string()
            }
            None => {
                let new_id = Uuid::new_v4().to_string();
                conn.execute(
                    "INSERT INTO encrypted_vault_entries (id, encrypted_payload, nonce, category, created_at, updated_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
                    params![new_id, encrypted, nonce, category, now],
                )
                .map_err(|e| e.to_string())?;
                new_id
            }
        };

        Ok(DecryptedVaultItem {
            id,
            title: title.to_string(),
            content: content.to_string(),
            category: category.to_string(),
            tags: tags.to_string(),
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn list_decrypted_items(
        conn: &Connection,
        vault_manager: &VaultManager,
    ) -> Result<Vec<DecryptedVaultItem>, String> {
        if !vault_manager.is_unlocked() {
            return Err("Vault terkunci".to_string());
        }

        let mut stmt = conn
            .prepare(
                "SELECT id, encrypted_payload, nonce, category, created_at, updated_at
                 FROM encrypted_vault_entries WHERE id != 'canary_entry' ORDER BY updated_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |r| {
                Ok((
                    r.get::<_, String>(0)?,
                    r.get::<_, Vec<u8>>(1)?,
                    r.get::<_, Vec<u8>>(2)?,
                    r.get::<_, String>(3)?,
                    r.get::<_, String>(4)?,
                    r.get::<_, String>(5)?,
                ))
            })
            .map_err(|e| e.to_string())?;

        let mut items = Vec::new();
        for row in rows {
            let (id, ct, nonce, category, created_at, updated_at) = row.map_err(|e| e.to_string())?;
            let pt = vault_manager.decrypt(&ct, &nonce)?;
            if let Ok(payload) = serde_json::from_slice::<VaultItemPayload>(&pt) {
                items.push(DecryptedVaultItem {
                    id,
                    title: payload.title,
                    content: payload.content,
                    category,
                    tags: payload.tags,
                    created_at,
                    updated_at,
                });
            }
        }

        Ok(items)
    }

    pub fn delete_item(conn: &Connection, id: &str) -> Result<(), String> {
        conn.execute("DELETE FROM encrypted_vault_entries WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}
