import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Family Finances",
    short_name: "Finances",
    description: "Shared household income and expenses",
    start_url: "/",
    display: "standalone",
    background_color: "#F3EEE6",
    theme_color: "#0F3D3E",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
