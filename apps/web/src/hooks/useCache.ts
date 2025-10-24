import { useState, useEffect, useCallback } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
  key?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class FrontendCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const isStale = now - entry.timestamp > entry.ttl * 0.8; // Consider stale at 80% of TTL
    return isStale;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton cache instance
const frontendCache = new FrontendCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  frontendCache.cleanup();
}, 5 * 60 * 1000);

/**
 * Hook for caching API responses and other data
 */
export function useCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: CacheOptions = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = true,
    key: customKey
  } = options;

  const cacheKey = customKey || key;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      // Check cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cached = frontendCache.get<T>(cacheKey);
        if (cached) {
          setData(cached);
          setIsStale(frontendCache.isStale(cacheKey));
          
          // If stale-while-revalidate is enabled and data is stale, fetch in background
          if (staleWhileRevalidate && frontendCache.isStale(cacheKey)) {
            setIsLoading(true);
            try {
              const freshData = await fetchFunction();
              frontendCache.set(cacheKey, freshData, ttl);
              setData(freshData);
              setIsStale(false);
            } catch (bgError) {
              console.warn('Background refresh failed:', bgError);
            } finally {
              setIsLoading(false);
            }
          }
          return cached;
        }
      }

      // Fetch fresh data
      setIsLoading(true);
      const freshData = await fetchFunction();
      
      // Cache the result
      frontendCache.set(cacheKey, freshData, ttl);
      setData(freshData);
      setIsStale(false);
      
      return freshData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, fetchFunction, ttl, staleWhileRevalidate]);

  const invalidate = useCallback(() => {
    frontendCache.invalidate(cacheKey);
    setData(null);
    setIsStale(false);
  }, [cacheKey]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isStale,
    refresh,
    invalidate,
    fetchData,
  };
}

/**
 * Hook for caching with automatic revalidation
 */
export function useCachedSWR<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: CacheOptions & { revalidateOnFocus?: boolean; revalidateInterval?: number } = {}
) {
  const {
    revalidateOnFocus = false,
    revalidateInterval,
    ...cacheOptions
  } = options;

  const result = useCache(key, fetchFunction, cacheOptions);

  // Revalidate on window focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      result.refresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, result.refresh]);

  // Revalidate on interval
  useEffect(() => {
    if (!revalidateInterval) return;

    const interval = setInterval(() => {
      result.refresh();
    }, revalidateInterval);

    return () => clearInterval(interval);
  }, [revalidateInterval, result.refresh]);

  return result;
}

/**
 * Hook for managing cache globally
 */
export function useCacheManager() {
  const invalidatePattern = useCallback((pattern: string) => {
    frontendCache.invalidatePattern(pattern);
  }, []);

  const clear = useCallback(() => {
    frontendCache.clear();
  }, []);

  const getSize = useCallback(() => {
    return frontendCache.size();
  }, []);

  const cleanup = useCallback(() => {
    frontendCache.cleanup();
  }, []);

  return {
    invalidatePattern,
    clear,
    getSize,
    cleanup,
  };
}

/**
 * Utility functions for cache management
 */
export const cacheUtils = {
  // Property-specific cache keys
  propertyListKey: (filters: Record<string, any>) => 
    `properties:${JSON.stringify(filters)}`,
  
  propertyDetailKey: (id: string) => 
    `property:${id}`,
  
  userKey: (id: string) => 
    `user:${id}`,
  
  // Invalidate related caches when property changes
  invalidatePropertyCaches: (propertyId?: string) => {
    if (propertyId) {
      frontendCache.invalidate(`property:${propertyId}`);
    }
    frontendCache.invalidatePattern('properties:*');
    frontendCache.invalidatePattern('analytics:*');
  },

  // Invalidate user-related caches
  invalidateUserCaches: (userId?: string) => {
    if (userId) {
      frontendCache.invalidate(`user:${userId}`);
    }
    frontendCache.invalidatePattern('user:*');
  },
};
