# CRM Platform Performance Optimization & Caching

## Overview

This document outlines the comprehensive caching solution implemented to optimize your CRM platform performance, especially for image handling and API responses.

## 🚀 What's Been Implemented

### 1. Redis Cache Service (`apps/api/src/services/cache.service.ts`)
- **Comprehensive Redis wrapper** with fallback support
- **Specialized methods** for properties, users, analytics, and search results
- **Rate limiting** and session management
- **Pattern-based cache invalidation**

### 2. Image Optimization Service (`apps/api/src/services/image.service.ts`)
- **Sharp integration** for image processing
- **Automatic variant generation** (thumbnail, small, medium, large, hero)
- **WebP conversion** for better compression
- **Batch processing** capabilities
- **Metadata extraction**

### 3. Cache Middleware (`apps/api/src/middleware/cache.middleware.ts`)
- **API response caching** with TTL control
- **Property-specific caching** (10 min for lists, 30 min for details)
- **Analytics caching** (1 hour)
- **Static file caching** with proper headers
- **Automatic cache invalidation** on data changes

### 4. Frontend Optimization
- **Next.js Image optimization** with WebP/AVIF support
- **Optimized Image component** with variants and lazy loading
- **Frontend caching hook** with stale-while-revalidate
- **Responsive image sizing** and srcset generation

## 📋 Installation Steps

### 1. Install Dependencies

```bash
# Backend dependencies
cd apps/api
npm install sharp@^0.33.0

# If you get build errors, you might need:
npm install @types/sharp@^0.33.0
```

### 2. Environment Configuration

Add to your `.env` file:
```env
# Redis (optional for development)
REDIS_URL=redis://localhost:6379

# API URL for image processing
API_URL=https://wayhome.al
```

### 3. Redis Setup (Production)

For production, ensure Redis is running:
```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Or install locally (Ubuntu/Debian)
sudo apt install redis-server
sudo systemctl start redis-server
```

### 4. Update Upload Routes

The upload routes have been updated to include:
- Image optimization and variant generation
- Metadata extraction
- Cache integration

## 🎯 Performance Improvements

### Image Optimization
- **Automatic WebP conversion** reduces file sizes by 25-35%
- **Multiple variants** serve appropriate sizes for different screens
- **Progressive JPEG** for faster perceived loading
- **Proper cache headers** for 1-year browser caching

### API Caching
- **Property lists**: 10-minute cache (high traffic)
- **Property details**: 30-minute cache (less frequent changes)
- **Analytics**: 1-hour cache (expensive queries)
- **Search results**: 5-minute cache (balance freshness/performance)

### Static Assets
- **Immutable caching** for built assets (1 year)
- **Optimized headers** for images and documents
- **CORS-friendly** serving

## 🛠️ Usage Examples

### Backend: Using Cache Service
```typescript
// In your controller
const cachedData = await cacheService.getOrSet(
  'expensive-query',
  async () => {
    return await prisma.complexQuery();
  },
  { ttl: 1800 } // 30 minutes
);
```

### Frontend: Using Optimized Images
```tsx
import { PropertyImage, HeroImage } from '@/components/ui/optimized-image';

// Property listing
<PropertyImage
  src={property.images[0]}
  alt={property.title}
  variants={property.imageVariants}
  width={400}
  height={300}
/>

// Hero banner
<HeroImage
  src={heroImage}
  alt="Hero"
  variants={heroVariants}
  width={1920}
  height={1080}
/>
```

### Frontend: Using Cache Hook
```tsx
import { useCache, cacheUtils } from '@/hooks/useCache';

function PropertyList() {
  const { data, isLoading, refresh } = useCache(
    cacheUtils.propertyListKey(filters),
    () => apiService.getProperties(filters),
    { ttl: 5 * 60 * 1000 } // 5 minutes
  );
  
  return (
    <div>
      {isLoading && <Spinner />}
      {data?.map(property => <PropertyCard key={property.id} {...property} />)}
    </div>
  );
}
```

## 📊 Expected Performance Gains

### Image Loading
- **60-80% faster** initial load times
- **90% reduction** in bandwidth for repeat visitors
- **Improved SEO** with proper image optimization
- **Better mobile experience** with responsive images

### API Performance
- **50-90% reduction** in database queries for cached endpoints
- **Sub-100ms response times** for cached data
- **Reduced server load** during high traffic
- **Better user experience** with instant data loading

### Overall Platform
- **Faster page loads** (especially property listings)
- **Reduced server costs** through efficient caching
- **Better scalability** for growing user base
- **Improved mobile performance**

## 🔧 Configuration Options

### Cache TTL Settings
```typescript
// Adjust in cache.middleware.ts
const CACHE_DURATIONS = {
  PROPERTIES_LIST: 600,     // 10 minutes
  PROPERTY_DETAILS: 1800,   // 30 minutes
  USER_DATA: 1800,          // 30 minutes
  ANALYTICS: 3600,          // 1 hour
  SEARCH_RESULTS: 300,      // 5 minutes
};
```

### Image Variants
```typescript
// Customize in image.service.ts
const variants = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 200 },
  medium: { width: 600, height: 400 },
  large: { width: 1200, height: 800 },
  hero: { width: 1920, height: 1080 },
};
```

## 🚨 Important Notes

1. **Redis is optional** for development - the system gracefully falls back
2. **Sharp requires native compilation** - ensure build environment supports it
3. **Cache invalidation** happens automatically on data changes
4. **Monitor cache hit rates** in production for optimization
5. **Image variants** are generated asynchronously to avoid blocking uploads

## 🔍 Monitoring & Debugging

### Cache Status Headers
Check response headers for cache status:
- `X-Cache: HIT` - Served from cache
- `X-Cache: MISS` - Fresh data fetched

### Redis Monitoring
```bash
# Connect to Redis CLI
redis-cli

# Check cache size
INFO memory

# View cache keys
KEYS crm:*

# Monitor cache operations
MONITOR
```

## 🎉 Next Steps

1. **Install dependencies** and restart your API server
2. **Configure Redis** for production environment
3. **Test image uploads** to verify optimization
4. **Monitor performance** improvements
5. **Adjust TTL values** based on usage patterns

Your platform should now handle images much faster and provide a significantly better user experience!
