import { L_COLORS, L_FONTS } from "./landingTheme";

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 420 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "100%",
        maxWidth: 420,
        height: "auto",
        animation: "breathe 5s ease-in-out infinite",
        filter: `drop-shadow(0 24px 48px ${L_COLORS.accent018})`,
      }}
      aria-hidden="true"
    >
      {/* Screen card 1 — left */}
      <rect x="20" y="60" width="110" height="180" rx="14"
        fill="#17171d" stroke="rgba(97,175,239,0.35)" strokeWidth="1.5" />
      {/* Screen 1 inner image area */}
      <rect x="32" y="72" width="86" height="120" rx="6"
        fill="rgba(97,175,239,0.08)" stroke="rgba(97,175,239,0.15)" strokeWidth="1" />
      {/* Screen 1 hotspot */}
      <rect x="38" y="168" width="52" height="14" rx="4"
        fill="rgba(97,175,239,0.22)" stroke="rgba(97,175,239,0.5)" strokeWidth="1" />
      {/* Screen 1 label */}
      <rect x="32" y="200" width="60" height="6" rx="3" fill="rgba(255,255,255,0.1)" />
      <rect x="32" y="212" width="44" height="5" rx="2.5" fill="rgba(255,255,255,0.06)" />

      {/* Screen card 2 — right, slightly higher */}
      <rect x="280" y="30" width="110" height="180" rx="14"
        fill="#17171d" stroke="rgba(97,175,239,0.35)" strokeWidth="1.5" />
      <rect x="292" y="42" width="86" height="120" rx="6"
        fill="rgba(97,175,239,0.08)" stroke="rgba(97,175,239,0.15)" strokeWidth="1" />
      <rect x="298" y="138" width="52" height="14" rx="4"
        fill="rgba(209,154,102,0.22)" stroke="rgba(209,154,102,0.5)" strokeWidth="1" />
      <rect x="292" y="170" width="60" height="6" rx="3" fill="rgba(255,255,255,0.1)" />
      <rect x="292" y="182" width="44" height="5" rx="2.5" fill="rgba(255,255,255,0.06)" />

      {/* Screen card 3 — bottom center, smaller */}
      <rect x="155" y="190" width="100" height="120" rx="12"
        fill="#17171d" stroke="rgba(97,175,239,0.25)" strokeWidth="1.5" />
      <rect x="165" y="200" width="80" height="70" rx="5"
        fill="rgba(97,175,239,0.06)" stroke="rgba(97,175,239,0.12)" strokeWidth="1" />
      <rect x="165" y="278" width="50" height="5" rx="2.5" fill="rgba(255,255,255,0.08)" />

      {/* Connection line: screen 1 -> screen 3 */}
      <path
        d="M 130 150 C 175 150, 160 230, 205 250"
        stroke="rgba(97,175,239,0.6)"
        strokeWidth="2"
        strokeDasharray="5 3"
        fill="none"
      />
      {/* Arrow head */}
      <polygon
        points="201,243 209,253 198,257"
        fill="rgba(97,175,239,0.7)"
      />

      {/* Connection line: screen 2 -> screen 3 */}
      <path
        d="M 280 120 C 240 120, 240 200, 255 240"
        stroke="rgba(209,154,102,0.55)"
        strokeWidth="2"
        strokeDasharray="5 3"
        fill="none"
      />
      <polygon
        points="251,233 259,243 248,245"
        fill="rgba(209,154,102,0.65)"
      />

      {/* Glow dot at connection origin 1 */}
      <circle cx="130" cy="150" r="5" fill="rgba(97,175,239,0.8)"
        style={{ filter: "drop-shadow(0 0 6px rgba(97,175,239,0.9))" }} />
      {/* Glow dot at connection origin 2 */}
      <circle cx="280" cy="120" r="5" fill="rgba(209,154,102,0.8)"
        style={{ filter: "drop-shadow(0 0 6px rgba(209,154,102,0.9))" }} />
    </svg>
  );
}

export default function Hero() {
  return (
    <section
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "132px 40px 80px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Background glow blob */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 60,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 440,
          background: `radial-gradient(ellipse at center, ${L_COLORS.accentGlow} 0%, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className="hero-columns"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 48,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Left column */}
        <div
          className="hero-left"
          style={{
            flex: "0 0 55%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 0,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 13px",
              background: L_COLORS.amberDim,
              border: `1px solid ${L_COLORS.amber03}`,
              borderRadius: 100,
              marginBottom: 28,
              animation: "fadeInUp 0.5s ease both",
              animationDelay: "0ms",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: L_COLORS.amber,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: L_FONTS.mono,
                fontSize: 11,
                fontWeight: 500,
                color: L_COLORS.amber,
                letterSpacing: "0.05em",
              }}
            >
              BROWSER-NATIVE · FREE · NO SIGN-UP
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: L_FONTS.heading,
              fontWeight: 800,
              fontSize: "clamp(34px, 4.5vw, 58px)",
              lineHeight: 1.08,
              color: L_COLORS.text,
              margin: "0 0 6px",
              letterSpacing: "-0.04em",
              animation: "fadeInUp 0.5s ease both",
              animationDelay: "80ms",
            }}
          >
            Draw the logic.
          </h1>
          <h1
            style={{
              fontFamily: L_FONTS.heading,
              fontWeight: 800,
              fontSize: "clamp(34px, 4.5vw, 58px)",
              lineHeight: 1.08,
              color: L_COLORS.accentLight,
              margin: "0 0 28px",
              letterSpacing: "-0.04em",
              animation: "fadeInUp 0.5s ease both",
              animationDelay: "80ms",
            }}
          >
            Ship with clarity.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: L_FONTS.ui,
              fontSize: "clamp(15px, 2vw, 18px)",
              color: L_COLORS.textMuted,
              lineHeight: 1.65,
              margin: "0 0 36px",
              maxWidth: 460,
              animation: "fadeInUp 0.5s ease both",
              animationDelay: "160ms",
            }}
          >
            Upload your screen images, connect navigation flows visually,
            define tap areas — then export structured AI build instructions
            your LLM can actually use.
          </p>

          {/* CTA row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              animation: "fadeInUp 0.5s ease both",
              animationDelay: "240ms",
            }}
          >
            <button
              onClick={() => { window.location.hash = "#/editor"; }}
              style={{
                padding: "13px 30px",
                background: L_COLORS.accent,
                border: "none",
                borderRadius: 10,
                color: L_COLORS.textOnAccent,
                fontFamily: L_FONTS.ui,
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                letterSpacing: "-0.01em",
                boxShadow: `0 4px 28px ${L_COLORS.accentGlow}`,
                transition: "background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = L_COLORS.accentHover;
                e.currentTarget.style.boxShadow = `0 6px 36px ${L_COLORS.accentGlow}`;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = L_COLORS.accent;
                e.currentTarget.style.boxShadow = `0 4px 28px ${L_COLORS.accentGlow}`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Open Editor
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                const el = document.getElementById("how-it-works");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See How It Works
            </button>
          </div>

          <a
            href="https://www.producthunt.com/products/drawd?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-drawd"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: 24,
              animation: "fadeInUp 0.5s ease both",
              animationDelay: "320ms",
              display: "inline-block",
            }}
          >
            <img
              alt="Drawd - Design app flows visually. Generate AI build instructions. | Product Hunt"
              width="250"
              height="54"
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1098709&theme=dark&t=1773694751467"
            />
          </a>
        </div>

        {/* Right column — decorative illustration */}
        <div
          className="hero-right"
          style={{
            flex: "0 0 45%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
