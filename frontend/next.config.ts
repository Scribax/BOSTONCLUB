import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pub-9a3768e385524a358c2dc7b00c3a2e75.r2.dev" },
      { protocol: "https", hostname: "api.qrserver.com" },
      { protocol: "https", hostname: "mybostonclub.com" }
    ],
  },
};

export default nextConfig;
