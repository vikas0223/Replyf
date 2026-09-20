# Workout Planner — Full Fitness Platform
## Master Product Requirements Document (PRD) v1.1
> **Status:** AUTHORITATIVE CURRENT MASTER PRD (Active — Phase 2H.5 Architecture Baseline)

**Project:** Workout Planner  
**Current repository:** `github.com/vikas0223/workout_planner`  
**Product type:** Responsive Fitness Web App / Progressive Web App  
**Primary users:** General fitness users — beginners through advanced  
**Primary architecture:** Next.js + React + TypeScript + Supabase + IndexedDB  
**V1 AI strategy:** Deterministic workout engine + LLM explanations/coaching  
**Primary distribution:** Web + installable PWA  
**Play Store:** Optional future distribution, not required for V1

---

# 1. Product Vision

Transform the current Personalized Workout Planner into a full fitness platform that helps users:

**Discover → Plan → Perform → Track → Analyze → Improve**

The application should not simply generate a workout once.

It should gradually build a useful understanding of each user's:

- fitness goal
- training experience
- equipment
- training frequency
- workout duration
- exercise preferences
- workout history
- set-level performance
- feedback
- consistency

and use this information to make future workouts and recommendations more relevant.

---

# 2. Product Positioning

MuscleWiki is a major functional reference for:

- exercise discovery
- muscle-based navigation
- body maps
- exercise information
- workout construction

The product should **not clone MuscleWiki's design, anatomy artwork, copy, or media**.

The product's differentiation is:

> A fitness platform that combines exercise discovery, personalized workout generation, manual workout building, set-by-set logging, progress analytics, offline workout execution, and progressively personalized recommendations.

---

# 3. Product North Star

The platform should answer:

> **What should I train today, how should I train it, and what should I do next?**

without requiring the user to understand programming theory, exercise science, or workout planning.

---

# 4. Target Users

The product supports:

- beginners
- intermediate users
- advanced users
- gym users
- home users
- bodyweight users
- limited-equipment users

The UX must adapt to experience level without unnecessarily separating the product into entirely different interfaces.

---

# 5. Core Product Loop

```text
Discover
   ↓
Generate / Build
   ↓
Review
   ↓
Start Workout
   ↓
Log Sets
   ↓
Complete Workout
   ↓
Give Feedback
   ↓
Analyze Progress
   ↓
Learn Preferences
   ↓
Recommend
   ↓
Generate Better Workout
```

This loop is the foundation of the product.

---

# 6. Platform Strategy

## Web

The application will first be available as a normal website.

Example:

`https://workout-planner.vercel.app`

## PWA

The application must eventually be installable from a supported browser as a Progressive Web App.

A Play Store listing is **not required** for the product to function as an installable mobile experience.

## Future Play Store

A Play Store package can be added later if there is a business or distribution reason to do so.

It is explicitly outside V1.

---

# 7. Application Shell

The application must evolve from a multi-step wizard into a persistent application.

## Desktop navigation

Primary destinations:

- Home
- Explore
- Start
- Workouts
- Progress
- Profile

## Mobile navigation

Recommended:

```text
Home | Explore | + Start | Progress | Profile
```

The center `+ Start` action should expose:

- Generate Workout
- Build Workout
- Resume Workout
- Start Saved Workout

The navigation structure may be changed later, but the platform must have persistent navigation rather than relying solely on `Next`/`Back`.

---

# 8. Information Architecture

```text
Home
├── Today's Workout
├── Progress Summary
├── Recommendations
└── Quick Actions

Explore
├── Exercises
├── Muscle Map
├── Joint Map
├── Workout Plans
└── Search

Start
├── Generate Workout
├── Build Manually
├── Saved Workout
└── Resume Workout

Workouts
├── Active
├── Saved
├── History
└── Templates

Progress
├── Overview
├── Strength
├── Volume
├── Muscle Distribution
├── Consistency
└── Personal Records

Profile
├── Goals
├── Preferences
├── Account
├── Storage & Offline
└── Settings
```

---

# 9. Guest Mode

Guest mode is required.

Users must be able to use the primary product without creating an account.

Guest users can:

- browse exercises
- use muscle/joint maps
- generate workouts
- manually build workouts
- save workouts locally
- execute workouts
- log individual sets
- view local progress
- submit feedback

