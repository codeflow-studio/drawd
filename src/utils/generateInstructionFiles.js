import { analyzeNavGraph } from "./analyzeNavGraph.js";

// --- Helpers ---

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sortedScreens(screens) {
  return [...screens].sort((a, b) => a.x - b.x || a.y - b.y);
}

function detectDeviceType(imageWidth, imageHeight) {
  if (!imageWidth || !imageHeight) return null;

  const w = Math.min(imageWidth, imageHeight);
  const h = Math.max(imageWidth, imageHeight);
  const ratio = h / w;
  const isPortrait = imageHeight >= imageWidth;

  // iPad: ~4:3 ratio
  if (ratio >= 1.2 && ratio <= 1.45) {
    return isPortrait ? "iPad (portrait)" : "iPad (landscape)";
  }

  // iPhone: ~19.5:9 ratio (modern), ~16:9 (older)
  if (ratio >= 1.7 && ratio <= 2.3) {
    if (w >= 700 && w <= 1300) {
      // Retina pixel dimensions
      return ratio >= 2.0 ? "iPhone (portrait)" : "Android phone (portrait)";
    }
    if (w >= 350 && w <= 450) {
      // Point dimensions
      return ratio >= 2.0 ? "iPhone (portrait)" : "Android phone (portrait)";
    }
    return isPortrait ? "Mobile (portrait)" : "Mobile (landscape)";
  }

  // Wide landscape
  if (ratio < 1.2) {
    return "Mobile (landscape)";
  }

  return isPortrait ? "Mobile (portrait)" : "Mobile (landscape)";
}

function resolveHotspotLabel(connection, screens) {
  if (!connection.hotspotId) return connection.label || "";
  const sourceScreen = screens.find(s => s.id === connection.fromScreenId);
  if (!sourceScreen) return connection.label || "";
  const hotspot = sourceScreen.hotspots.find(h => h.id === connection.hotspotId);
  return hotspot?.label || connection.label || "";
}

function extractImages(screens) {
  const sorted = sortedScreens(screens);
  const images = [];

  sorted.forEach((s, i) => {
    if (!s.imageData) return;

    const commaIdx = s.imageData.indexOf(",");
    if (commaIdx === -1) return;

    const base64 = s.imageData.slice(commaIdx + 1);
    const binaryStr = atob(base64);
    const data = new Uint8Array(binaryStr.length);
    for (let j = 0; j < binaryStr.length; j++) {
      data[j] = binaryStr.charCodeAt(j);
    }

    const idx = String(i + 1).padStart(2, "0");
    const slug = s.stateGroup && s.stateName
      ? `${slugify(s.name)}-${slugify(s.stateName)}`
      : slugify(s.name);
    const name = `images/${idx}-${slug}.png`;
    images.push({ name, data, screenId: s.id });
  });

  return images;
}

function imageRefForScreen(screen, images) {
  const img = images.find(i => i.screenId === screen.id);
  return img ? img.name : null;
}

// --- Platform templates ---

const PLATFORM_TERMINOLOGY = {
  swiftui: {
    name: "SwiftUI",
    navigate: "Use `NavigationStack` with `.navigationDestination(for:)` to push the target view.",
    back: "Call `dismiss()` via `@Environment(\\.dismiss)` or pop from the navigation path.",
    modal: "Present the target view using `.sheet(isPresented:)` or `.fullScreenCover()`.",
    api: "Use `URLSession.shared.data(from:)` with `async/await`. Handle success/error follow-up actions in the completion. Mark the call with `// TODO: implement API`.",
    custom: "Add a `// TODO: custom action` comment with the description.",
    stack: "Set up a `NavigationStack` with a path-based router using `@State private var path = NavigationPath()`.",
    tabs: "Use `TabView` with `.tabItem { Label(\"Title\", systemImage: \"icon\") }` for each tab.",
  },
  "react-native": {
    name: "React Native",
    navigate: "Use `navigation.navigate('ScreenName')` from React Navigation's stack navigator.",
    back: "Call `navigation.goBack()` to return to the previous screen.",
    modal: "Use `navigation.navigate()` with `presentation: 'modal'` in stack screen options.",
    api: "Use `fetch()` or `axios` for the API call. Handle success/error follow-up navigation in `.then()`/`.catch()`. Add a `// TODO: implement API` comment.",
    custom: "Add a `// TODO: custom action` comment with the description.",
    stack: "Set up `createNativeStackNavigator()` with `NavigationContainer` wrapping `Stack.Navigator`.",
    tabs: "Use `createBottomTabNavigator()` with `Tab.Screen` for each tab.",
  },
  flutter: {
    name: "Flutter",
    navigate: "Use `Navigator.push(context, MaterialPageRoute(builder: (_) => TargetScreen()))`.",
    back: "Call `Navigator.pop(context)` to return to the previous screen.",
    modal: "Use `showModalBottomSheet()` or `showDialog()` to present the screen as an overlay.",
    api: "Use the `http` package with `http.get()`/`http.post()`. Handle success/error follow-up navigation in try/catch. Add a `// TODO: implement API` comment.",
    custom: "Add a `// TODO: custom action` comment with the description.",
    stack: "Set up `MaterialApp` with named routes or `GoRouter` for declarative routing.",
    tabs: "Use `BottomNavigationBar` inside a `Scaffold` with an `IndexedStack` for tab content.",
  },
  "jetpack-compose": {
    name: "Jetpack Compose",
    navigate: "Use `navController.navigate(\"screenRoute\")` within a `NavHost`.",
    back: "Call `navController.popBackStack()` to return to the previous screen.",
    modal: "Use `Dialog { }` or `ModalBottomSheet { }` to present the screen as an overlay.",
    api: "Use Retrofit or Ktor with coroutines. Handle success/error follow-up navigation in try/catch. Add a `// TODO: implement API` comment.",
    custom: "Add a `// TODO: custom action` comment with the description.",
    stack: "Set up `NavHost(navController, startDestination)` with `composable(\"route\") { }` for each screen.",
    tabs: "Use `Scaffold` with `NavigationBar` and `NavigationBarItem` for each tab.",
  },
};

