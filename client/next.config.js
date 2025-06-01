/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // This is important for Netlify deployment
  distDir: '.next',
  // Ensure output is static for Netlify
  output: 'export',
}

module.exports = nextConfig
