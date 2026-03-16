/**
 * Pre-generation validation pass. Returns an array of issues found in the
 * screens/connections/documents data before instructions are generated.
 *
 * @param {Array} screens
 * @param {Array} connections
 * @param {Object} options - { documents: [], screenGroups: [], navigationStructure: null }
 * @returns {Array<{ level: "error"|"warning", code: string, message: string, entityId?: string }>}
 */
export function validateInstructions(screens, connections, options = {}) {
  const documents = options.documents || [];
  const screenGroups = options.screenGroups || [];
  const navigationStructure = options.navigationStructure || null;
  const screenIds = new Set(screens.map((s) => s.id));
  const docIds = new Set(documents.map((d) => d.id));
  const issues = [];

  for (const screen of screens) {
    if (!screen.imageData && !screen.description) {
      issues.push({
        level: "warning",
        code: "SCREEN_EMPTY",
        message: `Screen "${screen.name}" has no image and no description`,
        entityId: screen.id,
      });
    }

    for (const h of screen.hotspots || []) {
      if (h.targetScreenId && !screenIds.has(h.targetScreenId)) {
        issues.push({
          level: "error",
          code: "BROKEN_HOTSPOT_TARGET",
          message: `Hotspot "${h.label || "Unnamed"}" on "${screen.name}" targets a missing screen`,
          entityId: h.id,
        });
      }

      if (h.documentId && !docIds.has(h.documentId)) {
        issues.push({
          level: "warning",
          code: "BROKEN_DOC_REF",
          message: `Hotspot "${h.label || "Unnamed"}" on "${screen.name}" references a missing document`,
          entityId: h.id,
        });
      }

      if (h.action === "api" && !h.apiEndpoint) {
        issues.push({
          level: "warning",
          code: "API_NO_ENDPOINT",
          message: `API hotspot "${h.label || "Unnamed"}" on "${screen.name}" has no endpoint defined`,
          entityId: h.id,
        });
      }
    }
  }

  for (const conn of connections) {
    if (!screenIds.has(conn.fromScreenId) || !screenIds.has(conn.toScreenId)) {
      issues.push({
        level: "error",
        code: "BROKEN_CONNECTION",
        message: `Connection references a missing screen (from: ${conn.fromScreenId}, to: ${conn.toScreenId})`,
        entityId: conn.id,
      });
    }
  }

  // Navigation structure checks
  if (navigationStructure?.type) {
    const stackGroupIds = navigationStructure.stackGroupIds || [];
    const navStackGroups = screenGroups.filter(g => g.type === "nav-stack");

    for (const group of navStackGroups) {
      if (!stackGroupIds.includes(group.id)) continue; // not included in nav structure

      // NAV_STACK_NO_ENTRY: nav-stack group has no stackEntryScreenId
      if (!group.stackEntryScreenId || !screenIds.has(group.stackEntryScreenId)) {
        issues.push({
          level: "warning",
          code: "NAV_STACK_NO_ENTRY",
          message: `Nav stack "${group.name}" has no entry screen defined`,
          entityId: group.id,
        });
        continue;
      }

      // NAV_ORPHAN_SCREEN: screens in nav-stack unreachable from entry via connections
      const memberIds = new Set(group.screenIds.filter(id => screenIds.has(id)));
      const entryId = group.stackEntryScreenId;
      if (memberIds.size > 1 && memberIds.has(entryId)) {
        const visited = new Set([entryId]);
        const queue = [entryId];
        while (queue.length > 0) {
          const id = queue.shift();
          for (const conn of connections) {
            if (conn.fromScreenId === id && memberIds.has(conn.toScreenId) && !visited.has(conn.toScreenId)) {
              visited.add(conn.toScreenId);
              queue.push(conn.toScreenId);
            }
          }
        }
        for (const sid of memberIds) {
          if (!visited.has(sid)) {
            const s = screens.find(sc => sc.id === sid);
            issues.push({
              level: "warning",
              code: "NAV_ORPHAN_SCREEN",
              message: `Screen "${s?.name ?? sid}" in nav stack "${group.name}" is unreachable from the entry screen`,
              entityId: sid,
            });
          }
        }
      }
    }
  }

  return issues;
}
