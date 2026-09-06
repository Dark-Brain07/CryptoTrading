const path = require('path');
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@baseindex/shared'],
  webpack: (config) => {
    config.resolve.fallback = { 
      ...config.resolve.fallback,
      fs: false, 
      net: false, 
      tls: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
      '@x402/evm/upto/client': path.resolve(__dirname, 'src/stubs/x402.js'),
      '@x402/evm/exact/client': path.resolve(__dirname, 'src/stubs/x402.js'),
      '@x402/svm/upto/client': path.resolve(__dirname, 'src/stubs/x402.js'),
      '@x402/svm/exact/client': path.resolve(__dirname, 'src/stubs/x402.js'),
      '@x402/evm': path.resolve(__dirname, 'src/stubs/x402.js'),
      '@x402/svm': path.resolve(__dirname, 'src/stubs/x402.js'),
    };
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^@x402/, path.resolve(__dirname, 'src/stubs/x402.js'))
    );
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
};

module.exports = nextConfig;
