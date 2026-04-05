import { describe, it, expect } from "vitest";
import { figmaNodeToHtml } from "./figmaToHtml.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a minimal FRAME node in _figFile format (REST API property names). */
function makeFrame(overrides = {}) {
  return {
    type: "FRAME",
    name: "Frame",
    id: "1:1",
    visible: true,
    opacity: 1,
    size: { x: 390, y: 844 },
    relativeTransform: [[1, 0, 0], [0, 1, 0]],
    fills: [],
    strokes: [],
    strokeWeight: 0,
    strokeAlign: "INSIDE",
    cornerRadius: 0,
    clipsContent: false,
    effects: [],
    children: [],
    ...overrides,
  };
}

/** Build a minimal TEXT node in _figFile format. */
function makeText(characters, overrides = {}) {
  return {
    type: "TEXT",
    name: characters,
    id: "1:99",
    visible: true,
    opacity: 1,
    size: { x: 200, y: 24 },
    relativeTransform: [[1, 0, 10], [0, 1, 20]],
    fills: [{ type: "SOLID", visible: true, opacity: 1, blendMode: "NORMAL", color: { r: 1, g: 1, b: 1, a: 1 } }],
    strokes: [],
    strokeWeight: 0,
    strokeAlign: "OUTSIDE",
    characters,
    style: {
      fontFamily: "Inter",
      fontWeight: 400,
      italic: false,
      fontSize: 16,
      textAlignHorizontal: "LEFT",
      textAlignVertical: "CENTER",
      letterSpacing: 0,
      lineHeightPx: 24,
      textDecoration: "NONE",
    },
    effects: [],
    ...overrides,
  };
}

// ─── Auto-layout (kiwi props augmented by parseFigmaClipboard) ───────────────

