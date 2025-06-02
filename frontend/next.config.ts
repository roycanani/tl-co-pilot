import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compiler: {
    removeConsole: false,
  },
  onDemandEntries: {
    // This forces server to log in production
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  /* config options here */
};

export default nextConfig;
