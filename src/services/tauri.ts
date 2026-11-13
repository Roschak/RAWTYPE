import { getStorageAdapter, getPlatformInfo, isDesktopTauri } from '../core/storage/storageFactory';
import { refineTextShared } from '../core/refinement';
import { classifyNoteShared } from '../core/classification';
import {
  Manuscript,
  ManuscriptVersion,
  RefinementOptions,
  RefinementResult,
  Note,
  NoteCategory,
  NoteImportItem,
  ImportSummary,
  ClassificationResult,
  VaultStatus,
  DecryptedVaultItem,
  DictionaryEntry,
  BackupRecord,
  DashboardStats,
  SearchResultItem,
  RecoveryJournalEntry,
  CacheUsageStats,
  PlatformInfo,
} from '../types';

export const api = {
  getPlatformInfo(): PlatformInfo {
    return getPlatformInfo();
  },

  // Manuscripts
  async getManuscripts(includeArchived = false): Promise<Manuscript[]> {
    const storage = await getStorageAdapter();
    return await storage.listManuscripts(includeArchived);
  },

  async getManuscript(id: string): Promise<Manuscript> {
    const storage = await getStorageAdapter();
    return await storage.getManuscript(id);
  },

  async createManuscript(title: string, author: string, category: string, content: string): Promise<Manuscript> {
    const storage = await getStorageAdapter();
    return await storage.createManuscript(title, author, category, content);
  },

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
    const storage = await getStorageAdapter();
    return await storage.updateManuscript(
      id,
      title,
      author,
      category,
      description,
      tags,
      refinedContent,
      createNewVersion
    );
  },

  async deleteManuscript(id: string): Promise<void> {
    const storage = await getStorageAdapter();
    await storage.deleteManuscript(id);
  },

  async toggleArchiveManuscript(id: string): Promise<boolean> {
    const storage = await getStorageAdapter();
    return await storage.toggleArchiveManuscript(id);
  },

  async getManuscriptVersions(id: string): Promise<ManuscriptVersion[]> {
    const storage = await getStorageAdapter();
    return await storage.getManuscriptVersions(id);
  },

  async restoreManuscriptVersion(id: string, versionNumber: number): Promise<Manuscript> {
    const storage = await getStorageAdapter();
    return await storage.restoreManuscriptVersion(id, versionNumber);
  },

  async refineManuscript(manuscriptId: string, rawText: string, options: RefinementOptions): Promise<RefinementResult> {
    const storage = await getStorageAdapter();
    const dict = await storage.listDictionaryEntries();
    const protectedWords = new Set<string>();
    const ignoredWords = new Set<string>();

    for (const d of dict) {
      if (d.protected) {
        protectedWords.add(d.word);
        protectedWords.add(d.word.toLowerCase());
      }
      if (d.ignored) {
        ignoredWords.add(d.word);
        ignoredWords.add(d.word.toLowerCase());
      }
    }

    return refineTextShared(manuscriptId, rawText, options, protectedWords, ignoredWords);
  },

  // Notes
  async getNotes(categoryId?: string, includeArchived = false, includeSensitive = false, searchQuery?: string): Promise<Note[]> {
    const storage = await getStorageAdapter();
    return await storage.listNotes(categoryId, includeArchived, includeSensitive, searchQuery);
  },

  async getNote(id: string): Promise<Note> {
    const storage = await getStorageAdapter();
    return await storage.getNote(id);
  },

  async createNote(title: string, content: string, categoryId: string, tags: string, source: string, sensitive: boolean): Promise<Note> {
    const storage = await getStorageAdapter();
    return await storage.createNote(title, content, categoryId, tags, source, sensitive);
  },

  async updateNote(id: string, title: string, content: string, categoryId: string, tags: string, sensitive: boolean): Promise<Note> {
    const storage = await getStorageAdapter();
    return await storage.updateNote(id, title, content, categoryId, tags, sensitive);
  },

  async deleteNote(id: string): Promise<void> {
    const storage = await getStorageAdapter();
    await storage.deleteNote(id);
  },

  async togglePinNote(id: string): Promise<boolean> {
    const storage = await getStorageAdapter();
    return await storage.togglePinNote(id);
  },

  async toggleArchiveNote(id: string): Promise<boolean> {
    const storage = await getStorageAdapter();
    return await storage.toggleArchiveNote(id);
  },

  async getNoteCategories(): Promise<NoteCategory[]> {
    const storage = await getStorageAdapter();
    return await storage.listCategories();
  },

  async classifyNoteContent(title: string, content: string): Promise<ClassificationResult> {
    return classifyNoteShared(title, content);
  },

  async batchImportNotes(items: NoteImportItem[], skipDuplicates: boolean): Promise<ImportSummary> {
    const storage = await getStorageAdapter();
    return await storage.batchImportNotes(items, skipDuplicates);
  },

  // Vault
  async getVaultStatus(): Promise<VaultStatus> {
    const storage = await getStorageAdapter();
    return await storage.getVaultStatus();
  },

  async initializeVault(masterPassword: string): Promise<void> {
    const storage = await getStorageAdapter();
    await storage.initializeVault(masterPassword);
  },

  async unlockVault(masterPassword: string): Promise<boolean> {
    const storage = await getStorageAdapter();
    return await storage.unlockVault(masterPassword);
  },

  async lockVault(): Promise<void> {
    const storage = await getStorageAdapter();
    await storage.lockVault();
  },

  async getVaultItems(): Promise<DecryptedVaultItem[]> {
    const storage = await getStorageAdapter();
    return await storage.listVaultItems();
  },

  async saveVaultItem(id: string | null, title: string, content: string, category: string, tags: string): Promise<DecryptedVaultItem> {
    const storage = await getStorageAdapter();
    return await storage.saveVaultItem(id, title, content, category, tags);
  },

  async deleteVaultItem(id: string): Promise<void> {
    const storage = await getStorageAdapter();
    await storage.deleteVaultItem(id);
  },

  // Dictionary
  async getDictionaryEntries(): Promise<DictionaryEntry[]> {
    const storage = await getStorageAdapter();
    return await storage.listDictionaryEntries();
  },

  async addDictionaryEntry(word: string, definition: string, category: string, protectedWord: boolean, ignored: boolean): Promise<DictionaryEntry> {
    const storage = await getStorageAdapter();
    return await storage.addDictionaryEntry(word, definition, category, protectedWord, ignored);
  },

  async deleteDictionaryEntry(id: string): Promise<void> {
    const storage = await getStorageAdapter();
    await storage.deleteDictionaryEntry(id);
  },

  // Backup & Recovery
  async createBackup(backupType = 'manual'): Promise<BackupRecord> {
    const storage = await getStorageAdapter();
    return await storage.createBackup(backupType);
  },

  async getBackupHistory(): Promise<BackupRecord[]> {
    const storage = await getStorageAdapter();
    return await storage.listBackups();
  },

  async verifyBackup(backupPath: string): Promise<string> {
    const storage = await getStorageAdapter();
    return await storage.verifyBackup(backupPath);
  },

  async restoreBackup(backupData: string): Promise<boolean> {
    const storage = await getStorageAdapter();
    return await storage.restoreBackup(backupData);
  },

  // Crash Recovery Journal & Buffer
  async writeRecoveryJournal(entry: RecoveryJournalEntry): Promise<void> {
    const storage = await getStorageAdapter();
    await storage.writeRecoveryJournal(entry);
  },

  async getRecoveryJournal(): Promise<RecoveryJournalEntry | null> {
    const storage = await getStorageAdapter();
    return await storage.getRecoveryJournal();
  },

  async clearRecoveryJournal(): Promise<void> {
    const storage = await getStorageAdapter();
    await storage.clearRecoveryJournal();
  },

  // Cache & Storage Management
  async getCacheUsage(): Promise<CacheUsageStats> {
    const storage = await getStorageAdapter();
    return await storage.getCacheUsage();
  },

  async clearCache(cacheType?: string): Promise<void> {
    const storage = await getStorageAdapter();
    await storage.clearCache(cacheType);
  },

  // Dashboard & Search
  async getDashboardStats(): Promise<DashboardStats> {
    const storage = await getStorageAdapter();
    return await storage.getDashboardStats();
  },

  async globalSearch(query: string): Promise<SearchResultItem[]> {
    const storage = await getStorageAdapter();
    return await storage.globalSearch(query);
  },
};
