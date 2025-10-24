import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    // Add any module rules that need special handling
    rules: {
      '*.{ts,tsx}': ['@swc/plugin-relay']
    }
  },
  
  // External packages for server components
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  
  // Experimental features configuration
  experimental: {
    // Optimize package imports for better performance
    optimizePackageImports: [
      '@radix-ui/*',
      'lucide-react',
      'date-fns',
      'react-apexcharts',
      'recharts',
      'framer-motion'
    ],
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb'
    },
    // Enable optimized CSS
    optimizeCss: true,
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  output: 'standalone',
  compress: true,
  reactStrictMode: true,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
    // Enable incremental compilation
    tsconfigPath: './tsconfig.json'
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Webpack configuration
  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    // Only in development
    if (dev && !isServer) {
      // Improve hot reload performance
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000, // Check for changes every second
        aggregateTimeout: 200, // Delay before rebuilding
        ignored: ['**/node_modules', '**/.next']
      };
    }
    return config;
  },
  
  // Optimization headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
