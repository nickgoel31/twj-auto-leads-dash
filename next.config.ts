import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // react-pdf uses canvas optionally; avoid browser bundle errors
      canvas: "./empty-module.js",
    },
  },
};

export default nextConfig;
