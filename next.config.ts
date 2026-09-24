import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Bible API routes read the small files scripts/split-bible.mjs writes
  // under public/bible-data. Vercel serves public/ from its CDN rather than
  // the function's disk, so trace them into the two functions that read them.
  // On Cloudflare Workers the same files are read as static assets instead.
  outputFileTracingIncludes: {
    "/api/bible/chapter": [
      "./public/bible-data/manifest.json",
      "./public/bible-data/chapters/**/*",
    ],
    "/api/bible/search": [
      "./public/bible-data/manifest.json",
      "./public/bible-data/search/**/*",
    ],
  },
};

export default nextConfig;
