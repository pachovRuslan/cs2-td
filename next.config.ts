import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // ВАЖНО: отключаем для Phaser (двойной mount убивает WebGL в dev)
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Phaser тянет fs/path из Node — вырезаем на сервере
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