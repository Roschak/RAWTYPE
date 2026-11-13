# MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)
# RAWTYPE — OFFLINE WRITING STUDIO & PERSONAL KNOWLEDGE VAULT

**Project Code:** PROJECT-RAWTYPE  
**Product Name:** RAWTYPE  
**Product Type:** Desktop Application  
**Version:** 1.0.0  
**Primary Language:** Indonesian  
**Architecture:** Local-First, Offline-Capable  
**Text Processing:** Deterministic Rule-Based Engine  
**Generative AI:** PROHIBITED  
**External AI API:** PROHIBITED  
**Primary Platform:** Windows  
**Future Platforms:** macOS, Linux

---

# 00. MASTER EXECUTION DIRECTIVE

This document is the authoritative specification for PROJECT-RAWTYPE.

The coding agent MUST read and understand the complete PRD before implementation.

The coding agent MUST implement the entire application, not merely generate a technical plan.

The coding agent MUST follow the dependency order defined in this document.

The coding agent MUST preserve all existing working functionality when modifying an existing repository.

The coding agent MUST NOT silently omit requirements.

The coding agent MUST NOT claim functionality is complete without implementation and verification.

The coding agent MUST NOT introduce generative AI, AI APIs, AI services, or AI-based rewriting into the application.

The coding agent MUST prioritize data integrity, user privacy, original-text preservation, and maintainability.

If a requirement cannot be implemented automatically, the agent MUST:

1. Explain the limitation.
2. Identify the affected requirement.
3. Explain the technical reason.
4. Implement any feasible alternative.
5. Add the remaining task to HUMAN REQUIRED TASKS.
6. Continue implementing other requirements.

Do not stop the project because one requirement needs human intervention.

---

# 01. PRODUCT VISION

RAWTYPE is a private, offline-first writing and personal information management application.

The application combines:

1. RAW Manuscript Editor.
2. Rule-Based Manuscript Refinement Engine.
3. Manuscript Library.
4. Personal Notes Organizer.
5. Rule-Based Note Classification Engine.
6. Sensitive Information Vault.
7. Keyword Search & Filtering.
8. Local Dictionary.
9. Change Tracking.
10. Version History.
11. Backup & Recovery.
12. Document Import & Export.

RAWTYPE is designed for users who prefer writing freely without worrying about formatting, punctuation, capitalization, or organizing scattered notes.

The user remains the sole creator of all written content.

RAWTYPE provides deterministic technical assistance.

RAWTYPE does not generate stories.

RAWTYPE does not create new ideas.

RAWTYPE does not invent content.

RAWTYPE does not replace the author's creative voice.

RAWTYPE does not use artificial intelligence.

---

# 02. PRODUCT OBJECTIVES

## 2.1 Writing Objectives

- Allow users to write RAW text.
- Automatically improve punctuation.
- Automatically improve capitalization.
- Correct supported spelling mistakes.
- Preserve original vocabulary.
- Preserve original meaning.
- Preserve paragraph structure.
- Provide a professional manuscript workspace.
- Allow users to review all corrections.
- Allow users to undo changes.
- Allow users to export manuscripts.

## 2.2 Notes Objectives

- Collect notes from multiple Notepad documents.
- Consolidate scattered information.
- Classify notes using configurable rules.
- Filter notes using keywords.
- Find important information quickly.
- Protect sensitive notes.
- Prevent accidental loss.
- Provide reliable backups.

## 2.3 Security Objectives

- Work completely offline.
- Store content locally.
- Encrypt sensitive information.
- Protect the application vault.
- Prevent accidental data loss.
- Avoid external transmission of manuscript content.
- Never send content to AI services.

## 2.4 Quality Objectives

- Maintainable source code.
- Readable architecture.
- Modular components.
- Reliable processing.
- Predictable behavior.
- Comprehensive testing.
- Easy debugging.
- Easy future development.

---

# 03. PRODUCT PRINCIPLES

## 3.1 Preservation First

Original content must remain recoverable.

The system must never permanently overwrite original manuscripts during refinement.

## 3.2 Deterministic Processing

The same input and configuration must produce the same output.

No randomness may influence text transformations.

## 3.3 No Generative Content

The system must not generate content that does not originate from the user.

## 3.4 Conservative Corrections

If the engine cannot confidently determine the correct transformation, preserve the text and mark it for review.

## 3.5 Local-First Privacy

