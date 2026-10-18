import type { MetadataRoute } from "next";

/**
 * Web app manifest (design Section 12.3). Served by Next as /manifest.webmanifest.
 * Brand token: emerald accent (#0e9f6e) with a near-white light background.
 * All copy is Indonesian and emoji-free.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Heula",
    short_name: "Heula",
    description:
      "Teman puasa kamu buat atur jadwal intermittent fasting dan pantau progres, langsung dari HP.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f8",
    theme_color: "#0e9f6e",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
