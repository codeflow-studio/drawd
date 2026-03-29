import { COLORS, FONTS, styles, Z_INDEX } from "../styles/theme";

export function ConnectionTypePrompt({ x, y, onNavigate, onStateVariant }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        background: COLORS.surface,
        border: `1px solid ${COLORS.accent}`,
        borderRadius: 10,
        padding: "14px 18px",
        boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 12px ${COLORS.accent02}`,
        zIndex: Z_INDEX.canvasPrompt,
        minWidth: 200,
        pointerEvents: "all",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          color: COLORS.text,
          fontSize: 13,
          fontFamily: FONTS.ui,
          fontWeight: 500,
          marginBottom: 12,
        }}
      >
        Connection type?
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onNavigate}
          style={{
            ...styles.btnPrimary,
            flex: 1,
            padding: "7px 0",
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          Navigate
        </button>
        <button
          onClick={onStateVariant}
          style={{
            ...styles.btnPrimary,
            flex: 1,
            padding: "7px 0",
            background: COLORS.accent,
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          State Variant
        </button>
      </div>
    </div>
  );
}
