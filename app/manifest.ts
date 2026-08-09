import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tabsy - Merchant App",
    short_name: "Tabsy",
    description: "Track customer debts and payments for your shop",
    start_url: "/",
    display: "standalone",
    background_color: "#183524",
    theme_color: "#183524",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
