/**
 * Cache Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LRUCache,
  generateCacheKey,
  parseCache,
  renderCache,
  tokenCache,
  getAllCacheStats,
  clearAllCaches,
} from './cache';

describe('LRUCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>({ maxEntries: 5, maxSize: 1000 });
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('missing')).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('missing')).toBe(false);
    });

    it('should delete entries', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entries when full', () => {
      // Fill cache to capacity
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');
      
      // Add one more - should evict key1
      cache.set('key6', 'value6');
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key6')).toBe(true);
    });

    it('should update LRU order on get', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');
      
      // Access key1 to make it recently used
      cache.get('key1');
      
      // Add new entry - should evict key2 (now oldest)
      cache.set('key6', 'value6');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should track hits and misses', () => {
      cache.set('key1', 'value1');
      
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('missing'); // miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });

    it('should track entry count', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      expect(stats.entries).toBe(2);
    });
  });
});

describe('generateCacheKey', () => {
  it('should generate consistent keys for same input', () => {
    const key1 = generateCacheKey('source', { width: 800 });
    const key2 = generateCacheKey('source', { width: 800 });
    expect(key1).toBe(key2);
  });

  it('should generate different keys for different input', () => {
    const key1 = generateCacheKey('source1');
    const key2 = generateCacheKey('source2');
    expect(key1).not.toBe(key2);
  });

  it('should include options in key', () => {
    const key1 = generateCacheKey('source', { width: 800 });
    const key2 = generateCacheKey('source', { width: 1000 });
    expect(key1).not.toBe(key2);
  });
});

describe('Global caches', () => {
  beforeEach(() => {
    clearAllCaches();
  });

  it('should have parseCache available', () => {
    expect(parseCache).toBeDefined();
  });

  it('should have renderCache available', () => {
    expect(renderCache).toBeDefined();
  });

  it('should have tokenCache available', () => {
    expect(tokenCache).toBeDefined();
  });

  it('should get all cache stats', () => {
    const stats = getAllCacheStats();
    expect(stats.parse).toBeDefined();
    expect(stats.render).toBeDefined();
    expect(stats.token).toBeDefined();
  });

  it('should clear all caches', () => {
    renderCache.set('test', 'value');
    clearAllCaches();
    expect(renderCache.has('test')).toBe(false);
  });
});
