/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "images.pexels.com",
      "firebasestorage.googleapis.com",
      "i.pinimg.com",
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin"],
  },
};

module.exports = nextConfig;
