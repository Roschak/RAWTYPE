import { StorageAdapter } from './contracts';
import {
  Manuscript,
  ManuscriptVersion,
  Note,
  NoteCategory,
  NoteImportItem,
  ImportSummary,
  DictionaryEntry,
  VaultStatus,
  DecryptedVaultItem,
  BackupRecord,
  DashboardStats,
  SearchResultItem,
  RecoveryJournalEntry,
  CacheUsageStats,
} from '../../types';
import { WebCryptoVault } from '../vault/webCryptoVault';
import { globalCache } from '../cache';
import { classifyNoteShared } from '../classification';

const DB_NAME = 'RAWTYPE_LOCAL_DB';
const DB_VERSION = 1;

export class WebIndexedDBAdapter implements StorageAdapter {
  readonly name = 'WebIndexedDBAdapter';
  readonly storageEngine = 'IndexedDB (Browser Local-First)';

  private db: IDBDatabase | null = null;
  private vault = new WebCryptoVault();
  private isInit = false;

  async initialize(): Promise<void> {
    if (this.isInit && this.db) return;

    if (typeof indexedDB === 'undefined') {
      // In non-browser environments (e.g. Node tests without mock), initialize memory fallback
      this.isInit = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('manuscripts')) {
          const msStore = db.createObjectStore('manuscripts', { keyPath: 'id' });
          msStore.createIndex('updated_at', 'updated_at', { unique: false });
          msStore.createIndex('archived', 'archived', { unique: false });
        }

        if (!db.objectStoreNames.contains('manuscript_versions')) {
          const mvStore = db.createObjectStore('manuscript_versions', { keyPath: 'id' });
          mvStore.createIndex('manuscript_id', 'manuscript_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('notes')) {
          const nStore = db.createObjectStore('notes', { keyPath: 'id' });
          nStore.createIndex('category_id', 'category_id', { unique: false });
          nStore.createIndex('updated_at', 'updated_at', { unique: false });
          nStore.createIndex('pinned', 'pinned', { unique: false });
          nStore.createIndex('sensitive', 'sensitive', { unique: false });
        }

        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('dictionary')) {
          const dictStore = db.createObjectStore('dictionary', { keyPath: 'id' });
          dictStore.createIndex('word', 'word', { unique: true });
        }

        if (!db.objectStoreNames.contains('vault_metadata')) {
          db.createObjectStore('vault_metadata', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('encrypted_vault')) {
          db.createObjectStore('encrypted_vault', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('recovery_journal')) {
          db.createObjectStore('recovery_journal', { keyPath: 'doc_id' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInit = true;
        await this.seedDefaultsIfEmpty();
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private async seedDefaultsIfEmpty() {
    const cats = await this.listCategories();
    if (cats.length === 0) {
      const now = new Date().toISOString();
      const defaults: NoteCategory[] = [
        { id: 'cat_cred', name: 'Password / Credentials', description: 'Kata sandi & kredensial', color: '#ef4444', priority: 100, created_at: now },
        { id: 'cat_personal', name: 'Personal Information', description: 'Data pribadi & identitas', color: '#f97316', priority: 90, created_at: now },
        { id: 'cat_project', name: 'Project Notes', description: 'Catatan proyek & development', color: '#3b82f6', priority: 80, created_at: now },
        { id: 'cat_tech', name: 'Technical Notes', description: 'Snippet kode & server', color: '#06b6d4', priority: 75, created_at: now },
        { id: 'cat_meeting', name: 'Meeting Notes', description: 'Notulen rapat & agenda', color: '#8b5cf6', priority: 70, created_at: now },
        { id: 'cat_todo', name: 'Tasks / TODO', description: 'Checklist & deadline', color: '#10b981', priority: 65, created_at: now },
        { id: 'cat_financial', name: 'Financial Notes', description: 'Tagihan & invoice', color: '#eab308', priority: 60, created_at: now },
        { id: 'cat_important', name: 'Important Notes', description: 'Catatan prioritas tinggi', color: '#ec4899', priority: 50, created_at: now },
        { id: 'cat_general', name: 'General Notes', description: 'Catatan umum', color: '#64748b', priority: 20, created_at: now },
        { id: 'cat_unclass', name: 'Unclassified', description: 'Belum terorganisir', color: '#475569', priority: 0, created_at: now },
      ];
      for (const c of defaults) {
        await this.idbPut('categories', c);
      }
    }
  }

  private async idbGet<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    if (!this.db) return null;
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  private async idbGetAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) return [];
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  private async idbPut<T>(storeName: string, value: T): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async idbDelete(storeName: string, key: IDBValidKey): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async idbClear(storeName: string): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Manuscripts
  async listManuscripts(includeArchived = false): Promise<Manuscript[]> {
    const all = await this.idbGetAll<Manuscript>('manuscripts');
    const filtered = all.filter((m) => includeArchived || !m.archived);
    return filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  async getManuscript(id: string): Promise<Manuscript> {
    const found = await this.idbGet<Manuscript>('manuscripts', id);
    if (!found) throw new Error(`Naskah dengan ID ${id} tidak ditemukan`);
    return found;
  }

  async createManuscript(title: string, author: string, category: string, content: string): Promise<Manuscript> {
    const now = new Date().toISOString();
    const id = 'ms_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const item: Manuscript = {
      id,
      title,
      author,
      category,
      description: '',
      tags: '',
      original_content: content,
      refined_content: content,
      created_at: now,
      updated_at: now,
      version_number: 1,
      archived: false,
    };

    await this.idbPut('manuscripts', item);

    // Initial version
    const version: ManuscriptVersion = {
      id: 'ver_' + Date.now(),
      manuscript_id: id,
      content,
      version_number: 1,
      created_at: now,
    };
    await this.idbPut('manuscript_versions', version);

    return item;
  }

  async updateManuscript(
    id: string,
    title: string,
    author: string,
    category: string,
    description: string,
    tags: string,
    refinedContent: string,
    createNewVersion: boolean
  ): Promise<Manuscript> {
    const current = await this.getManuscript(id);
    const now = new Date().toISOString();
    const newVer = createNewVersion ? current.version_number + 1 : current.version_number;

    const updated: Manuscript = {
      ...current,
      title,
      author,
      category,
      description,
      tags,
      refined_content: refinedContent,
      updated_at: now,
      version_number: newVer,
    };

    await this.idbPut('manuscripts', updated);

    if (createNewVersion) {
      const ver: ManuscriptVersion = {
        id: 'ver_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        manuscript_id: id,
        content: refinedContent,
        version_number: newVer,
        created_at: now,
      };
      await this.idbPut('manuscript_versions', ver);
    }

    return updated;
  }

  async deleteManuscript(id: string): Promise<void> {
    await this.idbDelete('manuscripts', id);
  }

  async toggleArchiveManuscript(id: string): Promise<boolean> {
    const current = await this.getManuscript(id);
    current.archived = !current.archived;
    current.updated_at = new Date().toISOString();
    await this.idbPut('manuscripts', current);
    return current.archived;
  }

  async getManuscriptVersions(id: string): Promise<ManuscriptVersion[]> {
    const all = await this.idbGetAll<ManuscriptVersion>('manuscript_versions');
    return all.filter((v) => v.manuscript_id === id).sort((a, b) => b.version_number - a.version_number);
  }

  async restoreManuscriptVersion(id: string, versionNumber: number): Promise<Manuscript> {
    const versions = await this.getManuscriptVersions(id);
    const target = versions.find((v) => v.version_number === versionNumber);
    if (!target) throw new Error(`Versi ${versionNumber} tidak ditemukan`);

    const current = await this.getManuscript(id);
    return this.updateManuscript(
      id,
      current.title,
      current.author,
      current.category,
      current.description,
      current.tags,
      target.content,
      true
    );
  }

  // Notes
  async listNotes(
    categoryId?: string,
    includeArchived = false,
    includeSensitive = false,
    searchQuery?: string
  ): Promise<Note[]> {
    const all = await this.idbGetAll<Note>('notes');
    const categories = await this.listCategories();
    const catMap = new Map(categories.map((c) => [c.id, c]));

    const filtered = all.filter((n) => {
      if (!includeArchived && n.archived) return false;
      if (!includeSensitive && n.sensitive && !this.vault.isUnlocked()) return false;
      if (categoryId && categoryId !== 'all' && n.category_id !== categoryId) return false;
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const enriched = filtered.map((n) => {
      const c = catMap.get(n.category_id);
      return {
        ...n,
        category_name: c?.name,
        category_color: c?.color,
      };
    });

    return enriched.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }

  async getNote(id: string): Promise<Note> {
    const found = await this.idbGet<Note>('notes', id);
    if (!found) throw new Error(`Catatan dengan ID ${id} tidak ditemukan`);
    if (found.sensitive && !this.vault.isUnlocked()) {
      throw new Error('Catatan terkunci di dalam Sensitive Vault');
    }
    const categories = await this.listCategories();
    const c = categories.find((cat) => cat.id === found.category_id);
    return {
      ...found,
      category_name: c?.name,
      category_color: c?.color,
    };
  }

  async createNote(
    title: string,
    content: string,
    categoryId: string,
    tags: string,
    source: string,
    sensitive: boolean
  ): Promise<Note> {
    const now = new Date().toISOString();
    const id = 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const item: Note = {
      id,
      title,
      content,
      category_id: categoryId,
      tags,
      source,
      created_at: now,
      updated_at: now,
      archived: false,
      pinned: false,
      sensitive,
    };
    await this.idbPut('notes', item);
    return this.getNote(id);
  }

  async updateNote(
    id: string,
    title: string,
    content: string,
    categoryId: string,
    tags: string,
    sensitive: boolean
  ): Promise<Note> {
    const current = await this.getNote(id);
    const updated: Note = {
      ...current,
      title,
      content,
      category_id: categoryId,
      tags,
      sensitive,
      updated_at: new Date().toISOString(),
    };
    await this.idbPut('notes', updated);
    return this.getNote(id);
  }

  async deleteNote(id: string): Promise<void> {
    await this.idbDelete('notes', id);
  }

  async togglePinNote(id: string): Promise<boolean> {
    const current = await this.getNote(id);
    current.pinned = !current.pinned;
    current.updated_at = new Date().toISOString();
    await this.idbPut('notes', current);
    return current.pinned;
  }

  async toggleArchiveNote(id: string): Promise<boolean> {
    const current = await this.getNote(id);
    current.archived = !current.archived;
    current.updated_at = new Date().toISOString();
    await this.idbPut('notes', current);
    return current.archived;
  }

  async listCategories(): Promise<NoteCategory[]> {
    const all = await this.idbGetAll<NoteCategory>('categories');
    return all.sort((a, b) => b.priority - a.priority);
  }

  async batchImportNotes(items: NoteImportItem[], skipDuplicates: boolean): Promise<ImportSummary> {
    const existing = await this.idbGetAll<Note>('notes');
    let imported = 0;
    let duplicates = 0;
    let sensitiveCount = 0;

    for (const item of items) {
      const isDup = existing.some((n) => n.title === item.title && n.content === item.content);
      if (skipDuplicates && isDup) {
        duplicates++;
        continue;
      }

      const c = classifyNoteShared(item.title, item.content);
      if (c.is_sensitive) sensitiveCount++;

      await this.createNote(
        item.title,
        item.content,
        c.category_id,
        '',
        item.source,
        c.is_sensitive
      );
      imported++;
    }

    return {
      total: items.length,
      imported,
      duplicates,
      sensitive_detected: sensitiveCount,
    };
  }

  // Dictionary
  async listDictionaryEntries(): Promise<DictionaryEntry[]> {
    const all = await this.idbGetAll<DictionaryEntry>('dictionary');
    return all.sort((a, b) => a.word.localeCompare(b.word));
  }

  async addDictionaryEntry(
    word: string,
    definition: string,
    category: string,
    protectedWord: boolean,
    ignored: boolean
  ): Promise<DictionaryEntry> {
    const item: DictionaryEntry = {
      id: 'dict_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      word,
      definition,
      category,
      protected: protectedWord,
      ignored,
    };
    await this.idbPut('dictionary', item);
    globalCache.setDictionaryCache(word, protectedWord);
    return item;
  }

  async deleteDictionaryEntry(id: string): Promise<void> {
    await this.idbDelete('dictionary', id);
  }

  // Encrypted Vault (Web Crypto AES-256-GCM)
  async getVaultStatus(): Promise<VaultStatus> {
    const meta = await this.idbGet<{ id: string }>('vault_metadata', 'vault_meta');
    return {
      is_initialized: !!meta,
      is_unlocked: this.vault.isUnlocked(),
    };
  }

  async initializeVault(masterPassword: string): Promise<void> {
    const status = await this.getVaultStatus();
    if (status.is_initialized) throw new Error('Vault sudah diinisialisasi');

    const salt = this.vault.generateSalt();
    const key = await this.vault.deriveKey(masterPassword, salt);
    this.vault.setUnlockedKey(key);

    const saltBase64 = this.vault.bufferToBase64(salt);
    await this.idbPut('vault_metadata', {
      id: 'vault_meta',
      salt: saltBase64,
      kdf: 'PBKDF2-SHA256:100k',
      algo: 'AES-256-GCM',
      created_at: new Date().toISOString(),
    });

    // Canary entry to verify future unlock
    const canaryEncrypted = await this.vault.encrypt('RAWTYPE_VAULT_CANARY_OK');
    await this.idbPut('encrypted_vault', {
      id: 'canary_entry',
      ciphertext: canaryEncrypted.ciphertext,
      iv: canaryEncrypted.iv,
      category: 'SYSTEM',
    });
  }

  async unlockVault(masterPassword: string): Promise<boolean> {
    const meta = await this.idbGet<{ id: string; salt: string }>('vault_metadata', 'vault_meta');
    if (!meta) throw new Error('Vault belum diinisialisasi');

    const salt = this.vault.base64ToBuffer(meta.salt);
    const key = await this.vault.deriveKey(masterPassword, salt);
    this.vault.setUnlockedKey(key);

    const canary = await this.idbGet<{ ciphertext: string; iv: string }>('encrypted_vault', 'canary_entry');
    if (!canary) {
      this.vault.lock();
      throw new Error('Data verifikasi vault hilang');
    }

    try {
      const decrypted = await this.vault.decrypt(canary.ciphertext, canary.iv);
      if (decrypted === 'RAWTYPE_VAULT_CANARY_OK') {
        return true;
      }
      this.vault.lock();
      throw new Error('Password master tidak valid');
    } catch {
      this.vault.lock();
      throw new Error('Password master tidak valid');
    }
  }

  async lockVault(): Promise<void> {
    this.vault.lock();
  }

  async listVaultItems(): Promise<DecryptedVaultItem[]> {
    if (!this.vault.isUnlocked()) throw new Error('Vault terkunci');
    const all = await this.idbGetAll<{
      id: string;
      ciphertext: string;
      iv: string;
      category: string;
      created_at: string;
      updated_at: string;
    }>('encrypted_vault');

    const items: DecryptedVaultItem[] = [];
    for (const entry of all) {
      if (entry.id === 'canary_entry') continue;
      try {
        const plainJson = await this.vault.decrypt(entry.ciphertext, entry.iv);
        const parsed = JSON.parse(plainJson);
        items.push({
          id: entry.id,
          title: parsed.title,
          content: parsed.content,
          category: entry.category,
          tags: parsed.tags || '',
          created_at: entry.created_at,
          updated_at: entry.updated_at,
        });
      } catch {
        // failed item decryption skipped
      }
    }

    return items;
  }

  async saveVaultItem(
    id: string | null,
    title: string,
    content: string,
    category: string,
    tags: string
  ): Promise<DecryptedVaultItem> {
    if (!this.vault.isUnlocked()) throw new Error('Vault terkunci');
    const now = new Date().toISOString();
    const itemId = id || 'sec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    const payload = JSON.stringify({ title, content, tags });
    const encrypted = await this.vault.encrypt(payload);

    await this.idbPut('encrypted_vault', {
      id: itemId,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      category,
      created_at: now,
      updated_at: now,
    });

    return {
      id: itemId,
      title,
      content,
      category,
      tags,
      created_at: now,
      updated_at: now,
    };
  }

  async deleteVaultItem(id: string): Promise<void> {
    await this.idbDelete('encrypted_vault', id);
  }

  // Backup & Recovery
  async createBackup(backupType = 'manual'): Promise<BackupRecord> {
    const manuscripts = await this.idbGetAll('manuscripts');
    const versions = await this.idbGetAll('manuscript_versions');
    const notes = await this.idbGetAll('notes');
    const categories = await this.idbGetAll('categories');
    const dictionary = await this.idbGetAll('dictionary');
    const vaultMeta = await this.idbGet('vault_metadata', 'vault_meta');
    const encryptedVault = await this.idbGetAll('encrypted_vault');

    const exportData = {
      app: 'RAWTYPE',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      manuscripts,
      versions,
      notes,
      categories,
      dictionary,
      vaultMeta,
      encryptedVault, // Note: sensitive items remain encrypted!
    };

    const jsonStr = JSON.stringify(exportData);
    const id = 'bk_' + Date.now();
    const now = new Date().toISOString();

    const record: BackupRecord = {
      id,
      backup_path: `IndexedDB_Snapshot_${Date.now()}.json`,
      created_at: now,
      backup_type: backupType,
      integrity_status: 'ok',
    };

    await this.idbPut('backups', { ...record, payload: jsonStr });
    return record;
  }

  async listBackups(): Promise<BackupRecord[]> {
    const all = await this.idbGetAll<BackupRecord & { payload?: string }>('backups');
    return all.map(({ payload, ...rec }) => rec).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async verifyBackup(backupPath: string): Promise<string> {
    const all = await this.idbGetAll<BackupRecord & { payload?: string }>('backups');
    const found = all.find((b) => b.backup_path === backupPath);
    if (!found) return 'File cadangan tidak ditemukan';
    if (!found.payload) return 'Payload kosong';
    try {
      const parsed = JSON.parse(found.payload);
      if (parsed.app === 'RAWTYPE' && Array.isArray(parsed.manuscripts)) {
        return 'ok';
      }
      return 'Corrupt payload structure';
    } catch {
      return 'Invalid JSON integrity';
    }
  }

  async restoreBackup(backupData: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(backupData);
      if (parsed.app !== 'RAWTYPE') throw new Error('Bukan file cadangan RAWTYPE yang valid');

      if (Array.isArray(parsed.manuscripts)) {
        for (const m of parsed.manuscripts) await this.idbPut('manuscripts', m);
      }
      if (Array.isArray(parsed.versions)) {
        for (const v of parsed.versions) await this.idbPut('manuscript_versions', v);
      }
      if (Array.isArray(parsed.notes)) {
        for (const n of parsed.notes) await this.idbPut('notes', n);
      }
      if (Array.isArray(parsed.dictionary)) {
        for (const d of parsed.dictionary) await this.idbPut('dictionary', d);
      }
      if (parsed.vaultMeta) {
        await this.idbPut('vault_metadata', parsed.vaultMeta);
      }
      if (Array.isArray(parsed.encryptedVault)) {
        for (const ev of parsed.encryptedVault) await this.idbPut('encrypted_vault', ev);
      }

      return true;
    } catch {
      return false;
    }
  }

  // Crash Recovery Journal
  async writeRecoveryJournal(entry: RecoveryJournalEntry): Promise<void> {
    await this.idbPut('recovery_journal', entry);
    globalCache.setEditorBuffer(entry.doc_id, entry.content);
  }

  async getRecoveryJournal(): Promise<RecoveryJournalEntry | null> {
    const all = await this.idbGetAll<RecoveryJournalEntry>('recovery_journal');
    if (all.length === 0) return null;
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }

  async clearRecoveryJournal(): Promise<void> {
    await this.idbClear('recovery_journal');
  }

  // Cache & Storage Management
  async getCacheUsage(): Promise<CacheUsageStats> {
    return await globalCache.calculateUsage();
  }

  async clearCache(cacheType?: string): Promise<void> {
    await globalCache.purgeCache(cacheType);
  }

  // Dashboard Stats & Global Search
  async getDashboardStats(): Promise<DashboardStats> {
    const manuscripts = await this.listManuscripts(false);
    const notes = await this.listNotes(undefined, false, true);

    const totalWords = manuscripts.reduce(
      (sum, m) => sum + (m.refined_content || '').split(/\s+/).filter(Boolean).length,
      0
    );
    const unclassified = notes.filter((n) => n.category_id === 'cat_unclass').length;
    const pinned = notes.filter((n) => n.pinned).length;
    const sensitive = notes.filter((n) => n.sensitive).length;

    return {
      total_manuscripts: manuscripts.length,
      total_words: totalWords,
      total_notes: notes.length,
      total_categorized_notes: notes.length - unclassified,
      unclassified_notes: unclassified,
      pinned_notes: pinned,
      sensitive_notes_count: sensitive,
      recent_manuscripts: manuscripts.slice(0, 5),
      recent_notes: notes.slice(0, 6),
    };
  }

  async globalSearch(query: string): Promise<SearchResultItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const cached = globalCache.getSearchCache(q);
    if (cached) return cached;

    const results: SearchResultItem[] = [];
    const manuscripts = await this.listManuscripts(false);
    for (const m of manuscripts) {
      if (m.title.toLowerCase().includes(q) || (m.refined_content || '').toLowerCase().includes(q)) {
        results.push({
          item_type: 'manuscript',
          id: m.id,
          title: m.title,
          category: m.category,
          snippet: (m.refined_content || '').slice(0, 100) + '...',
          updated_at: m.updated_at,
        });
      }
    }

    const notes = await this.listNotes(undefined, false, this.vault.isUnlocked());
    for (const n of notes) {
      if (n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)) {
        results.push({
          item_type: 'note',
          id: n.id,
          title: n.title,
          category: n.category_name || 'Catatan',
          snippet: n.content.slice(0, 100) + '...',
          updated_at: n.updated_at,
        });
      }
    }

    globalCache.setSearchCache(q, results);
    return results;
  }
}
