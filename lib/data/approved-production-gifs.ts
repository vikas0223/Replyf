/**
 * Approved Local Production GIFs Registry & Determination (Requirement 2)
 *
 * Implements explicit determination for local production media:
 * - Distinguishes approved local production media from reference/unverified media.
 * - Does NOT globally ignore unverified rights.
 * - A local file being present in public/videos/ must NOT by itself be interpreted
 *   as proof of redistribution rights.
 * - Excludes public/videos/generated/ from the "existing GIF" tier so that generated
 *   GIFs remain strictly the second tier.
 */

// Normalized (lowercase) set of approved existing dataset GIFs under public/videos/
const RAW_APPROVED_LIST = [
  '/videos/0001-2gPfomN.gif', // 3/4 Sit-Up
  '/videos/0002-Hy9D21L.gif', // 45° Side Bend
  '/videos/0003-1ZFqTDN.gif', // Air Bike
  '/videos/0006-qaZVsGk.gif', // Alternate Heel Touchers
  '/videos/0007-4IKbhHV.gif', // Alternate Lateral Pulldown
  '/videos/0009-PAgTVaK.gif', // Assisted Chest Dip (kneeling)
  '/videos/0010-8K0w2yA.gif', // Assisted Hanging Knee Raise With Throw Down
  '/videos/0011-03lzqwk.gif', // Assisted Hanging Knee Raise
  '/videos/0012-UGhRD1A.gif', // Assisted Lying Leg Raise With Lateral Throw Down
];

export const APPROVED_LOCAL_PRODUCTION_GIFS = new Set<string>(
  RAW_APPROVED_LIST.map((p) => p.toLowerCase())
);

/**
 * Normalizes a URL path for comparison by stripping query strings, hashes, and leading slashes
 */
export function normalizeVideoPath(url: string): string {
  if (!url) return '';
  const clean = url.split(/[?#]/)[0].trim().toLowerCase();
  return clean.startsWith('/') ? clean : `/${clean}`;
}

/**
 * Determines whether a GIF qualifies as an approved existing local production asset (Tier 1).
 *
 * Requirements:
 * 1. Must be a .gif file.
 * 2. Must NOT be in public/videos/generated/ (which is Tier 2).
 * 3. Must either:
 *    a) Be explicitly marked isApproved: true
 *    b) Be included in the explicit APPROVED_LOCAL_PRODUCTION_GIFS whitelist
 *    c) Have verified rights in provenance (rights === 'verified' && !referenceOnly)
 * 4. Merely existing in public/videos/ without approval or verification returns false.
 */
export function isApprovedExistingGif(
  url: string,
  provenance?: {
    referenceOnly?: boolean;
    verification?: {
      identity?: string;
      rights?: string;
      asset?: string;
    };
  } | null,
  isExplicitlyApproved?: boolean
): boolean {
  if (!url) return false;
  const normalized = normalizeVideoPath(url);

  // Must be a .gif
  if (!normalized.endsWith('.gif')) return false;

  // Generated GIFs belong strictly to Tier 2, never Tier 1
  if (normalized.startsWith('/videos/generated/') || normalized.includes('/generated/')) {
    return false;
  }

  // Explicit approval flag
  if (isExplicitlyApproved === true) {
    return true;
  }

  // Whitelist check (explicitly approved local production media)
  if (APPROVED_LOCAL_PRODUCTION_GIFS.has(normalized)) {
    return true;
  }

  // Provenance check for other local verified assets
  if (provenance) {
    if (provenance.referenceOnly) return false;
    if (provenance.verification) {
      if (provenance.verification.identity === 'unverified') return false;
      if (
        provenance.verification.rights === 'unverified' ||
        provenance.verification.rights === 'restricted'
      ) {
        return false;
      }
      if (provenance.verification.asset === 'broken') return false;
      if (provenance.verification.rights === 'verified') {
        return true;
      }
    }
  }

  return false;
}
