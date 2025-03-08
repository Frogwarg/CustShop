import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5123/api/:path*'
      }
    ]
  },
  images: {
    domains: ['i.ibb.co']
  }
};

export default nextConfig;