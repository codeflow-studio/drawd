import { useEffect, useRef } from "react";

const DEBOUNCE_MS = 150;
const DEFAULT_BRIDGE_URL = "http://localhost:3337/selection";

function resolveBridgeUrl() {
  try {
    return import.meta.env?.VITE_DRAWD_SELECTION_URL || DEFAULT_BRIDGE_URL;
  } catch {
    return DEFAULT_BRIDGE_URL;
  }
}

/**
 * Reports the user's current canvas selection to the MCP selection bridge so
 * the `get_current_selection` MCP tool can return it to AI agents. Fails
 * silently when the bridge isn't reachable — the app works fine either way.
 */
export function useSelectionReporter({
  canvasSelection,
  selectedScreen,
  selectedStickyNote,
  selectedScreenGroup,
  selectedConnection,
  selectedHotspots,
  hotspotInteraction,
  selectedCommentId,
  screens,
  filePath,
}) {
  const timerRef = useRef(null);
  const bridgeUrl = resolveBridgeUrl();

  useEffect(() => {
    const items = buildItems({
      canvasSelection,
      selectedScreen,
      selectedStickyNote,
      selectedScreenGroup,
      selectedConnection,
      selectedHotspots,
      hotspotInteraction,
      selectedCommentId,
      screens,
    });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const body = JSON.stringify({ items, filePath: filePath || null, at: Date.now() });
      try {
        fetch(bridgeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => { /* bridge not running — ignore */ });
      } catch { /* ignore */ }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    canvasSelection,
    selectedScreen,
    selectedStickyNote,
    selectedScreenGroup,
    selectedConnection,
    selectedHotspots,
    hotspotInteraction,
    selectedCommentId,
    screens,
    filePath,
    bridgeUrl,
  ]);
}

function buildItems({
  canvasSelection,
  selectedScreen,
  selectedStickyNote,
  selectedScreenGroup,
  selectedConnection,
  selectedHotspots,
  hotspotInteraction,
  selectedCommentId,
  screens,
}) {
  const seen = new Set();
  const items = [];

  const push = (entry) => {
    const key = entry.type + ":" + entry.id;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(entry);
  };

  (canvasSelection || []).forEach((sel) => {
    if (sel?.type && sel?.id) push({ type: sel.type, id: sel.id });
  });

  const coerceId = (v) => {
    if (!v) return null;
    if (typeof v === "string") return v;
    if (typeof v === "object") return v.id || null;
    return null;
  };

  const screenId = coerceId(selectedScreen);
  if (screenId) push({ type: "screen", id: screenId });

  const stickyId = coerceId(selectedStickyNote);
  if (stickyId) push({ type: "sticky", id: stickyId });

  const groupId = coerceId(selectedScreenGroup);
  if (groupId) push({ type: "screenGroup", id: groupId });

  const connId = coerceId(selectedConnection);
  if (connId) push({ type: "connection", id: connId });

  if (selectedCommentId) push({ type: "comment", id: selectedCommentId });

  (selectedHotspots || []).forEach((hs) => {
    if (!hs) return;
    const hotspotId = typeof hs === "string" ? hs : hs.hotspotId || hs.id;
    if (!hotspotId) return;
    const parentScreenId =
      (typeof hs === "object" && (hs.screenId || hs.screen?.id)) ||
      findHotspotScreenId(screens, hotspotId);
    push({ type: "hotspot", id: hotspotId, screenId: parentScreenId || null });
  });

  // Single-hotspot selection lives on hotspotInteraction when mode is "selected".
  if (hotspotInteraction?.mode === "selected" && hotspotInteraction.hotspotId) {
    push({
      type: "hotspot",
      id: hotspotInteraction.hotspotId,
      screenId: hotspotInteraction.screenId || findHotspotScreenId(screens, hotspotInteraction.hotspotId),
    });
  }

  return items;
}

function findHotspotScreenId(screens, hotspotId) {
  if (!Array.isArray(screens)) return null;
  for (const screen of screens) {
    if ((screen.hotspots || []).some((h) => h.id === hotspotId)) return screen.id;
  }
  return null;
}
