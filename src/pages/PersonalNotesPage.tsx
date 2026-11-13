import React, { useState, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  Pin,
  Archive,
  Trash2,
  Tag,
  Shield,
  Folder,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/tauri';
import { Note, NoteCategory } from '../types';

interface PersonalNotesPageProps {
  initialNoteId?: string;
  onOpenVault: () => void;
}

export const PersonalNotesPage: React.FC<PersonalNotesPageProps> = ({ initialNoteId, onOpenVault }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Note editor states
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('cat_general');
  const [editTags, setEditTags] = useState('');
  const [editSensitive, setEditSensitive] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadNotes();
  }, [selectedCategory, includeArchived]);

  const loadCategories = async () => {
    try {
      const cats = await api.getNoteCategories();
      setCategories(cats);
    } catch (e) {
      console.error(e);
    }
  };

  const loadNotes = async () => {
    try {
      const list = await api.getNotes(
        selectedCategory === 'all' ? undefined : selectedCategory,
        includeArchived,
        true
      );
      setNotes(list);

      if (initialNoteId) {
        const found = list.find((n) => n.id === initialNoteId);
        if (found) {
          selectNote(found);
          return;
        }
      }

      if (list.length > 0 && !selectedNote) {
        selectNote(list[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategoryId(note.category_id);
    setEditTags(note.tags);
    setEditSensitive(note.sensitive);
  };

  const handleCreateNew = async () => {
    try {
      const newNote = await api.createNote(
        'Catatan Baru',
        '',
        selectedCategory !== 'all' ? selectedCategory : 'cat_general',
        '',
        'manual',
        false
      );
      await loadNotes();
      selectNote(newNote);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    try {
      const updated = await api.updateNote(
        selectedNote.id,
        editTitle,
        editContent,
        editCategoryId,
        editTags,
        editSensitive
      );
      setSelectedNote(updated);
      await loadNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus catatan ini?')) {
      try {
        await api.deleteNote(id);
        if (selectedNote?.id === id) setSelectedNote(null);
        await loadNotes();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await api.togglePinNote(id);
      await loadNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleArchive = async (id: string) => {
    try {
      await api.toggleArchiveNote(id);
      await loadNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoClassify = async () => {
    try {
      const result = await api.classifyNoteContent(editTitle, editContent);
      setEditCategoryId(result.category_id);
      if (result.is_sensitive) {
        setEditSensitive(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#0d0f12]">
      {/* Category Sidebar */}
      <aside className="w-56 border-r border-[#222733] bg-[#12151b] flex flex-col justify-between shrink-0">
        <div>
          <div className="p-4 border-b border-[#222733] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Kategori Catatan
            </span>
            <button
              onClick={handleCreateNew}
              className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
              title="Buat Catatan Baru"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-140px)]">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#181c24]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-3.5 h-3.5" />
                <span>Semua Catatan</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">{notes.length}</span>
            </button>

            {categories.map((cat) => {
              const count = notes.filter((n) => n.category_id === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#181c24]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 border-t border-[#222733] bg-[#101318]">
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded bg-[#181c24] border-[#2a303e] text-indigo-600 focus:ring-0"
            />
            <span>Tampilkan Arsip</span>
          </label>
        </div>
      </aside>

      {/* Notes List Column */}
      <div className="w-80 border-r border-[#222733] bg-[#14171d] flex flex-col shrink-0 overflow-hidden">
        {/* Search header */}
        <div className="p-3 border-b border-[#222733] bg-[#12151b]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari dalam catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#181c24] border border-[#262c38] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Note list items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => {
              const isSelected = selectedNote?.id === note.id;
              const cat = categories.find((c) => c.id === note.category_id);
              return (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-600/50 shadow-sm'
                      : 'bg-[#181c24] hover:bg-[#1d222c] border-[#222733]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      {note.pinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
                      <span className="text-xs font-semibold text-zinc-100 truncate">
                        {note.title || 'Catatan Tanpa Judul'}
                      </span>
                    </div>
                    {note.sensitive && (
                      <span title="Catatan Sensitif">
                        <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-2 font-mono mb-2">
                    {note.sensitive ? '[Terkunci di Sensitive Vault]' : note.content || 'Kosong'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span
                      className="px-1.5 py-0.5 rounded truncate max-w-[120px]"
                      style={{
                        backgroundColor: `${cat?.color}20`,
                        color: cat?.color || '#8b949e',
                      }}
                    >
                      {cat?.name || 'Unclassified'}
                    </span>
                    <span>{new Date(note.updated_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-xs text-zinc-500">
              Tidak ada catatan yang sesuai.
            </div>
          )}
        </div>
      </div>

      {/* Main Note Editor Panel */}
      <div className="flex-1 flex flex-col h-full bg-[#0d0f12] overflow-hidden">
        {selectedNote ? (
          <>
            {/* Editor Top Bar */}
            <div className="px-6 py-3 border-b border-[#222733] bg-[#14171d] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-[#384252] focus:border-indigo-500 focus:outline-none flex-1 px-1 py-0.5"
                  placeholder="Judul Catatan..."
                />

                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="px-2.5 py-1 rounded bg-[#1b2029] border border-[#2a3140] text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAutoClassify}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e2432] hover:bg-indigo-600/30 text-indigo-400 text-xs font-medium border border-indigo-500/30 transition-colors"
                  title="Klasifikasikan otomatis berdasarkan isi"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Oto-Klasifikasi</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditSensitive(!editSensitive)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    editSensitive
                      ? 'bg-rose-950/40 text-rose-300 border-rose-800'
                      : 'bg-[#1b2029] text-zinc-400 border-[#2a3140] hover:text-white'
                  }`}
                  title="Tandai sebagai catatan rahasia/sensitif"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{editSensitive ? 'Sensitif' : 'Standar'}</span>
                </button>

                <button
                  onClick={() => handleTogglePin(selectedNote.id)}
                  className={`p-1.5 rounded border transition-colors ${
                    selectedNote.pinned
                      ? 'bg-amber-950/40 border-amber-800 text-amber-400'
                      : 'bg-[#1b2029] border-[#2a3140] text-zinc-400 hover:text-white'
                  }`}
                  title={selectedNote.pinned ? 'Lepas Pin' : 'Pin Catatan'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleToggleArchive(selectedNote.id)}
                  className="p-1.5 rounded bg-[#1b2029] border border-[#2a3140] text-zinc-400 hover:text-white transition-colors"
                  title={selectedNote.archived ? 'Buka Arsip' : 'Arsipkan'}
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(selectedNote.id)}
                  className="p-1.5 rounded bg-[#1b2029] border border-[#2a3140] text-zinc-400 hover:text-rose-400 transition-colors"
                  title="Hapus Catatan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleSave}
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Simpan
                </button>
              </div>
            </div>

            {/* Note Textarea */}
            <div className="flex-1 overflow-y-auto p-6">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Ketik catatan di sini... Anda juga bisa menyalin langsung isi Notepad Anda ke sini."
                className="w-full h-full bg-transparent text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none font-mono text-sm leading-relaxed"
              />
            </div>

            {/* Note Footer Info */}
            <div className="px-6 py-2.5 border-t border-[#222733] bg-[#12151b] flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-3">
                <span>Sumber: {selectedNote.source}</span>
                <span>•</span>
                <span>{editContent.length} karakter</span>
              </div>
              <div>
                Terakhir diubah: {new Date(selectedNote.updated_at).toLocaleString('id-ID')}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs">
            <StickyNote className="w-12 h-12 text-zinc-700 mb-2 opacity-50" />
            Pilih catatan dari daftar atau buat catatan baru.
          </div>
        )}
      </div>
    </div>
  );
};