All manuscripts, personal notes, and sensitive content must remain local.

## 3.6 Transparent Changes

Every modification must be explainable.

## 3.7 Recoverability

Deleted or modified content must have an appropriate recovery mechanism.

---

# 04. TECHNICAL STACK

## 4.1 Recommended Stack

Desktop Framework:
Tauri 2.

Frontend:
React + TypeScript.

Frontend Build:
Vite.

Backend:
Rust.

Database:
SQLite.

Styling:
CSS Modules or a consistent component styling architecture.

Editor:
A suitable editor framework supporting rich text, plain text, keyboard shortcuts, and document structure.

Document Export:
DOCX and PDF libraries compatible with the application architecture.

Cryptography:
Vetted Rust cryptographic libraries.

## 4.2 Architecture

The application must use a modular architecture.

Recommended structure:

src/
  app/
  components/
  layouts/
  pages/

  editor/
    components/
    hooks/
    services/

  manuscripts/
    components/
    services/
    repository/

  notes/
    components/
    services/
    repository/

  classification/
    rules/
    services/
    tests/

  vault/
    components/
    services/
    crypto/
    repository/

  dictionary/
    components/
    services/
    repository/

  search/
    components/
    services/

  backup/
    services/
    recovery/

  export/
    services/
    templates/

  settings/
    components/
    services/

src-tauri/
  src/
    commands/
    database/
    repositories/
    processing/
      normalization/
      segmentation/
      punctuation/
      capitalization/
      spelling/
      dialogue/
      paragraph/
      classification/
    security/
    backup/
    export/

  migrations/

The architecture must be adapted to the selected framework without unnecessary duplication.

---

# 05. APPLICATION NAVIGATION

Create the following primary navigation:

1. Dashboard.
2. Writing Studio.
3. Manuscripts.
4. Personal Notes.
5. Import Center.
6. Sensitive Vault.
7. Search.
8. Dictionary.
9. Backup & Recovery.
10. Settings.

Navigation must be consistent across the application.

The user must be able to access important modules without navigating through excessive menus.

---

# 06. DASHBOARD

## 6.1 Dashboard Overview

Display:

- Total manuscripts.
- Total words written.
- Total personal notes.
- Total categorized notes.
- Unclassified notes.
- Pinned notes.
- Sensitive notes.
- Recent manuscripts.
- Recently imported notes.
- Recent activity.

## 6.2 Quick Actions

Provide:

- New Manuscript.
- New Note.
- Import Notes.
- Open Writing Studio.
- Open Sensitive Vault.
- Search Everything.

## 6.3 Dashboard Restrictions

Do not display sensitive note content on the dashboard.

Do not display password values.

Sensitive information must remain hidden until the vault is unlocked.

---

# 07. WRITING STUDIO

## 7.1 Primary Objective

Provide a professional writing workspace for novels, short stories, theories, essays, and other long-form documents.

## 7.2 Editor Layout

Provide:

- RAW Input Editor.
- Refined Output Editor.
- Correction Review Panel.
- Document Information Panel.
- Optional formatting toolbar.

The editor must support:

- Plain text.
- Paragraphs.
- Multiple paragraphs.
- Unicode.
- Indonesian text.
- Mixed-language text.
- Existing punctuation.
- Long documents.

## 7.3 Writing Features

- Create manuscript.
- Edit manuscript.
- Save manuscript.
- Autosave.
- Undo.
- Redo.
- Word count.
- Character count.
- Sentence count.
- Paragraph count.
- Reading time estimate.
- Adjustable font size.
- Adjustable line height.
- Adjustable editor width.
- Focus mode.
- Distraction-free mode.
- Search within document.
- Replace text manually.

## 7.4 RAW Writing Workflow

1. User writes RAW text.
2. User selects Refine.
3. Processing engine analyzes the text.
4. Engine applies supported deterministic rules.
5. Engine generates refined output.
6. Engine records changes.
7. User reviews output.
8. User accepts or rejects corrections.
9. User saves the refined manuscript.

The original manuscript must remain recoverable.

---

# 08. RULE-BASED MANUSCRIPT REFINEMENT ENGINE

## 8.1 Core Requirement

The refinement engine must operate without AI.

The engine must use:

- Linguistic rules.
- Deterministic algorithms.
- Offline dictionaries.
- Explicit transformation rules.
- Text processing heuristics.
- User-defined rules.

