import React, { useState } from 'react';
import { Search, BookOpen, StickyNote, ArrowRight, Filter } from 'lucide-react';
import { api } from '../services/tauri';
import { SearchResultItem } from '../types';

interface SearchPageProps {
  onNavigate: (tab: string, meta?: any) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'manuscript' | 'note'>('all');

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.globalSearch(q);
      setResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredResults = results.filter((r) => {
    if (filterType === 'all') return true;
    return r.item_type === filterType;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0f12]">
      {/* Header & Search Bar */}
      <div className="p-6 border-b border-[#222733] bg-[#12151b] space-y-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" />
            <span>Pencarian Global RAWTYPE</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Cari secara instan di seluruh naskah tulisan, catatan pribadi, dan basis pengetahuan offline Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              autoFocus
              placeholder="Ketik kata kunci untuk mencari..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#181c24] border border-[#2a303e] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center bg-[#1b2029] p-0.5 rounded-lg border border-[#2a303e] text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md font-medium ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Semua ({results.length})
            </button>
            <button
              onClick={() => setFilterType('manuscript')}
              className={`px-3 py-1.5 rounded-md font-medium ${
                filterType === 'manuscript'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Naskah
            </button>
            <button
              onClick={() => setFilterType('note')}
              className={`px-3 py-1.5 rounded-md font-medium ${
                filterType === 'note'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Catatan
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {isSearching ? (
          <div className="text-center py-16 text-xs text-zinc-500">Mencari...</div>
        ) : filteredResults.length > 0 ? (
          filteredResults.map((item) => (
            <div
              key={`${item.item_type}-${item.id}`}
              onClick={() => {
                if (item.item_type === 'manuscript') {
                  onNavigate('studio', { manuscriptId: item.id });
                } else {
                  onNavigate('notes', { noteId: item.id });
                }
              }}
              className="p-4 rounded-xl bg-[#14171d] hover:bg-[#181c24] border border-[#222733] hover:border-indigo-500/40 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="space-y-1 truncate mr-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-[#1f2532] text-indigo-400">
                    {item.item_type === 'manuscript' ? (
                      <BookOpen className="w-3.5 h-3.5" />
                    ) : (
                      <StickyNote className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {item.category}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-serif line-clamp-2 pl-7">
                  {item.snippet}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-zinc-500 text-xs font-mono">
                <span>{new Date(item.updated_at).toLocaleDateString('id-ID')}</span>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))
        ) : query.trim() ? (
          <div className="text-center py-16 text-xs text-zinc-500">
            Tidak ada hasil yang cocok dengan "{query}".
          </div>
        ) : (
          <div className="text-center py-16 text-xs text-zinc-500">
            Ketik kata kunci untuk mulai mencari di naskah dan catatan Anda.
          </div>
        )}
      </div>
    </div>
  );
};
