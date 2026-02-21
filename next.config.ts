import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xpzkixpgrmfltuomqego.supabase.co',
      },
    ],
  },
};

export default nextConfig;
