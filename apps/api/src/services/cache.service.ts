import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class CacheService {
  private redis: Redis | null = null;
  private defaultTTL = 3600; // 1 hour default
  private defaultPrefix = 'crm:';

  constructor(redisConnection?: Redis | null) {
    this.redis = redisConnection || null;
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  /**
   * Generate cache key with prefix
   */
  private getKey(key: string, prefix?: string): string {
    return `${prefix || this.defaultPrefix}${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const cacheKey = this.getKey(key, options.prefix);
      const value = await this.redis!.get(cacheKey);
      
      if (value === null) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const cacheKey = this.getKey(key, options.prefix);
      const ttl = options.ttl || this.defaultTTL;
      const serialized = JSON.stringify(value);
      
      await this.redis!.setex(cacheKey, ttl, serialized);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const cacheKey = this.getKey(key, options.prefix);
      await this.redis!.del(cacheKey);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      const searchPattern = this.getKey(pattern, options.prefix);
      const keys = await this.redis!.keys(searchPattern);
      
      if (keys.length === 0) return 0;
      
      await this.redis!.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fetchFunction();
    await this.set(key, result, options);
    return result;
  }

  /**
   * Increment counter
   */
  async incr(key: string, options: CacheOptions = {}): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      const cacheKey = this.getKey(key, options.prefix);
      const result = await this.redis!.incr(cacheKey);
      
      // Set TTL if this is a new key
      if (result === 1 && options.ttl) {
        await this.redis!.expire(cacheKey, options.ttl);
      }
      
      return result;
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const cacheKey = this.getKey(key, options.prefix);
      const result = await this.redis!.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Set hash field
   */
  async hset(hash: string, field: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const cacheKey = this.getKey(hash, options.prefix);
      const serialized = JSON.stringify(value);
      
      await this.redis!.hset(cacheKey, field, serialized);
      
      if (options.ttl) {
        await this.redis!.expire(cacheKey, options.ttl);
      }
      
      return true;
    } catch (error) {
      console.error('Cache hset error:', error);
      return false;
    }
  }

  /**
   * Get hash field
   */
  async hget<T = any>(hash: string, field: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const cacheKey = this.getKey(hash, options.prefix);
      const value = await this.redis!.hget(cacheKey, field);
      
      if (value === null) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache hget error:', error);
      return null;
    }
  }

  /**
   * Get all hash fields
   */
  async hgetall<T = any>(hash: string, options: CacheOptions = {}): Promise<Record<string, T> | null> {
    if (!this.isAvailable()) return null;

    try {
      const cacheKey = this.getKey(hash, options.prefix);
      const result = await this.redis!.hgetall(cacheKey);
      
      if (Object.keys(result).length === 0) return null;
      
      const parsed: Record<string, T> = {};
      for (const [field, value] of Object.entries(result)) {
        parsed[field] = JSON.parse(value) as T;
      }
      
      return parsed;
    } catch (error) {
      console.error('Cache hgetall error:', error);
      return null;
    }
  }

  /**
   * Cache common database queries
   */
  async cacheProperty(propertyId: string, property: any): Promise<void> {
    await this.set(`property:${propertyId}`, property, { ttl: 1800 }); // 30 minutes
  }

  async getCachedProperty(propertyId: string): Promise<any | null> {
    return await this.get(`property:${propertyId}`);
  }

  async cachePropertyList(filters: string, properties: any[]): Promise<void> {
    const key = `properties:${Buffer.from(filters).toString('base64')}`;
    await this.set(key, properties, { ttl: 600 }); // 10 minutes
  }

  async getCachedPropertyList(filters: string): Promise<any[] | null> {
    const key = `properties:${Buffer.from(filters).toString('base64')}`;
    return await this.get(key);
  }

  async invalidateProperty(propertyId: string): Promise<void> {
    await this.del(`property:${propertyId}`);
    await this.delPattern('properties:*'); // Invalidate all property lists
  }

  async cacheUser(userId: string, user: any): Promise<void> {
    await this.set(`user:${userId}`, user, { ttl: 1800 }); // 30 minutes
  }

  async getCachedUser(userId: string): Promise<any | null> {
    return await this.get(`user:${userId}`);
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.del(`user:${userId}`);
  }

  /**
   * Rate limiting helpers
   */
  async isRateLimited(identifier: string, limit: number, windowSeconds: number): Promise<boolean> {
    if (!this.isAvailable()) return false;

    const key = `rate_limit:${identifier}`;
    const current = await this.incr(key, { ttl: windowSeconds });
    
    return current > limit;
  }

  /**
   * Session caching
   */
  async cacheSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    await this.set(`session:${sessionId}`, data, { ttl });
  }

  async getCachedSession(sessionId: string): Promise<any | null> {
    return await this.get(`session:${sessionId}`);
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  /**
   * Analytics caching
   */
  async cacheAnalytics(key: string, data: any, ttl: number = 3600): Promise<void> {
    await this.set(`analytics:${key}`, data, { ttl });
  }

  async getCachedAnalytics(key: string): Promise<any | null> {
    return await this.get(`analytics:${key}`);
  }

  /**
   * Search result caching
   */
  async cacheSearchResults(query: string, results: any, ttl: number = 600): Promise<void> {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    await this.set(key, results, { ttl });
  }

  async getCachedSearchResults(query: string): Promise<any | null> {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    return await this.get(key);
  }
}
