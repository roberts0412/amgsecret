import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/brand";

/** Permite "Adicionar à tela inicial" no celular. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Amigo Secreto", // curto: cabe embaixo do ícone no celular
    description: "Sorteio de amigo secreto online, grátis e seguro.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff1f2",
    theme_color: "#e11d48",
    lang: "pt-BR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
