import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pg", "firebase-admin"],
  },
  allowedDevOrigins: [
    "*.replit.dev",
    "*.sisko.replit.dev",
    "*.pike.replit.dev",
    "*.kirk.replit.dev",
    "*.worf.replit.dev",
  ],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: false,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
