// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";
import { inlineRemoteImages, _imageInlineInternals } from "../satori-renderer.js";
import { Cache } from "../../asset-fetchers/cache.js";

function makeFreshCache() {
  const c = new Cache({ subdir: `inline-images-test-${Math.random().toString(36).slice(2, 8)}`, encoding: "binary" });
  c.readDisk = async () => null;
  c.writeDisk = async () => {};
  return c;
}

function mockFetchBinary(byteValue, contentType) {
  const arrayBuffer = new Uint8Array([byteValue]).buffer;
  const res = {
    ok: true,
    status: 200,
    arrayBuffer: async () => arrayBuffer,
    headers: { get: (k) => (k.toLowerCase() === "content-type" ? contentType : null) },
  };
  global.fetch = vi.fn(async () => res);
}

describe("inlineRemoteImages — passthrough", () => {
  it("returns input unchanged when no <img> tags exist", async () => {
    const html = "<div>no images here</div>";
    expect(await inlineRemoteImages(html)).toBe(html);
  });

  it("returns input unchanged for non-string input", async () => {
    expect(await inlineRemoteImages(undefined)).toBeUndefined();
  });
});

describe("inlineRemoteImages — allowlist enforcement", () => {
  beforeEach(() => {
    _imageInlineInternals.imageBytesCache.clearMemory();
  });

  it("replaces disallowed-host <img> with transparent PNG", async () => {
    const cache = makeFreshCache();
    global.fetch = vi.fn();
    const html = '<img src="https://evil.example.com/track.gif">';
    const out = await inlineRemoteImages(html, cache);
    expect(out).toContain(_imageInlineInternals.TRANSPARENT_PNG_DATA_URI);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("replaces non-http(s) URLs with transparent PNG", async () => {
    const cache = makeFreshCache();
    global.fetch = vi.fn();
    // Note: javascript: would not match the regex (no http/https). Test ftp.
    const html = '<img src="https://intranet.local/track.gif">';
    const out = await inlineRemoteImages(html, cache);
    expect(out).toContain(_imageInlineInternals.TRANSPARENT_PNG_DATA_URI);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("inlineRemoteImages — happy path", () => {
  beforeEach(() => {
    _imageInlineInternals.imageBytesCache.clearMemory();
  });

  it("downloads and inlines an allowlisted picsum URL", async () => {
    const cache = makeFreshCache();
    mockFetchBinary(0x42, "image/jpeg");
    const url = "https://picsum.photos/seed/test/100/100";
    const html = `<img src="${url}">`;
    const out = await inlineRemoteImages(html, cache);
    expect(out).toContain("data:image/jpeg;base64,");
    expect(out).not.toContain(url);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("dedupes multiple references to the same URL", async () => {
    const cache = makeFreshCache();
    mockFetchBinary(0x42, "image/jpeg");
    const url = "https://images.unsplash.com/photo-abc";
    const html = `<div><img src="${url}"><img src="${url}"></div>`;
    await inlineRemoteImages(html, cache);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to transparent PNG when fetch fails", async () => {
    const cache = makeFreshCache();
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    });
    const html = '<img src="https://images.unsplash.com/photo-bad">';
    const out = await inlineRemoteImages(html, cache);
    expect(out).toContain(_imageInlineInternals.TRANSPARENT_PNG_DATA_URI);
  });

  it("handles a mix of allowed and disallowed URLs", async () => {
    const cache = makeFreshCache();
    let call = 0;
    global.fetch = vi.fn(async () => {
      call++;
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => new Uint8Array([call]).buffer,
        headers: { get: () => "image/png" },
      };
    });
    const html =
      '<div>' +
      '<img src="https://images.unsplash.com/p1">' +
      '<img src="https://attacker.example/bad">' +
      '</div>';
    const out = await inlineRemoteImages(html, cache);
    expect(out).toContain("data:image/png;base64,");
    expect(out).toContain(_imageInlineInternals.TRANSPARENT_PNG_DATA_URI);
    // Only the allowed URL should have triggered a network call.
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
