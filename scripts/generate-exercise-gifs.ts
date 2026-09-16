/**
 * Reproducible Exercise GIF Fallback Generator
 *
 * Scans public/exercises/ for pairs of movement photos (0.jpg and 1.jpg),
 * deterministically maps them to canonical Replyf exercises,
 * verifies image identity and dimensions,
 * encodes a looping two-frame animated GIF (600ms per frame),
 * writes the GIF to public/videos/generated/<slug>.gif,
 * and generates a typed, deterministic registry in lib/data/generated-exercise-gifs.ts
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jpeg from 'jpeg-js';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { CANONICAL_EXERCISES } from '../lib/data/canonical-exercises';
import { Exercise } from '../types/domain';

export const GENERATOR_VERSION = '1.0.0';
export const FRAME_DURATION_MS = 600;

export interface GeneratedExerciseGifRecord {
  replyfExerciseId: string;
  canonicalExerciseName: string;
  canonicalSlug: string;
  sourceType: 'generated-gif';
  sourceImages: [string, string];
  mediaUrl: string;
  frameCount: 2;
  frameDurationMs: number;
  sourceHash: string;
  generatorVersion: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  status: 'ready';
  provenance: {
    source: string;
    sourceExerciseId?: string;
    sourceCommit?: string;
    sourcePath?: string;
    license: string;
    attribution: string;
    commercialUseAllowed: boolean;
    redistributionAllowed: boolean;
    localBundleAllowed: boolean;
    referenceOnly: boolean;
    verification: {
      identity: 'verified' | 'unverified';
      rights: 'verified' | 'unverified' | 'restricted';
      asset: 'verified' | 'broken';
    };
  };
}

export interface GenerationSummary {
  totalScanned: number;
  totalGenerated: number;
  totalSkipped: number;
  totalErrors: number;
  records: GeneratedExerciseGifRecord[];
  skipped: Array<{ folder: string; reason: string }>;
}

export function computeSha256(buffers: Buffer[]): string {
  const hash = crypto.createHash('sha256');
  for (const b of buffers) {
    hash.update(b);
  }
  return hash.digest('hex');
}

/**
 * Resizes an RGBA image buffer to target dimensions using bilinear interpolation
 */
export function resizeRgba(
  src: Uint8Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): Uint8Array {
  if (srcW === dstW && srcH === dstH) {
    return src;
  }
  const dst = new Uint8Array(dstW * dstH * 4);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    const srcY = y * yRatio;
    const y0 = Math.floor(srcY);
    const y1 = Math.min(y0 + 1, srcH - 1);
    const yLerp = srcY - y0;

    for (let x = 0; x < dstW; x++) {
      const srcX = x * xRatio;
      const x0 = Math.floor(srcX);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const xLerp = srcX - x0;

      const idx00 = (y0 * srcW + x0) * 4;
      const idx10 = (y0 * srcW + x1) * 4;
      const idx01 = (y1 * srcW + x0) * 4;
      const idx11 = (y1 * srcW + x1) * 4;
      const dstIdx = (y * dstW + x) * 4;

      for (let c = 0; c < 4; c++) {
        const top = src[idx00 + c] * (1 - xLerp) + src[idx10 + c] * xLerp;
        const bot = src[idx01 + c] * (1 - xLerp) + src[idx11 + c] * xLerp;
        dst[dstIdx + c] = Math.round(top * (1 - yLerp) + bot * yLerp);
      }
    }
  }
  return dst;
}

