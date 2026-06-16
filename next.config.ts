import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the bundled Bible JSON is traced into the serverless functions
  // that read it (the Bible chapter + search API routes).
  outputFileTracingIncludes: {
    "/api/bible/**": ["./data/bible/**/*.json"],
  },
};

export default nextConfig;
