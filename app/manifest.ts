import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Horaire UMONS",
    short_name: "UMONS",
    description: "Consultation rapide de l'horaire UMONS",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: []
  };
}
