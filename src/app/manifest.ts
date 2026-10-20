import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ready72",
    short_name: "Ready72",
    description: "Know if your household can last 72 hours. Works offline.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f1efe8",
    theme_color: "#f1efe8",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
