import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // destination: 'http://localhost:5123/api/:path*'
        // destination: 'http://192.168.100.82:5123/api/:path*'//домашний
        destination: 'http://192.168.0.22:5123/api/:path*' //водоканал
      }
    ]
  },
  images: {
    domains: ['i.ibb.co']
  },
};

export default nextConfig;