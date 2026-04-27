/**
 * Picsum (Lorem Picsum) provider.
 *
 * Keyless. Picsum doesn't actually search — we generate deterministic
 * seeded URLs so the same query always returns the same set of photos.
 * Sizes vary across the result set so screens don't all use identical
 * aspect ratios. This is the always-available fallback when no Unsplash
 * or Pexels key is configured.
 */

import { createHash } from "node:crypto";

export const PICSUM_HOST = "picsum.photos";

const DEFAULT_SIZES = [
  [1200, 800],
  [1024, 768],
  [800, 800],
  [1200, 1600],
  [1600, 1200],
  [900, 1200],
  [1280, 720],
  [1080, 1080],
];

function slugify(query) {
  // Lowercase, strip non-alphanumerics, hyphenate. Hash the result so
  // long/empty queries still produce a stable seed.
  const base = String(query).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const hash = createHash("sha1").update(String(query)).digest("hex").slice(0, 8);
  return base ? `${base}-${hash}` : hash;
}

/**
 * @param {string} query
 * @param {object} [opts]
 * @param {number} [opts.limit=5]
 * @returns {{results: Array<object>}}
 */
export function searchPhotos(query, opts = {}) {
  const limit = Math.max(1, Math.min(20, Number.isFinite(opts.limit) ? opts.limit : 5));
  const seedBase = slugify(query);

  const results = [];
  for (let i = 0; i < limit; i++) {
    const [w, h] = DEFAULT_SIZES[i % DEFAULT_SIZES.length];
    const seed = `${seedBase}-${i}`;
    results.push({
      url: `https://${PICSUM_HOST}/seed/${seed}/${w}/${h}`,
      thumbnailUrl: `https://${PICSUM_HOST}/seed/${seed}/300/200`,
      alt: `${query} #${i}`,
      attribution: "Picsum (Lorem Picsum)",
      source: "picsum",
      width: w,
      height: h,
    });
  }
  return { results };
}
