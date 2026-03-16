/**
 * Analyzes the navigation graph of screens and connections to detect
 * structural patterns like entry points, tab bars, modals, and back loops.
 *
 * When navigationStructure.type is set, builds tab/stack definitions from
 * user-defined nav-stack groups instead of heuristic detection.
 *
 * @param {Array} screens - Array of screen objects
 * @param {Array} connections - Array of connection objects
 * @param {Object|null} navigationStructure - { type: "tab-bar"|"single-stack"|null, stackGroupIds: string[] }
 * @param {Array} screenGroups - Array of screenGroup objects
 * @returns {Object} Navigation graph analysis result
 */
export function analyzeNavGraph(screens, connections, navigationStructure = null, screenGroups = []) {
  const screenMap = new Map(screens.map(s => [s.id, s]));

  const navType = navigationStructure?.type ?? null;

  if (navType) {
    return analyzeUserDefined(screens, connections, screenMap, navigationStructure, screenGroups);
  }

  const entryScreens = findEntryScreens(screens, connections, screenMap);
  const tabBarPatterns = findTabBarPatterns(screens, connections, screenMap);
  const modalScreens = findModalScreens(connections, screenMap);
  const backLoops = findBackLoops(connections, screenMap);
  const navigationSummary = buildSummary(entryScreens, tabBarPatterns, modalScreens, backLoops);

  return { userDefined: false, entryScreens, tabBarPatterns, modalScreens, backLoops, navigationSummary, stacks: null, tabBar: null };
}

function analyzeUserDefined(screens, connections, screenMap, navigationStructure, screenGroups) {
  const { type, stackGroupIds } = navigationStructure;
  const groupMap = new Map(screenGroups.map(g => [g.id, g]));

  const stacks = stackGroupIds
    .map((gid, idx) => {
      const group = groupMap.get(gid);
      if (!group) return null;

      const memberIds = new Set(group.screenIds);
      const entryId = group.stackEntryScreenId;

      // BFS from entry through connections within the group
      let orderedScreens;
      if (entryId && memberIds.has(entryId)) {
        const visited = new Set([entryId]);
        const queue = [entryId];
        orderedScreens = [];
        while (queue.length > 0) {
          const id = queue.shift();
          const s = screenMap.get(id);
          if (s) orderedScreens.push(s);
          for (const conn of connections) {
            if (conn.fromScreenId === id && memberIds.has(conn.toScreenId) && !visited.has(conn.toScreenId)) {
              visited.add(conn.toScreenId);
              queue.push(conn.toScreenId);
            }
          }
        }
        // Append any unreachable group members at the end
        for (const sid of memberIds) {
          if (!visited.has(sid)) {
            const s = screenMap.get(sid);
            if (s) orderedScreens.push(s);
          }
        }
      } else {
        orderedScreens = group.screenIds.map(id => screenMap.get(id)).filter(Boolean);
      }

      return {
        groupId: gid,
        name: group.name,
        tabIndex: idx,
        tabIcon: group.tabIcon || "",
        entryScreenId: entryId || (orderedScreens[0]?.id ?? null),
        screens: orderedScreens.map(s => ({ id: s.id, name: s.name })),
      };
    })
    .filter(Boolean);

  const tabBar = type === "tab-bar"
    ? { tabs: stacks.map(s => ({ groupId: s.groupId, name: s.name, tabIcon: s.tabIcon, entryScreenId: s.entryScreenId })) }
    : null;

  // Entry screens: entry of first stack (or heuristic fallback)
  const entryScreenId = stacks[0]?.entryScreenId ?? null;
  const entryScreen = entryScreenId ? screenMap.get(entryScreenId) : null;
  const entryScreens = entryScreen ? [{ id: entryScreen.id, name: entryScreen.name }] : findEntryScreens(Array.from(screenMap.values()), [], screenMap);

  // Modals and back loops are still heuristic (not affected by user-defined structure)
  const modalScreens = findModalScreens(connections, screenMap);
  const backLoops = findBackLoops(connections, screenMap);

  const navigationSummary = buildUserDefinedSummary(type, stacks, modalScreens, backLoops);

  return {
    userDefined: true,
    entryScreens,
    tabBarPatterns: [],
    modalScreens,
    backLoops,
    navigationSummary,
    stacks,
    tabBar,
  };
}

function buildUserDefinedSummary(type, stacks, modalScreens, backLoops) {
  const parts = [];

  if (type === "tab-bar") {
    const tabNames = stacks.map(s => s.name).join(", ");
    parts.push(`Tab bar with ${stacks.length} tab${stacks.length !== 1 ? "s" : ""}: ${tabNames}.`);
    for (const stack of stacks) {
      if (stack.screens.length > 1) {
        parts.push(`${stack.name} stack: ${stack.screens.map(s => s.name).join(" → ")}.`);
      }
    }
  } else if (type === "single-stack") {
    const stack = stacks[0];
    if (stack) {
      parts.push(`Single root stack starting at ${stack.entryScreenId ? (stacks[0].screens[0]?.name ?? stack.name) : stack.name}.`);
      if (stack.screens.length > 1) {
        parts.push(`Stack order: ${stack.screens.map(s => s.name).join(" → ")}.`);
      }
    }
  }

  if (modalScreens.length > 0) {
    const descriptions = modalScreens.map(m => `${m.name} from ${m.presentedFrom.name}`).join(", ");
    parts.push(`Modal screens: ${descriptions}.`);
  }

  if (backLoops.length > 0) {
    const descriptions = backLoops.map(b => `${b.from.name} back to ${b.to.name}`).join(", ");
    parts.push(`Back navigation: ${descriptions}.`);
  }

  return parts.join(" ");
}

