import { COLORS, FONTS } from "../styles/theme";

export function TopBar({ screenCount, connectionCount, onUpload, onAddBlank, onExport, onImport, onGenerate, canUndo, canRedo, onUndo, onRedo, connectedFileName, saveStatus, isFileSystemSupported, onOpen, onSaveAs, onDocuments, documentCount = 0 }) {
  const statusDotColor = saveStatus === "saving" ? COLORS.warning
    : saveStatus === "saved" ? COLORS.success
    : saveStatus === "error" ? COLORS.danger
    : null;
  return (
    <>
    <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    <div
      style={{
        height: 56,
        background: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.accent}, #a29bfe)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          F
        </div>
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: COLORS.text,
            fontFamily: FONTS.heading,
            letterSpacing: "-0.02em",
          }}
        >
          FlowForge
        </span>
        <span
          style={{
            fontSize: 10,
            color: COLORS.textDim,
            background: "rgba(108,92,231,0.1)",
            padding: "3px 8px",
            borderRadius: 4,
            fontFamily: FONTS.mono,
            border: "1px solid rgba(108,92,231,0.2)",
          }}
        >
          App Flow Designer
        </span>
        {connectedFileName && (
          <span
            style={{
              fontSize: 10,
              color: COLORS.textMuted,
              background: "rgba(255,255,255,0.04)",
              padding: "3px 8px",
              borderRadius: 4,
              fontFamily: FONTS.mono,
              border: `1px solid ${COLORS.border}`,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {statusDotColor && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: statusDotColor,
                  display: "inline-block",
                  flexShrink: 0,
                  animation: saveStatus === "saving" ? "pulse-dot 1s infinite" : "none",
                }}
              />
            )}
            {connectedFileName}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, color: COLORS.textDim, fontFamily: FONTS.mono }}>
          {screenCount} screen{screenCount !== 1 ? "s" : ""} &middot; {connectionCount} link{connectionCount !== 1 ? "s" : ""}
          {documentCount > 0 && ` \u00b7 ${documentCount} doc${documentCount !== 1 ? "s" : ""}`}
        </span>

        <div style={{ display: "flex", gap: 2 }}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Cmd+Z)"
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: `1px solid ${canUndo ? COLORS.border : "transparent"}`,
              borderRadius: 6,
              color: canUndo ? COLORS.textMuted : COLORS.textDim,
              fontSize: 15,
              cursor: canUndo ? "pointer" : "not-allowed",
              opacity: canUndo ? 1 : 0.4,
              transition: "all 0.2s",
            }}
          >
            &#8617;
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Cmd+Shift+Z)"
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: `1px solid ${canRedo ? COLORS.border : "transparent"}`,
              borderRadius: 6,
              color: canRedo ? COLORS.textMuted : COLORS.textDim,
              fontSize: 15,
              cursor: canRedo ? "pointer" : "not-allowed",
              opacity: canRedo ? 1 : 0.4,
              transition: "all 0.2s",
            }}
          >
            &#8618;
          </button>
        </div>

        <button
          onClick={onDocuments}
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            color: COLORS.textMuted,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONTS.mono,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Documents
          {documentCount > 0 && (
            <span style={{
              background: "rgba(108,92,231,0.25)",
              color: COLORS.accentLight,
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 700,
              padding: "1px 6px",
            }}>
              {documentCount}
            </span>
          )}
        </button>

        <button
          onClick={onUpload}
          style={{
            padding: "8px 16px",
            background: "rgba(108,92,231,0.12)",
            border: "1px solid rgba(108,92,231,0.3)",
            borderRadius: 8,
            color: COLORS.accentLight,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONTS.mono,
            transition: "all 0.2s",
          }}
        >
          + Upload Screens
        </button>

        <button
          onClick={onAddBlank}
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            color: COLORS.textMuted,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONTS.mono,
          }}
        >
          + Blank Screen
        </button>

        {isFileSystemSupported && (
          <button
            onClick={onOpen}
            title="Open file (Cmd+O)"
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              color: COLORS.textMuted,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONTS.mono,
            }}
          >
            Open
          </button>
        )}

        <button
          onClick={onImport}
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            color: COLORS.textMuted,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONTS.mono,
          }}
        >
          Import
        </button>

        <button
          onClick={onExport}
          disabled={screenCount === 0}
          style={{
            padding: "8px 16px",
            background: screenCount === 0
              ? "rgba(108,92,231,0.05)"
              : "rgba(108,92,231,0.12)",
            border: `1px solid ${screenCount === 0 ? COLORS.border : "rgba(108,92,231,0.3)"}`,
            borderRadius: 8,
            color: screenCount === 0 ? COLORS.textDim : COLORS.accentLight,
            fontSize: 12,
            fontWeight: 600,
            cursor: screenCount === 0 ? "not-allowed" : "pointer",
            fontFamily: FONTS.mono,
            transition: "all 0.2s",
          }}
        >
          Export
        </button>

        {isFileSystemSupported && (
          <button
            onClick={onSaveAs}
            disabled={screenCount === 0}
            title="Save As (Cmd+S)"
            style={{
              padding: "8px 16px",
              background: screenCount === 0
                ? "rgba(108,92,231,0.05)"
                : "rgba(108,92,231,0.12)",
              border: `1px solid ${screenCount === 0 ? COLORS.border : "rgba(108,92,231,0.3)"}`,
              borderRadius: 8,
              color: screenCount === 0 ? COLORS.textDim : COLORS.accentLight,
              fontSize: 12,
              fontWeight: 600,
              cursor: screenCount === 0 ? "not-allowed" : "pointer",
              fontFamily: FONTS.mono,
              transition: "all 0.2s",
            }}
          >
            Save As
          </button>
        )}

        <button
          onClick={onGenerate}
          disabled={screenCount === 0}
          style={{
            padding: "8px 20px",
            background: screenCount === 0
              ? "rgba(108,92,231,0.08)"
              : `linear-gradient(135deg, ${COLORS.accent}, #a29bfe)`,
            border: "none",
            borderRadius: 8,
            color: screenCount === 0 ? COLORS.textDim : "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: screenCount === 0 ? "not-allowed" : "pointer",
            fontFamily: FONTS.mono,
            boxShadow: screenCount > 0 ? `0 4px 16px ${COLORS.accentGlow}` : "none",
            transition: "all 0.2s",
            letterSpacing: "0.02em",
          }}
        >
          &#9889; Generate AI Instructions
        </button>
      </div>
    </div>
    </>
  );
}
