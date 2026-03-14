import { L_COLORS, L_FONTS } from "./landingTheme";

// Inline SVG icons — 24x24 line-art, accent stroke
const Icons = {
  canvas: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="7" height="10" rx="2" />
      <rect x="14" y="9" width="7" height="10" rx="2" />
      <path d="M10 10 C12 10, 12 14, 14 14" strokeDasharray="2.5 2" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    </svg>
  ),
  hotspot: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="12" rx="3" />
      <rect x="7" y="9" width="5" height="3" rx="1.5" strokeDasharray="0" fill="rgba(124,111,234,0.18)" />
      <path d="M14 10.5 h3" />
      <path d="M14 12.5 h2" />
    </svg>
  ),
  ai: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 17 L4 7 L8 7 L12 13 L16 7 L20 7 L20 17" />
      <path d="M9 17 L15 17" />
      <circle cx="20" cy="17" r="1.5" fill="currentColor" strokeWidth="0" />
    </svg>
  ),
  branch: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="7" r="2" />
      <circle cx="18" cy="17" r="2" />
      <path d="M8 12 C12 12, 12 7, 16 7" />
      <path d="M8 12 C12 12, 12 17, 16 17" />
    </svg>
  ),
  local: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 12 L11 15 L16 9" />
    </svg>
  ),
  undo: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8 L8 4 L8 8" />
      <path d="M8 4 C14 4, 20 8, 20 14 C20 18, 16 20, 12 20 C8 20, 5 18, 4 15" />
    </svg>
  ),
};

const FEATURES = [
  {
    key: "canvas",
    icon: Icons.canvas,
    title: "Visual Flow Design",
    description:
      "Upload screen images and arrange them on an infinite canvas. Draw connections to map every navigation path at a glance.",
    span: 2,
    highlight: true,
  },
  {
    key: "hotspot",
    icon: Icons.hotspot,
    title: "Hotspot Tap Areas",
    description:
      "Draw precise tap areas on each screen. Define what happens — navigate, open modal, call API, conditional branch.",
    span: 1,
  },
  {
    key: "local",
    icon: Icons.local,
    title: "Local-First",
    description:
      "All state lives in a local .drawd file. No cloud, no accounts, no data leaves your machine. Auto-saves as you work.",
    span: 1,
  },
  {
    key: "ai",
    icon: Icons.ai,
    title: "AI Build Instructions",
    description:
      "Export a structured ZIP of markdown files that an LLM can use to generate SwiftUI, Flutter, React Native, or Jetpack Compose code.",
    span: 2,
    highlight: true,
  },
  {
    key: "branch",
    icon: Icons.branch,
    title: "Conditional Branching",
    description:
      "Model complex flows with drag-to-create conditional branches. Label each path and export structured navigation logic.",
    span: 1,
  },
  {
    key: "undo",
    icon: Icons.undo,
    title: "Full Undo / Redo",
    description:
      "Every action is undoable — screen moves, hotspot edits, connection reroutes. Continuous drags produce a single undo step.",
    span: 1,
  },
];

function FeatureCard({ icon, title, description, span, highlight, delay }) {
  return (
    <div
      className="feature-card reveal"
      style={{
        gridColumn: `span ${span}`,
        background: highlight
          ? `linear-gradient(135deg, rgba(124,111,234,0.07) 0%, rgba(124,111,234,0.02) 100%)`
          : L_COLORS.surfaceCard,
        border: `1px solid ${highlight ? "rgba(124,111,234,0.2)" : L_COLORS.border}`,
        borderRadius: 14,
        padding: span === 2 ? "32px 28px" : "28px 24px",
        cursor: "default",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: `rgba(124,111,234,0.12)`,
          border: `1px solid rgba(124,111,234,0.2)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: L_COLORS.accentLight,
          marginBottom: 18,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: L_FONTS.heading,
          fontWeight: 600,
          fontSize: 16,
          color: L_COLORS.text,
          margin: "0 0 10px",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: L_FONTS.ui,
          fontSize: 14,
          color: L_COLORS.textMuted,
          lineHeight: 1.65,
          margin: 0,
          maxWidth: 360,
        }}
      >
        {description}
      </p>
    </div>
  );
}

export default function Features() {
  return (
    <section
      id="features"
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "80px 40px",
        boxSizing: "border-box",
      }}
    >
      {/* Section label */}
      <div
        className="reveal"
        style={{
          fontFamily: L_FONTS.mono,
          fontSize: 11,
          fontWeight: 500,
          color: L_COLORS.amber,
          letterSpacing: "0.1em",
          marginBottom: 16,
        }}
      >
        FEATURES
      </div>

      <h2
        className="reveal"
        style={{
          fontFamily: L_FONTS.heading,
          fontWeight: 700,
          fontSize: "clamp(22px, 3.5vw, 34px)",
          color: L_COLORS.text,
          margin: "0 0 12px",
          letterSpacing: "-0.03em",
          transitionDelay: "60ms",
        }}
      >
        Everything you need to plan an app
      </h2>
      <p
        className="reveal"
        style={{
          fontFamily: L_FONTS.ui,
          fontSize: 15,
          color: L_COLORS.textMuted,
          margin: "0 0 52px",
          lineHeight: 1.6,
          maxWidth: 500,
          transitionDelay: "100ms",
        }}
      >
        Purpose-built for mobile app navigation flows — not a general whiteboard tool.
      </p>

      {/* Bento grid */}
      <div
        className="bento-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.key} {...f} delay={i * 60} />
        ))}
      </div>
    </section>
  );
}
