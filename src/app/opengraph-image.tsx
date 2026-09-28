import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "Amigo secreto online e grátis";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    title: "Sorteio online e grátis",
    lines: ["Convide pelo WhatsApp", "Cada um vê só quem tirou"],
    footer: "Lista de desejos e mensagens anônimas",
  });
}
