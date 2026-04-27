/**
 * Pexels provider.
 *
 * Hits https://api.pexels.com/v1/search with
 *   Authorization: <PEXELS_API_KEY>
 *
 * Same env-only key handling as the Unsplash provider.
 */

import { Cache } from "./cache.js";
import { fetchJson } from "./http.js";
import { MissingApiKeyError } from "./errors.js";

export const PEXELS_API_HOST = "api.pexels.com";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const searchCache = new Cache({
  subdir: "image-search",
  encoding: "json",
  ttlMs: ONE_DAY_MS,
});

function getKey() {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    throw new MissingApiKeyError("pexels", "PEXELS_API_KEY");
  }
  return key;
}

/**
 * @param {string} query
 * @param {object} [opts]
 * @param {number} [opts.limit=5]
 * @returns {Promise<{results: Array<object>}>}
 */
export async function searchPhotos(query, opts = {}) {
  if (typeof query !== "string" || query.trim() === "") {
    throw new Error("query is required");
  }
  const limit = Math.max(1, Math.min(20, Number.isFinite(opts.limit) ? opts.limit : 5));
  const key = getKey();

  const params = new URLSearchParams({
    query: query.trim(),
    per_page: String(limit),
  });
  const url = `https://${PEXELS_API_HOST}/v1/search?${params.toString()}`;
  const cacheKey = `pexels|${query}|${limit}`;

  return searchCache.getOrFetch(cacheKey, async () => {
    const json = await fetchJson(url, {
      headers: { Authorization: key },
    });
    const items = Array.isArray(json?.photos) ? json.photos : [];
    const results = items.map((p) => ({
      url: p?.src?.large || p?.src?.original || p?.src?.medium || "",
      thumbnailUrl: p?.src?.small || p?.src?.tiny || p?.src?.medium || "",
      alt: p?.alt || query,
      attribution: p?.photographer
        ? `Photo by ${p.photographer} on Pexels`
        : "Pexels",
      source: "pexels",
      width: p?.width,
      height: p?.height,
    }));
    return { results };
  });
}

export const _internal = { searchCache };
