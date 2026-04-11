/**
 * Generates a self-contained interactive HTML prototype from flow data.
 * Each screen becomes a tappable page with hotspot overlays that navigate
 * between screens. Output is a single HTML file with all images inlined
 * as base64 — no external dependencies required.
 */

/**
 * Resolve navigation targets for every hotspot across all screens.
 * Returns { [screenId]: { [hotspotId]: { action, targetScreenId, conditions } } }
 */
function buildNavigationMap(screens, connections) {
  const navMap = {};

  for (const screen of screens) {
    const screenNav = {};
    for (const hs of screen.hotspots || []) {
      const action = hs.action || "navigate";

      if (action === "back") {
        screenNav[hs.id] = { action: "back", targetScreenId: null, conditions: null };
        continue;
      }

      if (action === "conditional") {
        const conditions = (hs.conditions || [])
          .filter((c) => c.targetScreenId)
          .map((c) => ({
            label: c.label || "Option",
            targetScreenId: c.targetScreenId,
          }));
        screenNav[hs.id] = { action: "conditional", targetScreenId: null, conditions };
        continue;
      }

      // navigate, modal, api, custom — resolve a single target
      let targetId = null;

      if (action === "navigate" || action === "modal") {
        targetId = hs.targetScreenId || null;
      } else if (action === "api") {
        // Follow success path in prototype (no real backend)
        targetId = hs.onSuccessTargetId || null;
      }

      // Fallback: look for a connection with this hotspotId
      if (!targetId) {
        const conn = connections.find(
          (c) => c.fromScreenId === screen.id && c.hotspotId === hs.id
        );
        if (conn) targetId = conn.toScreenId;
      }

      if (targetId) {
        screenNav[hs.id] = { action: "navigate", targetScreenId: targetId, conditions: null };
      }
      // If no target resolved, omit from navMap — hotspot will be a no-op
    }
    if (Object.keys(screenNav).length > 0) {
      navMap[screen.id] = screenNav;
    }
  }

  return navMap;
}

/**
 * Serialize screens into a minimal shape for embedding in the HTML.
 */
function buildScreenData(screens) {
  return screens.map((s) => ({
    id: s.id,
    name: s.name || "Untitled",
    imageData: s.imageData || null,
    hotspots: (s.hotspots || []).map((h) => ({
      id: h.id,
      label: h.label || "",
      x: h.x,
      y: h.y,
      w: h.w,
      h: h.h,
    })),
  }));
}

const PROTOTYPE_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; overflow: hidden; background: #1a1a2e;
             font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
#app { height: 100%; display: flex; justify-content: center; align-items: stretch; }

