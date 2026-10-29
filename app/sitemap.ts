import type { MetadataRoute } from "next";

// Only the public pages. Client dashboards are noindex and intentionally not listed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://shopdesk.ai/", changeFrequency: "monthly", priority: 1 },
    { url: "https://shopdesk.ai/beauty", changeFrequency: "monthly", priority: 0.6 },
  ];
}
