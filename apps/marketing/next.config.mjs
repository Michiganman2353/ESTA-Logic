/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable static exports for SSG
  output: 'export',
  // Configure image optimization for static export
  images: {
    unoptimized: true
  },
  // Disable ESLint during build (we run it separately)
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
