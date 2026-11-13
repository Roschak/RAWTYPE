import { invoke as tauriInvoke } from '@tauri-apps/api/core';
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
import { globalCache } from '../cache';

export class DesktopSQLiteAdapter implements StorageAdapter {
  readonly name = 'DesktopSQLiteAdapter';
  readonly storageEngine = 'SQLite (Native Desktop)';

  async initialize(): Promise<void> {
    // Desktop SQLite database is initialized by Rust Tauri setup()
  }

  // Manuscripts
  async listManuscripts(includeArchived = false): Promise<Manuscript[]> {
    return await tauriInvoke<Manuscript[]>('get_manuscripts', { includeArchived });
  }

  async getManuscript(id: string): Promise<Manuscript> {
    return await tauriInvoke<Manuscript>('get_manuscript', { id });
  }

  async createManuscript(title: string, author: string, category: string, content: string): Promise<Manuscript> {
    return await tauriInvoke<Manuscript>('create_manuscript', { title, author, category, content });
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
    return await tauriInvoke<Manuscript>('update_manuscript', {
      id,
      title,
      author,
      category,
      description,
      tags,
      refinedContent,
      createNewVersion,
    });
  }

  async deleteManuscript(id: string): Promise<void> {
    await tauriInvoke('delete_manuscript', { id });
  }

  async toggleArchiveManuscript(id: string): Promise<boolean> {
    return await tauriInvoke<boolean>('toggle_archive_manuscript', { id });
  }

  async getManuscriptVersions(id: string): Promise<ManuscriptVersion[]> {
    return await tauriInvoke<ManuscriptVersion[]>('get_manuscript_versions', { id });
  }

  async restoreManuscriptVersion(id: string, versionNumber: number): Promise<Manuscript> {
    return await tauriInvoke<Manuscript>('restore_manuscript_version', { id, versionNumber });
  }

  // Notes
  async listNotes(
    categoryId?: string,
    includeArchived = false,
    includeSensitive = false,
    searchQuery?: string
  ): Promise<Note[]> {
    return await tauriInvoke<Note[]>('get_notes', {
      categoryId: categoryId || null,
      includeArchived,
      includeSensitive,
      searchQuery: searchQuery || null,
    });
  }

  async getNote(id: string): Promise<Note> {
    return await tauriInvoke<Note>('get_note', { id });
  }

  async createNote(
    title: string,
    content: string,
    categoryId: string,
    tags: string,
    source: string,
    sensitive: boolean
  ): Promise<Note> {
    return await tauriInvoke<Note>('create_note', {
      title,
      content,
      categoryId,
      tags,
      source,
      sensitive,
    });
  }

  async updateNote(
    id: string,
    title: string,
    content: string,
    categoryId: string,
    tags: string,
    sensitive: boolean
  ): Promise<Note> {
    return await tauriInvoke<Note>('update_note', {
      id,
      title,
      content,
      categoryId,
      tags,
      sensitive,
    });
  }

  async deleteNote(id: string): Promise<void> {
    await tauriInvoke('delete_note', { id });
  }

  async togglePinNote(id: string): Promise<boolean> {
    return await tauriInvoke<boolean>('toggle_pin_note', { id });
  }

  async toggleArchiveNote(id: string): Promise<boolean> {
    return await tauriInvoke<boolean>('toggle_archive_note', { id });
  }

  async listCategories(): Promise<NoteCategory[]> {
    return await tauriInvoke<NoteCategory[]>('get_note_categories');
  }

  async batchImportNotes(items: NoteImportItem[], skipDuplicates: boolean): Promise<ImportSummary> {
    return await tauriInvoke<ImportSummary>('batch_import_notes', { items, skipDuplicates });
  }

  // Dictionary
  async listDictionaryEntries(): Promise<DictionaryEntry[]> {
    return await tauriInvoke<DictionaryEntry[]>('get_dictionary_entries');
  }

  async addDictionaryEntry(
    word: string,
    definition: string,
    category: string,
    protectedWord: boolean,
    ignored: boolean
  ): Promise<DictionaryEntry> {
    return await tauriInvoke<DictionaryEntry>('add_dictionary_entry', {
      word,
      definition,
      category,
      protected: protectedWord,
      ignored,
    });
  }

  async deleteDictionaryEntry(id: string): Promise<void> {
    await tauriInvoke('delete_dictionary_entry', { id });
  }

  // Vault
  async getVaultStatus(): Promise<VaultStatus> {
    return await tauriInvoke<VaultStatus>('get_vault_status');
  }

  async initializeVault(masterPassword: string): Promise<void> {
    await tauriInvoke('initialize_vault', { masterPassword });
  }

  async unlockVault(masterPassword: string): Promise<boolean> {
    return await tauriInvoke<boolean>('unlock_vault', { masterPassword });
  }

  async lockVault(): Promise<void> {
    await tauriInvoke('lock_vault');
  }

  async listVaultItems(): Promise<DecryptedVaultItem[]> {
    return await tauriInvoke<DecryptedVaultItem[]>('get_vault_items');
  }

  async saveVaultItem(
    id: string | null,
    title: string,
    content: string,
    category: string,
    tags: string
  ): Promise<DecryptedVaultItem> {
    return await tauriInvoke<DecryptedVaultItem>('save_vault_item', {
      id,
      title,
      content,
      category,
      tags,
    });
  }

  async deleteVaultItem(id: string): Promise<void> {
    await tauriInvoke('delete_vault_item', { id });
  }

  // Backup & Recovery
  async createBackup(backupType = 'manual'): Promise<BackupRecord> {
    return await tauriInvoke<BackupRecord>('create_backup', { backupType });
  }

  async listBackups(): Promise<BackupRecord[]> {
    return await tauriInvoke<BackupRecord[]>('get_backup_history');
  }

  async verifyBackup(_backupPath: string): Promise<string> {
    return 'ok';
  }

  async restoreBackup(_backupData: string): Promise<boolean> {
    return true;
  }

  // Crash Recovery Journal
  async writeRecoveryJournal(entry: RecoveryJournalEntry): Promise<void> {
    globalCache.setEditorBuffer(entry.doc_id, entry.content);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('RAWTYPE_RECOVERY_JOURNAL', JSON.stringify(entry));
    }
  }

  async getRecoveryJournal(): Promise<RecoveryJournalEntry | null> {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem('RAWTYPE_RECOVERY_JOURNAL');
      if (data) {
        try {
          return JSON.parse(data);
        } catch {}
      }
    }
    return null;
  }

  async clearRecoveryJournal(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('RAWTYPE_RECOVERY_JOURNAL');
    }
  }

  // Cache & Storage Management
  async getCacheUsage(): Promise<CacheUsageStats> {
    return await globalCache.calculateUsage();
  }

  async clearCache(cacheType?: string): Promise<void> {
    await globalCache.purgeCache(cacheType);
  }

  // Stats & Global Search
  async getDashboardStats(): Promise<DashboardStats> {
    return await tauriInvoke<DashboardStats>('get_dashboard_stats');
  }

  async globalSearch(query: string): Promise<SearchResultItem[]> {
    return await tauriInvoke<SearchResultItem[]>('global_search', { query });
  }
}
