import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Static export (required for S3 hosting):
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
