import React, { useState, useEffect } from 'react';
import { BookA, Plus, Trash2, Search, Shield, X, Check } from 'lucide-react';
import { api } from '../services/tauri';
import { DictionaryEntry } from '../types';

export const DictionaryPage: React.FC = () => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newCategory, setNewCategory] = useState('Character');
  const [isProtected, setIsProtected] = useState(true);
  const [isIgnored, setIsIgnored] = useState(false);

  const categories = ['Character', 'Place', 'Technical', 'Fictional', 'Foreign Language', 'Custom', 'KBBI'];

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const list = await api.getDictionaryEntries();
      setEntries(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEntry = async () => {
    if (!newWord.trim()) return;
    try {
      await api.addDictionaryEntry(
        newWord.trim(),
        newDefinition.trim(),
        newCategory,
        isProtected,
        isIgnored
      );
      setShowAddModal(false);
      setNewWord('');
      setNewDefinition('');
      await loadEntries();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus kosakata ini dari kamus?')) {
      try {
        await api.deleteDictionaryEntry(id);
        await loadEntries();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filtered = entries.filter((e) => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return e.word.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0f12]">
      {/* Header */}
      <div className="p-6 border-b border-[#222733] bg-[#12151b] space-y-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookA className="w-5 h-5 text-indigo-400" />
              <span>Kamus Lokal & Kosakata Terlindungi</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Lindungi nama karakter, istilah dunia fiksi, dan kata teknis agar tidak diubah oleh mesin perbaikan naskah.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kosakata</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kata dalam kamus..."
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
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dictionary Entries Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl bg-[#14171d] border border-[#222733] flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-indigo-400">
                      {entry.category}
                    </span>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white font-serif">{entry.word}</h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    {entry.definition || 'Tanpa definisi'}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#1e232d] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    {entry.protected && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>Terlindungi</span>
                      </span>
                    )}
                  </div>
                  <span>Offline</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-xs text-zinc-500">
            Belum ada entri kamus. Tambahkan kata baru untuk melindungi kosa kata karya Anda!
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[#151820] border border-[#262c3b] p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#262c3b] pb-2">
              <h2 className="text-base font-bold text-white">Tambah Kata / Istilah Terlindungi</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Kata / Istilah</label>
                <input
                  type="text"
                  placeholder="Misal: Eldoria, Rama, Quasar"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1e27] border border-[#2e3545] text-white focus:outline-none focus:border-indigo-500 font-serif text-sm"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Kategori</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1e27] border border-[#2e3545] text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Definisi / Catatan Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Catatan arti atau asal usul istilah ini..."
                  value={newDefinition}
                  onChange={(e) => setNewDefinition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1e27] border border-[#2e3545] text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isProtected}
                    onChange={(e) => setIsProtected(e.target.checked)}
                    className="rounded bg-[#181c24] border-[#2a303e] text-indigo-600 focus:ring-0"
                  />
                  <span>Lindungi dari koreksi otomatis mesin ejaan</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#262c3b]">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1f2430] hover:bg-[#282e3d] text-zinc-300 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleAddEntry}
                disabled={!newWord.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-50"
              >
                Simpan ke Kamus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
