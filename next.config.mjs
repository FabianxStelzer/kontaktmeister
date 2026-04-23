/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.heygen.com" },
      { protocol: "https", hostname: "**.heygen.ai" },
      { protocol: "https", hostname: "resource.heygen.ai" },
      { protocol: "https", hostname: "files2.heygen.ai" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
