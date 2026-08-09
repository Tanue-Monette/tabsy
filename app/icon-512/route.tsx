import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#183524",
          width: "512px",
          height: "512px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "102px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Roof */}
          <div
            style={{
              width: "300px",
              height: "96px",
              background: "#aeceb5",
              borderRadius: "20px 20px 0 0",
            }}
          />
          {/* Body */}
          <div
            style={{
              width: "260px",
              height: "172px",
              background: "#2f4c39",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
            }}
          >
            {/* Door */}
            <div
              style={{
                width: "76px",
                height: "108px",
                background: "#aeceb5",
                borderRadius: "38px 38px 0 0",
              }}
            />
            {/* Window */}
            <div
              style={{
                width: "76px",
                height: "76px",
                background: "#aeceb5",
                borderRadius: "10px",
              }}
            />
          </div>
          {/* Label */}
          <div
            style={{
              color: "#aeceb5",
              fontSize: "76px",
              fontWeight: 900,
              letterSpacing: "-2px",
              marginTop: "8px",
            }}
          >
            tabsy
          </div>
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