## 8.2 Processing Pipeline

1. Input Acquisition.
2. Original Text Preservation.
3. Unicode Normalization.
4. Whitespace Analysis.
5. Paragraph Boundary Analysis.
6. Sentence Boundary Detection.
7. Punctuation Processing.
8. Capitalization Processing.
9. Spelling Correction.
10. Dialogue Processing.
11. Ambiguity Detection.
12. Change Tracking.
13. Output Generation.
14. Correction Review.

## 8.3 Capitalization

Support:

- Sentence-start capitalization.
- Existing punctuation preservation.
- Protected names.
- Protected acronyms.
- User-defined capitalization rules.

Do not blindly capitalize proper names.

## 8.4 Punctuation

Support:

- Period.
- Comma.
- Question mark.
- Exclamation mark.
- Colon.
- Semicolon.
- Quotation marks.
- Parentheses.

Rules:

- Insert punctuation only when justified.
- Avoid excessive commas.
- Avoid unnecessary exclamation marks.
- Preserve existing punctuation.
- Avoid introducing stylistic punctuation without evidence.

## 8.5 Sentence Segmentation

Use:

- Existing punctuation.
- Sentence structure heuristics.
- Indonesian linguistic patterns.
- Question patterns.
- Conjunction analysis.
- User-defined rules.

Conjunctions such as:

dan
tetapi
karena
sehingga
kemudian
lalu
ketika
meskipun

must not automatically trigger sentence splitting.

## 8.6 Spelling Correction

Use an offline Indonesian dictionary based on legally usable KBBI-compatible data.

Support:

- Common spelling mistakes.
- Common typo corrections.
- Word correction suggestions.
- User dictionary.
- Protected vocabulary.
- Ignore-word list.

Do not automatically replace uncertain vocabulary.

Do not automatically change fictional character names.

Do not automatically replace technical terminology.

## 8.7 Vocabulary Protection

Users can protect:

- Character names.
- Place names.
- Fictional terminology.
- Technical terminology.
- Special expressions.
- Foreign vocabulary.
- Custom words.

Protected vocabulary must not be automatically modified.

## 8.8 Dialogue Processing

Support conservative dialogue formatting.

Only apply automatic dialogue formatting when the structure is sufficiently clear.

Ambiguous dialogue must remain unchanged or be marked for review.

## 8.9 Processing Modes

SAFE MODE:

Only high-confidence corrections.

STANDARD MODE:

Apply conservative punctuation and capitalization rules.

STRICT REVIEW MODE:

Show proposed corrections without silently accepting uncertain transformations.

CUSTOM MODE:

Allow configurable correction behavior.

---

# 09. CORRECTION REVIEW SYSTEM

## 9.1 Objective

Provide complete transparency for every transformation.

## 9.2 Correction Records

Each correction must contain:

- Original text.
- Proposed text.
- Rule identifier.
- Correction category.
- Confidence classification.
- Processing timestamp.
- Acceptance status.

## 9.3 Correction Categories

- Punctuation.
- Capitalization.
- Spelling.
- Whitespace.
- Dialogue formatting.
- Paragraph formatting.

## 9.4 Review Features

- Highlight changed text.
- Compare original and refined output.
- Accept individual correction.
- Reject individual correction.
- Accept all safe corrections.
- Undo accepted correction.
- Restore original manuscript.

## 9.5 Ambiguous Corrections

Ambiguous transformations must never be silently applied.

The system must preserve original text.

---

# 10. MANUSCRIPT LIBRARY

## 10.1 Document Categories

- Novel.
- Short Story.
- Poetry.
- Theory.
- Essay.
- Article.
- Academic Writing.
- Personal Writing.
- Other.

## 10.2 Manuscript Management

- Create.
- Rename.
- Duplicate.
- Edit.
- Delete.
- Archive.
- Restore.
- Search.
- Sort.
- Export.
- Import.

## 10.3 Document Metadata

- Title.
- Author.
- Category.
- Description.
- Tags.
- Created date.
- Updated date.
- Word count.
- Version number.

## 10.4 Version History

Maintain version history.

Support:

- Previous versions.
- Version comparison.
- Restore version.
- Version creation timestamps.

Do not overwrite the only recoverable version.

---

# 11. PERSONAL NOTES ORGANIZER

## 11.1 Objective

Provide one central location for notes previously scattered across multiple Notepad tabs or text files.

