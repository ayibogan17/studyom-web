import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/studyo", "/studyo/", "/hocalar", "/uretim", "/openjam", "/iletisim", "/hakkinda"],
        disallow: [
          "/admin",
          "/dashboard",
          "/studio-panel",
          "/teacher-panel",
          "/producer-panel",
          "/messages",
          "/notifications",
          "/login",
          "/signup",
          "/studio-login",
          "/studio-signup",
          "/auth",
          "/verify",
          "/onboarding",
          "/profile",
        ],
      },
    ],
    sitemap: "https://www.studyom.net/sitemap.xml",
    host: "https://www.studyom.net",
  };
}
