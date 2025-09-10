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
      
      // Supabase storage, new environment
      {
        protocol: 'https',
        hostname: 'foglxyygivkxwwawkgwu.supabase.co',
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
      
      // API storage local
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/storage/**',
      },
      
      
      // Placeholder images for mock/testing
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Temporariamente manter via.placeholder.com para dados antigos
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },

    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