// --- Sub-generators ---

function generateMainMd(screens, connections, options, navAnalysis) {
  const sorted = sortedScreens(screens);
  const platform = options.platform || "auto";
  const platformLabel = platform === "auto"
    ? "Auto (choose based on project needs)"
    : (PLATFORM_TERMINOLOGY[platform]?.name || platform);

  // Detect dominant device type
  const deviceTypes = sorted
    .map(s => detectDeviceType(s.imageWidth, s.imageHeight))
    .filter(Boolean);
  const deviceType = deviceTypes.length > 0
    ? mostCommon(deviceTypes)
    : "Unknown";

  let md = `# Mobile App Flow — AI Build Instructions\n\n`;
  md += `| | |\n|---|---|\n`;
  md += `| **Screens** | ${screens.length} |\n`;
  md += `| **Connections** | ${connections.length} |\n`;
  md += `| **Platform** | ${platformLabel} |\n`;
  md += `| **Device Type** | ${deviceType} |\n\n`;

  // Entry screens
  if (navAnalysis.entryScreens.length > 0) {
    const names = navAnalysis.entryScreens.map(s => s.name).join(", ");
    md += `**Entry screen${navAnalysis.entryScreens.length > 1 ? "s" : ""}:** ${names}\n\n`;
  }

  // Navigation summary
  if (navAnalysis.navigationSummary) {
    md += `**Navigation pattern:** ${navAnalysis.navigationSummary}\n\n`;
  }

  md += `---\n\n`;
  md += `## Contents\n\n`;
  md += `- **screens.md** — Detailed screen specifications, hotspots, and element descriptions\n`;
  md += `- **navigation.md** — Navigation architecture, flow connections, and graph analysis\n`;
  md += `- **build-guide.md** — Platform-specific implementation instructions and code patterns\n`;
  md += `- **images/** — Screen reference images (design captures/wireframes)\n`;

  return md;
}

