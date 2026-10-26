import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tales",
    short_name: "Tales",
    description: "A quiet study timer that keeps track of the time you put into each subject.",
    start_url: "/today",
    display: "standalone",
    background_color: "#EAF1E6",
    theme_color: "#EAF1E6",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Plan", url: "/plan" },
      { name: "Subjects", url: "/subjects" },
      { name: "Events", url: "/events" },
      { name: "Settings", url: "/settings" },
    ],
  };
}
