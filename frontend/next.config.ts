import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pub-c637a7f45b544d03991307b2257a3e79.r2.dev" },
      { protocol: "https", hostname: "api.qrserver.com" },
      { protocol: "https", hostname: "mybostonclub.com" }
    ],
  },
};

export default nextConfig;