The user must be able to copy entire Notepad contents into RAWTYPE and organize them.

## 11.2 Notes Features

- Create note.
- Edit note.
- Delete note.
- Archive note.
- Restore note.
- Pin note.
- Favorite note.
- Add tags.
- Change category.
- Merge notes.
- Split notes.
- Search notes.
- Filter notes.
- Import notes.

## 11.3 Notes Categories

Default categories:

1. Password / Credentials.
2. Personal Information.
3. Project Notes.
4. Technical Notes.
5. Meeting Notes.
6. Tasks / TODO.
7. Financial Notes.
8. Important Notes.
9. General Notes.
10. Unclassified.

Categories must be configurable.

Users can create custom categories.

## 11.4 Note Metadata

Each note must support:

- ID.
- Title.
- Content.
- Category.
- Tags.
- Source.
- Created date.
- Updated date.
- Import date.
- Archived status.
- Pinned status.
- Sensitive status.

---

# 12. NOTES IMPORT CENTER

## 12.1 Import Objective

Allow users to consolidate notes from various text sources.

## 12.2 Import Sources

- Clipboard.
- TXT.
- Markdown.
- Multiple text files.
- Existing RAWTYPE notes.
- Exported Notepad content.

## 12.3 Import Interface

Provide:

- Large text input.
- Paste button.
- File selection.
- Multi-file import.
- Preview.
- Source selection.
- Import confirmation.
- Duplicate detection.
- Import history.

## 12.4 Import Delimiters

Optional delimiters:

--- NOTE 01 ---
Content...

--- NOTE 02 ---
Content...

--- NOTE 03 ---
Content...

Support configurable note separators.

Do not assume every newline represents a new note.

## 12.5 Import Processing

1. User selects source.
2. System reads content.
3. System preserves original content.
4. System detects note boundaries.
5. System detects duplicates.
6. System performs classification.
7. System shows import preview.
8. User confirms.
9. System saves notes.
10. System records import history.

Do not silently discard content.

---

# 13. RULE-BASED NOTE CLASSIFICATION ENGINE

## 13.1 Objective

Automatically classify notes based on explicit rules.

No AI classification is permitted.

## 13.2 Classification Methods

- Exact keyword matching.
- Case-insensitive matching.
- Phrase matching.
- Regex matching.
- Prefix matching.
- Explicit user-defined rules.
- Deterministic scoring.

## 13.3 Default Keyword Rules

Password / Credentials:

- pw
- pwd
- password
- passwd
- pass
- kata sandi
- sandi
- credential
- credentials
- secret

Tasks / TODO:

- todo
- tugas
- task
- deadline
- checklist

Meeting Notes:

- meeting
- rapat
- notulen
- agenda

Project Notes:

- project
- proyek
- development
- repository

Financial Notes:

- keuangan
- invoice
- pembayaran
- budget

These are initial rules only.

Users must be able to modify them.

## 13.4 Classification Rules

Each rule supports:

- Rule ID.
- Rule name.
- Category.
- Keywords.
- Regex.
- Priority.
- Enabled status.
- Matching behavior.
- Exact or partial match.
- Case sensitivity.
- Confidence classification.

## 13.5 Classification Priority

Sensitive classifications must have higher priority than general classifications.

Example:

A note containing:

pw github: example-value
project github integration

must be classified as Sensitive if it contains credential information.

The system must not downgrade a sensitive classification because a general project keyword also exists.

## 13.6 Classification Preview

Before final import, display:

- Total detected notes.
- Password-related notes.
- Personal information notes.
- Project notes.
- Technical notes.
- Tasks.
- General notes.
- Unclassified notes.
- Duplicate notes.

Allow users to manually correct classification.

---

# 14. SENSITIVE INFORMATION VAULT

## 14.1 Objective

Provide a secure storage domain for sensitive personal information.

Sensitive information may include:

- Passwords.
- Credentials.
- API keys.
- Recovery codes.
- Private configuration.
- Personal identifiers.
- Confidential notes.

## 14.2 Vault Security

The vault must use authenticated encryption.

Recommended cryptography:

- AES-256-GCM.
- Argon2id.
- Secure random salts.
- Secure random nonces.
- Secure key derivation.
- Secure key handling.

Use vetted cryptographic libraries.

Never implement cryptographic primitives manually.

## 14.3 Vault Unlock

Features:

