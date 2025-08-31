import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Supabase storage, production
      {
        protocol: 'https',
        hostname: 'zszbbhofscgnnkvyonow.supabase.co',
      },
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
      
      // Supabase storage, custom IP (from env)
      {
        protocol: 'http',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME || '[IP_DO_SEU_SERVIDOR]',
      },
      
      // Supabase storage, custom domain (from env)
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_DOMAIN || '[SEU_DOMINIO]',
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
