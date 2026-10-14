import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/waiver/", "/account"],
    },
    sitemap: "https://www.cedarsoak.co/sitemap.xml",
  };
}
