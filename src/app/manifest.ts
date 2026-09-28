import type { MetadataRoute } from "next";

/** Permite "Adicionar à tela inicial" no celular. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Amigo Secreto",
    short_name: "Amigo Secreto",
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
