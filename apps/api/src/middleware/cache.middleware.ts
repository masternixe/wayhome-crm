import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../services/cache.service';

export interface CacheMiddlewareOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
  prefix?: string;
}

/**
 * Cache middleware factory
 */
export function createCacheMiddleware(
  cacheService: CacheService,
  options: CacheMiddlewareOptions = {}
) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    condition = (req, res) => req.method === 'GET' && res.statusCode === 200,
    prefix = 'api:'
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching if Redis is not available
    if (!cacheService.isAvailable()) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    // Try to get from cache
    try {
      const cached = await cacheService.get(cacheKey, { prefix });
      if (cached) {
        console.log(`Cache HIT: ${cacheKey}`);
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', 'public, max-age=300');
        return res.json(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function(data: any) {
      // Check if we should cache this response
      if (condition(req, res) && res.statusCode >= 200 && res.statusCode < 300) {
        // Cache the response asynchronously
        cacheService.set(cacheKey, data, { ttl, prefix }).catch((error) => {
          console.error('Cache write error:', error);
        });
        
        console.log(`Cache MISS: ${cacheKey}`);
        res.set('X-Cache', 'MISS');
      }
      
      res.set('Cache-Control', 'public, max-age=300');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Property list cache middleware
 */
export function createPropertyCacheMiddleware(cacheService: CacheService) {
  return createCacheMiddleware(cacheService, {
    ttl: 600, // 10 minutes
    keyGenerator: (req) => {
      const query = new URLSearchParams(req.query as any).toString();
      return `properties:${Buffer.from(query).toString('base64')}`;
    },
    prefix: 'api:',
    condition: (req, res) => req.method === 'GET' && res.statusCode === 200
  });
}

/**
 * Property details cache middleware
 */
export function createPropertyDetailsCacheMiddleware(cacheService: CacheService) {
  return createCacheMiddleware(cacheService, {
    ttl: 1800, // 30 minutes
    keyGenerator: (req) => `property:${req.params.id}`,
    prefix: 'api:',
    condition: (req, res) => req.method === 'GET' && res.statusCode === 200
  });
}

/**
 * User cache middleware
 */
export function createUserCacheMiddleware(cacheService: CacheService) {
  return createCacheMiddleware(cacheService, {
    ttl: 1800, // 30 minutes
    keyGenerator: (req) => `user:${req.params.id}`,
    prefix: 'api:',
    condition: (req, res) => req.method === 'GET' && res.statusCode === 200
  });
}

/**
 * Analytics cache middleware
 */
export function createAnalyticsCacheMiddleware(cacheService: CacheService) {
  return createCacheMiddleware(cacheService, {
    ttl: 3600, // 1 hour
    keyGenerator: (req) => {
      const query = new URLSearchParams(req.query as any).toString();
      return `analytics:${req.path}:${Buffer.from(query).toString('base64')}`;
    },
    prefix: 'api:',
    condition: (req, res) => req.method === 'GET' && res.statusCode === 200
  });
}

/**
 * Search results cache middleware
 */
export function createSearchCacheMiddleware(cacheService: CacheService) {
  return createCacheMiddleware(cacheService, {
    ttl: 300, // 5 minutes
    keyGenerator: (req) => {
      const query = new URLSearchParams(req.query as any).toString();
      return `search:${Buffer.from(query).toString('base64')}`;
    },
    prefix: 'api:',
    condition: (req, res) => req.method === 'GET' && res.statusCode === 200
  });
}

/**
 * Cache invalidation middleware
 */
export function createCacheInvalidationMiddleware(
  cacheService: CacheService,
  patterns: string[] | ((req: Request) => string[])
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const invalidateCache = async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const patternsToInvalidate = typeof patterns === 'function' 
            ? patterns(req) 
            : patterns;

          for (const pattern of patternsToInvalidate) {
            await cacheService.delPattern(pattern, { prefix: 'api:' });
          }
          
          console.log(`Cache invalidated for patterns:`, patternsToInvalidate);
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      }
    };

    // Override response methods
    res.json = function(data: any) {
      invalidateCache();
      return originalJson(data);
    };

    res.send = function(data: any) {
      invalidateCache();
      return originalSend(data);
    };

    next();
  };
}

/**
 * Static file cache middleware
 */
export function createStaticCacheMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set cache headers for static files
    if (req.path.match(/\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$/)) {
      // Cache static assets for 1 year
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      res.set('Expires', new Date(Date.now() + 31536000000).toUTCString());
    } else if (req.path.match(/\.(html|json)$/)) {
      // Cache HTML and JSON for 1 hour
      res.set('Cache-Control', 'public, max-age=3600');
      res.set('Expires', new Date(Date.now() + 3600000).toUTCString());
    } else {
      // Default cache for other files
      res.set('Cache-Control', 'public, max-age=300');
      res.set('Expires', new Date(Date.now() + 300000).toUTCString());
    }

    next();
  };
}

/**
 * Rate limiting middleware with Redis
 */
export function createRateLimitMiddleware(
  cacheService: CacheService,
  options: {
    windowMs: number;
    max: number;
    keyGenerator?: (req: Request) => string;
  }
) {
  const {
    windowMs,
    max,
    keyGenerator = (req) => req.ip || 'unknown'
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!cacheService.isAvailable()) {
      return next();
    }

    const key = keyGenerator(req);
    const windowSeconds = Math.floor(windowMs / 1000);

    try {
      const isLimited = await cacheService.isRateLimited(key, max, windowSeconds);
      
      if (isLimited) {
        res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later.',
          error: 'RATE_LIMITED'
        });
        return;
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue on error to avoid blocking requests
    }

    next();
  };
}
