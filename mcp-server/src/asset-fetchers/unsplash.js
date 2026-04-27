/**
 * Unsplash provider.
 *
 * Hits https://api.unsplash.com/search/photos with
 *   Authorization: Client-ID <UNSPLASH_ACCESS_KEY>
 *
 * The key is read from the env on each call — never logged, never persisted
 * to disk, never stashed on this module's state.
 */

import { Cache } from "./cache.js";
import { fetchJson } from "./http.js";
import { MissingApiKeyError } from "./errors.js";

export const UNSPLASH_API_HOST = "api.unsplash.com";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const searchCache = new Cache({
  subdir: "image-search",
  encoding: "json",
  ttlMs: ONE_DAY_MS,
});

function getKey() {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    throw new MissingApiKeyError("unsplash", "UNSPLASH_ACCESS_KEY");
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
  const key = getKey(); // throws MissingApiKeyError if env is unset

  const params = new URLSearchParams({
    query: query.trim(),
    per_page: String(limit),
  });
  const url = `https://${UNSPLASH_API_HOST}/search/photos?${params.toString()}`;
  const cacheKey = `unsplash|${query}|${limit}`;

  return searchCache.getOrFetch(cacheKey, async () => {
    const json = await fetchJson(url, {
      headers: { Authorization: `Client-ID ${key}` },
    });
    const items = Array.isArray(json?.results) ? json.results : [];
    const results = items.map((p) => ({
      url: p?.urls?.regular || p?.urls?.full || p?.urls?.raw || "",
      thumbnailUrl: p?.urls?.small || p?.urls?.thumb || p?.urls?.regular || "",
      alt: p?.alt_description || p?.description || query,
      attribution: p?.user?.name
        ? `Photo by ${p.user.name} on Unsplash`
        : "Unsplash",
      source: "unsplash",
      width: p?.width,
      height: p?.height,
    }));
    return { results };
  });
}

export const _internal = { searchCache };
