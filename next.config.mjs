/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [
      'https://*.cloudworkstations.dev',
    ],
    asyncWebAssembly: true,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
