import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

/** The app icon: a radar ring with a signal-orange sweep. */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const s = size === "192" ? 192 : 512;
  const r = s * 0.34;
  return new ImageResponse(
    (
      <div style={{ width: s, height: s, display: "flex", alignItems: "center", justifyContent: "center", background: "#14304a" }}>
        <div style={{ width: r * 2, height: r * 2, borderRadius: "50%", border: `${s * 0.045}px solid #f6f2e9`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ width: r * 1.1, height: r * 1.1, borderRadius: "50%", border: `${s * 0.025}px solid #f6f2e9`, opacity: 0.45, display: "flex" }} />
          <div style={{ position: "absolute", width: s * 0.05, height: r, background: "#f2c200", top: 0, left: r - s * 0.025, display: "flex" }} />
          <div style={{ position: "absolute", width: s * 0.09, height: s * 0.09, borderRadius: "50%", background: "#f1f6f8", display: "flex" }} />
        </div>
      </div>
    ),
    { width: s, height: s },
  );
}
