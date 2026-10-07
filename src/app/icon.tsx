import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070605",
          color: "#FFD27A",
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: -3,
        }}
      >
        18
      </div>
    ),
    size,
  );
}
