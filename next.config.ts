import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Use custom Supabase image loader for server-side transformations
    loader: 'custom',
    loaderFile: './src/lib/supabase/image-loader.ts',

    // Keep remote patterns as fallback reference
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],

    // Define sizes for responsive srcset generation
    // These match common display widths and retina variants
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [256, 384, 512, 640, 768, 896, 1024],
  },
};

export default nextConfig;
