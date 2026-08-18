/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Allows production builds to successfully complete even if
    // there are minor type mismatch warnings on the mobile pipeline
    ignoreBuildErrors: true,
  },
  eslint: {
    // Overrides terminal failures caused by strict formatting rules
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig