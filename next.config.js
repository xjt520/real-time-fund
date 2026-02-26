/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  output: 'export',
  basePath: '/real-time-fund',
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