function mostCommon(arr) {
  const counts = {};
  for (const item of arr) {
    counts[item] = (counts[item] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function generateScreenDetailMd(s, screens, images) {
  let md = "";

  if (s.description) {
    md += `${s.description}\n\n`;
  }

  const device = detectDeviceType(s.imageWidth, s.imageHeight);
  if (device) {
    md += `**Device:** ${device}\n\n`;
  }

  const imgRef = imageRefForScreen(s, images);
  if (imgRef) {
    md += `![${s.name}](${imgRef})\n\n`;
  } else if (!s.imageData) {
    md += `*No design image — needs design*\n\n`;
  }

  if (s.hotspots.length > 0) {
    md += `#### Interactive Elements\n\n`;
    md += `| # | Label | Type | Position | Action | Target |\n`;
    md += `|---|-------|------|----------|--------|--------|\n`;

    s.hotspots.forEach((h, j) => {
      const label = h.label || "Unnamed";
      const type = h.elementType || "button";
      const pos = `(${h.x}%, ${h.y}%, ${h.w}%x${h.h}%)`;
      let actionStr = h.action;
      let target = "\u2014";

      if (h.targetScreenId) {
        const targetScreen = screens.find(ts => ts.id === h.targetScreenId);
        target = targetScreen?.name || "Unknown";
      }

      md += `| ${j + 1} | ${label} | ${type} | ${pos} | ${actionStr} | ${target} |\n`;
    });
    md += `\n`;

    for (const h of s.hotspots) {
      if (h.action === "api" && (h.apiEndpoint || h.apiMethod)) {
        md += `**${h.label || "Unnamed"}** \u2014 API: \`${h.apiMethod || "GET"} ${h.apiEndpoint || "/endpoint"}\`\n\n`;

        if (h.onSuccessAction) {
          let successDetail = `On success: ${h.onSuccessAction}`;
          if (h.onSuccessTargetId) {
            const t = screens.find(ts => ts.id === h.onSuccessTargetId);
            if (t) successDetail += ` \u2192 ${t.name}`;
          }
          if (h.onSuccessAction === "custom" && h.onSuccessCustomDesc) {
            successDetail += ` (${h.onSuccessCustomDesc})`;
          }
          md += `- ${successDetail}\n`;
        }

        if (h.onErrorAction) {
          let errorDetail = `On error: ${h.onErrorAction}`;
          if (h.onErrorTargetId) {
            const t = screens.find(ts => ts.id === h.onErrorTargetId);
            if (t) errorDetail += ` \u2192 ${t.name}`;
          }
          if (h.onErrorAction === "custom" && h.onErrorCustomDesc) {
            errorDetail += ` (${h.onErrorCustomDesc})`;
          }
          md += `- ${errorDetail}\n`;
        }

        if (h.onSuccessAction || h.onErrorAction) md += `\n`;

        if (h.apiDocs) {
          md += `API Documentation:\n\`\`\`\n${h.apiDocs}\n\`\`\`\n\n`;
        }
      }
      if (h.action === "custom" && h.customDescription) {
        md += `**${h.label || "Unnamed"}** \u2014 Custom: ${h.customDescription}\n\n`;
      }
    }
  } else {
    md += `*No interactive elements defined*\n\n`;
  }

  return md;
}

function generateScreensMd(screens, connections, images) {
  const sorted = sortedScreens(screens);
  let md = `# Screens\n\n`;

  // Build stateGroup map
  const stateGroups = {};
  for (const s of sorted) {
    if (s.stateGroup) {
      if (!stateGroups[s.stateGroup]) stateGroups[s.stateGroup] = [];
      stateGroups[s.stateGroup].push(s);
    }
  }

  const output = new Set();
  let screenNum = 0;

  sorted.forEach((s) => {
    if (output.has(s.id)) return;

    screenNum++;

    if (s.stateGroup && stateGroups[s.stateGroup]?.length >= 2) {
      const group = stateGroups[s.stateGroup];
      md += `## Screen ${screenNum}: ${s.name}\n\n`;
      md += `*This screen has ${group.length} states:*\n\n`;

      group.forEach((gs) => {
        output.add(gs.id);
        md += `### State: ${gs.stateName || gs.name}\n\n`;
        md += generateScreenDetailMd(gs, screens, images);
      });

      md += `---\n\n`;
    } else {
      output.add(s.id);
      md += `## Screen ${screenNum}: ${s.name}\n\n`;
      md += generateScreenDetailMd(s, screens, images);
      md += `---\n\n`;
    }
  });

  return md;
}

function generateNavigationMd(screens, connections, navAnalysis) {
  let md = `# Navigation Architecture\n\n`;

  // Summary from navAnalysis
  if (navAnalysis.navigationSummary) {
    md += `${navAnalysis.navigationSummary}\n\n`;
  }

  // Entry screens
  if (navAnalysis.entryScreens.length > 0) {
    md += `## Entry Screens\n\n`;
    for (const entry of navAnalysis.entryScreens) {
      md += `- **${entry.name}**\n`;
    }
    md += `\n`;
  }

  // Tab bar patterns
  if (navAnalysis.tabBarPatterns.length > 0) {
    md += `## Tab Bar Patterns\n\n`;
    for (const pattern of navAnalysis.tabBarPatterns) {
      md += `**${pattern.hubScreenName}** hub with ${pattern.tabs.length} tabs:\n`;
      for (const tab of pattern.tabs) {
        md += `  - ${tab.name}\n`;
      }
      md += `\n`;
    }
  }

  // Modal screens
  if (navAnalysis.modalScreens.length > 0) {
    md += `## Modal Screens\n\n`;
    for (const modal of navAnalysis.modalScreens) {
      md += `- **${modal.name}** (presented from ${modal.presentedFrom.name})\n`;
    }
    md += `\n`;
  }

  // Back loops
  if (navAnalysis.backLoops.length > 0) {
    md += `## Back Navigation\n\n`;
    for (const loop of navAnalysis.backLoops) {
      md += `- ${loop.from.name} back to ${loop.to.name}\n`;
    }
    md += `\n`;
  }

  // Connection list
  md += `## All Connections\n\n`;
  if (connections.length === 0) {
    md += `No connections defined yet.\n\n`;
  } else {
    md += `| # | From | To | Trigger | Action |\n`;
    md += `|---|------|----|---------|--------|\n`;
    connections.forEach((c, i) => {
      const from = screens.find(s => s.id === c.fromScreenId);
      const to = screens.find(s => s.id === c.toScreenId);
      const label = resolveHotspotLabel(c, screens);
      let actionCol = c.action || "navigate";
      if (c.connectionPath === "api-success") actionCol += " (success)";
      else if (c.connectionPath === "api-error") actionCol += " (error)";
      md += `| ${i + 1} | ${from?.name || "?"} | ${to?.name || "?"} | ${label || "—"} | ${actionCol} |\n`;
    });
    md += `\n`;
  }

  return md;
}

function generateBuildGuideMd(screens, connections, options) {
  const platform = options.platform || "auto";
  let md = `# Build Guide\n\n`;

  if (platform === "auto") {
    md += `## Implementation Instructions\n\n`;
    md += `1. Create a mobile app (React Native / Flutter / SwiftUI / Jetpack Compose — choose based on project needs)\n`;
    md += `2. Implement each screen listed in screens.md as a separate component/view\n`;
    md += `3. Replicate the visual design from each screen's reference image as closely as possible\n`;
    md += `4. Wire up all navigation flows exactly as described in navigation.md\n`;
    md += `5. For each interactive element, implement the specified action type:\n`;
    md += `   - **navigate** — Push/navigate to the target screen\n`;
    md += `   - **back** — Pop/go back to previous screen\n`;
    md += `   - **modal** — Present target screen as a modal/overlay\n`;
    md += `   - **api** — Make the specified HTTP request (see endpoint and method in screens.md)\n`;
    md += `   - **custom** — Implement custom logic as described in screens.md\n`;
    md += `6. Set up proper navigation stack/router with all routes\n`;
    md += `7. Add smooth transitions between screens matching mobile platform conventions\n`;
    md += `8. Ensure responsive layout that adapts to different screen sizes\n`;
  } else {
    const pt = PLATFORM_TERMINOLOGY[platform];
    if (!pt) {
      md += `Unknown platform "${platform}". Using generic instructions.\n\n`;
      return md;
    }

    md += `## ${pt.name} Implementation\n\n`;
    md += `### Navigation Setup\n\n`;
    md += `${pt.stack}\n\n`;

    // Tab bar setup if applicable
    md += `### Tab Bar\n\n`;
    md += `${pt.tabs}\n\n`;

    md += `### Action Types\n\n`;
    md += `| Action | Implementation |\n`;
    md += `|--------|---------------|\n`;
    md += `| **navigate** | ${pt.navigate} |\n`;
    md += `| **back** | ${pt.back} |\n`;
    md += `| **modal** | ${pt.modal} |\n`;
    md += `| **api** | ${pt.api} |\n`;
    md += `| **custom** | ${pt.custom} |\n\n`;

    md += `### Steps\n\n`;
    md += `1. Implement each screen from screens.md as a separate ${pt.name} view/component\n`;
    md += `2. Replicate the visual design from each screen's reference image\n`;
    md += `3. Wire up navigation flows from navigation.md using the patterns above\n`;
    md += `4. Handle API actions with proper error handling and loading states\n`;
    md += `5. Add smooth transitions matching ${pt.name} platform conventions\n`;
  }

  return md;
}

// --- Main export ---

/**
 * Generate a multi-file instruction package from screens and connections.
 *
 * @param {Array} screens - Array of screen objects
 * @param {Array} connections - Array of connection objects
 * @param {Object} options - { platform: "auto"|"swiftui"|"react-native"|"flutter"|"jetpack-compose" }
 * @returns {{ files: Array<{ name: string, content: string }>, images: Array<{ name: string, data: Uint8Array }> }}
 */
export function generateInstructionFiles(screens, connections, options = {}) {
  const navAnalysis = analyzeNavGraph(screens, connections);
  const images = extractImages(screens);

  const files = [
    { name: "main.md", content: generateMainMd(screens, connections, options, navAnalysis) },
    { name: "screens.md", content: generateScreensMd(screens, connections, images) },
    { name: "navigation.md", content: generateNavigationMd(screens, connections, navAnalysis) },
    { name: "build-guide.md", content: generateBuildGuideMd(screens, connections, options) },
  ];

  return { files, images };
}
