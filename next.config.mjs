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
  
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
