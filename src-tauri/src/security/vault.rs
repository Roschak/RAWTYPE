use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::{Algorithm, Argon2, Params, Version};
use rand::{rngs::OsRng, RngCore};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultStatus {
    pub is_initialized: bool,
    pub is_unlocked: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecryptedVaultItem {
    pub id: String,
    pub title: String,
    pub content: String,
    pub category: String,
    pub tags: String,
    pub created_at: String,
    pub updated_at: String,
}

pub struct VaultManager {
    unlocked_key: Mutex<Option<[u8; 32]>>,
}

impl VaultManager {
    pub fn new() -> Self {
        Self {
            unlocked_key: Mutex::new(None),
        }
    }

    pub fn is_unlocked(&self) -> bool {
        self.unlocked_key.lock().unwrap().is_some()
    }

    pub fn lock(&self) {
        let mut key_guard = self.unlocked_key.lock().unwrap();
        if let Some(mut key) = key_guard.take() {
            // Zeroize key in memory
            for byte in key.iter_mut() {
                *byte = 0;
            }
        }
    }

    pub fn derive_key(password: &str, salt: &[u8]) -> Result<[u8; 32], String> {
        let mut key = [0u8; 32];
        let params = Params::new(19456, 2, 1, Some(32)).map_err(|e| e.to_string())?;
        let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
        argon2
            .hash_password_into(password.as_bytes(), salt, &mut key)
            .map_err(|e| e.to_string())?;
        Ok(key)
    }

    pub fn generate_salt() -> [u8; 16] {
        let mut salt = [0u8; 16];
        OsRng.fill_bytes(&mut salt);
        salt
    }

    pub fn generate_nonce() -> [u8; 12] {
        let mut nonce = [0u8; 12];
        OsRng.fill_bytes(&mut nonce);
        nonce
    }

    pub fn set_unlocked_key(&self, key: [u8; 32]) {
        let mut key_guard = self.unlocked_key.lock().unwrap();
        *key_guard = Some(key);
    }

    pub fn encrypt(&self, plaintext: &[u8]) -> Result<(Vec<u8>, Vec<u8>), String> {
        let key_guard = self.unlocked_key.lock().unwrap();
        let key = key_guard.as_ref().ok_or_else(|| "Vault is locked".to_string())?;

        let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;
        let nonce_bytes = Self::generate_nonce();
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, plaintext)
            .map_err(|e| e.to_string())?;

        Ok((ciphertext, nonce_bytes.to_vec()))
    }

    pub fn decrypt(&self, ciphertext: &[u8], nonce_bytes: &[u8]) -> Result<Vec<u8>, String> {
        let key_guard = self.unlocked_key.lock().unwrap();
        let key = key_guard.as_ref().ok_or_else(|| "Vault is locked".to_string())?;

        let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;
        let nonce = Nonce::from_slice(nonce_bytes);

        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| e.to_string())?;

        Ok(plaintext)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_key_derivation_and_encryption() {
        let salt = VaultManager::generate_salt();
        let key = VaultManager::derive_key("SuperSecretPassword123!", &salt).expect("derive key");

        let manager = VaultManager::new();
        manager.set_unlocked_key(key);
        assert!(manager.is_unlocked());

        let secret_data = b"Sensitive note with password github: token-123456";
        let (ciphertext, nonce) = manager.encrypt(secret_data).expect("encrypt");
        assert_ne!(ciphertext, secret_data);

        let decrypted = manager.decrypt(&ciphertext, &nonce).expect("decrypt");
        assert_eq!(decrypted, secret_data);

        manager.lock();
        assert!(!manager.is_unlocked());
        assert!(manager.encrypt(secret_data).is_err());
    }
}