.phone-frame { position: relative; width: 100%; max-width: 430px;
               height: 100%; overflow: hidden; background: #000; }

.screen { position: absolute; inset: 0; display: flex; flex-direction: column;
          opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
.screen.visible { opacity: 1; pointer-events: auto; }

.screen img { width: 100%; height: 100%; object-fit: contain;
              object-position: top center; display: block; }

.screen .hotspot-layer { position: absolute; }

.hotspot { position: absolute; cursor: pointer; border: none;
           background: transparent; padding: 0; z-index: 2;
           -webkit-tap-highlight-color: rgba(0,120,255,0.15); }
.hotspot:active { background: rgba(0,120,255,0.12); }

@keyframes hotspot-hint {
  0%   { background: rgba(0,120,255,0.18); border-color: rgba(0,120,255,0.6); }
  100% { background: transparent; border-color: transparent; }
}
.hotspot.hint { border: 2px solid rgba(0,120,255,0.6);
                border-radius: 6px;
                animation: hotspot-hint 1.2s ease-out forwards; }

.no-image { display: flex; align-items: center; justify-content: center;
            height: 100%; color: #666; font-size: 18px; text-align: center;
            padding: 24px; }

.back-btn { position: fixed; bottom: 24px; left: 50%;
            transform: translateX(-50%); z-index: 100;
            background: rgba(0,0,0,0.7); color: #fff; border: none;
            border-radius: 24px; padding: 10px 24px; cursor: pointer;
            font-size: 14px; backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: none; }
.back-btn.show { display: block; }
.back-btn:hover { background: rgba(0,0,0,0.9); }

.sidebar-toggle { position: fixed; top: 12px; right: 12px; z-index: 100;
                   background: rgba(0,0,0,0.7); color: #fff;
                   border: none; border-radius: 8px; padding: 8px 12px;
                   cursor: pointer; font-size: 18px; line-height: 1;
                   backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.sidebar-toggle:hover { background: rgba(0,0,0,0.9); }

.sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4);
                   z-index: 190; display: none; }
.sidebar-overlay.show { display: block; }

.sidebar { position: fixed; top: 0; right: 0; width: 280px;
           height: 100%; background: rgba(20,20,40,0.97);
           z-index: 200; transform: translateX(100%);
           transition: transform 0.3s ease; overflow-y: auto;
           -webkit-overflow-scrolling: touch;
           backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
.sidebar.open { transform: translateX(0); }

.sidebar-header { padding: 16px; font-size: 13px; font-weight: 600;
                   color: #888; text-transform: uppercase; letter-spacing: 0.05em;
                   border-bottom: 1px solid rgba(255,255,255,0.06); }

.sidebar-item { padding: 14px 16px; color: #ccc; cursor: pointer;
                border-bottom: 1px solid rgba(255,255,255,0.04);
                font-size: 14px; transition: background 0.15s; }
.sidebar-item:hover { background: rgba(255,255,255,0.06); }
.sidebar-item.active { color: #61dafb; background: rgba(97,218,251,0.08); }

.condition-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5);
                     z-index: 250; display: none; }
.condition-overlay.show { display: flex; align-items: center; justify-content: center; }

.condition-menu { background: #2a2a4a; border-radius: 14px; padding: 8px;
                  min-width: 220px; max-width: 320px;
                  box-shadow: 0 8px 32px rgba(0,0,0,0.6); }
.condition-menu-title { padding: 12px 14px 8px; font-size: 12px; font-weight: 600;
                         color: #888; text-transform: uppercase; letter-spacing: 0.04em; }
.condition-option { padding: 14px 14px; color: #ddd; cursor: pointer;
                    border-radius: 8px; font-size: 15px;
                    transition: background 0.15s; }
.condition-option:hover { background: rgba(255,255,255,0.08); }

.screen-name { position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
               z-index: 90; background: rgba(0,0,0,0.6); color: #aaa;
               font-size: 11px; padding: 4px 12px; border-radius: 12px;
               pointer-events: none; white-space: nowrap;
               backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }

@media (max-width: 430px) {
  .phone-frame { max-width: 100%; }
  .sidebar { width: 100%; }
}
`;

function buildRuntimeJS() {
  return `
(function() {
  var screens = window.__SCREENS__;
  var navMap = window.__NAV_MAP__;
  var startId = window.__START_ID__;

  var currentId = startId;
  var history = [];
  var sidebarOpen = false;

  var app = document.getElementById("app");
  var phoneFrame = document.createElement("div");
  phoneFrame.className = "phone-frame";
  app.appendChild(phoneFrame);

  var screenEls = {};
  var sidebarItems = {};

  // Calculate rendered image bounds for object-fit: contain
  function alignHotspotLayer(img, hotLayer) {
    var natW = img.naturalWidth;
    var natH = img.naturalHeight;
    if (!natW || !natH) { hotLayer.style.inset = "0"; return; }
    var contW = img.clientWidth;
    var contH = img.clientHeight;
    var scale = Math.min(contW / natW, contH / natH);
    var renderedW = natW * scale;
    var renderedH = natH * scale;
    // object-position: top center
    var offsetX = (contW - renderedW) / 2;
    var offsetY = 0;
    hotLayer.style.left = offsetX + "px";
    hotLayer.style.top = offsetY + "px";
    hotLayer.style.width = renderedW + "px";
    hotLayer.style.height = renderedH + "px";
  }

  // Build screen elements
  screens.forEach(function(s) {
    var div = document.createElement("div");
    div.className = "screen";
    div.dataset.id = s.id;

    var hotLayer = document.createElement("div");
    hotLayer.className = "hotspot-layer";

    if (s.imageData) {
      var img = document.createElement("img");
      img.src = s.imageData;
      img.alt = s.name;
      img.draggable = false;
      img.addEventListener("load", function() { alignHotspotLayer(img, hotLayer); });
      div.appendChild(img);
    } else {
      var ph = document.createElement("div");
      ph.className = "no-image";
      ph.textContent = s.name;
      div.appendChild(ph);
      hotLayer.style.inset = "0";
    }

    s.hotspots.forEach(function(h) {
      var btn = document.createElement("button");
      btn.className = "hotspot";
      btn.style.left = h.x + "%";
      btn.style.top = h.y + "%";
      btn.style.width = h.w + "%";
      btn.style.height = h.h + "%";
      btn.title = h.label || "";
      btn.setAttribute("aria-label", h.label || "Hotspot");
      btn.addEventListener("click", function() { handleHotspotClick(s.id, h.id); });
      hotLayer.appendChild(btn);
    });
    div.appendChild(hotLayer);

    phoneFrame.appendChild(div);
    screenEls[s.id] = div;
  });

  // Screen name indicator
  var nameEl = document.createElement("div");
  nameEl.className = "screen-name";
  document.body.appendChild(nameEl);

  // Back button
  var backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.textContent = "\\u2190 Back";
  backBtn.addEventListener("click", goBack);
  document.body.appendChild(backBtn);

  // Sidebar toggle
  var toggleBtn = document.createElement("button");
  toggleBtn.className = "sidebar-toggle";
  toggleBtn.innerHTML = "&#9776;";
  toggleBtn.addEventListener("click", toggleSidebar);
  document.body.appendChild(toggleBtn);

  // Sidebar overlay
  var sideOverlay = document.createElement("div");
  sideOverlay.className = "sidebar-overlay";
  sideOverlay.addEventListener("click", closeSidebar);
  document.body.appendChild(sideOverlay);

  // Sidebar
  var sidebar = document.createElement("div");
  sidebar.className = "sidebar";
  var sideHeader = document.createElement("div");
  sideHeader.className = "sidebar-header";
  sideHeader.textContent = "Screens";
  sidebar.appendChild(sideHeader);

  screens.forEach(function(s) {
    var item = document.createElement("div");
    item.className = "sidebar-item";
    item.textContent = s.name;
    item.addEventListener("click", function() {
      closeSidebar();
      navigate(s.id);
    });
    sidebar.appendChild(item);
    sidebarItems[s.id] = item;
  });
  document.body.appendChild(sidebar);

  // Condition menu
  var condOverlay = document.createElement("div");
  condOverlay.className = "condition-overlay";
  condOverlay.addEventListener("click", function(e) {
    if (e.target === condOverlay) hideConditionMenu();
  });
  var condMenu = document.createElement("div");
  condMenu.className = "condition-menu";
  condOverlay.appendChild(condMenu);
  document.body.appendChild(condOverlay);

  function showScreen(id) {
    currentId = id;
    Object.keys(screenEls).forEach(function(sid) {
      screenEls[sid].classList.toggle("visible", sid === id);
    });
    backBtn.classList.toggle("show", history.length > 0);
    Object.keys(sidebarItems).forEach(function(sid) {
      sidebarItems[sid].classList.toggle("active", sid === id);
    });
    var sc = screens.find(function(s) { return s.id === id; });
    nameEl.textContent = sc ? sc.name : "";
  }

  function navigate(targetId) {
    if (!targetId || targetId === currentId) return;
    if (!screenEls[targetId]) return;
    history.push(currentId);
    showScreen(targetId);
  }

  function goBack() {
    if (history.length === 0) return;
    var prevId = history.pop();
    showScreen(prevId);
  }

  function handleHotspotClick(screenId, hotspotId) {
    var entry = navMap[screenId] && navMap[screenId][hotspotId];
    if (!entry) return;

    if (entry.action === "back") {
      goBack();
    } else if (entry.action === "conditional" && entry.conditions && entry.conditions.length > 0) {
      showConditionMenu(entry.conditions);
    } else if (entry.targetScreenId) {
      navigate(entry.targetScreenId);
    }
  }

  function showConditionMenu(conditions) {
    condMenu.innerHTML = "";
    var title = document.createElement("div");
    title.className = "condition-menu-title";
    title.textContent = "Choose path";
    condMenu.appendChild(title);

    conditions.forEach(function(c) {
      var opt = document.createElement("div");
      opt.className = "condition-option";
      opt.textContent = c.label;
      opt.addEventListener("click", function() {
        hideConditionMenu();
        navigate(c.targetScreenId);
      });
      condMenu.appendChild(opt);
    });
    condOverlay.classList.add("show");
  }

  function hideConditionMenu() {
    condOverlay.classList.remove("show");
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle("open", sidebarOpen);
    sideOverlay.classList.toggle("show", sidebarOpen);
  }

  function closeSidebar() {
    sidebarOpen = false;
    sidebar.classList.remove("open");
    sideOverlay.classList.remove("show");
  }

  // Re-align hotspot layers on resize
  window.addEventListener("resize", function() {
    screens.forEach(function(s) {
      var el = screenEls[s.id];
      if (!el) return;
      var img = el.querySelector("img");
      var hotLayer = el.querySelector(".hotspot-layer");
      if (img && hotLayer && img.naturalWidth) {
        alignHotspotLayer(img, hotLayer);
      }
    });
  });

  // Hint: clicking outside hotspots briefly highlights all hotspot locations
  var hintTimeout = null;
  phoneFrame.addEventListener("click", function(e) {
    if (e.target.closest(".hotspot") || e.target.closest(".back-btn")) return;
    var visibleScreen = screenEls[currentId];
    if (!visibleScreen) return;
    var hotspots = visibleScreen.querySelectorAll(".hotspot");
    if (hotspots.length === 0) return;
    clearTimeout(hintTimeout);
    hotspots.forEach(function(btn) {
      btn.classList.remove("hint");
      void btn.offsetWidth;
      btn.classList.add("hint");
    });
    hintTimeout = setTimeout(function() {
      hotspots.forEach(function(btn) { btn.classList.remove("hint"); });
    }, 1300);
  });

  // Keyboard navigation
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      hideConditionMenu();
      closeSidebar();
    } else if (e.key === "Backspace" || (e.key === "ArrowLeft" && e.altKey)) {
      goBack();
    }
  });

  // Start
  showScreen(startId);
})();
`;
}

/**
 * Generate a self-contained HTML prototype from flow data.
 * @param {Array} screens - Screen objects with imageData, hotspots, etc.
 * @param {Array} connections - Connection objects
 * @param {Object} [options]
 * @param {string} [options.title] - Page title (default: "Prototype")
 * @param {string|null} [options.startScreenId] - First screen to display
 * @param {Set|null} [options.scopeScreenIds] - Only include these screen IDs
 * @returns {string} Complete HTML document
 */
export function generatePrototype(screens, connections, options = {}) {
  const { title = "Prototype", startScreenId = null, scopeScreenIds = null } = options;

  // Filter and sort screens
  let filtered = scopeScreenIds
    ? screens.filter((s) => scopeScreenIds.has(s.id))
    : [...screens];
  filtered.sort((a, b) => a.x - b.x || a.y - b.y);

  if (filtered.length === 0) return "";

  // Filter connections to only those between included screens
  const screenIdSet = new Set(filtered.map((s) => s.id));
  const filteredConnections = connections.filter(
    (c) => screenIdSet.has(c.fromScreenId) && screenIdSet.has(c.toScreenId)
  );

  const navMap = buildNavigationMap(filtered, filteredConnections);
  const screenData = buildScreenData(filtered);

  const startId = startScreenId && screenIdSet.has(startScreenId)
    ? startScreenId
    : filtered[0].id;

  const escapedTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>${escapedTitle}</title>
<style>${PROTOTYPE_CSS}</style>
</head>
<body>
<div id="app"></div>
<script>
window.__SCREENS__ = ${JSON.stringify(screenData)};
window.__NAV_MAP__ = ${JSON.stringify(navMap)};
window.__START_ID__ = ${JSON.stringify(startId)};
${buildRuntimeJS()}
</script>
</body>
</html>`;
}

/**
 * Download an HTML prototype file.
 * @param {string} htmlString - Complete HTML document string
 * @param {string} [filename] - Download filename
 */
export function downloadPrototype(htmlString, filename = "prototype.html") {
  const blob = new Blob([htmlString], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