- Create vault.
- Set master password.
- Unlock vault.
- Lock vault.
- Change master password.
- Recovery workflow.
- Secure timeout.
- Failed unlock handling.

Do not use hardcoded vault credentials.

Do not store master passwords in plaintext.

## 14.4 Sensitive Note Storage

Sensitive note content must be encrypted at rest.

Sensitive notes must not appear in:

- Public dashboard.
- Unlocked search results when vault is locked.
- Debug logs.
- Error reports.
- Analytics.
- Plaintext backups.

## 14.5 Password Classification

When the classifier detects:

pw
password
passwd
credential
secret

the note may be suggested for the Sensitive Vault.

The user must be able to review the classification.

Never automatically expose detected passwords.

Never display password values in classification reports.

## 14.6 Vault Safety

Implement:

- Secure encryption.
- Vault lock.
- Recovery options.
- Encrypted backup.
- Sensitive note deletion confirmation.
- Secure handling of decrypted data in memory.

Important:

Deleting encrypted content does not guarantee secure physical erasure from SSDs or database remnants.

Use appropriate database and backup lifecycle controls.

---

# 15. GLOBAL SEARCH & FILTERING

## 15.1 Search Objective

Provide unified search across manuscripts and personal notes.

## 15.2 Search Scope

- Manuscripts.
- Personal notes.
- Categories.
- Tags.
- Dictionary.
- Titles.
- Content.

Sensitive vault content must remain inaccessible while locked.

## 15.3 Search Features

- Exact search.
- Case-insensitive search.
- Phrase search.
- Multiple keywords.
- Category filter.
- Date filter.
- Tag filter.
- Pinned filter.
- Archived filter.
- Sensitive filter.
- Source filter.

## 15.4 Search Results

Display:

- Title.
- Category.
- Tags.
- Matching text snippet.
- Last modified date.

Do not expose sensitive content snippets without vault authorization.

---

# 16. USER DICTIONARY

## 16.1 Objective

Allow users to protect special vocabulary from automatic correction.

## 16.2 Dictionary Entries

- Word.
- Definition.
- Category.
- Protected status.
- Ignore status.
- Case sensitivity.

## 16.3 Dictionary Categories

- Character.
- Place.
- Technical.
- Fictional.
- Foreign Language.
- Custom.

## 16.4 Dictionary Operations

- Add.
- Edit.
- Delete.
- Import.
- Export.
- Search.
- Protect.
- Ignore.

The dictionary must work offline.

---

# 17. BACKUP & RECOVERY

## 17.1 Objective

Prevent accidental loss of manuscripts and notes.

## 17.2 Backup Features

- Automatic backup.
- Manual backup.
- Backup scheduling.
- Backup history.
- Restore backup.
- Backup integrity verification.
- Backup location configuration.
- Encrypted sensitive backups.

## 17.3 Recovery Features

- Deleted note recovery.
- Deleted manuscript recovery.
- Previous manuscript versions.
- Import history.
- Recovery preview.
- Restore confirmation.

## 17.4 Backup Rules

Never overwrite the only backup automatically.

Never delete all recovery data without confirmation.

Never export sensitive information in plaintext without explicit user authorization and a clear warning.

---

# 18. IMPORT & EXPORT

## 18.1 Import

Supported:

- TXT.
- Markdown.
- DOCX.
- Clipboard.
- Multiple text files.

## 18.2 Export

Supported:

- TXT.
- Markdown.
- DOCX.
- PDF.

## 18.3 Export Requirements

- Preserve paragraph structure.
- Preserve document titles.
- Preserve basic formatting.
- Preserve Unicode.
- Preserve Indonesian characters.
- Provide export preview where appropriate.

Sensitive exports must require explicit authorization.

Encrypted vault backups must remain encrypted.

---

# 19. DATABASE DESIGN

Use SQLite.

Separate manuscript storage, notes storage, and encrypted vault storage logically.

Suggested tables:

## manuscripts

- id
- title
- author
- category
- description
- tags
- original_content
- refined_content
- created_at
- updated_at
- version_number
- archived

## manuscript_versions

- id
- manuscript_id
- content
- version_number
- created_at

## corrections

- id
- manuscript_id
- rule_id
- correction_type
- original_text
- proposed_text
- confidence
- accepted
- created_at

## notes

- id
- title
- content
- category_id
- tags
- source
- created_at
- updated_at
- archived
- pinned
- sensitive