describe("figmaNodeToHtml — auto-layout", () => {
  it("converts a VERTICAL auto-layout frame to flex column", () => {
    const node = makeFrame({
      stackMode: "VERTICAL",
      stackSpacing: 16,
      stackHorizontalPadding: 24,
      stackVerticalPadding: 32,
      stackPaddingRight: 24,
      stackPaddingBottom: 48,
      stackPrimaryAlignItems: "CENTER",
      stackCounterAlignItems: "CENTER",
      fills: [{ type: "SOLID", visible: true, opacity: 1, color: { r: 0, g: 0, b: 0, a: 1 } }],
      children: [makeText("Hello")],
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("flex-direction: column");
    expect(html).toContain("gap: 16px");
    expect(html).toContain("padding: 32px 24px 48px 24px");
    expect(html).toContain("justify-content: center");
    expect(html).toContain("align-items: center");
    expect(html).toContain("display: flex");
  });

  it("converts a HORIZONTAL auto-layout frame to flex row", () => {
    const node = makeFrame({
      stackMode: "HORIZONTAL",
      stackSpacing: 8,
      children: [makeText("A"), makeText("B")],
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("flex-direction: row");
    expect(html).toContain("gap: 8px");
  });

  it("applies stackChildAlignSelf STRETCH to children", () => {
    const child = makeText("Stretch me", { stackChildAlignSelf: "STRETCH" });
    const node = makeFrame({
      stackMode: "VERTICAL",
      children: [child],
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("align-self: stretch");
    expect(html).toContain("width: 100%");
  });

  it("applies stackChildPrimaryGrow to children", () => {
    const child = makeFrame({
      name: "Spacer",
      size: { x: 100, y: 10 },
      stackChildPrimaryGrow: 1,
    });
    const node = makeFrame({
      stackMode: "VERTICAL",
      children: [child],
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("flex-grow: 1");
  });
});

// ─── Position extraction from relativeTransform ──────────────────────────────

describe("figmaNodeToHtml — position", () => {
  it("positions children absolutely using relativeTransform when no auto-layout", () => {
    const child = makeFrame({
      name: "Box",
      size: { x: 100, y: 50 },
      relativeTransform: [[1, 0, 30], [0, 1, 60]],
    });
    const node = makeFrame({ children: [child] });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("left: 30px");
    expect(html).toContain("top: 60px");
  });
});

// ─── Gradient fills ──────────────────────────────────────────────────────────

describe("figmaNodeToHtml — gradients", () => {
  it("handles kiwi gradient format (stops + transform)", () => {
    const node = makeFrame({
      fills: [{
        type: "GRADIENT_LINEAR",
        visible: true,
        opacity: 1,
        stops: [
          { color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 },
          { color: { r: 0, g: 0, b: 1, a: 1 }, position: 1 },
        ],
        transform: { m00: 0, m01: 0, m02: 0.5, m10: -1, m11: 0, m12: 1 },
      }],
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("linear-gradient");
    expect(html).toContain("rgb(255, 0, 0)");
    expect(html).toContain("rgb(0, 0, 255)");
  });

  it("handles REST API gradient format (gradientStops + gradientHandlePositions)", () => {
    const node = makeFrame({
      fills: [{
        type: "GRADIENT_LINEAR",
        visible: true,
        opacity: 1,
        gradientStops: [
          { color: { r: 0.71, g: 0.63, b: 1, a: 1 }, position: 0 },
          { color: { r: 0.49, g: 0.32, b: 1, a: 1 }, position: 1 },
        ],
        gradientHandlePositions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ],
      }],
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("linear-gradient");
    expect(html).toMatch(/rgb\(/);
    expect(html).toContain("0%");
    expect(html).toContain("100%");
  });
});

// ─── Text nodes ──────────────────────────────────────────────────────────────

describe("figmaNodeToHtml — text", () => {
  it("renders text with font properties from style object", () => {
    const node = makeFrame({
      children: [
        makeText("Hello World", {
          style: {
            fontFamily: "Manrope",
            fontWeight: 800,
            italic: false,
            fontSize: 36,
            textAlignHorizontal: "LEFT",
            letterSpacing: -0.9,
            lineHeightPx: 40,
            textDecoration: "NONE",
          },
        }),
      ],
      stackMode: "VERTICAL",
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("Hello World");
    expect(html).toContain("font-size: 36px");
    expect(html).toContain("font-weight: 800");
    expect(html).toContain("line-height: 40px");
    expect(html).toContain("letter-spacing: -0.9px");
  });

  it("uses text color from fills", () => {
    const node = makeFrame({
      children: [makeText("Colored text")],
      stackMode: "VERTICAL",
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("color: rgb(255, 255, 255)");
  });
});

// ─── Solid fills and corner radius ───────────────────────────────────────────

describe("figmaNodeToHtml — fills and corners", () => {
  it("renders solid fill background", () => {
    const node = makeFrame({
      fills: [{ type: "SOLID", visible: true, opacity: 1, color: { r: 0.05, g: 0.05, b: 0.05, a: 1 } }],
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("background-color: rgb(13, 13, 13)");
  });

  it("renders corner radius from rectangleCornerRadii array", () => {
    const node = makeFrame({
      cornerRadius: 0,
      rectangleCornerRadii: [12, 12, 0, 0],
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("border-radius: 12px 12px 0px 0px");
  });
});

// ─── Vector / shape SVG rendering ────────────────────────────────────────────

/** Build a minimal VECTOR node with optional vectorNetwork. */
function makeVector(overrides = {}) {
  return {
    type: "VECTOR",
    name: "Vector",
    id: "1:50",
    visible: true,
    opacity: 1,
    size: { x: 24, y: 24 },
    relativeTransform: [[1, 0, 0], [0, 1, 0]],
    fills: [{ type: "SOLID", visible: true, opacity: 1, color: { r: 0, g: 0, b: 0, a: 1 } }],
    strokes: [],
    strokeWeight: 0,
    strokeAlign: "INSIDE",
    cornerRadius: 0,
    effects: [],
    ...overrides,
  };
}

describe("figmaNodeToHtml — vector SVG rendering", () => {
  it("renders a vector node with vectorNetwork as inline SVG", () => {
    const node = makeFrame({
      children: [
        makeVector({
          vectorNetwork: {
            vertices: [[0, 12], [12, 0], [24, 12], [12, 24]],
            segments: [
              { a: 0, b: 1, ta: [0, 0], tb: [0, 0] },
              { a: 1, b: 2, ta: [0, 0], tb: [0, 0] },
              { a: 2, b: 3, ta: [0, 0], tb: [0, 0] },
              { a: 3, b: 0, ta: [0, 0], tb: [0, 0] },
            ],
          },
        }),
      ],
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("<svg");
    expect(html).toContain("<path");
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain("M0 12");
    expect(html).toContain("L12 0");
    expect(html).toContain("Z");
    expect(html).toContain('fill="rgb(0, 0, 0)"');
  });

  it("renders a vector with curved segments (cubic bezier)", () => {
    const node = makeFrame({
      children: [
        makeVector({
          vectorNetwork: {
            vertices: [[0, 12], [24, 12]],
            segments: [
              { a: 0, b: 1, ta: [6, -8], tb: [-6, -8] },
            ],
          },
        }),
      ],
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("<svg");
    expect(html).toContain("C"); // cubic bezier command
  });

  it("falls back to colored div when no vectorNetwork", () => {
    const node = makeFrame({
      children: [
        makeVector({
          fills: [{ type: "SOLID", visible: true, opacity: 1, color: { r: 1, g: 0, b: 0, a: 1 } }],
        }),
      ],
    });
    const html = figmaNodeToHtml(node);
    expect(html).not.toContain("<svg");
    expect(html).toContain("background-color: rgb(255, 0, 0)");
    expect(html).toContain("width: 24px");
  });

  it("applies stroke attributes when strokes are present", () => {
    const node = makeFrame({
      children: [
        makeVector({
          vectorNetwork: {
            vertices: [[0, 0], [24, 24]],
            segments: [{ a: 0, b: 1, ta: [0, 0], tb: [0, 0] }],
          },
          fills: [],
          strokes: [{ type: "SOLID", visible: true, opacity: 1, color: { r: 0, g: 0, b: 1, a: 1 } }],
          strokeWeight: 2,
        }),
      ],
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain('stroke="rgb(0, 0, 255)"');
    expect(html).toContain('stroke-width="2"');
  });
});

// ─── Z-index for absolute-positioned children ────────────────────────────────

describe("figmaNodeToHtml — z-index stacking", () => {
  it("assigns incremental z-index to non-auto-layout children", () => {
    const node = makeFrame({
      children: [
        makeText("Behind", { relativeTransform: [[1, 0, 0], [0, 1, 0]] }),
        makeText("In front", { relativeTransform: [[1, 0, 0], [0, 1, 50]] }),
      ],
    });
    const html = figmaNodeToHtml(node);
    expect(html).toContain("z-index: 0");
    expect(html).toContain("z-index: 1");
  });

  it("does NOT add z-index to auto-layout children", () => {
    const node = makeFrame({
      stackMode: "VERTICAL",
      children: [
        makeText("A"),
        makeText("B"),
      ],
    });
    const html = figmaNodeToHtml(node);
    expect(html).not.toContain("z-index");
  });
});
