/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
  allowedDevOrigins: ["*.replit.dev", "*.sisko.replit.dev"],
};

export default nextConfig;
