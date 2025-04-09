/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

/** @type {import('next').NextConfig} */

// Log environment detection
console.log("Next.js Build Environment:");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`VERCEL_ENV: ${process.env.VERCEL_ENV}`);
console.log(`VERCEL_URL: ${process.env.VERCEL_URL}`);

// Import env carefully
await import("./src/env.js");

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
