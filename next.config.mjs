/** @type {import('next').NextConfig} */
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "twiiwiyumlvwsgbfthva.supabase.co",
      },
    ],
    // SEO optimization for images
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // SEO optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,  // Properly handle ESLint and TypeScript errors during build
  eslint: {
    // Don't fail the build on ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail the build on TypeScript errors
    ignoreBuildErrors: true,
  },
  // Configure page generation
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Skip static generation for admin routes
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // SEO headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  // Redirect configuration for SEO
  async redirects() {
    return [
      // Add any necessary redirects here
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
