import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "nortoo Blog";
  const cat = searchParams.get("cat") ?? "guide";

  const catColors: Record<string, string> = {
    guide: "#00E5A0",
    industry: "#3B82F6",
    product: "#F59E0B",
    news: "#F43F5E",
    "case-study": "#8B5CF6",
  };

  const catLabels: Record<string, string> = {
    guide: "GUIDE",
    industry: "INDUSTRIE",
    product: "PRODUIT",
    news: "ACTUALITÉS",
    "case-study": "ÉTUDE DE CAS",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          background:
            "linear-gradient(135deg, #0A0A0B 0%, #111113 50%, #0D1508 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            textTransform: "uppercase" as const,
            letterSpacing: "0.1em",
            color: catColors[cat] ?? "#00E5A0",
            marginBottom: 16,
          }}
        >
          {catLabels[cat] ?? cat.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "#FAFAFA",
            maxWidth: "90%",
          }}
        >
          {title.length > 80 ? title.slice(0, 77) + "..." : title}
        </div>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FAFAFA" }}>
            nortoo<span style={{ color: "#00E5A0" }}>.</span>
          </div>
          <div style={{ fontSize: 14, color: "#71717A" }}>blog</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
