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

    // Allow importing ClawnchDeployer directly (not exported from package barrel)
    config.resolve.alias = {
      ...config.resolve.alias,
      "@clawnch/clawncher-sdk/deployer": path.resolve(
        __dirname,
        "node_modules/@clawnch/clawncher-sdk/dist/deployer.js"
      ),
    };

    return config;
  },
};

export default nextConfig;
