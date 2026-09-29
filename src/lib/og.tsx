import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/brand";

/**
 * Cartão de prévia (1200x630) para WhatsApp/redes. Sem emoji: o renderizador
 * buscaria as figuras na internet em tempo real. O presente é desenhado com
 * formas simples.
 */
export const OG_SIZE = { width: 1200, height: 630 };

function Gift({ size }: { size: number }) {
  const u = size / 10;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: size, height: size }}>
      {/* laço */}
      <div style={{ display: "flex", gap: u * 0.4, marginBottom: -u * 0.2 }}>
        <div style={{ width: u * 2.6, height: u * 1.8, borderRadius: u, background: "#fde047" }} />
        <div style={{ width: u * 2.6, height: u * 1.8, borderRadius: u, background: "#fde047" }} />
      </div>
      {/* tampa */}
      <div style={{ display: "flex", width: u * 9, height: u * 2, background: "#fb7185", borderRadius: u * 0.4, justifyContent: "center" }}>
        <div style={{ width: u * 1.4, height: "100%", background: "#fde047" }} />
      </div>
      {/* caixa */}
      <div style={{ display: "flex", width: u * 8, height: u * 5.4, background: "#f43f5e", justifyContent: "center", borderRadius: u * 0.3 }}>
        <div style={{ width: u * 1.4, height: "100%", background: "#fde047" }} />
      </div>
    </div>
  );
}

export function ogCard({ title, lines, footer }: { title: string; lines: string[]; footer: string }) {
  const shown = title.length > 60 ? `${title.slice(0, 57)}…` : title;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", background: "#e11d48",
          padding: 48, fontFamily: "Geist",
        }}
      >
        <div
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 48, background: "white",
            borderRadius: 40, padding: "48px 64px",
          }}
        >
          <Gift size={260} />
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
            <div style={{ fontSize: 30, color: "#e11d48" }}>{SITE_NAME}</div>
            <div style={{ fontSize: shown.length > 28 ? 56 : 72, color: "#0f172a", lineHeight: 1.1 }}>{shown}</div>
            {lines.map((l) => (
              <div key={l} style={{ fontSize: 34, color: "#334155" }}>
                {l}
              </div>
            ))}
            <div style={{ fontSize: 28, color: "#64748b", marginTop: 12 }}>{footer}</div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
