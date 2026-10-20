import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

/** The app icon: a radar ring with a signal-orange sweep. */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const s = size === "192" ? 192 : 512;
  return new ImageResponse(
    (
      <div style={{ width: s, height: s, display: "flex", alignItems: "center", justifyContent: "center", background: "#14181d" }}>
        <div
          style={{
            width: s * 0.78,
            height: s * 0.78,
            borderRadius: s * 0.18,
            background: "#0b7a4d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `${s * 0.025}px solid #ffffff`,
            color: "#ffffff",
            fontSize: s * 0.36,
            fontWeight: 900,
            letterSpacing: -s * 0.015,
          }}
        >
          72
        </div>
      </div>
    ),
    { width: s, height: s },
  );
}
