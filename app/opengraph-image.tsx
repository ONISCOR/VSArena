import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VSArena — official open benchmark for embodied policies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Launch OG card (1200×630). Mark = three stacked cubes.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#07080b",
          backgroundImage:
            "radial-gradient(circle at 18% 22%, rgba(0,174,239,0.22) 0%, transparent 42%), radial-gradient(circle at 82% 78%, rgba(225,29,143,0.18) 0%, transparent 40%)",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", width: 72, height: 72, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #3EE0EA 0%, #0077FF 100%)",
                boxShadow: "0 0 18px rgba(0,174,239,0.55)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 18,
                bottom: 18,
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #FFB020 0%, #FF6A00 100%)",
                boxShadow: "0 0 18px rgba(247,148,30,0.5)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 36,
                bottom: 36,
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #FF4DB8 0%, #9B00FF 100%)",
                boxShadow: "0 0 18px rgba(225,29,143,0.5)",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#ffffff", fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>
              VSArena
            </span>
            <span style={{ color: "#8B949E", fontSize: 18, marginTop: 4 }}>product 1.0.0</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 54,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: -1.1,
            }}
          >
            The official open benchmark for embodied policies.
          </div>
          <div style={{ marginTop: 20, color: "#8B949E", fontSize: 24, lineHeight: 1.35 }}>
            Signed results. VLA-only public ELO. A board the client cannot write.
          </div>
        </div>

        <div style={{ display: "flex", color: "#8B949E", fontSize: 20 }}>
          block_stacking.v1 · Rapier 0.20 · 60 Hz · Ed25519 receipts
        </div>
      </div>
    ),
    { ...size },
  );
}
