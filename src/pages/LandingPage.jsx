import { useEffect } from "react";
import { L_COLORS, L_FONTS, L_FONT_LINK } from "./landing/landingTheme";
import NavBar from "./landing/NavBar";
import Hero from "./landing/Hero";
import Features from "./landing/Features";
import HowItWorks from "./landing/HowItWorks";
import DemoPreview from "./landing/DemoPreview";
import Footer from "./landing/Footer";

const GLOBAL_CSS = `
  @import url('${L_FONT_LINK}');

  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }

  /* ── Keyframes ──────────────────────────────── */
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes breathe {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%       { transform: translateY(-8px) scale(1.015); }
  }

  /* ── Scroll reveal ──────────────────────────── */
  .reveal {
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 0.55s ease, transform 0.55s ease;
  }
  .reveal.revealed {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── Dot-grid background ────────────────────── */
  .dot-grid {
    position: relative;
  }
  .dot-grid::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(
      circle,
      rgba(124, 111, 234, 0.10) 1px,
      transparent 1px
    );
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
  }

  /* ── Gradient divider ───────────────────────── */
  .gradient-divider {
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(124, 111, 234, 0.35) 30%,
      rgba(232, 160, 69, 0.25) 70%,
      transparent 100%
    );
    margin: 0 auto;
    max-width: 860px;
  }

  /* ── Nav link hover ─────────────────────────── */
  .nav-link {
    font-family: ${L_FONTS.ui};
    font-size: 14px;
    font-weight: 500;
    color: ${L_COLORS.textMuted};
    text-decoration: none;
    letter-spacing: -0.01em;
    transition: color 0.18s ease;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
  }
  .nav-link:hover {
    color: ${L_COLORS.text};
  }

  /* ── Ghost button ───────────────────────────── */
  .btn-ghost {
    font-family: ${L_FONTS.ui};
    font-size: 14px;
    font-weight: 600;
    color: ${L_COLORS.textMuted};
    background: transparent;
    border: 1px solid ${L_COLORS.border};
    border-radius: 8px;
    padding: 8px 18px;
    cursor: pointer;
    letter-spacing: -0.01em;
    transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }
  .btn-ghost:hover {
    color: ${L_COLORS.text};
    border-color: rgba(124, 111, 234, 0.5);
    background: rgba(124, 111, 234, 0.06);
  }

  /* ── Feature card hover ─────────────────────── */
  .feature-card {
    transition: box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease;
  }
  .feature-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(124, 111, 234, 0.14), 0 0 0 1px rgba(124, 111, 234, 0.22);
    border-color: rgba(124, 111, 234, 0.3) !important;
  }

  /* ── Responsive ─────────────────────────────── */
  @media (max-width: 768px) {
    .hero-columns {
      flex-direction: column !important;
    }
    .hero-left {
      text-align: center !important;
      align-items: center !important;
      max-width: 100% !important;
    }
    .hero-right {
      display: none !important;
    }
    .bento-grid {
      grid-template-columns: 1fr !important;
    }
    .bento-grid > * {
      grid-column: span 1 !important;
    }
    .how-steps {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
    .how-connector {
      display: none !important;
    }
    .footer-cols {
      flex-direction: column !important;
      gap: 32px !important;
    }
  }
`;

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.12 }
    );

    const targets = document.querySelectorAll(".reveal");
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div
        className="dot-grid"
        style={{
          background: L_COLORS.bg,
          minHeight: "100vh",
          color: L_COLORS.text,
          overflowX: "hidden",
        }}
      >
        <NavBar />
        <main style={{ position: "relative", zIndex: 1 }}>
          <Hero />
          <div className="gradient-divider" />
          <Features />
          <div className="gradient-divider" />
          <HowItWorks />
          <div className="gradient-divider" />
          <DemoPreview />
        </main>
        <Footer />
      </div>
    </>
  );
}
