import { DecryptedVaultItem, VaultStatus } from '../../types';

export interface EncryptedPayload {
  ciphertextBase64: string;
  ivBase64: string;
  category: string;
}

export class WebCryptoVault {
  private cryptoKey: CryptoKey | null = null;
  private isUnlockedState = false;

  // Derive AES-GCM-256 key from master password and salt using PBKDF2
  async deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(masterPassword),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  generateSalt(): Uint8Array {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    return salt;
  }

  generateIV(): Uint8Array {
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    return iv;
  }

  setUnlockedKey(key: CryptoKey) {
    this.cryptoKey = key;
    this.isUnlockedState = true;
  }

  lock() {
    this.cryptoKey = null;
    this.isUnlockedState = false;
  }

  isUnlocked(): boolean {
    return this.isUnlockedState && this.cryptoKey !== null;
  }

  async encrypt(data: string): Promise<{ ciphertext: string; iv: string }> {
    if (!this.cryptoKey) throw new Error('Vault terkunci');
    const enc = new TextEncoder();
    const iv = this.generateIV();
    const encoded = enc.encode(data);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      this.cryptoKey,
      encoded as BufferSource
    );

    return {
      ciphertext: this.bufferToBase64(new Uint8Array(ciphertextBuffer)),
      iv: this.bufferToBase64(iv),
    };
  }

  async decrypt(ciphertextBase64: string, ivBase64: string): Promise<string> {
    if (!this.cryptoKey) throw new Error('Vault terkunci');
    const ciphertext = this.base64ToBuffer(ciphertextBase64);
    const iv = this.base64ToBuffer(ivBase64);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      this.cryptoKey,
      ciphertext as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  }

  bufferToBase64(buf: Uint8Array): string {
    let binary = '';
    const len = buf.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buf[i]);
    }
    return btoa(binary);
  }

  base64ToBuffer(b64: string): Uint8Array {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
