import crypto from 'node:crypto';

// Polyfill Node 25 Webpack crypto hash edge-case where undefined is passed to hash.update()
const origCreateHash = crypto.createHash;
crypto.createHash = function (algorithm, options) {
  const hash = origCreateHash.call(crypto, algorithm === 'xxhash64' ? 'sha256' : algorithm, options);
  const origUpdate = hash.update;
  hash.update = function (data, encoding) {
    if (data === undefined) {
      return this;
    }
    return origUpdate.call(this, data, encoding);
  };
  return hash;
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "manifest-src 'self'",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/landing',
        permanent: false,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_ENABLE_TEST_HELPERS:
      process.env.NEXT_PUBLIC_ENABLE_TEST_HELPERS ||
      (process.env.npm_lifecycle_event === 'dev:test' ? 'true' : 'false'),
  },
  webpack: (config) => {
    config.output.hashFunction = 'sha256';
    return config;
  },
};

export default nextConfig;
