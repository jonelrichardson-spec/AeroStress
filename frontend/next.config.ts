import type { NextConfig } from "next";
import path from "path";

const frontendDir = path.resolve(__dirname);

const nextConfig: NextConfig = {
  // Force this directory as the project root (avoids wrong root when parent has a lockfile).
  outputFileTracingRoot: frontendDir,
  webpack: (config, { dev }) => {
    config.resolve.modules = [path.join(frontendDir, "node_modules"), "node_modules"];
    if (dev) config.context = frontendDir;
    return config;
  },
};

export default nextConfig;
