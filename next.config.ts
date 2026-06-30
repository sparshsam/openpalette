import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React strict mode for detecting side-effects (already implicit in Next 16)
  reactStrictMode: true,

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Image optimization (for the Extract tab's uploaded images)
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
