import type { MetadataRoute } from "next";

const PRIVATE_PATHS = [
  "/dashboard",
  "/habits",
  "/checkin",
  "/coach",
  "/cookie-jar",
  "/challenges",
  "/analytics",
  "/settings",
  "/upgrade",
  "/onboarding",
  "/api",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: "https://mindforge.app/sitemap.xml",
  };
}
