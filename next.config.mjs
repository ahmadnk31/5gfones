/** @type {import('next').NextConfig} */
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "twiiwiyumlvwsgbfthva.supabase.co",
      },
    ],
  },
  // Properly handle ESLint and TypeScript errors during build
  eslint: {
    // Don't fail the build on ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail the build on TypeScript errors
    ignoreBuildErrors: true,
  }
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
