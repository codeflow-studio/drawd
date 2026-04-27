// @vitest-environment node

import { describe, it, expect } from "vitest";
import { searchPhotos } from "../picsum.js";

describe("picsum.searchPhotos", () => {
  it("returns the requested number of results (default 5)", () => {
    const r = searchPhotos("kitchen");
    expect(r.results).toHaveLength(5);
  });

  it("clamps limit between 1 and 20", () => {
    expect(searchPhotos("a", { limit: 9999 }).results).toHaveLength(20);
    expect(searchPhotos("a", { limit: 0 }).results).toHaveLength(1);
  });

  it("produces deterministic URLs for the same query", () => {
    const a = searchPhotos("kitchen", { limit: 3 });
    const b = searchPhotos("kitchen", { limit: 3 });
    expect(a.results.map((r) => r.url)).toEqual(b.results.map((r) => r.url));
  });

  it("differs across queries", () => {
    const a = searchPhotos("kitchen", { limit: 3 });
    const b = searchPhotos("forest", { limit: 3 });
    expect(a.results[0].url).not.toBe(b.results[0].url);
  });

  it("uses picsum.photos host", () => {
    const r = searchPhotos("home");
    for (const item of r.results) {
      expect(item.url.startsWith("https://picsum.photos/")).toBe(true);
      expect(item.source).toBe("picsum");
    }
  });
});
