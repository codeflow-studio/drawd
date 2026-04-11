import { describe, it, expect } from "vitest";
import { generatePrototype } from "./generatePrototype.js";

function makeScreen(overrides = {}) {
  return {
    id: "s1",
    name: "Screen 1",
    x: 0,
    y: 0,
    width: 200,
    imageData: "data:image/png;base64,AAAA",
    hotspots: [],
    ...overrides,
  };
}

function makeHotspot(overrides = {}) {
  return {
    id: "hs1",
    label: "Tap me",
    x: 10,
    y: 20,
    w: 30,
    h: 10,
    action: "navigate",
    targetScreenId: "s2",
    conditions: [],
    ...overrides,
  };
}

describe("generatePrototype", () => {
  it("returns a valid HTML document", () => {
    const html = generatePrototype([makeScreen()], []);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
    expect(html).toContain("<title>Prototype</title>");
  });

  it("returns empty string when no screens", () => {
    expect(generatePrototype([], [])).toBe("");
  });

  it("returns empty string when scope filters out all screens", () => {
    const html = generatePrototype(
      [makeScreen()],
      [],
      { scopeScreenIds: new Set(["nonexistent"]) }
    );
    expect(html).toBe("");
  });

  it("embeds screen image data as base64", () => {
    const screen = makeScreen({ imageData: "data:image/png;base64,TEST123" });
    const html = generatePrototype([screen], []);
    expect(html).toContain("data:image/png;base64,TEST123");
  });

  it("uses custom title", () => {
    const html = generatePrototype([makeScreen()], [], { title: "My App" });
    expect(html).toContain("<title>My App</title>");
  });

  it("escapes HTML in title", () => {
    const html = generatePrototype([makeScreen()], [], { title: "<script>alert(1)</script>" });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("generates hotspot elements with correct percentage positioning", () => {
    const screen = makeScreen({
      hotspots: [makeHotspot({ x: 15, y: 25, w: 40, h: 12 })],
    });
    const html = generatePrototype([screen], []);
    // The hotspot data is serialized in the screen data JSON
    expect(html).toContain('"x":15');
    expect(html).toContain('"y":25');
    expect(html).toContain('"w":40');
    expect(html).toContain('"h":12');
  });

  it("handles screens without images", () => {
    const screen = makeScreen({ imageData: null });
    const html = generatePrototype([screen], []);
    expect(html).toContain("Screen 1");
    expect(html).toContain("no-image");
  });

  it("handles screens without hotspots", () => {
    const screen = makeScreen({ hotspots: [] });
    const html = generatePrototype([screen], []);
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("respects scopeScreenIds filtering", () => {
    const screens = [
      makeScreen({ id: "s1", name: "Included" }),
      makeScreen({ id: "s2", name: "Excluded", x: 100 }),
    ];
    const html = generatePrototype(screens, [], {
      scopeScreenIds: new Set(["s1"]),
    });
    expect(html).toContain("Included");
    expect(html).not.toContain("Excluded");
  });

  it("resolves navigate target via hotspot.targetScreenId", () => {
    const screens = [
      makeScreen({
        id: "s1",
        hotspots: [makeHotspot({ id: "hs1", targetScreenId: "s2" })],
      }),
      makeScreen({ id: "s2", name: "Target", x: 100 }),
    ];
    const html = generatePrototype(screens, []);
    // NAV_MAP should have s1 -> hs1 -> targetScreenId: s2
    expect(html).toContain('"targetScreenId":"s2"');
  });

  it("resolves navigate target via connection fallback", () => {
    const screens = [
      makeScreen({
        id: "s1",
        hotspots: [makeHotspot({ id: "hs1", targetScreenId: null })],
      }),
      makeScreen({ id: "s2", name: "Target", x: 100 }),
    ];
    const connections = [
      { id: "c1", fromScreenId: "s1", toScreenId: "s2", hotspotId: "hs1" },
    ];
    const html = generatePrototype(screens, connections);
    expect(html).toContain('"targetScreenId":"s2"');
  });

  it("resolves conditional hotspots into conditions array", () => {
    const screens = [
      makeScreen({
        id: "s1",
        hotspots: [
          makeHotspot({
            id: "hs1",
            action: "conditional",
            targetScreenId: null,
            conditions: [
              { id: "c1", label: "Success", targetScreenId: "s2" },
              { id: "c2", label: "Error", targetScreenId: "s3" },
            ],
          }),
        ],
      }),
      makeScreen({ id: "s2", name: "Success", x: 100 }),
      makeScreen({ id: "s3", name: "Error", x: 200 }),
    ];
    const html = generatePrototype(screens, []);
    expect(html).toContain('"action":"conditional"');
    expect(html).toContain('"label":"Success"');
    expect(html).toContain('"label":"Error"');
  });

  it("handles back action hotspots", () => {
    const screens = [
      makeScreen({
        id: "s1",
        hotspots: [makeHotspot({ id: "hs1", action: "back", targetScreenId: null })],
      }),
    ];
    const html = generatePrototype(screens, []);
    expect(html).toContain('"action":"back"');
  });

  it("handles API action hotspots via success path", () => {
    const screens = [
      makeScreen({
        id: "s1",
        hotspots: [
          makeHotspot({
            id: "hs1",
            action: "api",
            targetScreenId: null,
            onSuccessTargetId: "s2",
          }),
        ],
      }),
      makeScreen({ id: "s2", name: "API Result", x: 100 }),
    ];
    const html = generatePrototype(screens, []);
    expect(html).toContain('"targetScreenId":"s2"');
  });

  it("handles orphan hotspots without errors", () => {
    const screens = [
      makeScreen({
        id: "s1",
        hotspots: [makeHotspot({ id: "hs1", targetScreenId: null })],
      }),
    ];
    const html = generatePrototype(screens, []);
    // Should produce valid HTML — orphan hotspot omitted from navMap
    expect(html).toContain("<!DOCTYPE html>");
    // Hotspot data still in screen data (rendered as no-op)
    expect(html).toContain('"id":"hs1"');
  });

  it("uses first sorted screen as start when no startScreenId provided", () => {
    const screens = [
      makeScreen({ id: "s2", x: 200 }),
      makeScreen({ id: "s1", x: 0 }),
    ];
    const html = generatePrototype(screens, []);
    expect(html).toContain('"s1"');
    // s1 appears as __START_ID__ because it has lower x
    expect(html).toContain('window.__START_ID__ = "s1"');
  });

  it("uses provided startScreenId when given", () => {
    const screens = [
      makeScreen({ id: "s1", x: 0 }),
      makeScreen({ id: "s2", x: 200 }),
    ];
    const html = generatePrototype(screens, [], { startScreenId: "s2" });
    expect(html).toContain('window.__START_ID__ = "s2"');
  });

  it("falls back to first screen if startScreenId is not in scope", () => {
    const screens = [
      makeScreen({ id: "s1", x: 0 }),
      makeScreen({ id: "s2", x: 200 }),
    ];
    const html = generatePrototype(screens, [], { startScreenId: "nonexistent" });
    expect(html).toContain('window.__START_ID__ = "s1"');
  });

  it("sorts screens by x then y", () => {
    const screens = [
      makeScreen({ id: "c", x: 100, y: 0 }),
      makeScreen({ id: "a", x: 0, y: 50 }),
      makeScreen({ id: "b", x: 0, y: 10 }),
    ];
    const html = generatePrototype(screens, []);
    // Sidebar order should be b, a, c
    const bIdx = html.indexOf('"id":"b"');
    const aIdx = html.indexOf('"id":"a"');
    const cIdx = html.indexOf('"id":"c"');
    expect(bIdx).toBeLessThan(aIdx);
    expect(aIdx).toBeLessThan(cIdx);
  });

  it("filters connections to only included screens", () => {
    const screens = [
      makeScreen({
        id: "s1",
        hotspots: [makeHotspot({ id: "hs1", targetScreenId: null })],
      }),
      makeScreen({ id: "s2", x: 100 }),
      makeScreen({ id: "s3", x: 200 }),
    ];
    const connections = [
      { id: "c1", fromScreenId: "s1", toScreenId: "s2", hotspotId: "hs1" },
      { id: "c2", fromScreenId: "s1", toScreenId: "s3", hotspotId: "hs1" },
    ];
    // Only include s1 and s2 — connection to s3 should be filtered out
    const html = generatePrototype(screens, connections, {
      scopeScreenIds: new Set(["s1", "s2"]),
    });
    expect(html).toContain('"targetScreenId":"s2"');
    expect(html).not.toContain('"s3"');
  });

  it("includes runtime navigation engine", () => {
    const html = generatePrototype([makeScreen()], []);
    expect(html).toContain("function navigate(");
    expect(html).toContain("function goBack(");
    expect(html).toContain("function handleHotspotClick(");
  });

  it("includes sidebar and back button in output", () => {
    const html = generatePrototype([makeScreen()], []);
    expect(html).toContain("sidebar");
    expect(html).toContain("back-btn");
  });

  it("includes hotspot hint CSS and click-outside handler", () => {
    const screen = makeScreen({
      hotspots: [makeHotspot()],
    });
    const html = generatePrototype([screen], []);
    expect(html).toContain("hotspot-hint");
    expect(html).toContain(".hotspot.hint");
    expect(html).toContain('classList.add("hint")');
  });
});
