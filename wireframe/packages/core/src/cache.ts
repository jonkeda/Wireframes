/**
 * Caching System for Wireframe
 * 
 * Provides LRU caching for parsed documents and rendered SVGs
 * to improve performance for repeated operations.
 */

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  size: number;
  hits: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
  hitRate: number;
}

/**
 * LRU Cache implementation
 */
export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private maxEntries: number;
  private currentSize: number = 0;
  private hits: number = 0;
  private misses: number = 0;

  constructor(options: { maxSize?: number; maxEntries?: number } = {}) {
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    this.maxEntries = options.maxEntries || 1000;
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.hits++;
      this.hits++;
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.value;
    }
    this.misses++;
    return undefined;
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: T, size: number = 0): void {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentSize -= existing.size;
      this.cache.delete(key);
    }

    // Evict entries if needed
    while (
      (this.currentSize + size > this.maxSize || this.cache.size >= this.maxEntries) &&
      this.cache.size > 0
    ) {
      this.evictOldest();
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      size,
      hits: 0,
    });
    this.currentSize += size;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a specific entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.currentSize,
      entries: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Evict the oldest (least recently used) entry
   */
  private evictOldest(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.delete(firstKey);
    }
  }
}

/**
 * Generate a cache key from source and options
 */
export function generateCacheKey(source: string, options?: Record<string, unknown>): string {
  let key = hashString(source);
  if (options) {
    key += ':' + hashString(JSON.stringify(options));
  }
  return key;
}

/**
 * Simple string hash function (djb2)
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Parse cache for storing parsed documents
 */
export const parseCache = new LRUCache<{
  document: unknown;
  errors: unknown[];
}>({
  maxEntries: 500,
  maxSize: 5 * 1024 * 1024, // 5MB
});

/**
 * Render cache for storing rendered SVGs
 */
export const renderCache = new LRUCache<string>({
  maxEntries: 200,
  maxSize: 20 * 1024 * 1024, // 20MB for SVGs
});

/**
 * Token cache for storing tokenized results
 */
export const tokenCache = new LRUCache<{
  tokens: unknown[];
  errors: unknown[];
}>({
  maxEntries: 500,
  maxSize: 5 * 1024 * 1024,
});

/**
 * Get all cache stats
 */
export function getAllCacheStats(): {
  parse: CacheStats;
  render: CacheStats;
  token: CacheStats;
} {
  return {
    parse: parseCache.getStats(),
    render: renderCache.getStats(),
    token: tokenCache.getStats(),
  };
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  parseCache.clear();
  renderCache.clear();
  tokenCache.clear();
}
