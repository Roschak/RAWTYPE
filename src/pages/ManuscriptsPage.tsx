import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Archive,
  Trash2,
  Copy,
  PenLine,
  History,
  RotateCcw,
  Tag,
  Calendar,
  X,
  Clock,
} from 'lucide-react';
import { api } from '../services/tauri';
import { Manuscript, ManuscriptVersion } from '../types';

interface ManuscriptsPageProps {
  onOpenStudio: (manuscriptId: string) => void;
}

export const ManuscriptsPage: React.FC<ManuscriptsPageProps> = ({ onOpenStudio }) => {
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Manuscript modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('Novel');

  // Version history drawer
  const [selectedManuscriptForVersions, setSelectedManuscriptForVersions] = useState<Manuscript | null>(null);
  const [versions, setVersions] = useState<ManuscriptVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const categories = [
    'Novel',
    'Cerpen (Short Story)',
    'Puisi (Poetry)',
    'Teori (Theory)',
    'Esai (Essay)',
    'Artikel (Article)',
    'Karya Ilmiah (Academic)',
    'Catatan Pribadi (Personal)',
    'Lainnya (Other)',
  ];

  useEffect(() => {
    loadManuscripts();
  }, [includeArchived]);

  const loadManuscripts = async () => {
    try {
      setLoading(true);
      const list = await api.getManuscripts(includeArchived);
      setManuscripts(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const created = await api.createManuscript(
        newTitle.trim(),
        newAuthor.trim() || 'Penulis',
        newCategory,
        ''
      );
      setShowCreateModal(false);
      setNewTitle('');
      setNewAuthor('');
      await loadManuscripts();
      onOpenStudio(created.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicate = async (m: Manuscript) => {
    try {
      await api.createManuscript(
        `${m.title} (Salinan)`,
        m.author,
        m.category,
        m.refined_content || m.original_content
      );
      await loadManuscripts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus naskah ini secara permanen?')) {
      try {
        await api.deleteManuscript(id);
        await loadManuscripts();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleArchive = async (id: string) => {
    try {
      await api.toggleArchiveManuscript(id);
      await loadManuscripts();
    } catch (e) {
      console.error(e);
    }
  };

  const openVersionHistory = async (m: Manuscript) => {
    setSelectedManuscriptForVersions(m);
    setLoadingVersions(true);
    try {
      const vers = await api.getManuscriptVersions(m.id);
      setVersions(vers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (vNumber: number) => {
    if (!selectedManuscriptForVersions) return;
    if (confirm(`Kembalikan naskah ke versi v${vNumber}? Versi baru akan dibuat untuk menjaga riwayat pemulihan.`)) {
      try {
        await api.restoreManuscriptVersion(selectedManuscriptForVersions.id, vNumber);
        setSelectedManuscriptForVersions(null);
        await loadManuscripts();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredManuscripts = manuscripts.filter((m) => {
    if (filterCategory !== 'all' && m.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.author.toLowerCase().includes(q) ||
        m.tags.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0f12]">
      {/* Header & Controls */}
      <div className="p-6 border-b border-[#222733] bg-[#12151b] space-y-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>Perpustakaan Naskah</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Koleksi novel, esai, teori, dan karya tulis panjang Anda yang tersimpan secara lokal.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Naskah Baru</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari naskah berdasarkan judul atau penulis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#181c24] border border-[#2a303e] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#181c24] border border-[#2a303e] text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

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
      </div>

      {/* Manuscripts Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-xs">
            Memuat naskah...
          </div>
        ) : filteredManuscripts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredManuscripts.map((m) => {
              const words = m.refined_content ? m.refined_content.split(/\s+/).filter(Boolean).length : 0;
              return (
                <div
                  key={m.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between transition-all group ${
                    m.archived
                      ? 'bg-[#12151b] border-[#202530] opacity-60'
                      : 'bg-[#14171d] hover:bg-[#181c24] border-[#222733] hover:border-indigo-500/40 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 text-[10px] font-medium font-mono">
                        {m.category}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        v{m.version_number}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {m.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mb-3">
                      {m.author ? `Oleh: ${m.author}` : 'Tanpa nama penulis'}
                    </p>

                    <p className="text-xs text-zinc-400 line-clamp-3 font-serif leading-relaxed mb-4">
                      {m.refined_content || m.original_content || 'Belum ada isi naskah.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#222733] space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span>{words.toLocaleString()} kata</span>
                      <span>{new Date(m.updated_at).toLocaleDateString('id-ID')}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => onOpenStudio(m.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold transition-colors"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                        <span>Buka Studio</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openVersionHistory(m)}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="Riwayat Versi"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(m)}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="Duplikat"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(m.id)}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title={m.archived ? 'Buka dari Arsip' : 'Arsipkan'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <BookOpen className="w-12 h-12 text-zinc-600 mb-3 opacity-40" />
            <div className="text-sm font-semibold text-zinc-400">Tidak ada naskah ditemukan</div>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Mulai karya tulisan pertama Anda dengan menekan tombol Buat Naskah Baru.
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[#151820] border border-[#262c3b] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262c3b]">
              <h2 className="text-base font-bold text-white">Buat Naskah Baru</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Judul Karya</label>
                <input
                  type="text"
                  placeholder="Misal: Sang Pengelana Waktu"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1e27] border border-[#2e3545] text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Penulis</label>
                <input
                  type="text"
                  placeholder="Nama Penulis"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1e27] border border-[#2e3545] text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Kategori</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1e27] border border-[#2e3545] text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#262c3b]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1f2430] hover:bg-[#282e3d] text-zinc-300 text-xs font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                Buat & Buka Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Drawer */}
      {selectedManuscriptForVersions && (
        <div className="fixed inset-y-0 right-0 w-96 z-50 bg-[#14171d] border-l border-[#262c3b] shadow-2xl flex flex-col">
          <div className="p-4 border-b border-[#262c3b] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white truncate max-w-[200px]">
                Versi: {selectedManuscriptForVersions.title}
              </h2>
            </div>
            <button
              onClick={() => setSelectedManuscriptForVersions(null)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingVersions ? (
              <div className="text-center py-6 text-xs text-zinc-500">Memuat riwayat versi...</div>
            ) : versions.length > 0 ? (
              versions.map((ver) => (
                <div
                  key={ver.id}
                  className="p-3 rounded-lg bg-[#181c24] border border-[#29303e] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400 font-mono">v{ver.version_number}</span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {new Date(ver.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-zinc-400 line-clamp-3 font-serif text-[12px] bg-[#101318] p-2 rounded border border-[#202530]">
                    {ver.content || '[Naskah kosong]'}
                  </div>
                  <button
                    onClick={() => handleRestoreVersion(ver.version_number)}
                    className="w-full mt-1 flex items-center justify-center gap-1.5 py-1 rounded bg-[#202633] hover:bg-indigo-600 hover:text-white text-zinc-300 text-[11px] font-medium transition-colors border border-[#2b3345]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Pulihkan Versi Ini</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-zinc-500">
                Belum ada versi sebelumnya tercatat.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
