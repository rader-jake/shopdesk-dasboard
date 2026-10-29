import type { MetadataRoute } from "next";

// Client dashboards are hidden from search with a noindex tag in the root layout; the public pages opt back in.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://shopdesk.ai/sitemap.xml",
  };
}
