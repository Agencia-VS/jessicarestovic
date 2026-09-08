import type { MetadataRoute } from "next";
import { urlDelSitio } from "@/lib/entorno";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin" }],
    sitemap: `${urlDelSitio()}/sitemap.xml`,
  };
}