Users can optionally create an account later.

---

# 10. Guest → Account Migration

When a guest creates an account:

```text
Local Guest Data
       ↓
Authentication
       ↓
Data Migration
       ↓
Supabase
       ↓
Continue Existing Fitness Journey
```

The migration must preserve:

- workouts
- workout templates
- sessions
- individual sets
- preferences
- favorites
- feedback
- progress

The process must be idempotent and must not duplicate existing records.

---

# 11. Personalization Philosophy

The onboarding must follow:

> **Minimum necessary input, maximum useful personalization.**

Users should not be presented with a large questionnaire.

Each important input appears one at a time.

---

# 12. V1 Personalization Inputs

## Required / high-value inputs

- primary goal
- training experience
- gym/home/both
- available equipment
- days per week
- preferred workout duration
- selected muscle focus

## Optional profile enrichment

- age
- height
- weight
- preferred exercises
- avoided exercises

The application should not require all optional fields before generating the first workout.

---

# 13. Sequential Onboarding

The onboarding flow should present one question per screen.

Example:

```text
Step 4 of 9

What equipment do you have?

[ Dumbbells ]
[ Barbell ]
[ Machine ]
...

████████████░░░░░
5 steps remaining
```

Users must be able to:

- continue
- go back
- skip optional inputs
- resume interrupted onboarding

---

# 14. Progress Indicator

Every multi-step onboarding/generator flow must show:

- current step
- total steps
- visual progress
- remaining steps

Examples:

> Step 4 of 9  
> 5 steps remaining

Do not display fabricated precise time estimates.

---

# 15. Workout Goals

## V1

Each workout has exactly **one primary goal**.

Examples:

- muscle gain
- strength
- fat loss
- endurance
- general fitness
- mobility

The database may be designed to support multiple goals later, but the V1 UI and deterministic engine must constrain a workout to one goal.

## V2+

Multi-goal reasoning may be introduced through adaptive planning and LLM-assisted interpretation.

---

# 16. Deterministic Workout Engine

V1 workout generation must be deterministic and rule-driven.

The LLM must **not** independently invent the workout prescription.

The engine receives structured inputs and produces a validated workout.

```text
Goal
+
Experience
+
Equipment
+
Duration
+
Frequency
+
Muscle Focus
        ↓
Exercise Candidate Pool
        ↓
Scoring
        ↓
Workout Composition
        ↓
Constraint Validation
        ↓
Final Workout
```

---

# 17. Workout Engine Requirements

The engine must consider:

- goal
- experience
- available equipment
- target muscles
- duration
- exercise difficulty
- exercise compatibility
- movement balance
- volume
- duplicate prevention
- exercise alternatives

The engine must validate the final workout before presenting it.

---

# 18. Workout Validation

Generated workouts must be checked for:

- invalid exercise/equipment combinations
- duplicate exercises
- excessive volume
- unsuitable duration
- missing target muscles
- inappropriate goal configuration
- invalid set/rep configuration
- impossible workout length

Invalid plans must be regenerated or corrected internally.

---

# 19. Manual Workout Builder

Users must be able to create a workout manually.

Flow:

```text
Create Workout
↓
Add Exercise
↓
Configure Sets/Reps/Rest
↓
Reorder
↓
Save
```

The builder must support:

- add exercise
- remove exercise
- reorder exercise
- edit sets
- edit reps
- edit rest
- save template
- duplicate workout

---

# 20. Generated Workout Editing

Generated workouts must be editable.

For every exercise:

- Replace
- Remove
- Edit
- Reorder
- Add alternative

The user must never be forced to regenerate the entire workout because one exercise is unsuitable.

---

# 21. Exercise Library

Exercise discovery is a first-class feature.

Users can search/filter by:

- exercise name
- muscle
- equipment
- difficulty
- movement
- goal

Each exercise detail page should include:

- name
- demonstration
- target muscles
- secondary muscles
- equipment
- instructions
- form cues
- common mistakes
- alternatives
- favorite
- add to workout

---

# 22. Exercise Data Strategy

Exercise information should not be scattered through React components.

Exercise data must be normalized into structured records.

Core model:

```text
Exercise
Muscle
Equipment
Joint
Media
Alternative
Goal
Movement Pattern
```

The initial exercise dataset may use reputable open/licensed sources where commercial and redistribution terms permit it.

