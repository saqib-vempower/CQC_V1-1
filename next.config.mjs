/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@google-cloud/firestore'],
    webAssembly: true,
    allowedDevOrigins: [
      'https://6000-firebase-studio-1755087705682.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

export default nextConfig;
