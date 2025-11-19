import NodeCache from 'node-cache';

// In-memory cache with TTL
// stdTTL: Time to live in seconds (default 1 hour)
// checkperiod: Automatic delete check interval in seconds
const cache = new NodeCache({
  stdTTL: 3600, // 1 hour default
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Better performance, don't clone objects
});

/**
 * Cache wrapper for external API calls
 * Caches successful responses to reduce API calls
 */
export const cacheWrapper = async <T>(
  key: string,
  ttl: number,
  fetchFunction: () => Promise<T>
): Promise<T> => {
  // Try to get from cache
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    console.log(`Cache HIT: ${key}`);
    return cached;
  }

  // Cache miss - fetch fresh data
  console.log(`Cache MISS: ${key}`);
  const data = await fetchFunction();

  // Store in cache with TTL
  cache.set(key, data, ttl);

  return data;
};

/**
 * Clear specific cache key
 */
export const clearCache = (key: string): void => {
  cache.del(key);
};

/**
 * Clear all cache
 */
export const clearAllCache = (): void => {
  cache.flushAll();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return cache.getStats();
};

export default cache;
