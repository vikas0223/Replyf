# Third-Party Notices and Licensing Information

This document details third-party code, data, and asset attributions incorporated into or referenced by Replyf. Each external source is documented separately with explicit boundaries between repository code, metadata, API terms, and asset-level rights.

---

## 1. Software Dependencies & Libraries

Replyf builds upon standard open-source libraries. The key production and development dependencies are licensed as follows:

| Library | License | Usage in Replyf |
| :--- | :--- | :--- |
| **Next.js** | MIT | Core application framework, server-side rendering, routing, and optimization |
| **React & React-DOM** | MIT | Component architecture and state lifecycle |
| **TypeScript** | Apache-2.0 | Static typing and interfaces |
| **Tailwind CSS** | MIT | Utility-first CSS styling and layout system |
| **Radix UI** | MIT | Accessible unstyled primitive components (dialogs, tooltips, tabs, dropdowns) |
| **Lucide React** | ISC | System iconography |
| **Framer Motion** | MIT | Declarative micro-interactions, page transitions, and card motion |
| **Lenis** | MIT | Smooth momentum scrolling for landing and content pages |
| **Recharts** | MIT | Visual charting for workout volume and progression tracking |
| **@supabase/supabase-js** | MIT | Client library for remote authentication and database synchronization |
| **Zod** | MIT | Schema validation and domain type invariants |
| **gifenc** | MIT | Pure JavaScript GIF encoder used by offline media generation tooling |
| **jpeg-js** | BSD-3-Clause | JPEG decoding utility for image dimension verification |
| **Vitest** | MIT | Unit and integration test runner |

---

## 2. free-exercise-db

