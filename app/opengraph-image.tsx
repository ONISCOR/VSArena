import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VSArena — browser stacking eval for embodied policies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Launch OG card (1200×630) for HN, X, and Slack unfurls.
 *
 * @example fetched as /opengraph-image
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
            "radial-gradient(circle at 12% 18%, rgba(0,174,239,0.28) 0%, transparent 42%), radial-gradient(circle at 88% 82%, rgba(247,148,30,0.22) 0%, transparent 40%)",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ color: "#00AEEF", fontSize: 40, fontWeight: 700 }}>V</span>
          <span style={{ color: "#F7941E", fontSize: 40, fontWeight: 700 }}>S</span>
          <span style={{ color: "#ffffff", fontSize: 36, fontWeight: 600, marginLeft: 14 }}>Arena</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 62,
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: -1.2,
            }}
          >
            Test an embodied policy on a stacking task.
          </div>
          <div style={{ marginTop: 22, color: "#8B949E", fontSize: 26, lineHeight: 1.35 }}>
            Studio v0.6.0 is live. 1v1 Arena is not. Scores come from the harness.
          </div>
        </div>
        <div style={{ display: "flex", color: "#8B949E", fontSize: 22 }}>
          Open source · Rapier 60 Hz · VLA camera 5 Hz
        </div>
      </div>
    ),
    { ...size },
  );
}
