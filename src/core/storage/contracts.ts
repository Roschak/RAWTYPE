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

export interface StorageAdapter {
  readonly name: string;
  readonly storageEngine: string;

  initialize(): Promise<void>;

  // Manuscripts
  listManuscripts(includeArchived?: boolean): Promise<Manuscript[]>;
  getManuscript(id: string): Promise<Manuscript>;
  createManuscript(title: string, author: string, category: string, content: string): Promise<Manuscript>;
  updateManuscript(
    id: string,
    title: string,
    author: string,
    category: string,
    description: string,
    tags: string,
    refinedContent: string,
    createNewVersion: boolean
  ): Promise<Manuscript>;
  deleteManuscript(id: string): Promise<void>;
  toggleArchiveManuscript(id: string): Promise<boolean>;
  getManuscriptVersions(id: string): Promise<ManuscriptVersion[]>;
  restoreManuscriptVersion(id: string, versionNumber: number): Promise<Manuscript>;

  // Notes
  listNotes(categoryId?: string, includeArchived?: boolean, includeSensitive?: boolean, searchQuery?: string): Promise<Note[]>;
  getNote(id: string): Promise<Note>;
  createNote(title: string, content: string, categoryId: string, tags: string, source: string, sensitive: boolean): Promise<Note>;
  updateNote(id: string, title: string, content: string, categoryId: string, tags: string, sensitive: boolean): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  togglePinNote(id: string): Promise<boolean>;
  toggleArchiveNote(id: string): Promise<boolean>;
  listCategories(): Promise<NoteCategory[]>;
  batchImportNotes(items: NoteImportItem[], skipDuplicates: boolean): Promise<ImportSummary>;

  // Dictionary
  listDictionaryEntries(): Promise<DictionaryEntry[]>;
  addDictionaryEntry(word: string, definition: string, category: string, protectedWord: boolean, ignored: boolean): Promise<DictionaryEntry>;
  deleteDictionaryEntry(id: string): Promise<void>;

  // Encrypted Vault
  getVaultStatus(): Promise<VaultStatus>;
  initializeVault(masterPassword: string): Promise<void>;
  unlockVault(masterPassword: string): Promise<boolean>;
  lockVault(): Promise<void>;
  listVaultItems(): Promise<DecryptedVaultItem[]>;
  saveVaultItem(id: string | null, title: string, content: string, category: string, tags: string): Promise<DecryptedVaultItem>;
  deleteVaultItem(id: string): Promise<void>;

  // Backup & Recovery
  createBackup(backupType?: string): Promise<BackupRecord>;
  listBackups(): Promise<BackupRecord[]>;
  verifyBackup(backupPath: string): Promise<string>;
  restoreBackup(backupData: string): Promise<boolean>;

  // Recovery Journal (Autosave & Crash Recovery)
  writeRecoveryJournal(entry: RecoveryJournalEntry): Promise<void>;
  getRecoveryJournal(): Promise<RecoveryJournalEntry | null>;
  clearRecoveryJournal(): Promise<void>;

  // Cache & Storage Management
  getCacheUsage(): Promise<CacheUsageStats>;
  clearCache(cacheType?: string): Promise<void>;

  // Stats & Global Search
  getDashboardStats(): Promise<DashboardStats>;
  globalSearch(query: string): Promise<SearchResultItem[]>;
}