- **Repository**: [https://github.com/yuhonas/free-exercise-db.git](https://github.com/yuhonas/free-exercise-db.git)
- **Pinned Commit**: `a859101d633a01c4a1a920d6a8ce41dabba0705f`
- **License**: The Unlicense (Public Domain Dedication)
- **Stated Terms**: The repository explicitly describes itself as an open public-domain dataset under The Unlicense and explicitly documents local use of its JSON records and exercise image files (`0.jpg`, `1.jpg`).
- **Usage in Replyf**:
  - Structured exercise metadata reference for deterministic matching.
  - Approved imported static exercise demonstration images stored locally in `public/exercises/{slug}/`.
  - Provenance tracked on every imported file (`source: 'free-exercise-db'`, `sourceCommit`, `sourcePath`, `assetHash`, `license: 'Unlicense'`).
- **Provenance Retention**:
  - Source attribution and provenance are permanently retained in `lib/data/exercise-dataset-mapping.ts` and `public/exercises/manifest.json`.

---

## 3. Generated Exercise Movement GIFs

- **Tooling**: `scripts/generate-exercise-gifs.ts`
- **Output Directory**: `public/videos/generated/<slug>.gif`
- **Source Material**: Two-frame movement photo pairs (`0.jpg` and `1.jpg`) from `free-exercise-db`.
- **Source Rights**: Dedicated to the Public Domain under The Unlicense.
- **Generation Method**: High-efficiency palette quantization (`gifenc`), 600ms per frame continuous loop.
- **Licensing & Redistribution**:
  - The underlying photographic source frames are derived from public-domain materials (`free-exercise-db`).
  - These generated demonstration GIFs are created specifically for offline fallback animation in Replyf.
  - Verification identity, dimensions, hashes, and provenance are tracked in `lib/data/generated-exercise-gifs.ts`.

---

## 4. azilRababe/Exercises_Dataset & Third-Party Animated Assets

- **Repository**: [https://github.com/azilRababe/Exercises_Dataset.git](https://github.com/azilRababe/Exercises_Dataset.git)
- **Pinned Commit**: `29145279a39a2675f5e4ade584a50718f71cfa58`
- **Repository License**: MIT License
- **Media Provenance & Rights Separation**:
  - **CRITICAL NOTICE**: Repository MIT ≠ Every GIF automatically MIT.
  - The repository's own README explicitly states that contributed exercise media must comply with applicable copyright and licensing requirements. Many GIFs within the dataset originate from third-party fitness websites (such as `fitnessprogramer.com`).
  - Therefore, individual GIFs are treated as unverified third-party assets.
- **Replyf Policy & Redistribution Status**:
  - **License / redistribution status: Unverified**.
  - GIFs referenced from external sources remain flagged with `referenceOnly: true` and `verification.rights = 'unverified'`.
  - Replyf does not make commercial redistribution claims over third-party GIFs whose upstream copyright cannot be independently validated.
  - Where valid public-domain or CC-BY assets exist, Replyf prioritizes in-house SVGs (`public/images/exercises/`) and reproducible generated GIFs (`public/videos/generated/`).

---

## 5. ExerciseDB API & Dataset

- **Repository / Hosted API**:
  - [https://github.com/ExerciseDB/exercisedb-api.git](https://github.com/ExerciseDB/exercisedb-api.git) (Pinned Commit: `401ef93437a160f86927fee43b8e692532d04469`)
  - [https://oss.exercisedb.dev/](https://oss.exercisedb.dev/)
- **License & Rights Separation**:
  - **Repository Code**: AGPL-3.0 License
  - **Hosted Free API**: Subject to ExerciseDB / AscendAPI terms (rate-limited, non-commercial use tiers).
  - **Media Demonstrations**: Third-party animation demonstrations.
- **Replyf Policy**:
  - The Replyf exercise catalog does NOT depend on the hosted API at runtime. Exercise metadata remains 100% offline-first and self-contained.
  - ExerciseDB media is NOT bundled into production unless applicable commercial redistribution rights are explicitly secured.
  - Candidate records remain `referenceOnly: true`.

---

## 6. ExerciseDB Muscle Visualizer API

- **Repository**: [https://github.com/ExerciseDB/muscle-visualizer-api.git](https://github.com/ExerciseDB/muscle-visualizer-api.git)
- **Pinned Commit**: `3177d1ce2c9ab382fd875901fa4c6c86b64462c0`
- **Purpose**: Dynamic anatomical visualization, muscle highlighting, and workout heatmap presentation.
- **Usage Boundary**:
  - Used strictly for anatomy/muscle visualization concepts.
  - **NOT used as an exercise movement GIF/demonstration source.**
  - Replyf's canonical anatomy taxonomy (`lib/anatomy/anatomy-definitions.ts`) remains the authoritative domain model.

---

## 7. MuscleMap

- **Repository**: [https://github.com/melihcolpan/MuscleMap.git](https://github.com/melihcolpan/MuscleMap.git)
- **Author**: Melih Colpan
- **License**: MIT License
- **Usage in Replyf**:
  - Male and female body silhouette SVG vector coordinate geometry (`components/anatomy/muscle-map-model.tsx`).
  - Interactive anterior/posterior muscle group highlighting.
- **Domain Boundary**:
  - Replyf canonical muscle IDs and exercise-to-muscle relationships remain authoritative. MuscleMap provides visual presentation geometry only.
  - MuscleMap is NOT used for exercise movement demonstrations.

### MIT License Text (MuscleMap)

```
MIT License

Copyright (c) 2023 Melih Colpan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 8. Replyf In-House Artwork & Vector Demonstrations

- **Author**: Replyf Platform Design System
- **Location**: `public/images/exercises/*.svg`
- **License**: Creative Commons Attribution 4.0 International (CC-BY-4.0)
- **Scope**: Original, high-fidelity SVG vector demonstrations with anatomical muscle highlighting, motion vectors, and equipment geometry for priority movements (e.g., Abductor Machine, Adductor Machine, Ankle Rotations, Assault Bike, Band Pull-Aparts, Dumbbell Press, Triceps Extension).
- **Commercial Use & Redistribution**: Permitted with attribution (`commercialUseAllowed: true`, `localBundleAllowed: true`).
