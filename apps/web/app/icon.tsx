import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation matching the Ajaia Docs wordmark logo
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: "#09090b", // zinc-950 dark background matching the app theme
          color: "#fafafa", // zinc-50 light letter
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          fontWeight: "bold",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        A
      </div>
    ),
    {
      ...size,
    }
  );
}
