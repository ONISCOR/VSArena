import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Allow indexing of the public product; skip auth and APIs.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/account", "/test-simulazione-avanzata"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
