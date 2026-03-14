// Landing page-specific theme. Do NOT import from the editor's theme.js —
// this file intentionally diverges from it to keep the landing design
// independent of editor UI changes.

export const L_COLORS = {
  // Slightly warmer dark background — less blue-black, more neutral-dark
  bg: "#0c0c10",
  surface: "#141418",
  surfaceHover: "#1c1c22",
  surfaceCard: "#17171d",
  border: "#27273a",
  borderSubtle: "#1e1e2a",

  // Shifted violet — a touch more blue, less purely purple
  accent: "#7c6fea",
  accentHover: "#8f84f0",
  accentGlow: "rgba(124, 111, 234, 0.28)",
  accentLight: "#a99cf6",

  // Warm amber secondary — for step numbers, highlights, badge dots
  amber: "#e8a045",
  amberGlow: "rgba(232, 160, 69, 0.22)",
  amberDim: "rgba(232, 160, 69, 0.12)",

  text: "#eaeaf2",
  textMuted: "#7a7a90",
  textDim: "#44445a",
  textOnAccent: "#ffffff",
};

export const L_FONTS = {
  // Sora: geometric-humanist, distinctive — not an AI-default
  heading: "'Sora', sans-serif",
  ui: "'Outfit', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// Google Fonts URL — includes Sora, Outfit, JetBrains Mono
export const L_FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
