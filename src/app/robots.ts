import type { MetadataRoute } from "next";

const SITE_URL = "https://glorydomain.org";

// Allow all crawlers — including AI assistants' crawlers (GPTBot, OAI-SearchBot,
// ChatGPT-User, Google-Extended, PerplexityBot, meta-externalagent, etc.) which
// the "*" rule covers — while keeping the admin area and APIs out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
