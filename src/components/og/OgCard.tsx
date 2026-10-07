// Satori: inline styles and flexbox only, no Tailwind.
export const OG_SIZE = { width: 1200, height: 630 };

interface OgCardProps {
  eyebrow: string;
  title: string;
  footer: string;
}

export function OgCard({ eyebrow, title, footer }: OgCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#0b0f14",
        color: "#f6f4ef",
        borderTop: "12px solid #ff5a36",
      }}
    >
      <div style={{ fontSize: 26, letterSpacing: 4, color: "#ff5a36", fontWeight: 700 }}>
        {eyebrow.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: title.length > 60 ? 60 : 72,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: -1.5,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 28, color: "#9aa0a8" }}>{footer}</div>
    </div>
  );
}
