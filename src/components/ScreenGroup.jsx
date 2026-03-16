import { useState } from "react";
import { COLORS, FONTS, Z_INDEX } from "../styles/theme";
import { HEADER_HEIGHT, DEFAULT_SCREEN_WIDTH, DEFAULT_SCREEN_HEIGHT } from "../constants";

const PADDING = 30;

function computeBounds(groupScreenIds, screens) {
  const members = screens.filter((s) => groupScreenIds.includes(s.id));
  if (members.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of members) {
    const w = s.width || DEFAULT_SCREEN_WIDTH;
    const h = s.imageHeight ? s.imageHeight + HEADER_HEIGHT : DEFAULT_SCREEN_HEIGHT;
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x + w);
    maxY = Math.max(maxY, s.y + h);
  }

  return {
    x: minX - PADDING,
    y: minY - PADDING - 20,
    width: maxX - minX + PADDING * 2,
    height: maxY - minY + PADDING * 2 + 20,
  };
}

const NAV_STACK_CYAN = "#56b6c2";
const NAV_STACK_BG = "rgba(86,182,194,0.08)";
const NAV_STACK_BORDER = "rgba(86,182,194,0.5)";
const NAV_STACK_BORDER_SELECTED = "rgba(86,182,194,0.9)";

export function ScreenGroup({ group, screens, onUpdate, onDelete, onMoveScreens, selected, onSelect }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(group.name);

  const bounds = computeBounds(group.screenIds, screens);
  if (!bounds) return null;

  const isNavStack = group.type === "nav-stack";

  const color = isNavStack ? NAV_STACK_BG : (group.color || COLORS.accent008);
  const borderColor = isNavStack
    ? (selected ? NAV_STACK_BORDER_SELECTED : NAV_STACK_BORDER)
    : (group.color
        ? group.color.replace(/[\d.]+\)$/, selected ? "0.85)" : "0.4)")
        : (selected ? COLORS.accent03.replace(/[\d.]+\)$/, "0.85)") : COLORS.accent03));

  const memberScreens = screens.filter((s) => group.screenIds.includes(s.id));

  const handleToggleType = (e) => {
    e.stopPropagation();
    const newType = isNavStack ? "feature-area" : "nav-stack";
    const patch = { type: newType };
    // Auto-detect entry screen: first screen with no incoming connections from within group
    if (newType === "nav-stack" && !group.stackEntryScreenId && memberScreens.length > 0) {
      patch.stackEntryScreenId = memberScreens[0].id;
    }
    onUpdate(group.id, patch);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        background: color,
        border: isNavStack
          ? `2px solid ${borderColor}`
          : (selected ? `2px solid ${borderColor}` : `1.5px dashed ${borderColor}`),
        borderRadius: 14,
        pointerEvents: "none",
        zIndex: Z_INDEX.screenGroup,
      }}
    >
      {/* Label + controls */}
      <div
        onMouseDown={() => onSelect?.(group.id)}
        style={{
          position: "absolute",
          top: 6,
          left: 12,
          display: "flex",
          alignItems: "center",
          gap: 6,
          pointerEvents: "all",
        }}
      >
        {isEditingName ? (
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => {
              onUpdate(group.id, { name: draftName.trim() || group.name });
              setIsEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") {
                onUpdate(group.id, { name: draftName.trim() || group.name });
                setIsEditingName(false);
              }
            }}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: `1px solid ${isNavStack ? NAV_STACK_CYAN : borderColor}`,
              borderRadius: 4,
              color: COLORS.text,
              fontFamily: FONTS.mono,
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 6px",
              outline: "none",
              minWidth: 80,
            }}
          />
        ) : (
          <span
            onClick={() => { setDraftName(group.name); setIsEditingName(true); }}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: isNavStack ? NAV_STACK_CYAN : COLORS.accentLight,
              fontFamily: FONTS.mono,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              cursor: "text",
              padding: "2px 6px",
              background: "rgba(0,0,0,0.35)",
              border: `1px solid ${isNavStack ? NAV_STACK_BORDER : borderColor}`,
              borderRadius: 4,
              userSelect: "none",
            }}
          >
            {group.name}
          </span>
        )}

        {/* Type toggle */}
        <button
          onClick={handleToggleType}
          title={isNavStack ? "Switch to feature area" : "Mark as nav stack"}
          style={{
            fontSize: 9,
            fontWeight: 700,
            fontFamily: FONTS.mono,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            cursor: "pointer",
            padding: "1px 5px",
            borderRadius: 3,
            lineHeight: 1.5,
            color: isNavStack ? NAV_STACK_CYAN : COLORS.textDim,
            background: isNavStack ? "rgba(86,182,194,0.15)" : "rgba(0,0,0,0.25)",
            border: `1px solid ${isNavStack ? NAV_STACK_BORDER : "rgba(255,255,255,0.12)"}`,
          }}
        >
          {isNavStack ? "STACK" : "AREA"}
        </button>

        {/* Entry screen picker (nav-stack only) */}
        {isNavStack && memberScreens.length > 0 && (
          <select
            value={group.stackEntryScreenId || ""}
            onChange={(e) => {
              e.stopPropagation();
              onUpdate(group.id, { stackEntryScreenId: e.target.value || null });
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            title="Entry screen for this stack"
            style={{
              fontSize: 9,
              fontFamily: FONTS.mono,
              background: "rgba(0,0,0,0.45)",
              border: `1px solid ${NAV_STACK_BORDER}`,
              borderRadius: 3,
              color: NAV_STACK_CYAN,
              padding: "1px 4px",
              cursor: "pointer",
              outline: "none",
              maxWidth: 100,
            }}
          >
            <option value="" style={{ color: COLORS.textDim }}>entry…</option>
            {memberScreens.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        {!isNavStack && group.folderHint && (
          <span
            style={{
              fontSize: 9,
              color: COLORS.textDim,
              fontFamily: FONTS.mono,
              background: "rgba(0,0,0,0.3)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {group.folderHint}
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(group.id); }}
          style={{
            background: "none",
            border: "none",
            color: COLORS.textDim,
            cursor: "pointer",
            fontSize: 12,
            padding: "1px 4px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
