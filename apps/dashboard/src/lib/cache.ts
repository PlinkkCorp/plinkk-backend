/**
 * Lib Cache
 * - SimpleCache -> Class
 * - themeCache -> Instance
 * - userCache -> Instance
 */

/**
 * Interface for a cache entry
 * @template T The type of the value being cached
 */
interface CacheEntry<T> {
  value: T;
  expiry: number;
}

/**
 * Simple in-memory cache with LRU eviction policy
 * @template T The type of the value being cached
 */
class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number;

  constructor(options: { maxSize?: number; ttl?: number } = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 60000;
  }

  /**
   * Retrieves a value from the cache
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Adds or updates a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Optional time-to-live in milliseconds (overrides default ttl)
   */
  set(key: string, value: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      expiry: Date.now() + (ttl || this.ttl),
    });
  }

  /**
   * Deletes a value from the cache
   * @param key The cache key
   * @returns True if the value was deleted, false otherwise
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Checks if a key exists in the cache and is not expired
   * @param key The cache key
   * @returns True if the key exists and is not expired, false otherwise
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
}

/**
 * Cache for theme data
 */
export const themeCache = new SimpleCache<any>({ maxSize: 100, ttl: 60000 });

/**
 * Cache for user data
 */
export const userCache = new SimpleCache<any>({ maxSize: 500, ttl: 30000 });
