# Image Loading Performance Fix

## Issues Found

1. **CRM pages use regular `<img>` tags** - No automatic optimization or lazy loading
2. **Images not compressed** - Large file sizes
3. **No CDN/Caching** - Images loaded fresh every time
4. **Full-size images everywhere** - No responsive variants

## Quick Fixes (Apply on Server)

### 1. Enable Image Compression on Nginx

Add to your nginx config (`/etc/nginx/sites-available/your-site`):

```nginx
# Image compression
location ~* \.(jpg|jpeg|png|gif|webp|svg)$ {
    # Enable gzip compression for images
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types image/jpeg image/png image/gif image/svg+xml image/webp;
    
    # Cache images for 1 year
    expires 1y;
    add_header Cache-Control "public, immutable";
    
    # Enable keep-alive
    tcp_nodelay on;
    tcp_nopush on;
}

# API uploads location with compression
location /api/v1/uploads/ {
    proxy_pass http://localhost:4001;
    
    # Compression
    gzip on;
    gzip_comp_level 6;
    gzip_types image/jpeg image/png image/gif image/webp;
    
    # Caching
    proxy_cache_valid 200 1y;
    add_header X-Cache-Status $upstream_cache_status;
}
```

Then restart nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 2. Compress Existing Images

Run this on your server to compress existing images:

```bash
# Install image optimization tools
sudo apt-get update
sudo apt-get install -y jpegoptim optipng webp

# Navigate to uploads directory
cd /path/to/crm/apps/api/uploads/images

# Compress JPG images (75% quality)
find . -name "*.jpg" -type f -exec jpegoptim --max=75 --strip-all --preserve --totals {} \;

# Compress PNG images
find . -name "*.png" -type f -exec optipng -o2 -preserve {} \;

# Convert large images to WebP (better compression)
for file in *.jpg *.jpeg *.png; do
    if [ -f "$file" ]; then
        cwebp -q 80 "$file" -o "${file%.*}.webp"
    fi
done
```

### 3. Add Lazy Loading to Images

The images in CRM should use loading="lazy". This is a quick fix that doesn't require rebuilding.

### 4. Enable HTTP/2

Check if HTTP/2 is enabled in nginx:
```bash
# In your nginx server block, ensure you have:
listen 443 ssl http2;
```

## Performance Expected

- **Before**: 2-5s per image load
- **After**: 200-500ms per image load

## Server-Side Quick Commands

```bash
# SSH into server
ssh user@wayhome.al

# 1. Install compression tools
sudo apt-get update && sudo apt-get install -y jpegoptim optipng webp

# 2. Backup images first!
cd /path/to/crm/apps/api/uploads
tar -czf images-backup-$(date +%Y%m%d).tar.gz images/

# 3. Compress all images
cd images
find . -name "*.jpg" -o -name "*.jpeg" | xargs -P 4 jpegoptim --max=75 --strip-all --preserve
find . -name "*.png" | xargs -P 4 optipng -o2 -preserve

# 4. Update nginx config
sudo nano /etc/nginx/sites-available/your-site
# (Add the config from above)

# 5. Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx
```

## Code Fixes (For Later Deployment)

Replace regular img tags with Next.js Image in `ImageUploadGallery.tsx`:

```tsx
// Instead of:
<img src={url} alt="..." />

// Use:
<Image src={url} alt="..." width={200} height={200} loading="lazy" />
```

## Check Results

After applying fixes, test image load time:
```bash
# Test image load time
curl -o /dev/null -s -w "Time: %{time_total}s\n" https://wayhome.al/api/v1/uploads/images/yourimage.jpg
```

Good time: < 0.5s

