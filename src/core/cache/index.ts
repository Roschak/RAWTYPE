import { CacheUsageStats } from '../../types';

export const CACHE_VERSION = 'rawtype-cache-v1.0';

export class CacheManager {
  private editorBuffer: Map<string, string> = new Map();
  private searchCache: Map<string, any> = new Map();
  private dictionaryCache: Map<string, boolean> = new Map();
  private thumbnailCache: Map<string, string> = new Map();
  private sessionCache: Map<string, any> = new Map();

  // Editor Cache
  setEditorBuffer(docId: string, content: string) {
    this.editorBuffer.set(docId, content);
  }

  getEditorBuffer(docId: string): string | undefined {
    return this.editorBuffer.get(docId);
  }

  clearEditorBuffer(docId?: string) {
    if (docId) this.editorBuffer.delete(docId);
    else this.editorBuffer.clear();
  }

  // Search Cache
  setSearchCache(query: string, results: any) {
    this.searchCache.set(query.toLowerCase(), results);
  }

  getSearchCache(query: string): any | undefined {
    return this.searchCache.get(query.toLowerCase());
  }

  clearSearchCache() {
    this.searchCache.clear();
  }

  // Dictionary Cache
  setDictionaryCache(word: string, isProtected: boolean) {
    this.dictionaryCache.set(word.toLowerCase(), isProtected);
  }

  getDictionaryCache(word: string): boolean | undefined {
    return this.dictionaryCache.get(word.toLowerCase());
  }

  clearDictionaryCache() {
    this.dictionaryCache.clear();
  }

  // Thumbnail / Preview Cache
  setThumbnailCache(docId: string, previewText: string) {
    this.thumbnailCache.set(docId, previewText);
  }

  getThumbnailCache(docId: string): string | undefined {
    return this.thumbnailCache.get(docId);
  }

  // Session Cache
  setSession(key: string, value: any) {
    this.sessionCache.set(key, value);
  }

  getSession(key: string): any {
    return this.sessionCache.get(key);
  }

  // Calculate byte usage
  async calculateUsage(): Promise<CacheUsageStats> {
    const calcMapBytes = (map: Map<string, any>) => {
      let bytes = 0;
      for (const [k, v] of map.entries()) {
        bytes += (k.length || 0) * 2;
        bytes += (typeof v === 'string' ? v.length * 2 : JSON.stringify(v || '').length * 2);
      }
      return bytes;
    };

    const editorBytes = calcMapBytes(this.editorBuffer);
    const searchBytes = calcMapBytes(this.searchCache);
    const dictBytes = calcMapBytes(this.dictionaryCache);
    const thumbBytes = calcMapBytes(this.thumbnailCache);
    const sessionBytes = calcMapBytes(this.sessionCache);

    let appCacheBytes = 0;
    if (typeof caches !== 'undefined') {
      try {
        const keys = await caches.keys();
        for (const key of keys) {
          const cache = await caches.open(key);
          const matchAll = await cache.keys();
          appCacheBytes += matchAll.length * 2048; // approximate per cached asset
        }
      } catch {
        appCacheBytes = 1024 * 64;
      }
    }

    const total = editorBytes + searchBytes + dictBytes + thumbBytes + sessionBytes + appCacheBytes;

    return {
      applicationCacheBytes: appCacheBytes,
      editorBufferBytes: editorBytes,
      searchIndexBytes: searchBytes,
      dictionaryCacheBytes: dictBytes,
      thumbnailCacheBytes: thumbBytes,
      sessionCacheBytes: sessionBytes,
      totalBytes: total,
      lastCleaned: new Date().toISOString(),
    };
  }

  // Safe purge: strictly removes ephemeral cache, never touches database or backups!
  async purgeCache(type?: string): Promise<void> {
    if (!type || type === 'all' || type === 'search') {
      this.searchCache.clear();
    }
    if (!type || type === 'all' || type === 'editor') {
      this.editorBuffer.clear();
    }
    if (!type || type === 'all' || type === 'dictionary') {
      this.dictionaryCache.clear();
    }
    if (!type || type === 'all' || type === 'thumbnail') {
      this.thumbnailCache.clear();
    }
    if (!type || type === 'all' || type === 'session') {
      this.sessionCache.clear();
    }
    if (!type || type === 'all' || type === 'app') {
      if (typeof caches !== 'undefined') {
        try {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
        } catch {
          // ignore
        }
      }
    }
  }
}

export const globalCache = new CacheManager();
