import { useState } from "react";
import { COLORS, FONTS } from "../styles/theme";

export function InstructionsPanel({ instructions, onClose }) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          width: "90%",
          maxWidth: 750,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 80px rgba(0,0,0,0.7)",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>&#9889;</span>
            <h3
              style={{
                margin: 0,
                color: COLORS.text,
                fontFamily: FONTS.heading,
                fontSize: 17,
                fontWeight: 600,
              }}
            >
              AI Build Instructions
            </h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(instructions);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{
                padding: "7px 16px",
                background: copied ? "rgba(0,210,211,0.15)" : "rgba(108,92,231,0.15)",
                border: `1px solid ${copied ? "rgba(0,210,211,0.3)" : "rgba(108,92,231,0.3)"}`,
                borderRadius: 8,
                color: copied ? COLORS.success : COLORS.accentLight,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: FONTS.mono,
                transition: "all 0.2s",
              }}
            >
              {copied ? "\u2713 Copied!" : "Copy All"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "7px 12px",
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                color: COLORS.textMuted,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              &#10005;
            </button>
          </div>
        </div>
        <pre
          style={{
            margin: 0,
            padding: 24,
            overflow: "auto",
            flex: 1,
            color: COLORS.text,
            fontSize: 12.5,
            lineHeight: 1.7,
            fontFamily: FONTS.mono,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {instructions}
        </pre>
      </div>
    </div>
  );
}
