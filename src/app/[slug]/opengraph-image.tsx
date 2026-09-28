import { ogCard, OG_SIZE } from "@/lib/og";
import { getSeoPage, SEO_PAGES } from "@/lib/seo-pages";

export const alt = "Amigo secreto online e grátis";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return SEO_PAGES.map((p) => ({ slug: p.slug }));
}

/** Prévia própria de cada página de SEO (título da página no cartão). */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const page = getSeoPage((await params).slug);
  return ogCard({
    title: page?.h1 ?? "Amigo secreto online",
    lines: ["Grátis e sem cadastro", "Convite pelo WhatsApp"],
    footer: "Cada um vê só quem tirou",
  });
}
