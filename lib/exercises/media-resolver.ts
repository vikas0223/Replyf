/**
 * Canonical Exercise Media Resolver
 *
 * Implements deterministic media resolution hierarchy:
 * 1. Approved existing local animated GIF from public/videos/
 * 2. Approved generated local GIF from public/videos/generated/
 * 3. Approved local video / poster
 * 4. Approved local SVG illustration
 * 5. Approved local static image
 * 6. Approved permitted remote media
 * 7. Fallback unapproved media (animations prioritized over thumbnails in Detail)
 * 8. Neutral fallback
 */

import { Exercise, ExerciseMedia as DomainExerciseMedia } from '@/types/domain';
import { GENERATED_EXERCISE_GIFS_BY_ID } from '@/lib/data/generated-exercise-gifs';
import { isApprovedExistingGif } from '@/lib/data/approved-production-gifs';

export type ExerciseMediaContext = 'card' | 'detail' | 'picker' | 'session';

export interface ResolvedCandidate {
  id: string;
  url: string;
  type: 'animation' | 'video' | 'svg' | 'image';
  posterUrl?: string;
  license?: string;
  isApproved?: boolean;
}

export const VALID_MEDIA_TYPES = new Set(['image', 'video', 'gif', 'svg', 'animation']);

/**
 * Validates whether a candidate URL is non-empty and well-formed
 */
export function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/')
  );
}

/**
 * Checks if a URL points to a local path
 */
export function isLocalUrl(url: string): boolean {
  return !url.startsWith('http://') && !url.startsWith('https://');
}

/**
 * Checks if a URL ends with .gif, ignoring query strings and hashes
 */
