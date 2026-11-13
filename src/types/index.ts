export interface Manuscript {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  tags: string;
  original_content: string;
  refined_content: string;
  created_at: string;
  updated_at: string;
  version_number: number;
  archived: boolean;
}

export interface ManuscriptVersion {
  id: string;
  manuscript_id: string;
  content: string;
  version_number: number;
  created_at: string;
}

export interface CorrectionRecord {
  id: string;
  manuscript_id: string;
  rule_id: string;
  correction_type: 'capitalization' | 'punctuation' | 'spelling' | 'dialogue' | 'whitespace';
  original_text: string;
  proposed_text: string;
  confidence: 'high' | 'medium' | 'low';
  accepted: boolean;
  created_at: string;
}

export interface RefinementOptions {
  mode: 'safe' | 'standard' | 'strict_review' | 'custom';
  fix_capitalization: boolean;
  fix_punctuation: boolean;
  fix_spelling: boolean;
  fix_dialogue: boolean;
  fix_whitespace: boolean;
}

export interface RefinementResult {
  original_text: string;
  refined_text: string;
  corrections: CorrectionRecord[];
}

export interface NoteCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  priority: number;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category_id: string;
  category_name?: string;
  category_color?: string;
  tags: string;
  source: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
  pinned: boolean;
  sensitive: boolean;
}

export interface NoteImportItem {
  title: string;
  content: string;
  source: string;
}

export interface ImportSummary {
  total: number;
  imported: number;
  duplicates: number;
  sensitive_detected: number;
}

export interface ClassificationResult {
  category_id: string;
  category_name: string;
  confidence: number;
  matched_rule?: string;
  is_sensitive: boolean;
}

export interface VaultStatus {
  is_initialized: boolean;
  is_unlocked: boolean;
}

export interface DecryptedVaultItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface DictionaryEntry {
  id: string;
  word: string;
  definition: string;
  category: string;
  protected: boolean;
  ignored: boolean;
}

export interface BackupRecord {
  id: string;
  backup_path: string;
  created_at: string;
  backup_type: string;
  integrity_status: string;
}

export interface DashboardStats {
  total_manuscripts: number;
  total_words: number;
  total_notes: number;
  total_categorized_notes: number;
  unclassified_notes: number;
  pinned_notes: number;
  sensitive_notes_count: number;
  recent_manuscripts: Manuscript[];
  recent_notes: Note[];
}

export interface SearchResultItem {
  item_type: 'manuscript' | 'note';
  id: string;
  title: string;
  category: string;
  snippet: string;
  updated_at: string;
}

export interface RecoveryJournalEntry {
  doc_id: string;
  doc_type: 'manuscript' | 'note';
  title: string;
  content: string;
  timestamp: string;
}

export interface CacheUsageStats {
  applicationCacheBytes: number;
  editorBufferBytes: number;
  searchIndexBytes: number;
  dictionaryCacheBytes: number;
  thumbnailCacheBytes: number;
  sessionCacheBytes: number;
  totalBytes: number;
  lastCleaned?: string;
}

export interface PlatformInfo {
  isDesktop: boolean;
  isWeb: boolean;
  isPWA: boolean;
  platformName: string;
  storageEngine: 'SQLite (Native Desktop)' | 'IndexedDB (Browser Local-First)' | 'OPFS/Memory';
  offlineReady: boolean;
}
