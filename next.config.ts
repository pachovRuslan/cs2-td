import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        phaser: "commonjs phaser",
        eventemitter3: "commonjs eventemitter3",
      });
    }
    return config;
  },
};

export default nextConfig;