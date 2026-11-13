import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  WifiOff,
  Cpu,
  CheckCircle,
  Database,
  Trash2,
  HardDrive,
  RefreshCw,
  Globe,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { api } from '../services/tauri';
import { CacheUsageStats, PlatformInfo } from '../types';

export const SettingsPage: React.FC = () => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(api.getPlatformInfo());
  const [cacheStats, setCacheStats] = useState<CacheUsageStats | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    try {
      const stats = await api.getCacheUsage();
      setCacheStats(stats);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearCache = async (type?: string) => {
    setIsClearing(true);
    try {
      await api.clearCache(type);
      await loadCacheInfo();
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compatibilityMatrix = [
    { feature: 'Writing Studio', desktop: true, web: true, pwa: true, android: 'Future' },
    { feature: 'Manuscript Library & Versioning', desktop: true, web: true, pwa: true, android: 'Future' },
    { feature: 'Personal Notes Organizer', desktop: true, web: true, pwa: true, android: 'Future' },
    { feature: 'Rule-Based Refinement Engine', desktop: true, web: true, pwa: true, android: 'Future' },
    { feature: 'Rule-Based Note Classification', desktop: true, web: true, pwa: true, android: 'Future' },
    { feature: 'Encrypted Sensitive Vault', desktop: 'AES-256-GCM + Argon2id', web: 'AES-256-GCM + PBKDF2', pwa: 'AES-256-GCM + PBKDF2', android: 'Future' },
    { feature: 'Autosave & Working Buffer', desktop: true, web: true, pwa: true, android: 'Future' },
    { feature: 'Crash Recovery Journal', desktop: true, web: true, pwa: 'Best effort', android: 'Future' },
    { feature: 'Offline-First Capability', desktop: '100% Native', web: '100% Local-First', pwa: '100% Service Worker', android: 'Future' },
    { feature: 'Atomic Snapshot Backup', desktop: 'SQLite VACUUM', web: 'IndexedDB JSON', pwa: 'IndexedDB JSON', android: 'Future' },
    { feature: 'Document Export (DOCX/PDF/MD/TXT)', desktop: true, web: true, pwa: true, android: 'Future' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0f12]">
      {/* Header */}
      <div className="p-6 border-b border-[#222733] bg-[#12151b] shrink-0">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>Pengaturan & Arsitektur Multi-Platform</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Informasi runtime, manajemen cache berstruktur, dan matriks kompatibilitas lintas platform.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl">
        {/* Active Runtime & Storage Platform */}
        <div className="p-5 rounded-xl bg-[#14171d] border border-[#222733] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-400" />
              <span>Platform Runtime & Storage Aktif</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 text-[11px] font-mono">
              {platformInfo.platformName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
            <div className="p-3 rounded-lg bg-[#181c24] border border-[#262c3a]">
              <span className="text-zinc-500 block text-[10px]">Storage Engine</span>
              <strong className="text-zinc-100">{platformInfo.storageEngine}</strong>
            </div>
            <div className="p-3 rounded-lg bg-[#181c24] border border-[#262c3a]">
              <span className="text-zinc-500 block text-[10px]">Offline Capability</span>
              <strong className="text-emerald-400">Tersedia 100%</strong>
            </div>
            <div className="p-3 rounded-lg bg-[#181c24] border border-[#262c3a]">
              <span className="text-zinc-500 block text-[10px]">Generative AI Policy</span>
              <strong className="text-rose-400">Dilarang Mutlak (Prohibited)</strong>
            </div>
          </div>
        </div>

        {/* Cache Management System (PRD Addendum Section 7) */}
        <div className="p-5 rounded-xl bg-[#14171d] border border-[#222733] space-y-4">
          <div className="flex items-center justify-between border-b border-[#222733] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span>Cache Management System</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Cache bersifat efemeral dan terisolasi. Pembersihan cache aman dan tidak pernah menghapus database atau backup naskah Anda.
              </p>
            </div>

            <button
              onClick={() => handleClearCache('all')}
              disabled={isClearing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{isClearing ? 'Membersihkan...' : 'Bersihkan Semua Cache'}</span>
            </button>
          </div>

          {cacheStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#181c24] border border-[#262c3a]">
                <span className="text-zinc-500 block text-[10px]">Editor Buffer</span>
                <strong className="text-zinc-200">{formatBytes(cacheStats.editorBufferBytes)}</strong>
              </div>
              <div className="p-3 rounded-lg bg-[#181c24] border border-[#262c3a]">
                <span className="text-zinc-500 block text-[10px]">Search Index Cache</span>
                <strong className="text-zinc-200">{formatBytes(cacheStats.searchIndexBytes)}</strong>
              </div>
              <div className="p-3 rounded-lg bg-[#181c24] border border-[#262c3a]">
                <span className="text-zinc-500 block text-[10px]">App & Web Cache</span>
                <strong className="text-zinc-200">{formatBytes(cacheStats.applicationCacheBytes)}</strong>
              </div>
              <div className="p-3 rounded-lg bg-[#181c24] border border-[#262c3a]">
                <span className="text-zinc-500 block text-[10px]">Total Ukuran Cache</span>
                <strong className="text-indigo-400">{formatBytes(cacheStats.totalBytes)}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Cross-Platform Feature Parity Matrix (PRD Addendum Section 10) */}
        <div className="p-5 rounded-xl bg-[#14171d] border border-[#222733] space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Matriks Paritas Fitur Lintas Platform</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Prinsip: Satu Produk, Inti Bersama, Multi-Target Distribusi.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#242b38] text-zinc-400 font-medium">
                  <th className="py-2.5 px-3">Fitur Aplikasi</th>
                  <th className="py-2.5 px-3">Desktop (Win)</th>
                  <th className="py-2.5 px-3">Web (Hosted)</th>
                  <th className="py-2.5 px-3">PWA (Installable)</th>
                  <th className="py-2.5 px-3">Android (Future)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2430] text-zinc-300">
                {compatibilityMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#181c25]">
                    <td className="py-2.5 px-3 font-medium text-white">{row.feature}</td>
                    <td className="py-2.5 px-3">
                      {row.desktop === true ? (
                        <span className="text-emerald-400">✓ Aktif</span>
                      ) : (
                        <span className="text-zinc-400 font-mono text-[11px]">{row.desktop}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {row.web === true ? (
                        <span className="text-emerald-400">✓ Aktif</span>
                      ) : (
                        <span className="text-zinc-400 font-mono text-[11px]">{row.web}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {row.pwa === true ? (
                        <span className="text-emerald-400">✓ Aktif</span>
                      ) : (
                        <span className="text-zinc-400 font-mono text-[11px]">{row.pwa}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">{row.android}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Anti-AI Directive */}
        <div className="p-5 rounded-xl bg-[#14171d] border border-emerald-900/50 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>Kepatuhan Privasi Mutlak & Anti-AI Directive</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#181c24] border border-[#232936] flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Generative AI Dilarang (Prohibited)</strong>
                Tidak ada panggilan ke API AI eksternal atau sintesis teks buatan. Penulis adalah pencipta tunggal karya.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#181c24] border border-[#232936] flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Local-First & Data Isolation</strong>
                Setiap browser dan perangkat memiliki penyimpanan terisolasi secara lokal. Data tidak pernah disinkronkan tanpa izin.
              </div>
            </div>
          </div>
        </div>

        {/* Application Credits */}
        <div className="p-5 rounded-xl bg-[#14171d] border border-[#222733] text-xs text-zinc-500 flex items-center justify-between font-mono">
          <div>
            <span>PROJECT-RAWTYPE • Multi-Platform Edition v1.0.0</span>
            <div className="text-[11px] text-zinc-600 mt-0.5">Desktop (.exe/.msi), Web Hosting, & Progressive Web App</div>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-sans font-medium">
            <WifiOff className="w-4 h-4" />
            <span>Offline Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