Every external asset must carry:

- source
- license
- attribution
- commercial-use status

Unknown-license media must not be imported into production.

---

# 23. Exercise Media

Preferred order:

1. properly licensed video
2. open/licensed animation
3. original animated illustration
4. static illustration

Randomly copied public GIFs/videos are not acceptable merely because they are downloadable.

Large media should not automatically be stored in Supabase Storage.

Static/CDN hosting should be preferred where appropriate.

---

# 24. Anatomy / Muscle Map

The application will provide an interactive anatomy system.

Modes:

```text
Muscles
Joints
```

Views:

```text
Front
Back
```

Both male and female anatomy views are required.

---

# 25. Anatomy Interaction

The supplied design direction should be implemented as an interactive SVG system.

Desktop:

```text
Hover
 ↓
Highlight
 ↓
Tooltip
 ↓
Click
 ↓
Selection
```

Mobile:

```text
Tap
 ↓
Highlight
 ↓
Tap/select
```

Hover cannot be the only interaction because touch devices do not provide persistent hover semantics.

---

# 26. Muscle Highlight States

Each body region must support:

- default
- hover
- selected
- related
- disabled/faded

Visual feedback should not rely on color alone.

Selected state should include visual emphasis plus accessible labels/state.

---

# 27. Joint Map

Joint mode must support selectable regions such as:

- neck
- shoulder
- elbow
- wrist
- spine
- hip
- knee
- ankle

The exact supported joint list will be finalized during implementation.

Joint markers should support the glow/highlight interaction shown in the supplied reference.

---

# 28. Joint UX Language

The application should describe:

> exercises involving this joint

rather than claiming:

> exercises that fix/treat the joint.

The feature must not imply medical diagnosis or rehabilitation guarantees.

---

# 29. Anatomy Implementation

Use custom semantic SVGs rather than raster overlays.

The anatomy system should expose stable IDs such as:

```text
chest
front_deltoid
biceps
triceps
quads
hamstrings
glutes
knee_left
knee_right
elbow_left
elbow_right
```

This enables:

- hover
- selection
- filtering
- exercise lookup
- accessibility
- analytics

---

# 30. Set-by-Set Workout Logger

The workout execution system must log individual sets.

Hierarchy:

```text
Workout Session
 └── Session Exercise
      └── Set
```

Each set includes:

- set number
- weight
- weight unit
- reps
- optional rest
- optional RPE
- optional notes
- completion timestamp

Example:

```text
Bench Press

Set 1 — 40 kg × 12
Set 2 — 45 kg × 10
Set 3 — 45 kg × 8
```

---

# 31. Previous Performance

During a workout, users should be able to see relevant previous performance.

Example:

```text
Last session
45 kg × 9

Today's target
45 kg × 10
```

This enables progressive-overload-oriented interaction without requiring users to remember prior numbers.

---

# 32. Rest Timer

The logger must include an optional rest timer.

Controls:

- start automatically after completing a set
- add 15 seconds
- subtract 15 seconds
- skip
- pause/resume

The timer must function without an internet connection.

---

# 33. Workout Session Offline Requirement

The workout session must remain usable if the network disappears.

Users must be able to:

- open the active workout
- record sets
- edit sets
- start/stop rest
- complete exercises
- complete the workout
- close/reopen the application
- resume the session

without internet.

---

# 34. Workout Completion

After completion:

```text
Workout Complete

Duration
Sets Completed
Volume
Personal Records
Calories estimate, where applicable

[View Progress]
[Rate Workout]
[Save]
[Done]
```

The completion screen is an important transition point into analytics and feedback.

---

# 35. Feedback

Workout feedback must include:

## Rating

1–5 stars.

## Difficulty

- too easy
- just right
- too hard

## Structured reasons

Examples:

- exercise selection was good
- too repetitive
- too difficult
- too easy
- too long
- too short
- equipment mismatch

## Optional comment

Feedback should feed the recommendation/personalization pipeline.

---

# 36. Recommendation System

V1 recommendations should be deterministic/content/behavior based.

Signals include:

- goal
- experience
- equipment
- muscle history
- workout frequency
- completed workouts
- skipped exercises
- replaced exercises
- ratings
- saved workouts
- exercise preferences

The recommendation system should produce a score and reason.

---

