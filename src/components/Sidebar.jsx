import { COLORS, FONTS } from "../styles/theme";

export function Sidebar({ screen, screens, connections, onClose, onRename, onAddHotspot, onEditHotspot }) {
  const incomingLinks = connections.filter((c) => c.toScreenId === screen.id);

  return (
    <div
      style={{
        width: 280,
        background: COLORS.surface,
        borderLeft: `1px solid ${COLORS.border}`,
        overflow: "auto",
        flexShrink: 0,
        padding: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h4
          style={{
            margin: 0,
            color: COLORS.text,
            fontFamily: FONTS.heading,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Screen Details
        </h4>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: COLORS.textDim,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          &#10005;
        </button>
      </div>

      <div
        style={{
          padding: "10px 12px",
          background: COLORS.bg,
          borderRadius: 8,
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, fontFamily: FONTS.mono }}>
          {screen.name}
        </span>
        <button
          onClick={onRename}
          style={{
            background: "rgba(108,92,231,0.1)",
            border: "1px solid rgba(108,92,231,0.2)",
            borderRadius: 6,
            color: COLORS.accentLight,
            fontSize: 10,
            padding: "3px 8px",
            cursor: "pointer",
            fontFamily: FONTS.mono,
          }}
        >
          Rename
        </button>
      </div>

      {/* Hotspots list */}
      <h5
        style={{
          margin: "16px 0 8px",
          color: COLORS.textMuted,
          fontFamily: FONTS.mono,
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Tap Areas / Buttons ({screen.hotspots.length})
      </h5>

      {screen.hotspots.map((hs) => {
        const target = screens.find((s) => s.id === hs.targetScreenId);
        return (
          <div
            key={hs.id}
            onClick={() => onEditHotspot(hs)}
            style={{
              padding: "10px 12px",
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              marginBottom: 6,
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, fontFamily: FONTS.mono }}>
              {hs.label || "Unnamed"}
            </div>
            <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4, fontFamily: FONTS.mono }}>
              {hs.action} &rarr; {target?.name || "none"}
            </div>
          </div>
        );
      })}

      <button
        onClick={() => onAddHotspot(screen.id)}
        style={{
          width: "100%",
          padding: "10px 0",
          marginTop: 8,
          background: "rgba(108,92,231,0.08)",
          border: "1px dashed rgba(108,92,231,0.3)",
          borderRadius: 8,
          color: COLORS.accentLight,
          fontSize: 12,
          cursor: "pointer",
          fontFamily: FONTS.mono,
        }}
      >
        + Add Tap Area
      </button>

      {/* Incoming connections */}
      {incomingLinks.length > 0 && (
        <>
          <h5
            style={{
              margin: "20px 0 8px",
              color: COLORS.textMuted,
              fontFamily: FONTS.mono,
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Incoming Links
          </h5>
          {incomingLinks.map((c) => {
            const from = screens.find((s) => s.id === c.fromScreenId);
            return (
              <div
                key={c.id}
                style={{
                  padding: "8px 12px",
                  background: COLORS.bg,
                  borderRadius: 8,
                  marginBottom: 4,
                  fontSize: 11,
                  color: COLORS.textMuted,
                  fontFamily: FONTS.mono,
                }}
              >
                &larr; {from?.name} {c.label ? `(${c.label})` : ""}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
