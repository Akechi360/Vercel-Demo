import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Optimización para desarrollo
  reactStrictMode: true,
  // Configuración de TypeScript
  typescript: {
    ignoreBuildErrors: true,
    // Habilita la compilación incremental
    tsconfigPath: './tsconfig.json'
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
  
  // ⚡ Optimizaciones de performance
  experimental: {
    optimizePackageImports: [
      '@/components', 
      '@/lib', 
      'lucide-react', 
      'date-fns',
      '@radix-ui/*',
      'react-apexcharts',
      'recharts',
      'framer-motion'
    ],
    // Habilita la compresión en desarrollo
    gzipSize: true,
    // Mejora el rendimiento del módulo de nodo
    esmExternals: 'loose',
  },
  
  // Configuración de Webpack
  webpack: (config, { dev, isServer }) => {
    // Solo en desarrollo
    if (dev && !isServer) {
      // Mejora el rendimiento del hot reload
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000, // Verifica cambios cada segundo
        aggregateTimeout: 200, // Retraso antes de reconstruir
        ignored: ['**/node_modules', '**/.next']
      };
    }
    return config;
  },
  
  
  // Headers de optimización
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