# 37. Recommendation Explanations

Examples:

> Recommended because you usually complete 45–60 minute upper-body workouts.

> Recommended because you rated similar workouts highly.

> Recommended because you have not trained your lower body recently.

The explanation should be generated from structured recommendation data rather than invented by the LLM.

---

# 38. Progress Dashboard

The dashboard is a core product feature.

Required areas include:

- weekly workout count
- workout duration
- training volume
- muscle distribution
- consistency
- exercise progression
- personal records

---

# 39. Real-Time Dashboard

The dashboard must update when relevant underlying training data changes.

The architecture should be:

```text
Workout Event
↓
Data Layer
↓
Metrics Aggregation
↓
Realtime Update
↓
Dashboard
```

The frontend should not independently recalculate the same analytics in multiple components.

---

# 40. Charts

V1 should include:

- weekly workout frequency
- training volume over time
- workout duration
- muscle-group distribution
- exercise progression
- personal-record history
- consistency/calendar visualization

Charts must have textual summaries for accessibility.

---

# 41. Local-First Architecture

The application must use:

**IndexedDB as the primary local operational data store.**

A lightweight engine pattern is used for IndexedDB access.

Do not use localStorage as the primary workout database.

localStorage may be used for:

- small preferences
- installation state
- UI flags
- lightweight identifiers

---

# 42. Local Data

Local storage contains enough information for offline operation:

```text
profile cache
preferences
exercise cache
active workout
workout sessions
sets
saved workouts
feedback queue
events
sync queue
app state
```

---

# 43. Cloud Data

Supabase is the cloud source of truth for authenticated users.

---

# 44. Offline Sync

Every cloud-bound mutation is represented by a sync queue.

State:

```text
pending
processing
succeeded
failed
conflict
dead
```

Each queue item contains:

- entity type
- entity ID
- operation
- payload
- retry count
- timestamps
- last error
- idempotency key

---

# 45. Sync Requirements

The sync system supports:

- automatic retry
- exponential backoff
- idempotent writes
- recovery after browser restart
- queue persistence
- duplicate prevention
- failure reporting
- manual retry

Historical workout records are never silently overwritten.

---

# 46. Sync UX

If a user is offline:

> Workout saved on this device. It will sync when you're online.

If syncing is pending:

> Sync pending.

If a sync permanently fails:

> Some workout data could not be synced. Your local copy is safe.

Provide:

- Retry
- View Details, where appropriate

---

# 47. Connectivity

The application reacts to:

- online
- offline
- reconnecting
- syncing
- synced
- failed

Network status never blocks local workout interaction.

---

# 48. Storage Management

Settings provides storage monitoring and safe cache clearance without deleting workout history.

---

# 49. Storage Warnings

If local storage becomes large, display a non-blocking warning.

---

# 50. PWA Requirements

The application supports:

- web app manifest
- icons (512x512, maskable)
- service worker
- offline shell
- cache strategy
- standalone display
- install handling
- update handling
- offline workout session

---

# 51–93. Architecture & Quality Principles

- Deterministic workout engine + LLM explanation layer
- Comprehensive offline-first persistence with sync queue
- Row-Level Security on Supabase cloud tables
- Complete responsive support from 320px mobile to desktop

---

# 94. Product Pillars (V1.0 Final Snapshot — Phases 2A–2L)

The platform's capabilities map to seven product pillars:

| Pillar | Description | Status |
|--------|-------------|--------|
| **DISCOVER** | Exercise library, muscle/joint maps, search & filters, exercise details | ✅ Implemented (Phase 2F–2G) |
| **PLAN** | Workout generation, manual building, programs, scheduling | ✅ Implemented (Phase 2H, 2J) |
| **TRAIN** | Session execution, set logging, real-time tracking, guided mode | ✅ Implemented (Phase 2H) |
| **TRACK** | Dashboard metrics, body metrics, workout history | ✅ Implemented (Phase 2H, 2I) |
| **ADAPT** | Personal records, goals, recommendation engine, adaptive training | ✅ Implemented (Phase 2I–2L) |
| **COACH** | AI coaching, form guidance, training insights | 🔲 V2.0 Scope |
| **CONNECT** | Sharing, challenges, streaks, wearable integrations | ✅ Streaks & Challenges implemented (Phase 2I, 2J); Social/Wearables V2.0 |

