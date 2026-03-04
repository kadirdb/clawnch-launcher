import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        net: false,
        tls: false,
      };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      "@clawnch/clawncher-sdk/deployer": path.join(
        process.cwd(),
        "node_modules/@clawnch/clawncher-sdk/dist/deployer.js"
      ),
    };

    return config;
  },
};

export default nextConfig;
