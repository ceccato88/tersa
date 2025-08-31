import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Supabase storage, current environment
      {
        protocol: 'https',
        hostname: 'ydaxspkdulvastqoriwr.supabase.co',
      },

      // Supabase storage, development
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      
      // Supabase storage, localhost
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      
      // Replicate delivery URLs
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  // biome-ignore lint/suspicious/useAwait: "rewrites is async"
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ];
  },
};

export default nextConfig;
