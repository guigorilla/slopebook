import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@slopebook/skimatch"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