---

# 95. Long-Term Information Architecture

```text
Home (Dashboard)
├── Quick Workout
├── Active Program
├── Streaks / Challenges
└── Recovery Status

Explore (Discovery)
├── Exercise Library
├── Muscle Map
├── Joint Map
├── Saved Favorites
└── Custom Exercises

Workout (Plan + Train)
├── Generate Workout
├── Build Workout
├── Saved Workouts
├── Start Session
└── Active Session

Progress (Track + Adapt)
├── Dashboard Metrics
├── Personal Records
├── Goal Targets
├── Body Metrics
└── Workout History

You (User Profile)
├── Profile Settings
├── Training Preferences
├── Integrations
├── Reminders
└── Sharing
```

---

# 96. Domain Model Overview (Phase 2H.5)

The canonical domain model is organized into layers:

```text
USER
├── UserProfile              (cloud-synced)
├── TrainingPreferences      (domain-only)
├── TrainingConstraints      (domain-only, embedded)
└── BodyMetricEntry          (domain-only)

DISCOVERY
├── Exercise                 (cloud-persisted, read-only catalog)
├── ExerciseVariation        (domain-only, embedded in Exercise)
├── ExerciseAlternative      (cloud-persisted, embedded in Exercise)
├── ComplementaryExercise    (domain-only, embedded in Exercise)
├── Muscle                   (cloud-persisted, read-only)
├── Joint                    (cloud-persisted, read-only)
└── Equipment                (cloud-persisted, read-only)

WORKOUT
├── WorkoutDraft             (in-memory)
├── WorkoutTemplate          (cloud-synced)
├── GeneratedWorkout         (cloud-synced)
├── GeneratedWorkoutExercise (cloud-synced, embedded)
├── ExerciseGroupType        (domain-only, optional metadata)
├── WorkoutPresentationMode  (domain-only, optional field)
└── QuickWorkoutProfile      (domain-only, optional field)

SESSION
├── WorkoutSession           (cloud-synced)
├── SessionExercise          (cloud-synced, embedded)
├── WorkoutSet               (cloud-synced, embedded)
│   ├── SetType              (extended: normal, warmup, working, drop, failure, negative, amrap, cooldown)
│   └── SetSide              (domain-only: bilateral, left, right)
├── WorkoutFeedback          (cloud-synced)
└── RecoverySnapshot         (domain-only)

PROGRAMMING
├── Program                  (domain-only)
├── ProgramWeek              (domain-only, embedded)
└── ProgramDay               (domain-only, embedded)

PROGRESS
├── DashboardMetrics         (computed)
├── PersonalRecord           (domain-only)
├── FitnessGoalTarget        (domain-only)
├── Streak                   (domain-only)
└── ChallengeProgress        (domain-only)

ENGAGEMENT
├── Reminder                 (domain-only)
├── Challenge                (domain-only)
├── ShareableWorkout         (domain-only)
└── WorkoutShare             (domain-only)

INTEGRATION
├── IntegrationProvider      (domain-only)
├── IntegrationConnection    (domain-only)
└── IntegrationCapability    (domain-only, embedded)

AI
├── Recommendation           (computed)
├── RecommendationEvent      (domain-only)
└── AICoachMessage           (domain-only)
```

See `docs/foundation-persistence-readiness.md` for the full persistence readiness matrix.

---

# 97. Future Feature Roadmap

| Phase | Focus | Key Capabilities |
|---|---|---|
| **2I** | Progress & Dashboard | Body metrics persistence, recovery tracking, enhanced dashboard analytics |
| **2J** | Programs & Goals | Multi-week programs, goal targets, personal records, challenges, streaks |
| **2K** | Recommendation Engine | Content-based + collaborative filtering, recommendation events |
| **2L** | Adaptive Training | Progressive overload, auto-adjustment, deload detection |
| **2M** | AI Coach | Conversational coaching, form insights, training suggestions |
| **2N** | Sharing & Community | Workout sharing, share codes, privacy-respecting social features |
| **2O** | Health & Wearable Integrations | Apple Health, Google Health Connect, Fitbit, Strava, Garmin, Wear OS |

> **Constraint:** Each future phase must implement persistence (IndexedDB + Supabase + Sync) for its domain entities before building UI. No UI should reference unpersisted domain-only types.
