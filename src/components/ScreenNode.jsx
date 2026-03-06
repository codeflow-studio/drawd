import { useState } from "react";
import { COLORS, FONTS } from "../styles/theme";

export function ScreenNode({
  screen, selected, onSelect, onDragStart, onAddHotspot, onRemoveScreen,
  onDotDragStart, onConnectTarget, onHoverTarget, isConnectHoverTarget, isConnecting,
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const borderColor = isConnectHoverTarget
    ? COLORS.success
    : selected ? COLORS.borderActive : COLORS.border;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target.closest(".hotspot-area") || e.target.closest(".screen-btn")) return;
        if (e.target.closest(".connection-dot-right")) return;
        onSelect(screen.id);
        onDragStart(e, screen.id);
      }}
      onMouseUp={() => {
        if (isConnecting) onConnectTarget?.(screen.id);
      }}
      onMouseEnter={() => {
        if (isConnecting) onHoverTarget?.(screen.id);
      }}
      onMouseLeave={() => {
        if (isConnecting) onHoverTarget?.(null);
      }}
      style={{
        position: "absolute",
        left: screen.x,
        top: screen.y,
        width: screen.width || 220,
        minHeight: 80,
        background: COLORS.screenBg,
        border: `2px solid ${borderColor}`,
        borderRadius: 14,
        cursor: isConnecting ? "default" : "grab",
        boxShadow: isConnectHoverTarget
          ? `0 0 30px rgba(0,210,211,0.3), 0 8px 32px rgba(0,0,0,0.5)`
          : selected
            ? `0 0 30px ${COLORS.accentGlow}, 0 8px 32px rgba(0,0,0,0.5)`
            : "0 4px 20px rgba(0,0,0,0.4)",
        transition: "border-color 0.2s, box-shadow 0.2s",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 10px",
          background: selected ? "rgba(108,92,231,0.1)" : "rgba(255,255,255,0.02)",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: selected ? COLORS.accentLight : COLORS.text,
            letterSpacing: "0.02em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: FONTS.mono,
          }}
        >
          {screen.name}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            className="screen-btn"
            onClick={(e) => { e.stopPropagation(); onAddHotspot(screen.id); }}
            title="Add tap area / button link"
            style={{
              background: "rgba(108,92,231,0.15)",
              border: "1px solid rgba(108,92,231,0.3)",
              borderRadius: 6,
              color: COLORS.accentLight,
              fontSize: 11,
              padding: "2px 7px",
              cursor: "pointer",
              fontFamily: FONTS.mono,
            }}
          >
            + Link
          </button>
          <button
            className="screen-btn"
            onClick={(e) => { e.stopPropagation(); onRemoveScreen(screen.id); }}
            title="Remove screen"
            style={{
              background: "rgba(255,107,107,0.1)",
              border: "1px solid rgba(255,107,107,0.25)",
              borderRadius: 6,
              color: COLORS.danger,
              fontSize: 11,
              padding: "2px 7px",
              cursor: "pointer",
              fontFamily: FONTS.mono,
            }}
          >
            x
          </button>
        </div>
      </div>

      {/* Image */}
      <div style={{ position: "relative", minHeight: 120, background: "#0d0d15" }}>
        {screen.imageData ? (
          <>
            <img
              src={screen.imageData}
              alt={screen.name}
              onLoad={() => setImgLoaded(true)}
              draggable={false}
              style={{
                width: "100%",
                display: "block",
                opacity: imgLoaded ? 1 : 0,
                transition: "opacity 0.3s",
              }}
            />
            {(screen.hotspots || []).map((hs) => (
              <div
                key={hs.id}
                className="hotspot-area"
                style={{
                  position: "absolute",
                  left: `${hs.x}%`,
                  top: `${hs.y}%`,
                  width: `${hs.w}%`,
                  height: `${hs.h}%`,
                  background: hs.targetScreenId ? "rgba(0,210,211,0.15)" : COLORS.hotspot,
                  border: `2px dashed ${hs.targetScreenId ? COLORS.success : COLORS.hotspotBorder}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: hs.targetScreenId ? COLORS.success : COLORS.accentLight,
                  fontFamily: FONTS.mono,
                  fontWeight: 600,
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
                title={hs.label || "Tap area"}
              >
                {hs.label || "TAP"}
              </div>
            ))}
          </>
        ) : (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: COLORS.textDim,
              fontSize: 12,
              fontFamily: FONTS.mono,
            }}
          >
            Drop image or<br />click to upload
          </div>
        )}
      </div>

      {/* Right connection dot -- draggable */}
      <div
        className="connection-dot-right"
        onMouseDown={(e) => {
          e.stopPropagation();
          onDotDragStart?.(e, screen.id);
        }}
        style={{
          position: "absolute",
          right: -7,
          top: "50%",
          transform: "translateY(-50%)",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: COLORS.accent,
          border: `2px solid ${COLORS.surface}`,
          boxShadow: `0 0 10px ${COLORS.accentGlow}`,
          cursor: "crosshair",
          padding: 4,
          margin: -4,
          boxSizing: "content-box",
        }}
      />
      {/* Left connection dot */}
      <div
        style={{
          position: "absolute",
          left: -7,
          top: "50%",
          transform: "translateY(-50%)",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: COLORS.border,
          border: `2px solid ${COLORS.surface}`,
        }}
      />
    </div>
  );
}
