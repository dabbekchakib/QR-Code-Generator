import { ImageResponse } from "next/og";

export const alt = "QR Manager — Free QR Code Generator & Manager";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const cells = Array.from({ length: 49 }, (_, i) => {
  const r = Math.floor(i / 7);
  const c = i % 7;
  const isFinder =
    (r < 3 && c < 3) ||
    (r < 3 && c >= 4) ||
    (r >= 4 && c < 3);
  if (isFinder) {
    const inCorner = r < 3 && c < 3;
    const topRight = r < 3 && c >= 4;
    const bottomLeft = r >= 4 && c < 3;
    if (inCorner) return r === 0 || r === 2 || c === 0 || c === 2;
    if (topRight) return r === 0 || r === 2 || c === 4 || c === 6;
    if (bottomLeft) return r === 4 || r === 6 || c === 0 || c === 2;
    return false;
  }
  return (r + c) % 3 === 0 || i % 5 === 0;
});

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "96px",
          background: "#0B1120",
          color: "#F8FAFC",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              width: 164,
              gap: 4,
            }}
          >
            {cells.map((on, i) => (
              <div
                key={i}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 2.5,
                  background: on ? "#22C55E" : "#1E293B",
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.5px" }}>
            QR Manager
          </div>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-1px",
            maxWidth: 800,
          }}
        >
          Free QR Code Generator &amp; Manager
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 26,
            color: "#94A3B8",
            maxWidth: 720,
          }}
        >
          Static and dynamic QR codes. Generated locally, with scan analytics.
        </div>
      </div>
    ),
    { ...size }
  );
}