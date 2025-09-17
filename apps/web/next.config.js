/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com', 'res.cloudinary.com', 'wayhome.al'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1',
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:4000',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  },
  async rewrites() {
    return [
      {
        source: '/crm/:path*',
        destination: '/crm/:path*',
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
};

module.exports = nextConfig;
