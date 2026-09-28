import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícone para "Adicionar à tela de início" no iPhone. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#e11d48" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: -4 }}>
            <div style={{ width: 34, height: 24, borderRadius: 12, background: "#fde047" }} />
            <div style={{ width: 34, height: 24, borderRadius: 12, background: "#fde047" }} />
          </div>
          <div style={{ display: "flex", width: 118, height: 28, background: "#fecdd3", justifyContent: "center", borderRadius: 6 }}>
            <div style={{ width: 18, height: "100%", background: "#fde047" }} />
          </div>
          <div style={{ display: "flex", width: 104, height: 66, background: "#fff1f2", justifyContent: "center", borderRadius: 6 }}>
            <div style={{ width: 18, height: "100%", background: "#fde047" }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
