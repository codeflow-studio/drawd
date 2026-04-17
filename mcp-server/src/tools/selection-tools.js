const STALENESS_MS = 60_000;

export const selectionTools = [
  {
    name: "get_current_selection",
    description:
      "Return the element(s) the user currently has selected in the running Drawd browser app. " +
      "Requires the Drawd app to be open and connected to the MCP selection bridge. " +
      "Returns enriched objects (screen, sticky, connection, hotspot, screenGroup, comment) " +
      "so the agent can act on them directly without asking the user for IDs. " +
      "If no recent selection is available (app closed or user hasn't selected anything in the last 60s), " +
      "returns { selection: null, reason, hint }.",
    inputSchema: {
      type: "object",
      properties: {
        includeDetails: {
          type: "boolean",
          description: "Include enriched object data (default: true). Set false to get only type + id entries.",
        },
      },
    },
  },
];

export function handleSelectionTool(name, args, state, bridge) {
  if (name !== "get_current_selection") {
    throw new Error(`Unknown selection tool: ${name}`);
  }

  const snapshot = bridge ? bridge.get() : null;

  if (!snapshot) {
    return {
      selection: null,
      reason: "no_recent_selection",
      hint:
        "The Drawd app has not reported a selection yet. Ask the user to open the flow in the Drawd app and click an element.",
    };
  }

  const age = Date.now() - snapshot.receivedAt;
  if (age > STALENESS_MS) {
    return {
      selection: null,
      reason: "no_recent_selection",
      hint:
        "User hasn't selected anything recently — ask them to click an element in the Drawd app.",
      lastReceivedAt: new Date(snapshot.receivedAt).toISOString(),
      ageMs: age,
    };
  }

  const items = Array.isArray(snapshot.payload?.items) ? snapshot.payload.items : [];
  const includeDetails = args?.includeDetails !== false;

  const enriched = items
    .map((item) => (includeDetails ? enrichItem(item, state) : { type: item.type, id: item.id }))
    .filter(Boolean);

  return {
    selection: enriched,
    receivedAt: new Date(snapshot.receivedAt).toISOString(),
    source: "live_bridge",
    filePath: snapshot.payload?.filePath || null,
  };
}

function enrichItem(item, state) {
  if (!item || !item.type || !item.id) return null;

  switch (item.type) {
    case "screen": {
      const screen = state.screens.find((s) => s.id === item.id);
      if (!screen) return { type: "screen", id: item.id, missing: true };
      return {
        type: "screen",
        id: screen.id,
        name: screen.name,
        description: screen.description || "",
        status: screen.status || "new",
        hotspotCount: (screen.hotspots || []).length,
      };
    }

    case "sticky": {
      const sticky = state.stickyNotes.find((n) => n.id === item.id);
      if (!sticky) return { type: "sticky", id: item.id, missing: true };
      return {
        type: "sticky",
        id: sticky.id,
        content: sticky.content || "",
        color: sticky.color || null,
        x: sticky.x,
        y: sticky.y,
      };
    }

    case "connection": {
      const conn = state.connections.find((c) => c.id === item.id);
      if (!conn) return { type: "connection", id: item.id, missing: true };
      return {
        type: "connection",
        id: conn.id,
        fromScreenId: conn.fromScreenId,
        toScreenId: conn.toScreenId,
        label: conn.label || "",
        action: conn.action || "navigate",
      };
    }

    case "hotspot": {
      const screenId = item.screenId || findHotspotScreenId(state, item.id);
      const screen = screenId ? state.screens.find((s) => s.id === screenId) : null;
      const hotspot = screen ? (screen.hotspots || []).find((h) => h.id === item.id) : null;
      if (!hotspot) return { type: "hotspot", id: item.id, screenId: screenId || null, missing: true };
      return {
        type: "hotspot",
        id: hotspot.id,
        screenId: screen.id,
        label: hotspot.label || "",
        action: hotspot.action || "navigate",
        targetScreenId: hotspot.targetScreenId || null,
      };
    }

    case "screenGroup": {
      const group = state.screenGroups.find((g) => g.id === item.id);
      if (!group) return { type: "screenGroup", id: item.id, missing: true };
      return {
        type: "screenGroup",
        id: group.id,
        name: group.name,
        screenIds: [...(group.screenIds || [])],
      };
    }

    case "comment": {
      const comment = state.comments.find((c) => c.id === item.id);
      if (!comment) return { type: "comment", id: item.id, missing: true };
      return {
        type: "comment",
        id: comment.id,
        text: comment.text || "",
        targetType: comment.targetType || "screen",
        targetId: comment.targetId || null,
        resolved: !!comment.resolved,
      };
    }

    default:
      return { type: item.type, id: item.id, unknown: true };
  }
}

function findHotspotScreenId(state, hotspotId) {
  for (const screen of state.screens) {
    if ((screen.hotspots || []).some((h) => h.id === hotspotId)) return screen.id;
  }
  return null;
}
