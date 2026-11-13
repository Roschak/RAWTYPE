import { describe, it, expect } from 'vitest';
import { api } from '../services/tauri';
import { refineTextShared } from '../core/refinement';
import { classifyNoteShared } from '../core/classification';
import { WebCryptoVault } from '../core/vault/webCryptoVault';
import { globalCache } from '../core/cache';

describe('RAWTYPE Shared Core & Multi-Platform Engine Tests', () => {
  it('correctly standardizes typos without altering protected words in shared engine', () => {
    const raw = 'pagi ini saya pergi ke apotik dan antri cukup lama';
    const protectedWords = new Set(['Eldoria', 'Rama']);
    const res = refineTextShared('test-1', raw, {
      mode: 'standard',
      fix_capitalization: true,
      fix_punctuation: true,
      fix_spelling: true,
      fix_dialogue: true,
      fix_whitespace: true,
    }, protectedWords);

    expect(res.refined_text).toContain('apotek');
    expect(res.refined_text).toContain('antre');
    expect(res.refined_text).toContain('Pagi');
    expect(res.corrections.length).toBeGreaterThan(0);
  });

  it('correctly handles sentence start capitalization and elongated vowels without truncating letters', () => {
    const raw = 'pada saaat saya melihat sesuatu di dalam peti tersebut';
    const res = refineTextShared('test-user-sentence', raw, {
      mode: 'standard',
      fix_capitalization: true,
      fix_punctuation: true,
      fix_spelling: true,
      fix_dialogue: true,
      fix_whitespace: true,
    });

    expect(res.refined_text).toBe('Pada saat saya melihat sesuatu di dalam peti tersebut.');
    expect(res.refined_text).not.toContain('Pda');
    expect(res.refined_text).not.toContain('saaat');

    // Verify individual corrections
    const capCorr = res.corrections.find(c => c.correction_type === 'capitalization');
    expect(capCorr?.original_text).toBe('pada');
    expect(capCorr?.proposed_text).toBe('Pada');

    const spellCorr = res.corrections.find(c => c.correction_type === 'spelling');
    expect(spellCorr?.original_text).toBe('saaat');
    expect(spellCorr?.proposed_text).toBe('saat');

    const punctCorr = res.corrections.find(c => c.correction_type === 'punctuation');
    expect(punctCorr?.original_text).toBe('tersebut');
    expect(punctCorr?.proposed_text).toBe('tersebut.');
  });

  it('preserves protected vocabulary from spell correction', () => {
    const raw = 'Rama pergi ke Apotik dan bertemu Eldoria';
    const protectedWords = new Set(['Apotik', 'Eldoria']);
    const res = refineTextShared('test-2', raw, {
      mode: 'standard',
      fix_capitalization: true,
      fix_punctuation: true,
      fix_spelling: true,
      fix_dialogue: true,
      fix_whitespace: true,
    }, protectedWords);

    // Apotik should remain Apotik because it is in protectedWords!
    expect(res.refined_text).toContain('Apotik');
  });

  it('classifies credentials as sensitive with highest priority', () => {
    const title = 'Akun Server Proyek';
    const content = 'pw github: super_secret_token_abc123\nproject development milestone';
    const classification = classifyNoteShared(title, content);

    expect(classification.category_id).toBe('cat_cred');
    expect(classification.is_sensitive).toBe(true);
  });

  it('manages Web Crypto AES-256-GCM authenticated vault operations', async () => {
    const vault = new WebCryptoVault();
    const salt = vault.generateSalt();
    const key = await vault.deriveKey('StrongMasterPassword123!', salt);
    vault.setUnlockedKey(key);

    expect(vault.isUnlocked()).toBe(true);

    const secretText = 'Api Token: secret-key-xyz-789';
    const { ciphertext, iv } = await vault.encrypt(secretText);
    expect(ciphertext).not.toBe(secretText);

    const decrypted = await vault.decrypt(ciphertext, iv);
    expect(decrypted).toBe(secretText);

    vault.lock();
    expect(vault.isUnlocked()).toBe(false);
  });

  it('calculates and purges ephemeral cache safely', async () => {
    globalCache.setEditorBuffer('doc-1', 'draft working text in memory');
    globalCache.setSearchCache('query', [{ title: 'result' }]);

    const usage = await globalCache.calculateUsage();
    expect(usage.editorBufferBytes).toBeGreaterThan(0);
    expect(usage.searchIndexBytes).toBeGreaterThan(0);

    // Purge search cache only
    await globalCache.purgeCache('search');
    expect(globalCache.getSearchCache('query')).toBeUndefined();
    expect(globalCache.getEditorBuffer('doc-1')).toBe('draft working text in memory');

    // Purge all
    await globalCache.purgeCache('all');
    expect(globalCache.getEditorBuffer('doc-1')).toBeUndefined();
  });

  it('detects runtime platform information accurately', () => {
    const info = api.getPlatformInfo();
    expect(info.offlineReady).toBe(true);
    expect(typeof info.platformName).toBe('string');
    expect(typeof info.storageEngine).toBe('string');
  });
});