export function isGifUrl(url: string): boolean {
  if (!url) return false;
  const cleanPath = url.split(/[?#]/)[0].toLowerCase();
  return cleanPath.endsWith('.gif');
}

/**
 * Checks if a URL ends with .svg, ignoring query strings and hashes
 */
export function isSvgUrl(url: string): boolean {
  if (!url) return false;
  const cleanPath = url.split(/[?#]/)[0].toLowerCase();
  return cleanPath.endsWith('.svg');
}

/**
 * Accurately infers effective media type.
 * Requirement 4: If a URL ends in .gif, it must be typed as 'animation', never 'image'.
 */
export function inferCandidateType(
  url: string,
  declaredType?: string
): 'animation' | 'video' | 'svg' | 'image' {
  if (isGifUrl(url)) return 'animation';
  if (declaredType === 'gif' || declaredType === 'animation') return 'animation';
  if (declaredType === 'video' || /\.(mp4|webm|mov)($|[?#])/i.test(url)) return 'video';
  if (isSvgUrl(url) || declaredType === 'svg') return 'svg';
  return 'image';
}

/**
 * Extracts and sorts valid media candidates in priority order according to requirements:
 *
 * For Exercise Detail and Session contexts:
 * 1. Approved existing GIF from public/videos/ (excluding generated/)
 * 2. Approved generated GIF from public/videos/generated/
 * 3. Approved local video
 * 4. Approved local SVG
 * 5. Approved local static image
 * 6. Approved remote media
 * 7. Unapproved fallback animation / mediaUrl / thumbnailUrl
 *
 * For Card and Picker contexts:
 * Lightweight media first (SVG / static image) to avoid eagerly downloading heavy animations.
 * If GIF is the only valid media, it is still used.
 */
export function resolveMediaCandidates(
  exercise: Exercise,
  context: ExerciseMediaContext = 'card'
): ResolvedCandidate[] {
  const candidates: ResolvedCandidate[] = [];
  const rawList: DomainExerciseMedia[] = Array.isArray(exercise.media) ? exercise.media : [];

  // Categorized buckets for approved media
  const localExistingGifs: ResolvedCandidate[] = [];
  const localGeneratedGifs: ResolvedCandidate[] = [];
  const localVideos: ResolvedCandidate[] = [];
  const localSvgs: ResolvedCandidate[] = [];
  const localImages: ResolvedCandidate[] = [];
  const remoteApproved: ResolvedCandidate[] = [];

  // Process raw media list
  for (const item of rawList) {
    if (!item || !isValidUrl(item.url)) continue;
    if (!item.type || !VALID_MEDIA_TYPES.has(item.type)) continue;

    const candidateType = inferCandidateType(item.url, item.type);
    const isLocal = item.isLocal ?? isLocalUrl(item.url);
    const license = item.provenance?.license || exercise.provenance?.license;

    // Filter out unapproved or reference-only media per Section 20 & 43
    if (item.provenance) {
      if (item.provenance.referenceOnly) continue;
      if (item.provenance.verification) {
        if (item.provenance.verification.identity === 'unverified') continue;
        if (
          item.provenance.verification.rights === 'unverified' ||
          item.provenance.verification.rights === 'restricted'
        ) {
          // Explicit determination check: is this specific GIF approved?
          const explicitlyApproved =
            item.isApproved === true ||
            isApprovedExistingGif(item.url, null, item.isApproved);
          if (!explicitlyApproved) continue;
        }
        if (item.provenance.verification.asset === 'broken') continue;
      }
    }

    const candidate: ResolvedCandidate = {
      id: item.id || `m-${item.url}`,
      url: item.url,
      type: candidateType,
      posterUrl: item.posterUrl,
      license,
      isApproved: true,
    };

    if (!isLocal) {
      remoteApproved.push(candidate);
    } else if (candidateType === 'animation') {
      if (item.url.startsWith('/videos/generated/') || item.url.includes('/generated/')) {
        localGeneratedGifs.push(candidate);
      } else {
        localExistingGifs.push(candidate);
      }
    } else if (candidateType === 'video') {
      localVideos.push(candidate);
    } else if (candidateType === 'svg') {
      localSvgs.push(candidate);
    } else {
      localImages.push(candidate);
    }
  }

  // Tier 2: Check deterministic generated GIF registry (indexed by canonical ID)
  const genRecord = GENERATED_EXERCISE_GIFS_BY_ID[exercise.id];
  if (genRecord && genRecord.status === 'ready' && isValidUrl(genRecord.mediaUrl)) {
    localGeneratedGifs.push({
      id: `gen-gif-${exercise.id}`,
      url: genRecord.mediaUrl,
      type: 'animation',
      license: genRecord.provenance.license,
      isApproved: true,
    });
  }

  // Split remote approved media into static and animated
  const remoteApprovedStatic = remoteApproved.filter(
    (c) => c.type === 'svg' || c.type === 'image'
  );
  const remoteApprovedAnimated = remoteApproved.filter(
    (c) => c.type === 'animation' || c.type === 'video'
  );

  // Fallbacks: thumbnailUrl and mediaUrl
  const staticFallbacks: ResolvedCandidate[] = [];
  const animatedFallbacks: ResolvedCandidate[] = [];

  // ThumbnailUrl is prioritized as static thumbnail fallback
  if (isValidUrl(exercise.thumbnailUrl)) {
    const isGif = isGifUrl(exercise.thumbnailUrl);
    const cand: ResolvedCandidate = {
      id: `thumb-${exercise.id}`,
      url: exercise.thumbnailUrl,
      type: isGif ? 'animation' : isSvgUrl(exercise.thumbnailUrl) ? 'svg' : 'image',
      license: exercise.provenance?.license,
      isApproved: false,
    };
    if (cand.type === 'animation') {
      animatedFallbacks.push(cand);
    } else {
      staticFallbacks.push(cand);
    }
  }

  if (isValidUrl(exercise.mediaUrl)) {
    const isGif = isGifUrl(exercise.mediaUrl);
    const cand: ResolvedCandidate = {
      id: `mediaurl-${exercise.id}`,
      url: exercise.mediaUrl,
      type: isGif ? 'animation' : isSvgUrl(exercise.mediaUrl) ? 'svg' : 'image',
      license: exercise.provenance?.license,
      isApproved: false,
    };
    if (cand.type === 'animation') {
      animatedFallbacks.push(cand);
    } else {
      staticFallbacks.push(cand);
    }
  }

  // Hierarchy prioritization by context
  if (context === 'card' || context === 'picker') {
    // Card & Picker context: STRICTLY STATIC MEDIA ONLY
    // 1. Approved local SVG illustration
    // 2. Approved local static image
    // 3. Static thumbnail fallback (e.g. /images/XXXX-*.jpg)
    // 4. Approved remote static SVG / image
    // 5. Static mediaUrl fallback
    // Under no circumstances should animated GIFs (.gif) or videos be rendered
    // or loaded for exercise library cards when static media is available.
    candidates.push(...localSvgs);
    candidates.push(...localImages);
    candidates.push(...staticFallbacks);
    candidates.push(...remoteApprovedStatic);
  } else {
    // Detail / Session context: ANIMATION-FIRST
    // 1. Approved existing GIF from public/videos/ (excluding generated/)
    // 2. Approved generated GIF from public/videos/generated/
    // 3. Approved local video
    // 4. Approved local SVG
    // 5. Approved local static image
    // 6. Approved remote media (animated outranking static)
    // 7. Fallback unapproved animation (animated thumbnailUrl/mediaUrl)
    // 8. Fallback unapproved static thumbnails / images
    candidates.push(...localExistingGifs);
    candidates.push(...localGeneratedGifs);
    candidates.push(...localVideos);
    candidates.push(...localSvgs);
    candidates.push(...localImages);
    candidates.push(...remoteApprovedAnimated);
    candidates.push(...remoteApprovedStatic);
    candidates.push(...animatedFallbacks);
    candidates.push(...staticFallbacks);
  }

  // Deduplicate by URL while strictly preserving priority order
  const seen = new Set<string>();
  const uniqueCandidates: ResolvedCandidate[] = [];
  for (const c of candidates) {
    if (!seen.has(c.url)) {
      seen.add(c.url);
      uniqueCandidates.push(c);
    }
  }

  return uniqueCandidates;
}

/**
 * Resolves approved media candidates, falling back to valid resolved candidates
 */
export function resolveApprovedMediaCandidates(
  exercise: Exercise,
  context: ExerciseMediaContext = 'detail'
): ResolvedCandidate[] {
  const all = resolveMediaCandidates(exercise, context);
  const approved = all.filter((c) => c.isApproved === true);
  return approved.length > 0 ? approved : all;
}

/**
 * Shared approved-media predicate checking if an exercise possesses at least one qualified asset
 */
export function hasApprovedMedia(exercise: Exercise): boolean {
  return resolveApprovedMediaCandidates(exercise, 'detail').length > 0;
}

/**
 * Resolves the active candidate that has not failed, or returns null if all failed
 */
export function resolveActiveCandidate(
  candidates: ResolvedCandidate[],
  failedUrls: Set<string>
): ResolvedCandidate | null {
  return candidates.find((c) => !failedUrls.has(c.url)) || null;
}
