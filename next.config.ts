import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Explicitly set monorepo root to silence workspace root warning
  experimental: {},
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
