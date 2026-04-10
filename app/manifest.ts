import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RSS Bullish Alerts",
    short_name: "RSS Alerts",
    description: "DART와 SEC 호재 공시 알림 웹앱",
    start_url: "/dart",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#29a3ff",
    lang: "ko",
  };
}
