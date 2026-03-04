import type { NextConfig } from "next";
import path from "path";

// Force this repo as the workspace root (avoids /Users/pursuit when parent has lockfile).
const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  webpack: (config, { dev }) => {
    config.resolve.modules = [path.join(projectRoot, "node_modules"), "node_modules"];
    if (dev) config.context = projectRoot;
    return config;
  },
};

export default nextConfig;
