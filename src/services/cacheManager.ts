export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in MB
  defaultTTL: number; // Default time-to-live in ms
  cleanupInterval: number; // Cleanup interval in ms
  enableCompression: boolean;
  enablePersistence: boolean;
  storageKey: string;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  oldestEntry: number;
  newestEntry: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50, // 50MB default
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      enableCompression: false,
      enablePersistence: true,
      storageKey: 'figma-converter-cache',
      ...config
    };

    this.startCleanupInterval();
    
    if (this.config.enablePersistence) {
      this.loadFromStorage();
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      value: this.config.enableCompression ? await this.compress(value) : value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
      size: this.calculateSize(value)
    };

    // Check if we need to evict entries
    await this.ensureCapacity(entry.size);

    this.cache.set(key, entry);

    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    const value = this.config.enableCompression ? 
      await this.decompress(entry.value) : 
      entry.value;

    return value as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
    
    if (this.config.enablePersistence) {
      this.clearStorage();
    }
  }

  // Cache with fallback function
  async getOrSet<T>(
    key: string, 
    fallbackFn: () => Promise<T> | T, 
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fallbackFn();
    await this.set(key, value, ttl);
    return value;
  }

  // Batch operations
  async setMany<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.ttl);
    }
  }

  async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    for (const key of keys) {
      const value = await this.get<T>(key);
      results.set(key, value);
    }

    return results;
  }

  // Cache statistics
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalRequests = this.stats.hits + this.stats.misses;

    return {
      totalEntries: entries.length,
      totalSize: totalSize / (1024 * 1024), // Convert to MB
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0,
      evictionCount: this.stats.evictions,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0
    };
  }

  // Cache optimization
  optimize(): void {
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    });

    // Sort by access frequency and recency
    const sortedEntries = entries
      .filter(([_, entry]) => !this.isExpired(entry))
      .sort((a, b) => {
        const scoreA = this.calculateEntryScore(a[1]);
        const scoreB = this.calculateEntryScore(b[1]);
        return scoreB - scoreA;
      });

    // Keep only the most valuable entries if over capacity
    const maxEntries = Math.floor(this.config.maxSize * 1024 * 1024 / 1000); // Rough estimate
    if (sortedEntries.length > maxEntries) {
      const toRemove = sortedEntries.slice(maxEntries);
      toRemove.forEach(([key]) => {
        this.cache.delete(key);
        this.stats.evictions++;
      });
    }
  }

  // Private methods
  private async ensureCapacity(newEntrySize: number): Promise<void> {
    const currentSize = this.getCurrentSize();
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;

    if (currentSize + newEntrySize > maxSizeBytes) {
      await this.evictLeastValuable(newEntrySize);
    }
  }

  private getCurrentSize(): number {
    return Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
  }

  private async evictLeastValuable(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => this.calculateEntryScore(a[1]) - this.calculateEntryScore(b[1]));

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      this.cache.delete(key);
      this.stats.evictions++;
      freedSpace += entry.size;
      
      if (freedSpace >= requiredSpace) {
        break;
      }
    }
  }

  private calculateEntryScore(entry: CacheEntry): number {
    const age = Date.now() - entry.timestamp;
    const recency = Date.now() - entry.lastAccessed;
    const frequency = entry.accessCount;
    
    // Higher score = more valuable
    return (frequency * 1000) - (age / 1000) - (recency / 1000);
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private calculateSize(value: any): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 1000; // Fallback size estimate
    }
  }

  private async compress<T>(value: T): Promise<T> {
    // Simple compression simulation
    // In a real implementation, you might use a compression library
    return value;
  }

  private async decompress<T>(value: T): Promise<T> {
    // Simple decompression simulation
    return value;
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));

    if (this.config.enablePersistence && expiredKeys.length > 0) {
      this.saveToStorage();
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach((entry: CacheEntry) => {
          if (!this.isExpired(entry)) {
            this.cache.set(entry.key, entry);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.values());
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem(this.config.storageKey);
    } catch (error) {
      console.warn('Failed to clear cache storage:', error);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global cache instance
export const globalCache = new CacheManager({
  maxSize: 100, // 100MB
  defaultTTL: 60 * 60 * 1000, // 1 hour
  enableCompression: false,
  enablePersistence: true
});

// Utility functions
export async function cacheFunction<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
): Promise<T> {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    return globalCache.getOrSet(key, () => fn(...args), ttl);
  }) as T;
}

// React hook component-level caching
import React from 'react';

export function useCache(namespace: string = 'default') {
  const prefixKey = (key: string) => `${namespace}:${key}`;

  const set = React.useCallback(async <T>(key: string, value: T, ttl?: number) => {
    return globalCache.set(prefixKey(key), value, ttl);
  }, [namespace]);

  const get = React.useCallback(async <T>(key: string): Promise<T | null> => {
    return globalCache.get<T>(prefixKey(key));
  }, [namespace]);

  const remove = React.useCallback((key: string) => {
    return globalCache.delete(prefixKey(key));
  }, [namespace]);

  const clear = React.useCallback(() => {
    // Clear only entries with this namespace
    const keys = Array.from(globalCache['cache'].keys())
      .filter(key => key.startsWith(`${namespace}:`));
    
    keys.forEach(key => globalCache.delete(key));
  }, [namespace]);

  return { set, get, remove, clear };
}