function findEntryScreens(screens, connections, _screenMap) {
  const incomingTargets = new Set();
  for (const conn of connections) {
    if (conn.action === 'navigate' || conn.action === 'modal') {
      incomingTargets.add(conn.toScreenId);
    }
  }

  const entries = screens
    .filter(s => !incomingTargets.has(s.id))
    .map(s => ({ id: s.id, name: s.name }));

  if (entries.length > 0) return entries;

  // Fallback: leftmost screen
  if (screens.length === 0) return [];
  const leftmost = screens.reduce((min, s) => (s.x < min.x ? s : min), screens[0]);
  return [{ id: leftmost.id, name: leftmost.name }];
}

function findTabBarPatterns(screens, connections, screenMap) {
  // Group outgoing navigate connections by source screen
  const outgoing = new Map();
  for (const conn of connections) {
    if (conn.action !== 'navigate') continue;
    if (!outgoing.has(conn.fromScreenId)) {
      outgoing.set(conn.fromScreenId, []);
    }
    outgoing.set(conn.fromScreenId, [...outgoing.get(conn.fromScreenId), conn]);
  }

  const patterns = [];

  for (const [hubId, conns] of outgoing) {
    if (conns.length < 3 || conns.length > 5) continue;

    const hub = screenMap.get(hubId);
    if (!hub) continue;

    const targetScreens = conns
      .map(c => screenMap.get(c.toScreenId))
      .filter(Boolean);

    if (targetScreens.length < 3) continue;

    // Check if target screens are at similar Y positions
    const yValues = targetScreens.map(s => s.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    if (maxY - minY <= 100) {
      patterns.push({
        hubScreenId: hubId,
        hubScreenName: hub.name,
        tabs: targetScreens.map(s => ({ id: s.id, name: s.name })),
      });
    }
  }

  // Sort so the hub with the most tabs comes first
  patterns.sort((a, b) => b.tabs.length - a.tabs.length);

  return patterns;
}

function findModalScreens(connections, screenMap) {
  const modals = [];
  const seen = new Set();

  for (const conn of connections) {
    if (conn.action !== 'modal') continue;
    const target = screenMap.get(conn.toScreenId);
    const source = screenMap.get(conn.fromScreenId);
    if (!target || !source) continue;
    if (seen.has(target.id)) continue;
    seen.add(target.id);

    modals.push({
      id: target.id,
      name: target.name,
      presentedFrom: { id: source.id, name: source.name },
    });
  }

  return modals;
}

function findBackLoops(connections, screenMap) {
  return connections
    .filter(c => c.action === 'back')
    .map(c => {
      const from = screenMap.get(c.fromScreenId);
      const to = screenMap.get(c.toScreenId);
      if (!from || !to) return null;
      return {
        from: { id: from.id, name: from.name },
        to: { id: to.id, name: to.name },
      };
    })
    .filter(Boolean);
}

function buildSummary(entryScreens, tabBarPatterns, modalScreens, backLoops) {
  const parts = [];

  // Entry points
  if (entryScreens.length === 1) {
    parts.push(`Entry point: ${entryScreens[0].name}.`);
  } else if (entryScreens.length > 1) {
    const names = entryScreens.map(s => s.name).join(', ');
    parts.push(`Entry points: ${names}.`);
  }

  // Navigation style
  if (tabBarPatterns.length > 0) {
    for (const pattern of tabBarPatterns) {
      const tabNames = pattern.tabs.map(t => t.name).join(', ');
      parts.push(
        `${pattern.hubScreenName} acts as a tab bar hub with ${pattern.tabs.length} tabs (${tabNames}).`
      );
    }
  } else {
    parts.push('Main flow uses stack navigation.');
  }

  // Modals
  if (modalScreens.length === 1) {
    const m = modalScreens[0];
    parts.push(`${m.name} is presented as a modal from ${m.presentedFrom.name}.`);
  } else if (modalScreens.length > 1) {
    const descriptions = modalScreens
      .map(m => `${m.name} from ${m.presentedFrom.name}`)
      .join(', ');
    parts.push(`Modal screens: ${descriptions}.`);
  }

  // Back loops
  if (backLoops.length > 0) {
    const descriptions = backLoops
      .map(b => `${b.from.name} back to ${b.to.name}`)
      .join(', ');
    parts.push(`Back navigation: ${descriptions}.`);
  }

  return parts.join(' ');
}
