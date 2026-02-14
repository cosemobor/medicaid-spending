/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@libsql/client'],
  turbopack: {
    root: __dirname,
  },
  typescript: {
    // drizzle.config.ts references drizzle-kit (dev only)
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
