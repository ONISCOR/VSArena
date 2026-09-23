import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";

/**
 * Root metadata for the App Router layout.
 */
export function rootMetadata(): Metadata {
  const url = siteUrl();
  return {
    metadataBase: new URL(url),
    title: {
      default: `${SITE_NAME} — stacking eval for embodied policies`,
      template: `%s · ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: ["embodied AI", "VLA", "robotics benchmark", "Rapier", "leaderboard"],
    authors: [{ name: "Aran Kair", url: "https://github.com/arankair" }],
    creator: "Aran Kair",
    publisher: "ONISCOR",
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Per-page title, description, and canonical path.
 */
export function pageMetadata(title: string, description: string, path: string): Metadata {
  const canonical = path.startsWith("/") ? path : `/${path}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url: canonical,
    },
    twitter: {
      title: `${title} · ${SITE_NAME}`,
      description,
    },
  };
}