## note_categories

- id
- name
- description
- color
- priority
- created_at

## classification_rules

- id
- name
- category_id
- keywords
- regex_pattern
- priority
- enabled
- case_sensitive
- match_mode

## dictionary_entries

- id
- word
- definition
- category
- protected
- ignored

## import_history

- id
- source
- imported_at
- total_items
- successful_items
- failed_items

## backup_history

- id
- backup_path
- created_at
- backup_type
- integrity_status

## vault_metadata

- id
- salt
- kdf_parameters
- encryption_version
- created_at

## encrypted_vault_entries

- id
- encrypted_payload
- nonce
- category
- created_at
- updated_at

Sensitive information must never be stored in plaintext database fields.

Use appropriate indexes, constraints, migrations, and foreign keys.

---

# 20. UI/UX DESIGN SYSTEM

## 20.1 Design Direction

Create a premium writing application.

Design characteristics:

- Minimalist.
- Distraction-free.
- Professional.
- Comfortable for long writing sessions.
- High readability.
- Consistent spacing.
- Consistent typography.
- Calm visual hierarchy.

## 20.2 Main Workspace

The Writing Studio must prioritize text.

Avoid:

- Excessive animations.
- Distracting colors.
- Overloaded toolbars.
- Unnecessary cards.
- Excessive modals.
- Complicated navigation.

## 20.3 Notes Workspace

Use a structured notes interface.

Provide:

- Category sidebar.
- Notes list.
- Main editor.
- Search.
- Filter controls.
- Tag management.

## 20.4 Sensitive Vault UI

Sensitive Vault must visually communicate locked and unlocked states.

Locked state:

- Hide note contents.
- Hide password values.
- Hide sensitive snippets.
- Display unlock controls.

Unlocked state:

- Show authorized content.
- Provide lock action.
- Maintain secure timeout.

---

# 21. SECURITY & PRIVACY

## 21.1 Privacy

The application must not transmit:

- Manuscripts.
- Personal notes.
- Passwords.
- Credentials.
- API keys.
- Vault contents.

## 21.2 Network Restrictions

All core functionality must work without internet.

Do not introduce mandatory cloud services.

Do not introduce external AI APIs.

## 21.3 Security Requirements

- Input validation.
- Secure database access.
- Safe file handling.
- Secure import processing.
- Secure export processing.
- Encrypted vault.
- Encrypted sensitive backups.
- No plaintext credential logging.
- No sensitive telemetry.
- Secure key handling.

---

# 22. TESTING & QUALITY ASSURANCE

## 22.1 Unit Tests

Test:

- Text normalization.
- Sentence segmentation.
- Punctuation.
- Capitalization.
- Spelling.
- Classification.
- Keyword detection.
- Regex rules.
- Protected vocabulary.
- Duplicate detection.
- Backup validation.
- Encryption.
- Decryption.

## 22.2 Integration Tests

Test:

- Manuscript saving.
- Manuscript loading.
- Version history.
- Notes import.
- Notes classification.
- Vault creation.
- Vault unlocking.
- Sensitive note storage.
- Backup.
- Restore.
- Export.

## 22.3 Regression Tests

Ensure previously correct text is not unnecessarily changed.

Ensure existing notes are not silently deleted.

Ensure sensitive information never appears in plaintext logs.

## 22.4 Acceptance Criteria

The project is complete when:

- The application builds.
- The application launches.
- The application works offline.
- Manuscripts can be created.
- Manuscripts can be refined.
- Manuscripts can be saved.
- Manuscripts can be restored.
- Notes can be imported.
- Notes can be classified.
- Password keywords can be detected.
- Notes can be searched.
- Categories can be managed.
- Sensitive vault can be unlocked.
- Sensitive notes are encrypted.
- Backups work.
- Restore works.
- Exports work.
- No AI is integrated.
- Automated tests pass.
- Critical errors are resolved.

---

# 23. IMPLEMENTATION PHASES

## PHASE 01 — PROJECT FOUNDATION

- Inspect repository.
- Identify existing stack.
- Configure Tauri.
- Configure React.
- Configure TypeScript.
- Configure Rust.
- Configure SQLite.
- Configure migrations.
- Establish architecture.
- Establish design system.

## PHASE 02 — DATABASE FOUNDATION

