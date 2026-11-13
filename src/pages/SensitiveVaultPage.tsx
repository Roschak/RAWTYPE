import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { api } from '../services/tauri';
import { DecryptedVaultItem, VaultStatus } from '../types';

export const SensitiveVaultPage: React.FC = () => {
  const [vaultStatus, setVaultStatus] = useState<VaultStatus>({ is_initialized: false, is_unlocked: false });
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Decrypted items when unlocked
  const [items, setItems] = useState<DecryptedVaultItem[]>([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('Password');
  const [editTags, setEditTags] = useState('');

  // Visibility states for individual secrets
  const [visibleMap, setVisibleMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await api.getVaultStatus();
      setVaultStatus(status);
      if (status.is_unlocked) {
        await loadVaultItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadVaultItems = async () => {
    try {
      const list = await api.getVaultItems();
      setItems(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInitializeVault = async () => {
    if (!masterPassword || masterPassword.length < 8) {
      setErrorMsg('Password master minimal harus 8 karakter');
      return;
    }
    if (masterPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await api.initializeVault(masterPassword);
      setMasterPassword('');
      setConfirmPassword('');
      await loadStatus();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal membuat vault');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!masterPassword) {
      setErrorMsg('Masukkan password master');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await api.unlockVault(masterPassword);
      setMasterPassword('');
      await loadStatus();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Password master salah');
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    try {
      await api.lockVault();
      setItems([]);
      setVisibleMap({});
      await loadStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveItem = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      await api.saveVaultItem(null, editTitle, editContent, editCategory, editTags);
      setShowItemModal(false);
      setEditTitle('');
      setEditContent('');
      setEditTags('');
      await loadVaultItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Hapus item rahasia ini dari vault secara permanen?')) {
      try {
        await api.deleteVaultItem(id);
        await loadVaultItems();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0f12]">
      {/* Header */}
      <div className="p-6 border-b border-[#222733] bg-[#12151b] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {vaultStatus.is_unlocked ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            )}
            <span>Sensitive Information Vault</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Enkripsi terotentikasi AES-256-GCM + Argon2id untuk kata sandi, token API, dan data rahasia.
          </p>
        </div>

        {vaultStatus.is_unlocked && (
          <button
            onClick={handleLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Kunci Vault</span>
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {!vaultStatus.is_initialized ? (
          /* Initial Setup View */
          <div className="max-w-md mx-auto mt-12 p-6 rounded-xl bg-[#14171d] border border-[#222733] shadow-xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white">Inisialisasi Master Vault</h2>
              <p className="text-xs text-zinc-400">
                Buat password master utama untuk melindungi semua data rahasia Anda. Password ini tidak pernah dikirim ke jaringan luar.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Password Master</label>
                <input
                  type="password"
                  placeholder="Minimal 8 karakter kuat"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181c24] border border-[#2a303e] text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Ulangi Password Master</label>
                <input
                  type="password"
                  placeholder="Ketik ulang password master"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181c24] border border-[#2a303e] text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleInitializeVault}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              {loading ? 'Menginisialisasi...' : 'Buat Vault Terenkripsi'}
            </button>
          </div>
        ) : !vaultStatus.is_unlocked ? (
          /* Locked State View */
          <div className="max-w-md mx-auto mt-14 p-6 rounded-xl bg-[#14171d] border border-[#222733] shadow-xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-600/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white">Vault Terkunci</h2>
              <p className="text-xs text-zinc-400">
                Semua kata sandi dan catatan rahasia dienkripsi secara aman. Masukkan password master untuk membuka akses.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Password Master</label>
                <input
                  type="password"
                  placeholder="Masukkan password master..."
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  className="w-full px-3 py-2 rounded-lg bg-[#181c24] border border-[#2a303e] text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleUnlock}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              {loading ? 'Membuka Enkripsi...' : 'Buka Vault'}
            </button>
          </div>
        ) : (
          /* Unlocked State View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Data Rahasia Terdekripsi ({items.length})</h2>
                <p className="text-xs text-zinc-400">
                  Data ini didekripsi hanya di dalam memori kerja lokal (RAM).
                </p>
              </div>

              <button
                onClick={() => setShowItemModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Rahasia Baru</span>
              </button>
            </div>

            {/* Secret items list */}
            {items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => {
                  const isVisible = visibleMap[item.id] || false;
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#14171d] border border-[#222733] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {item.category}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => toggleVisibility(item.id)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                            title={isVisible ? 'Sembunyikan' : 'Tampilkan'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(item.id, item.content)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                            title="Salin ke Clipboard"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
                        <div className="mt-1 p-2.5 rounded bg-[#0f1115] border border-[#1e232d] font-mono text-xs select-all break-all">
                          {isVisible ? item.content : '••••••••••••••••••••'}
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-between pt-1 border-t border-[#1e232d]">
                        <span>{item.tags || 'Umum'}</span>
                        <span>{new Date(item.updated_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-zinc-500">
                Belum ada item rahasia yang disimpan di vault. Klik "Tambah Rahasia Baru".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Secret Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[#151820] border border-[#262c3b] p-6 shadow-2xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-white border-b border-[#262c3b] pb-2">
              Tambah Data Rahasia Baru
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Judul / Layanan</label>
                <input
                  type="text"
                  placeholder="Misal: GitHub Token / Akun Email"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1e27] border border-[#2e3545] text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Kategori</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1e27] border border-[#2e3545] text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Password">Password / Kredensial</option>
                  <option value="API Key">API Key / Token</option>
                  <option value="Recovery Code">Recovery Code</option>
                  <option value="Server Config">Server / SSH</option>
                  <option value="Personal Note">Catatan Rahasia</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Konten Rahasia</label>
                <textarea
                  rows={4}
                  placeholder="Ketik atau tempel nilai rahasia di sini..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1e27] border border-[#2e3545] text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#262c3b]">
              <button
                onClick={() => setShowItemModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1f2430] hover:bg-[#282e3d] text-zinc-300 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSaveItem}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                Enkripsi & Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
