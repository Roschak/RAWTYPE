import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  FileText,
  StickyNote,
  Shield,
  Pin,
  Clock,
  PlusCircle,
  Upload,
  Search,
  PenLine,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/tauri';
import { DashboardStats } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: string, meta?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#0d0f12]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222733] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard RAWTYPE</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Ringkasan studio penulisan lokal dan brankas catatan pengetahuan pribadi Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('studio')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Mulai Menulis</span>
          </button>
          <button
            onClick={() => onNavigate('import')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1a1e27] hover:bg-[#232936] text-zinc-200 text-xs font-medium border border-[#2e3545] transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Catatan</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#14171d] border border-[#222733]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Total Naskah</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? '...' : stats?.total_manuscripts ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            {stats?.total_words ? `${stats.total_words.toLocaleString()} kata` : '0 kata'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#14171d] border border-[#222733]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Catatan Pribadi</span>
            <StickyNote className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? '...' : stats?.total_notes ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {stats?.total_categorized_notes ?? 0} terklasifikasi
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#14171d] border border-[#222733]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Belum Diklasifikasi</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? '...' : stats?.unclassified_notes ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Butuh penataan kategori
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#14171d] border border-[#222733]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Catatan Sensitif</span>
            <Shield className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? '...' : stats?.sensitive_notes_count ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 text-rose-300">
            Tersimpan di Vault Terenkripsi
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="p-5 rounded-xl bg-[#14171d] border border-[#222733]">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('studio', { action: 'new' })}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#181c24] hover:bg-[#202531] border border-[#262c3b] text-center transition-all group"
          >
            <PlusCircle className="w-5 h-5 text-indigo-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-zinc-200">Naskah Baru</span>
          </button>
          <button
            onClick={() => onNavigate('notes', { action: 'new' })}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#181c24] hover:bg-[#202531] border border-[#262c3b] text-center transition-all group"
          >
            <StickyNote className="w-5 h-5 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-zinc-200">Catatan Baru</span>
          </button>
          <button
            onClick={() => onNavigate('import')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#181c24] hover:bg-[#202531] border border-[#262c3b] text-center transition-all group"
          >
            <Upload className="w-5 h-5 text-sky-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-zinc-200">Impor Notepad</span>
          </button>
          <button
            onClick={() => onNavigate('studio')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#181c24] hover:bg-[#202531] border border-[#262c3b] text-center transition-all group"
          >
            <PenLine className="w-5 h-5 text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-zinc-200">Writing Studio</span>
          </button>
          <button
            onClick={() => onNavigate('vault')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#181c24] hover:bg-[#202531] border border-[#262c3b] text-center transition-all group"
          >
            <Shield className="w-5 h-5 text-rose-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-zinc-200">Buka Vault</span>
          </button>
          <button
            onClick={() => onNavigate('search')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#181c24] hover:bg-[#202531] border border-[#262c3b] text-center transition-all group"
          >
            <Search className="w-5 h-5 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-zinc-200">Cari Semuanya</span>
          </button>
        </div>
      </div>

      {/* Recent Manuscripts and Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Manuscripts */}
        <div className="p-5 rounded-xl bg-[#14171d] border border-[#222733] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Naskah Terbaru</h3>
              </div>
              <button
                onClick={() => onNavigate('manuscripts')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {stats?.recent_manuscripts && stats.recent_manuscripts.length > 0 ? (
                stats.recent_manuscripts.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onNavigate('studio', { manuscriptId: m.id })}
                    className="p-3 rounded-lg bg-[#181c24] hover:bg-[#1e232e] border border-[#252b38] cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-zinc-100">{m.title}</div>
                      <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                          {m.category}
                        </span>
                        <span>•</span>
                        <span>v{m.version_number}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {new Date(m.updated_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-zinc-500">
                  Belum ada naskah. Mulai buat naskah pertama Anda!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Notes */}
        <div className="p-5 rounded-xl bg-[#14171d] border border-[#222733] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <StickyNote className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Catatan Terbaru</h3>
              </div>
              <button
                onClick={() => onNavigate('notes')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {stats?.recent_notes && stats.recent_notes.length > 0 ? (
                stats.recent_notes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onNavigate('notes', { noteId: n.id })}
                    className="p-3 rounded-lg bg-[#181c24] hover:bg-[#1e232e] border border-[#252b38] cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="truncate mr-3">
                      <div className="text-sm font-medium text-zinc-100 flex items-center gap-1.5 truncate">
                        {n.pinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
                        <span className="truncate">{n.title}</span>
                      </div>
                      <div className="text-xs text-zinc-400 truncate mt-0.5">
                        {/* Note content snippet (censored if sensitive) */}
                        {n.sensitive ? (
                          <span className="text-rose-400 font-mono text-[11px]">
                            [Catatan Terkunci di Sensitive Vault]
                          </span>
                        ) : (
                          n.content.slice(0, 50) + (n.content.length > 50 ? '...' : '')
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-400 shrink-0 font-mono">
                      {new Date(n.updated_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-zinc-500">
                  Belum ada catatan. Impor atau buat catatan baru!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