- Manuscript schema.
- Notes schema.
- Category schema.
- Dictionary schema.
- Version schema.
- Backup schema.
- Migration system.
- Repository layer.

## PHASE 03 — MANUSCRIPT ENGINE

- Text normalization.
- Sentence segmentation.
- Punctuation.
- Capitalization.
- Spelling.
- Vocabulary protection.
- Correction tracking.
- Automated tests.

## PHASE 04 — WRITING STUDIO

- Editor.
- RAW input.
- Refined output.
- Comparison.
- Correction review.
- Autosave.
- Manuscript library.

## PHASE 05 — PERSONAL NOTES

- Notes editor.
- Notes CRUD.
- Categories.
- Tags.
- Search.
- Archive.
- Pinning.
- Favorites.

## PHASE 06 — IMPORT CENTER

- Clipboard import.
- TXT import.
- Markdown import.
- Multi-file import.
- Import preview.
- Duplicate detection.
- Import history.

## PHASE 07 — CLASSIFICATION ENGINE

- Keyword rules.
- Regex rules.
- Category priorities.
- Sensitive detection.
- Classification preview.
- Manual classification.
- Automated tests.

## PHASE 08 — SENSITIVE VAULT

- Vault creation.
- Key derivation.
- Encryption.
- Decryption.
- Vault unlock.
- Vault lock.
- Sensitive note storage.
- Secure timeout.
- Vault tests.

## PHASE 09 — SEARCH & DICTIONARY

- Global search.
- Category filters.
- Tag filters.
- Dictionary.
- Protected vocabulary.
- Search tests.

## PHASE 10 — BACKUP & RECOVERY

- Automatic backup.
- Manual backup.
- Encrypted backup.
- Restore.
- Version recovery.
- Backup validation.

## PHASE 11 — EXPORT

- TXT.
- Markdown.
- DOCX.
- PDF.
- Export validation.

## PHASE 12 — UI/UX FINISHING

- Visual refinement.
- Responsive layouts.
- Editor readability.
- Keyboard shortcuts.
- Accessibility.
- Loading states.
- Error states.
- Empty states.

## PHASE 13 — TESTING

- Unit tests.
- Integration tests.
- Security tests.
- Regression tests.
- Build verification.
- Offline verification.

## PHASE 14 — RELEASE

- Production build.
- Installer generation.
- Application verification.
- Backup verification.
- Release documentation.
- Human-required task report.

---

# 24. HUMAN REQUIRED TASKS

The coding agent must identify and report tasks that require human participation.

Examples:

- Review linguistic correction quality.
- Verify Indonesian dictionary licensing.
- Approve default classification rules.
- Test real manuscripts.
- Review sensitive vault recovery procedures.
- Verify backup restoration.
- Approve application release.
- Decide whether optional features should be enabled.

Do not invent successful human approvals.

---

# 25. CLI AGENT EXECUTION CONTRACT

The coding agent must:

1. Read the complete PRD.
2. Inspect the existing repository.
3. Create a dependency-aware implementation plan.
4. Implement foundational architecture.
5. Implement database migrations.
6. Implement processing engines.
7. Implement automated tests.
8. Implement user interfaces.
9. Implement persistence.
10. Implement security.
11. Implement backup and recovery.
12. Execute tests.
13. Fix errors.
14. Verify the production build.
15. Verify offline behavior.
16. Verify sensitive data protection.
17. Report completed requirements.
18. Report incomplete requirements.
19. Report HUMAN REQUIRED TASKS.

The agent must continue implementation until all feasible requirements are completed.

Do not stop after planning.

Do not fabricate implementation status.

Do not silently omit requirements.

Do not introduce AI functionality.

Do not perform unrelated refactoring.

---

# 26. FINAL PRODUCT DEFINITION

RAWTYPE is a private writing studio and personal information vault.

The application enables users to:

- Write stories.
- Write novels.
- Write theories.
- Write essays.
- Refine RAW manuscripts.
- Organize personal notes.
- Import scattered Notepad content.
- Automatically classify notes.
- Filter password-related notes.
- Protect sensitive information.
- Search information.
- Recover lost notes.
- Back up manuscripts.
- Export documents.

The application operates locally.

All text processing is deterministic.

The author remains the sole creator of written content.

The system must prioritize original vocabulary, original meaning, privacy, data integrity, and recoverability.

The final product must be readable, maintainable, secure, reliable, and easy to repair.

END OF MASTER PRD.
