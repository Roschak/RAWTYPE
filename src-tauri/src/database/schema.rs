pub const INIT_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS manuscripts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Novel',
    description TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '',
    original_content TEXT NOT NULL DEFAULT '',
    refined_content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS manuscript_versions (
    id TEXT PRIMARY KEY,
    manuscript_id TEXT NOT NULL,
    content TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (manuscript_id) REFERENCES manuscripts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS corrections (
    id TEXT PRIMARY KEY,
    manuscript_id TEXT NOT NULL,
    rule_id TEXT NOT NULL,
    correction_type TEXT NOT NULL,
    original_text TEXT NOT NULL,
    proposed_text TEXT NOT NULL,
    confidence TEXT NOT NULL,
    accepted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS note_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#6366f1',
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category_id TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0,
    pinned INTEGER NOT NULL DEFAULT 0,
    sensitive INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES note_categories(id)
);

CREATE TABLE IF NOT EXISTS classification_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL,
    keywords TEXT NOT NULL,
    regex_pattern TEXT NOT NULL DEFAULT '',
    priority INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    case_sensitive INTEGER NOT NULL DEFAULT 0,
    match_mode TEXT NOT NULL DEFAULT 'contains',
    FOREIGN KEY (category_id) REFERENCES note_categories(id)
);

CREATE TABLE IF NOT EXISTS dictionary_entries (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    definition TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Custom',
    protected INTEGER NOT NULL DEFAULT 1,
    ignored INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS import_history (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    imported_at TEXT NOT NULL,
    total_items INTEGER NOT NULL,
    successful_items INTEGER NOT NULL,
    failed_items INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_history (
    id TEXT PRIMARY KEY,
    backup_path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    backup_type TEXT NOT NULL,
    integrity_status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vault_metadata (
    id TEXT PRIMARY KEY,
    salt TEXT NOT NULL,
    kdf_parameters TEXT NOT NULL,
    encryption_version TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS encrypted_vault_entries (
    id TEXT PRIMARY KEY,
    encrypted_payload TEXT NOT NULL,
    nonce TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category_id);
CREATE INDEX IF NOT EXISTS idx_notes_archived ON notes(archived);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(pinned);
CREATE INDEX IF NOT EXISTS idx_notes_sensitive ON notes(sensitive);
CREATE INDEX IF NOT EXISTS idx_manuscripts_archived ON manuscripts(archived);
CREATE INDEX IF NOT EXISTS idx_manuscript_versions ON manuscript_versions(manuscript_id);
"#;

pub const DEFAULT_CATEGORIES: &[(&str, &str, &str, &str, i32)] = &[
    ("cat_cred", "Password / Credentials", "Kata sandi, token, dan akun kredensial", "#ef4444", 100),
    ("cat_personal", "Personal Information", "Data pribadi, identitas, kontak", "#f97316", 90),
    ("cat_project", "Project Notes", "Catatan proyek, arsitektur, dan backlog", "#3b82f6", 80),
    ("cat_tech", "Technical Notes", "Snippet kode, konfigurasi server, docs", "#06b6d4", 75),
    ("cat_meeting", "Meeting Notes", "Notulen rapat, agenda, diskusi", "#8b5cf6", 70),
    ("cat_todo", "Tasks / TODO", "Daftar pekerjaan, checklist, deadline", "#10b981", 65),
    ("cat_financial", "Financial Notes", "Tagihan, invoice, anggaran, pengeluaran", "#eab308", 60),
    ("cat_important", "Important Notes", "Catatan prioritas tinggi yang perlu diingat", "#ec4899", 50),
    ("cat_general", "General Notes", "Catatan umum sehari-hari", "#64748b", 20),
    ("cat_unclass", "Unclassified", "Catatan belum terorganisir", "#475569", 0),
];

pub const DEFAULT_RULES: &[(&str, &str, &str, &str, &str, i32)] = &[
    ("rule_pwd", "Deteksi Kredensial", "cat_cred", "pw,pwd,password,passwd,pass,kata sandi,sandi,credential,credentials,secret,api_key,token", "", 100),
    ("rule_todo", "Deteksi TODO & Tugas", "cat_todo", "todo,tugas,task,deadline,checklist,target,jadwal", "", 70),
    ("rule_meet", "Deteksi Rapat & Notulen", "cat_meeting", "meeting,rapat,notulen,agenda,hadir,pembahasan", "", 75),
    ("rule_proj", "Deteksi Proyek", "cat_project", "project,proyek,development,repository,roadmap,milestone", "", 60),
    ("rule_fin", "Deteksi Keuangan", "cat_financial", "keuangan,invoice,pembayaran,budget,biaya,rekening,transfer,tagihan", "", 80),
    ("rule_tech", "Deteksi Teknis", "cat_tech", "curl,http,docker,sql,git,api,ssh,port,database,linux,config", "", 65),
];
