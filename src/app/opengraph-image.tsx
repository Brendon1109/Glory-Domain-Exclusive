import { ImageResponse } from "next/og";

export const alt = "Glory Domain — Bible teachings, prayer & worship";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded preview card shown by search engines, social platforms and AI tools.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#1b1a17",
          color: "#f6f4ee",
          padding: "84px",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              border: "3px solid #9a7b3f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9a7b3f",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            GD
          </div>
          <div
            style={{
              color: "#9a7b3f",
              fontSize: 26,
              letterSpacing: 10,
              textTransform: "uppercase",
            }}
          >
            Ministry · Zimbabwe
          </div>
        </div>
        <div style={{ fontSize: 104, fontWeight: 700, marginTop: 36 }}>
          Glory Domain
        </div>
        <div
          style={{
            fontSize: 42,
            color: "rgba(246,244,238,0.72)",
            marginTop: 10,
          }}
        >
          Bible teachings · Prayer · Worship
        </div>
        <div
          style={{
            width: 140,
            height: 6,
            background: "#9a7b3f",
            marginTop: 44,
            borderRadius: 3,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
