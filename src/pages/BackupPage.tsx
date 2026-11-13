import React, { useState, useEffect } from 'react';
import {
  DatabaseBackup,
  CheckCircle2,
  HardDrive,
  Shield,
  FileCheck,
  Upload,
  Download,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/tauri';
import { BackupRecord } from '../types';

export const BackupPage: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackup, setLastBackup] = useState<BackupRecord | null>(null);
  const [restoreStatusMsg, setRestoreStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const list = await api.getBackupHistory();
      setBackups(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setRestoreStatusMsg(null);
    try {
      const rec = await api.createBackup('manual');
      setLastBackup(rec);
      await loadBackups();
    } catch (e: any) {
      alert(`Gagal membuat cadangan: ${e?.message || e}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Apakah Anda yakin ingin memulihkan basis data dari file "${file.name}"? Data yang ada akan disinkronkan.`)) {
      return;
    }

    setIsRestoring(true);
    setRestoreStatusMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const ok = await api.restoreBackup(content);
        if (ok) {
          setRestoreStatusMsg(`Berhasil memulihkan data dari ${file.name}`);
          await loadBackups();
        } else {
          setRestoreStatusMsg(`Gagal memulihkan: Berkas cadangan tidak kompatibel.`);
        }
      } catch (err: any) {
        setRestoreStatusMsg(`Error: ${err?.message || err}`);
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0f12]">
      {/* Header */}
      <div className="p-6 border-b border-[#222733] bg-[#12151b] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <DatabaseBackup className="w-5 h-5 text-indigo-400" />
            <span>Cadangan & Pemulihan (Backup & Recovery)</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Snapshot atomik lokal (SQLite VACUUM / IndexedDB Snapshot) dengan verifikasi integritas checksum otomatis.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Restore from File */}
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1e27] hover:bg-[#222834] text-zinc-300 hover:text-white text-xs font-medium border border-[#2a303e] cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>{isRestoring ? 'Memulihkan...' : 'Pulihkan dari Berkas'}</span>
            <input
              type="file"
              accept=".json,.db"
              onChange={handleRestoreFromFile}
              className="hidden"
            />
          </label>

          {/* Create Backup */}
          <button
            onClick={handleCreateBackup}
            disabled={isBackingUp}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
          >
            <HardDrive className="w-4 h-4" />
            <span>{isBackingUp ? 'Membuat Snapshot...' : 'Buat Cadangan Sekarang'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Restore status banner */}
        {restoreStatusMsg && (
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>{restoreStatusMsg}</span>
          </div>
        )}

        {/* Recent backup success banner */}
        {lastBackup && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-sm text-white">Snapshot Database Berhasil Dibuat</span>
                <p className="text-[11px] text-emerald-400/90 font-mono mt-0.5">
                  Path: {lastBackup.backup_path} • Status Integritas: {lastBackup.integrity_status}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Backup Rules & Security Notices */}
        <div className="p-5 rounded-xl bg-[#14171d] border border-[#222733] space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Prinsip Keamanan & Integritas Cadangan Multi-Platform</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-zinc-400">
            <div className="p-3 rounded-lg bg-[#181c24] border border-[#232936]">
              <strong className="text-zinc-200 block mb-1">Atomik & Bebas Korupsi</strong>
              Pada desktop menggunakan SQLite VACUUM snapshot, pada web menggunakan transaksi IndexedDB terisolasi.
            </div>
            <div className="p-3 rounded-lg bg-[#181c24] border border-[#232936]">
              <strong className="text-zinc-200 block mb-1">Vault Tetap Terenkripsi</strong>
              Konten di dalam Sensitive Vault tetap terkunci dalam format enkripsi AES-256-GCM pada berkas cadangan.
            </div>
            <div className="p-3 rounded-lg bg-[#181c24] border border-[#232936]">
              <strong className="text-zinc-200 block mb-1">Verifikasi Otomatis</strong>
              Setiap kali cadangan dibuat atau dipulihkan, RAWTYPE memverifikasi integritas checksum untuk memastikan data valid.
            </div>
          </div>
        </div>

        {/* Backup History Table */}
        <div className="p-5 rounded-xl bg-[#14171d] border border-[#222733] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Riwayat Cadangan Lokal ({backups.length})</h2>
          </div>

          {backups.length > 0 ? (
            <div className="space-y-2">
              {backups.map((bk) => (
                <div
                  key={bk.id}
                  className="p-3 rounded-lg bg-[#181c24] border border-[#262c38] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5 truncate mr-4">
                    <div className="font-mono text-zinc-200 truncate">{bk.backup_path}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      Tipe: {bk.backup_type} • Dibuat: {new Date(bk.created_at).toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                      <FileCheck className="w-3 h-3" />
                      <span>Integritas: {bk.integrity_status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-zinc-500">
              Belum ada riwayat cadangan. Klik "Buat Cadangan Sekarang" untuk menyimpan salinan basis data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
