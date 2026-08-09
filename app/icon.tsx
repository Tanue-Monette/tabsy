import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#183524",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "38px",
        }}
      >
        {/* Storefront icon shape */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {/* Roof */}
          <div
            style={{
              width: "110px",
              height: "36px",
              background: "#aeceb5",
              borderRadius: "8px 8px 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
          {/* Body */}
          <div
            style={{
              width: "96px",
              height: "64px",
              background: "#2f4c39",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {/* Door */}
            <div
              style={{
                width: "28px",
                height: "40px",
                background: "#aeceb5",
                borderRadius: "14px 14px 0 0",
              }}
            />
            {/* Window */}
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "#aeceb5",
                borderRadius: "4px",
              }}
            />
          </div>
          {/* T label */}
          <div
            style={{
              color: "#aeceb5",
              fontSize: "28px",
              fontWeight: 900,
              letterSpacing: "-1px",
              marginTop: "2px",
            }}
          >
            tabsy
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
