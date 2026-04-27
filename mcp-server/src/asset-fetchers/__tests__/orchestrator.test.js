// @vitest-environment node

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { findStockImage } from "../index.js";
import { _internal as unsplashInternal } from "../unsplash.js";
import { _internal as pexelsInternal } from "../pexels.js";

const ORIG_UNSPLASH = process.env.UNSPLASH_ACCESS_KEY;
const ORIG_PEXELS = process.env.PEXELS_API_KEY;

function mockFetchJson(body) {
  const res = {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: new Map(),
  };
  global.fetch = vi.fn(async () => res);
}

beforeEach(() => {
  delete process.env.UNSPLASH_ACCESS_KEY;
  delete process.env.PEXELS_API_KEY;
  unsplashInternal.searchCache.clearMemory();
  unsplashInternal.searchCache.readDisk = async () => null;
  unsplashInternal.searchCache.writeDisk = async () => {};
  pexelsInternal.searchCache.clearMemory();
  pexelsInternal.searchCache.readDisk = async () => null;
  pexelsInternal.searchCache.writeDisk = async () => {};
});

afterEach(() => {
  if (ORIG_UNSPLASH != null) process.env.UNSPLASH_ACCESS_KEY = ORIG_UNSPLASH;
  if (ORIG_PEXELS != null) process.env.PEXELS_API_KEY = ORIG_PEXELS;
});

describe("findStockImage — fallback chain", () => {
  it("falls all the way through to Picsum when no keys are set", async () => {
    const out = await findStockImage("kitchen", { limit: 3 });
    expect(out.source).toBe("picsum");
    expect(out.results.length).toBe(3);
    expect(out.warning).toMatch(/UNSPLASH_ACCESS_KEY/);
    expect(out.warning).toMatch(/PEXELS_API_KEY/);
  });

  it("uses unsplash when UNSPLASH_ACCESS_KEY is set", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "test-key";
    mockFetchJson({
      results: [
        {
          urls: { regular: "https://images.unsplash.com/abc", small: "https://images.unsplash.com/abc-sm" },
          alt_description: "kitchen",
          user: { name: "Alice" },
          width: 1200,
          height: 800,
        },
      ],
    });
    const out = await findStockImage("kitchen", { limit: 1 });
    expect(out.source).toBe("unsplash");
    expect(out.results[0].url).toBe("https://images.unsplash.com/abc");
    expect(out.results[0].attribution).toContain("Alice");
    expect(out.warning).toBeUndefined();
  });

  it("respects explicit source override", async () => {
    const out = await findStockImage("kitchen", { source: "picsum", limit: 1 });
    expect(out.source).toBe("picsum");
    expect(out.warning).toBeUndefined();
  });

  it("falls through when explicit source has no key", async () => {
    const out = await findStockImage("kitchen", { source: "unsplash", limit: 1 });
    expect(out.source).toBe("picsum");
    expect(out.warning).toMatch(/UNSPLASH_ACCESS_KEY/);
  });

  it("sends Authorization header for unsplash", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "k1";
    mockFetchJson({ results: [] });
    await findStockImage("a", { source: "unsplash" });
    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe("Client-ID k1");
  });

  it("sends Authorization header for pexels", async () => {
    process.env.PEXELS_API_KEY = "k2";
    mockFetchJson({ photos: [] });
    await findStockImage("a", { source: "pexels" });
    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe("k2");
  });
});
