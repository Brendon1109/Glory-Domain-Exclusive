import type { MetadataRoute } from "next";

const SITE_URL = "https://glorydomain.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number; freq: "daily" | "weekly" }[] =
    [
      { path: "", priority: 1, freq: "daily" },
      { path: "/bible", priority: 0.8, freq: "weekly" },
      { path: "/bible/search", priority: 0.5, freq: "weekly" },
      { path: "/teachings", priority: 0.8, freq: "daily" },
      { path: "/worship", priority: 0.7, freq: "weekly" },
    ];
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));
}
