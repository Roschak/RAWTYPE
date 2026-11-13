import { StorageAdapter } from './contracts';
import { DesktopSQLiteAdapter } from './desktopSQLiteAdapter';
import { WebIndexedDBAdapter } from './indexedDBAdapter';
import { PlatformInfo } from '../../types';

let currentAdapter: StorageAdapter | null = null;

export const isDesktopTauri =
  typeof window !== 'undefined' &&
  ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

export function getPlatformInfo(): PlatformInfo {
  const isDesktop = isDesktopTauri;
  const isPWA =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true);

  return {
    isDesktop,
    isWeb: !isDesktop,
    isPWA,
    platformName: isDesktop ? 'Windows Desktop' : isPWA ? 'Progressive Web App (PWA)' : 'Web Application',
    storageEngine: isDesktop ? 'SQLite (Native Desktop)' : 'IndexedDB (Browser Local-First)',
    offlineReady: true,
  };
}

export async function getStorageAdapter(): Promise<StorageAdapter> {
  if (currentAdapter) return currentAdapter;

  if (isDesktopTauri) {
    currentAdapter = new DesktopSQLiteAdapter();
  } else {
    currentAdapter = new WebIndexedDBAdapter();
  }

  await currentAdapter.initialize();
  return currentAdapter;
}