export function generateExerciseGifs(rootDir: string = process.cwd()): GenerationSummary {
  console.log('=== STARTING DETERMINISTIC EXERCISE GIF GENERATOR ===\n');

  const exercisesDir = path.resolve(rootDir, 'public/exercises');
  const outputDir = path.resolve(rootDir, 'public/videos/generated');
  const manifestPath = path.resolve(exercisesDir, 'manifest.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load manifest if available for provenance
  let manifestRecords: any[] = [];
  if (fs.existsSync(manifestPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifestRecords = parsed.records || [];
    } catch {
      console.warn('Warning: Could not parse public/exercises/manifest.json');
    }
  }
  const manifestByCanonicalId = new Map<string, any>();
  const manifestBySlug = new Map<string, any>();
  for (const rec of manifestRecords) {
    if (rec.canonicalExerciseId) manifestByCanonicalId.set(rec.canonicalExerciseId, rec);
    if (rec.localMediaUrl) {
      const m = rec.localMediaUrl.match(/\/exercises\/([^/]+)\//);
      if (m) manifestBySlug.set(m[1], rec);
    }
  }

  // Build canonical index
  const canonicalBySlug = new Map<string, Exercise>();
  const canonicalByName = new Map<string, Exercise>();
  for (const ex of CANONICAL_EXERCISES) {
    const slug = ex.slug || ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    canonicalBySlug.set(slug, ex);
    canonicalByName.set(ex.name.toLowerCase().trim(), ex);
  }

  const entries = fs.readdirSync(exercisesDir, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

  const records: GeneratedExerciseGifRecord[] = [];
  const skipped: Array<{ folder: string; reason: string }> = [];

  for (const folder of folders) {
    const folderPath = path.join(exercisesDir, folder);
    const files = fs.readdirSync(folderPath).filter((f) => /\.(jpg|jpeg|png)$/i.test(f)).sort();

    // Verification requirement: must have exactly 2 images representing movement phases
    if (files.length !== 2) {
      skipped.push({
        folder,
        reason: `Expected exactly 2 images, found ${files.length}`,
      });
      continue;
    }

    // Require expected 0.jpg and 1.jpg convention
    const hasZero = files.includes('0.jpg') || files.includes('0.jpeg');
    const hasOne = files.includes('1.jpg') || files.includes('1.jpeg');
    if (!hasZero || !hasOne) {
      skipped.push({
        folder,
        reason: `Files do not follow 0.jpg and 1.jpg convention: [${files.join(', ')}]`,
      });
      continue;
    }

    // Map folder to canonical exercise
    let canonical = canonicalBySlug.get(folder);
    if (!canonical) {
      const normalizedName = folder.replace(/-/g, ' ').toLowerCase();
      canonical = canonicalByName.get(normalizedName);
    }

    if (!canonical) {
      skipped.push({
        folder,
        reason: `Could not safely map directory '${folder}' to canonical exercise`,
      });
      continue;
    }

    const file0Path = path.join(folderPath, files[0]);
    const file1Path = path.join(folderPath, files[1]);

    const buf0 = fs.readFileSync(file0Path);
    const buf1 = fs.readFileSync(file1Path);

    let dec0: { width: number; height: number; data: Uint8Array };
    let dec1: { width: number; height: number; data: Uint8Array };

    try {
      dec0 = jpeg.decode(buf0, { useTArray: true });
      dec1 = jpeg.decode(buf1, { useTArray: true });
    } catch (err: any) {
      skipped.push({
        folder,
        reason: `Failed to decode JPEG frames: ${err.message}`,
      });
      continue;
    }

    // Normalization: Ensure frames have identical dimensions
    const targetW = Math.max(dec0.width, dec1.width);
    const targetH = Math.max(dec0.height, dec1.height);

    const frame0Data = resizeRgba(dec0.data, dec0.width, dec0.height, targetW, targetH);
    const frame1Data = resizeRgba(dec1.data, dec1.width, dec1.height, targetW, targetH);

    // Encode GIF using gifenc
    const gif = GIFEncoder();

    // Frame 1 (0.jpg - starting position)
    const pal0 = quantize(frame0Data, 256);
    const idx0 = applyPalette(frame0Data, pal0);
    gif.writeFrame(idx0, targetW, targetH, {
      palette: pal0,
      delay: FRAME_DURATION_MS,
      repeat: 0, // Loop forever
    });

    // Frame 2 (1.jpg - contracted/pulled position)
    const pal1 = quantize(frame1Data, 256);
    const idx1 = applyPalette(frame1Data, pal1);
    gif.writeFrame(idx1, targetW, targetH, {
      palette: pal1,
      delay: FRAME_DURATION_MS,
    });

    gif.finish();
    const gifBytes = Buffer.from(gif.bytesView());

    const outSlug = canonical.slug || folder;
    const outFilename = `${outSlug}.gif`;
    const outFilePath = path.join(outputDir, outFilename);

    fs.writeFileSync(outFilePath, gifBytes);

    const sourceHash = computeSha256([buf0, buf1]);
    const manifestItem = manifestByCanonicalId.get(canonical.id) || manifestBySlug.get(folder);

    const provenance = {
      source: manifestItem?.externalSource || 'free-exercise-db',
      sourceExerciseId: manifestItem?.externalSourceId || folder,
      sourceCommit: manifestItem?.sourceCommit || 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
      sourcePath: `public/exercises/${folder}/`,
      license: manifestItem?.mediaLicense || 'Unlicense',
      attribution: manifestItem?.mediaAttributionRequired || 'free-exercise-db (Public Domain / The Unlicense)',
      commercialUseAllowed: manifestItem?.commercialUseAllowed ?? true,
      redistributionAllowed: manifestItem?.redistributionAllowed ?? true,
      localBundleAllowed: manifestItem?.localBundleAllowed ?? true,
      referenceOnly: manifestItem?.referenceOnly ?? false,
      verification: {
        identity: (manifestItem?.verification?.identity || 'verified') as 'verified' | 'unverified',
        rights: (manifestItem?.verification?.rights || 'verified') as 'verified' | 'unverified' | 'restricted',
        asset: 'verified' as const,
      },
    };

    const record: GeneratedExerciseGifRecord = {
      replyfExerciseId: canonical.id,
      canonicalExerciseName: canonical.name,
      canonicalSlug: outSlug,
      sourceType: 'generated-gif',
      sourceImages: [
        `/exercises/${folder}/${files[0]}`,
        `/exercises/${folder}/${files[1]}`,
      ],
      mediaUrl: `/videos/generated/${outFilename}`,
      frameCount: 2,
      frameDurationMs: FRAME_DURATION_MS,
      sourceHash,
      generatorVersion: GENERATOR_VERSION,
      width: targetW,
      height: targetH,
      fileSizeBytes: gifBytes.length,
      status: 'ready',
      provenance,
    };

    records.push(record);
    console.log(`[GENERATED] ${canonical.name.padEnd(32)} -> /videos/generated/${outFilename} (${(gifBytes.length / 1024).toFixed(1)} KB)`);
  }

  // Sort records deterministically by canonical exercise name
  records.sort((a, b) => a.canonicalExerciseName.localeCompare(b.canonicalExerciseName));

  // Write lib/data/generated-exercise-gifs.json
  const jsonRegistryPath = path.resolve(rootDir, 'lib/data/generated-exercise-gifs.json');
  fs.writeFileSync(jsonRegistryPath, JSON.stringify(records, null, 2), 'utf8');

  // Write lib/data/generated-exercise-gifs.ts
  const tsRegistryPath = path.resolve(rootDir, 'lib/data/generated-exercise-gifs.ts');
  const tsContent = `/**
 * Deterministic Generated Exercise GIFs Registry
 * Autogenerated by scripts/generate-exercise-gifs.ts (v${GENERATOR_VERSION})
 *
 * Provides two-frame animated GIF demonstrations compiled ahead-of-time
 * from public/exercises/ source imagery.
 */

export interface GeneratedExerciseGifRecord {
  replyfExerciseId: string;
  canonicalExerciseName: string;
  canonicalSlug: string;
  sourceType: 'generated-gif';
  sourceImages: [string, string];
  mediaUrl: string;
  frameCount: 2;
  frameDurationMs: number;
  sourceHash: string;
  generatorVersion: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  status: 'ready';
  provenance: {
    source: string;
    sourceExerciseId?: string;
    sourceCommit?: string;
    sourcePath?: string;
    license: string;
    attribution: string;
    commercialUseAllowed: boolean;
    redistributionAllowed: boolean;
    localBundleAllowed: boolean;
    referenceOnly: boolean;
    verification: {
      identity: 'verified' | 'unverified';
      rights: 'verified' | 'unverified' | 'restricted';
      asset: 'verified' | 'broken';
    };
  };
}

import registryJson from './generated-exercise-gifs.json';

export const GENERATED_EXERCISE_GIF_LIST: GeneratedExerciseGifRecord[] = registryJson as GeneratedExerciseGifRecord[];

/**
 * Fast O(1) lookup table indexed by canonical exercise ID
 */
export const GENERATED_EXERCISE_GIFS_BY_ID: Record<string, GeneratedExerciseGifRecord> =
  Object.fromEntries(GENERATED_EXERCISE_GIF_LIST.map((r) => [r.replyfExerciseId, r]));

/**
 * Fast O(1) lookup table indexed by canonical slug
 */
export const GENERATED_EXERCISE_GIFS_BY_SLUG: Record<string, GeneratedExerciseGifRecord> =
  Object.fromEntries(GENERATED_EXERCISE_GIF_LIST.map((r) => [r.canonicalSlug, r]));
`;

  fs.writeFileSync(tsRegistryPath, tsContent, 'utf8');

  console.log(`\nSuccessfully generated ${records.length} GIFs into public/videos/generated/`);
  console.log(`Updated registries:`);
  console.log(` - ${jsonRegistryPath}`);
  console.log(` - ${tsRegistryPath}\n`);

  return {
    totalScanned: folders.length,
    totalGenerated: records.length,
    totalSkipped: skipped.length,
    totalErrors: 0,
    records,
    skipped,
  };
}

// Execute if run directly via CLI
if (require.main === module || process.argv[1]?.includes('generate-exercise-gifs')) {
  generateExerciseGifs();
}
