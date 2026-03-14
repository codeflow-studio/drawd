import { L_COLORS, L_FONTS } from "./landingTheme";

const STEPS = [
  {
    number: "01",
    title: "Upload Screens",
    description:
      "Drag and drop your screen images onto the canvas — or paste them directly. Drawd arranges them automatically.",
  },
  {
    number: "02",
    title: "Map the Flow",
    description:
      "Draw hotspot tap areas, drag connections between screens, and model conditional branches — all without leaving the browser.",
  },
  {
    number: "03",
    title: "Export Instructions",
    description:
      "Hit Generate. Download a structured ZIP of markdown files your AI assistant can use to build the real app.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
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
        HOW IT WORKS
      </div>

      <h2
        className="reveal"
        style={{
          fontFamily: L_FONTS.heading,
          fontWeight: 700,
          fontSize: "clamp(22px, 3.5vw, 34px)",
          color: L_COLORS.text,
          margin: "0 0 56px",
          letterSpacing: "-0.03em",
          transitionDelay: "60ms",
        }}
      >
        From screen images to AI-ready spec
      </h2>

      {/* Steps row */}
      <div
        className="how-steps"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0,
          position: "relative",
        }}
      >
        {STEPS.map((step, i) => (
          <div
            key={step.number}
            style={{ display: "flex", alignItems: "flex-start", flex: 1 }}
          >
            {/* Step content */}
            <div
              className="reveal"
              style={{
                flex: 1,
                transitionDelay: `${i * 100}ms`,
              }}
            >
              {/* Step number */}
              <div
                style={{
                  fontFamily: L_FONTS.heading,
                  fontWeight: 800,
                  fontSize: 42,
                  color: L_COLORS.amber,
                  lineHeight: 1,
                  marginBottom: 16,
                  letterSpacing: "-0.04em",
                  opacity: 0.85,
                }}
              >
                {step.number}
              </div>

              <h3
                style={{
                  fontFamily: L_FONTS.heading,
                  fontWeight: 600,
                  fontSize: 18,
                  color: L_COLORS.text,
                  margin: "0 0 10px",
                  letterSpacing: "-0.02em",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontFamily: L_FONTS.ui,
                  fontSize: 14,
                  color: L_COLORS.textMuted,
                  lineHeight: 1.65,
                  margin: 0,
                  maxWidth: 240,
                }}
              >
                {step.description}
              </p>
            </div>

            {/* Connector (between steps, not after last) */}
            {i < STEPS.length - 1 && (
              <div
                className="how-connector"
                style={{
                  width: 60,
                  flexShrink: 0,
                  marginTop: 20,
                  borderTop: `1.5px dashed ${L_COLORS.border}`,
                  alignSelf: "flex-start",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
