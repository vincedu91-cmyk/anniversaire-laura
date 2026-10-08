import type { MetadataRoute } from "next";

// Pages privées, jamais indexées (elles portent aussi une balise noindex).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/invitation", "/gestion-invitations", "/moderation", "/livre-d-or", "/projection"],
    },
  };
}
