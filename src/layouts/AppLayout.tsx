import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  PenTool,
  BookOpen,
  StickyNote,
  FileInput,
  ShieldCheck,
  ShieldAlert,
  Search,
  BookA,
  DatabaseBackup,
  Settings,
  WifiOff,
  Lock,
  Unlock,
  DownloadCloud,
  Monitor,
  Globe,
} from 'lucide-react';
import { api } from '../services/tauri';
import { VaultStatus, PlatformInfo } from '../types';

interface AppLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentTab, onSelectTab, children }) => {
  const [vaultStatus, setVaultStatus] = useState<VaultStatus>({ is_initialized: false, is_unlocked: false });
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(api.getPlatformInfo());
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const loadVaultStatus = async () => {
    try {
      const status = await api.getVaultStatus();
      setVaultStatus(status);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadVaultStatus();
    setPlatformInfo(api.getPlatformInfo());
    const interval = setInterval(loadVaultStatus, 4000);

    // Listen for PWA install event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleLockVault = async () => {
    await api.lockVault();
    await loadVaultStatus();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'studio', label: 'Writing Studio', icon: PenTool },
    { id: 'manuscripts', label: 'Manuscripts', icon: BookOpen },
    { id: 'notes', label: 'Personal Notes', icon: StickyNote },
    { id: 'import', label: 'Import Center', icon: FileInput },
    { id: 'vault', label: 'Sensitive Vault', icon: vaultStatus.is_unlocked ? ShieldCheck : ShieldAlert },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'dictionary', label: 'Dictionary', icon: BookA },
    { id: 'backup', label: 'Backup & Recovery', icon: DatabaseBackup },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#0d0f12] text-[#e6edf3] overflow-hidden select-none">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#14171d] border-r border-[#222733] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Header */}
          <div className="px-5 py-5 border-b border-[#222733]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white tracking-widest text-sm shadow-md shadow-indigo-600/30">
                RW
              </div>
              <div>
                <h1 className="text-base font-bold tracking-wider text-white">RAWTYPE</h1>
                <p className="text-[11px] text-zinc-400 font-mono tracking-tight">STUDIO & VAULT</p>
              </div>
            </div>

            {/* Platform badge */}
            <div className="mt-2.5 flex items-center justify-between px-2 py-1 rounded bg-[#1b2028] text-[10px] border border-[#262c38]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline-First (No AI)</span>
              </div>
              <span className="text-zinc-500 font-mono flex items-center gap-1">
                {platformInfo.isDesktop ? <Monitor className="w-3 h-3 text-indigo-400" /> : <Globe className="w-3 h-3 text-sky-400" />}
                <span>{platformInfo.isDesktop ? 'Desktop' : platformInfo.isPWA ? 'PWA' : 'Web'}</span>
              </span>
            </div>

            {/* PWA Install Button if available */}
            {installPrompt && (
              <button
                onClick={handleInstallPWA}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-semibold border border-indigo-500/30 transition-all"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>Install Aplikasi PWA</span>
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1e27]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Vault Status Footer in Sidebar */}
        <div className="p-3 border-t border-[#222733] bg-[#101318]">
          <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-[#171b22] border border-[#222733]">
            <div className="flex items-center space-x-2">
              {vaultStatus.is_unlocked ? (
                <Unlock className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-[12px] text-zinc-300">
                {vaultStatus.is_unlocked ? 'Vault Terbuka' : 'Vault Terkunci'}
              </span>
            </div>
            {vaultStatus.is_unlocked && (
              <button
                onClick={handleLockVault}
                className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Kunci Vault Sekarang"
              >
                Kunci
              </button>
            )}
          </div>
          <div className="mt-2 text-[10px] text-center text-zinc-500 font-mono">
            {platformInfo.storageEngine}
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0f12]">
        {children}
      </main>
    </div>
  );
};
