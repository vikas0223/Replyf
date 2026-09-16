/**
 * Canonical Domain Types for Workout Planner Platform
 * Phase 2A Architecture Foundation + Phase 2H.5 Future-Proof Extension
 *
 * Domain Layers:
 *   USER        — profile, preferences, constraints, body metrics
 *   DISCOVERY   — exercise catalog, variations, alternatives, anatomy
 *   WORKOUT     — templates, drafts, generated workouts, grouping, presentation
 *   SESSION     — live workout execution, sets, feedback, recovery
 *   PROGRAMMING — programs, weeks, days, planned workouts
 *   PROGRESS    — dashboard, PRs, goals, streaks, challenges
 *   ENGAGEMENT  — reminders, challenges, sharing
 *   INTEGRATION — external provider connections
 *   AI          — recommendations, coach messages
 */

// ==========================================
// Branded ID Types
// ==========================================

export type UserId = string & { readonly __brand: unique symbol };
export type ExerciseId = string & { readonly __brand: unique symbol };
export type MuscleId = string & { readonly __brand: unique symbol };
export type EquipmentId = string & { readonly __brand: unique symbol };
export type JointId = string & { readonly __brand: unique symbol };
export type TemplateId = string & { readonly __brand: unique symbol };
export type GeneratedWorkoutId = string & { readonly __brand: unique symbol };
export type SessionId = string & { readonly __brand: unique symbol };
export type SessionExerciseId = string & { readonly __brand: unique symbol };
export type SetId = string & { readonly __brand: unique symbol };
export type RecommendationId = string & { readonly __brand: unique symbol };
export type ProgramId = string & { readonly __brand: unique symbol };
export type GoalTargetId = string & { readonly __brand: unique symbol };
export type PersonalRecordId = string & { readonly __brand: unique symbol };
export type ChallengeId = string & { readonly __brand: unique symbol };
export type ReminderId = string & { readonly __brand: unique symbol };
export type IntegrationId = string & { readonly __brand: unique symbol };

// ==========================================
// Core Enums / Union Types
// ==========================================

export type FitnessGoal =
  | 'muscle_gain'
  | 'hypertrophy'
  | 'strength'
  | 'fat_loss'
  | 'endurance'
  | 'general_fitness'
  | 'mobility';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Gender = 'male' | 'female' | 'other';
export type MovementPattern = 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'rotation' | 'isolation' | 'locomotion';
export type Mechanics = 'compound' | 'isolation';
export type ForceType = 'push' | 'pull' | 'static' | 'dynamic';
export type MuscleRole = 'primary' | 'secondary' | 'stabilizer';

/**
 * Set type classification.
 * Existing persisted values ('warmup' | 'working' | 'drop' | 'failure' | 'cooldown') remain valid.
 * Phase 2H.5 adds: 'normal', 'amrap', 'negative'.
 * Missing setType on legacy records should be treated as 'normal' by hydration logic.
 */
export type SetType = 'normal' | 'warmup' | 'working' | 'drop' | 'failure' | 'negative' | 'amrap' | 'cooldown';

/**
 * Separate from SetType. Tracks unilateral vs bilateral execution.
 * Missing side should be treated as 'bilateral' by default.
 */
export type SetSide = 'bilateral' | 'left' | 'right';

export type SetStatus = 'planned' | 'completed' | 'skipped';
export type SessionStatus = 'planned' | 'active' | 'completed' | 'abandoned';
export type SessionExerciseStatus = 'pending' | 'active' | 'completed' | 'skipped' | 'substituted';

export type AnatomyMode = 'muscle' | 'joint';
export type BodySex = 'male' | 'female';
export type BodyView = 'front' | 'back';
export type BodySide = 'left' | 'right' | 'bilateral' | 'center';

// ==========================================
// Phase 2H.5 Extended Enums
// ==========================================

/** Exercise origin — 'catalog' for canonical bundled, 'user' for user-created custom exercises. */
export type ExerciseSource = 'catalog' | 'user';

/** Exercise grouping within a workout (superset, giant set, circuit). */
export type ExerciseGroupType = 'superset' | 'giant_set' | 'circuit';

/**
 * Relationship semantics between exercises.
 * - alternative: replacement candidate (same movement intent)
 * - variation: same exercise family with meaningful variation (grip, stance, tempo, etc.)
 * - complementary: commonly paired exercise (agonist/antagonist)
 * - related: exploration/discovery linkage
 */
export type ExerciseRelationshipKind = 'alternative' | 'variation' | 'complementary' | 'related';

/** Specific variation dimensions for ExerciseVariation. */
export type ExerciseVariationKind =
  | 'grip'
  | 'stance'
  | 'tempo'
  | 'range_of_motion'
  | 'equipment'
  | 'unilateral'
  | 'position'
  | 'progression'
  | 'regression';

/** Workout presentation mode — self-logged vs guided execution. Default: 'self_logged'. */
export type WorkoutPresentationMode = 'self_logged' | 'guided';

/** Quick workout duration profile classification. Actual duration stored separately. */
export type QuickWorkoutProfile = 'quick' | 'short' | 'standard' | 'long';

/** Structured non-medical exercise-selection constraints. NOT medical diagnoses. */
export type TrainingConstraint =
  | 'no_jump'
  | 'low_impact'
  | 'quiet'
  | 'limited_space'
  | 'bodyweight_only'
  | 'home_only'
  | 'gym_only';

/** User-level goal target types (distinct from workout-level FitnessGoal). */
export type GoalTargetType =
  | 'weight'
  | 'frequency'
  | 'strength'
  | 'volume'
  | 'workouts_completed'
  | 'personal_record'
  | 'body_metric';

export type GoalTargetStatus = 'active' | 'achieved' | 'abandoned';

/** Personal record measurement types. */
export type PersonalRecordType =
  | 'max_weight'
  | 'max_reps'
  | 'estimated_1rm'
  | 'volume'
  | 'duration'
  | 'distance'
  | 'time'
  | 'pace';

export type ChallengeStatus = 'active' | 'completed' | 'abandoned';

/** Goal direction for fitness targets. */
export type GoalDirection = 'increase' | 'decrease' | 'maintain';

/** Program lifecycle status. */
export type ProgramStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

/** Program day scheduling/adherence status. */
export type ProgramDayStatus = 'planned' | 'completed' | 'skipped' | 'rescheduled';

/** Challenge target metric types. */
export type ChallengeMetricType =
  | 'workout_count'
  | 'set_count'
  | 'volume'
  | 'frequency'
  | 'streak'
  | 'personal_record';

/** Program day types — what is scheduled for a given day. */
export type ProgramDayType = 'workout' | 'rest' | 'recovery' | 'mobility';

/** Integration capability categories. */
export type IntegrationCapabilityType =
  | 'read_workouts'
  | 'write_workouts'
  | 'read_body_metrics'
  | 'write_body_metrics'
  | 'read_heart_rate'
  | 'read_steps'
  | 'read_sleep';

export type ReminderType = 'workout' | 'program' | 'goal' | 'recovery' | 'custom';

export interface AnatomySelection {
  type: AnatomyMode;
  id: string;
  label: string;
  catalogTargets: string[];
}

export interface AnatomyRegionDefinition {
  id: string;
  label: string;
  type: AnatomyMode;
  view: BodyView;
  side: BodySide;
  catalogMuscles?: string[];
  catalogJoints?: string[];
  relatedRegionIds?: string[];
  description?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  gender?: Gender;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  height?: number;
  heightUnit?: 'cm' | 'in';
  fitnessLevel: ExperienceLevel;
  primaryGoal: FitnessGoal;
  preferredEquipment: string[];
  preferredMuscleGroups: string[];
  avoidedJoints?: string[];
  avoidedMuscles?: string[];
  completedWorkouts?: number;
  ratings?: WorkoutRating[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutRating {
  id?: string;
  workoutPlanId: string;
  rating: number; // 1-5
  feedback?: string;
  timestamp: number;
}

export interface Muscle {
  id: string;
  slug: string;
  name: string;
  region: 'upper' | 'lower' | 'core' | 'full_body';
  parentMuscleId?: string;
  mapPathId?: string;
  description?: string;
}

export interface Joint {
  id: string;
  slug: string;
  name: string;
  region: 'upper' | 'lower' | 'spine';
  mapPathId?: string;
}

export interface Equipment {
  id: string;
  slug: string;
  name: string;
  category: string;
  isCommonHomeEquipment: boolean;
}

export interface MediaVerificationStatus {
  identity: 'verified' | 'unverified';
  rights: 'verified' | 'unverified' | 'restricted';
  asset: 'verified' | 'broken';
}

export interface ProvenanceMetadata {
  source: 'in_house' | 'public_domain' | 'creative_commons' | 'licensed_dataset' | 'exercises-dataset' | 'free-exercise-db' | 'azilRababe' | 'ExerciseDB' | 'MuscleMap' | (string & {});
  sourceExerciseId?: string;
  sourceCommit?: string;
  sourcePath?: string;
  assetHash?: string;
  importedAt?: string;
  license: 'MIT' | 'CC-BY-4.0' | 'CC0' | 'Unlicense' | 'Proprietary' | (string & {});
  attribution: string;
  commercialUseAllowed: boolean;
  redistributionAllowed?: boolean;
  localBundleAllowed?: boolean;
  referenceOnly?: boolean;
  verification?: MediaVerificationStatus;
  matchMethod?: 'exact_source_id' | 'exact_normalized_name' | 'verified_name_equipment' | 'verified_name_muscles' | 'manual_verified' | (string & {});
  matchConfidence?: number;
}

export interface ExerciseMedia {
  id: string;
  replyfExerciseId?: string;
  type: 'image' | 'video' | 'gif' | 'svg' | 'animation';
  url: string;
  posterUrl?: string;
  isLocal?: boolean;
  isApproved?: boolean;
  provenance: ProvenanceMetadata;
}

export interface ExerciseAlternative {
  alternativeExerciseId: string;
  alternativeName?: string;
  reason: string;
  difference?: string;
}

/**
 * Structured variation of a canonical exercise.
 * Distinct from alternatives (replacements) and complementary (paired) exercises.
 */
export interface ExerciseVariation {
  variationExerciseId: string;
  variationName?: string;
  kind: ExerciseVariationKind;
  description?: string;
}

/**
 * Complementary exercise pairing (agonist/antagonist or commonly-trained-together).
 * Distinct from alternatives and variations.
 */
export interface ComplementaryExercise {
  exerciseId: string;
  name?: string;
  reason?: string;
}

export interface Exercise {
  id: string;
  name: string;
  slug?: string;
  aliases?: string[];
  description?: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  equipment: string[];
  movementPattern?: MovementPattern;
  difficulty: ExperienceLevel;
  mechanics?: Mechanics;
  force?: ForceType;
  goals: (FitnessGoal | string)[];
  joints?: string[];
  instructions?: string[];
  formCues?: string[];
  commonMistakes?: string[];
  tips?: string[];
  alternatives?: (string | ExerciseAlternative)[];
  /** Phase 2H.5: structured variations (grip, stance, tempo, etc.) */
  variations?: ExerciseVariation[];
  /** Phase 2H.5: commonly paired exercises (agonist/antagonist) */
  complementaryExercises?: ComplementaryExercise[];
  media?: ExerciseMedia[];
  provenance?: ProvenanceMetadata;
  caloriesBurnRate?: number; // approx kcal/min
  defaultSets?: number;
  defaultReps?: string | number;
  defaultRestSeconds?: number;
  mediaUrl?: string;
  thumbnailUrl?: string;
  catalogVersion?: string;
  isActive?: boolean;
  /** Phase 2H.5: exercise origin — 'catalog' for bundled, 'user' for user-created. Default: 'catalog'. */
  source?: ExerciseSource;
  /** Phase 2H.5: convenience flag for user-created exercises. Default: false. */
  isCustom?: boolean;
  /** Phase 2H.5: owner of user-created exercise. Undefined for catalog exercises. */
  ownerId?: string;
}

export interface GeneratedWorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  targetMuscles: string[];
  secondaryMuscles?: string[];
  equipment: string[];
  notes?: string;
  difficulty?: ExperienceLevel;
  order: number;
  /** Phase 2H.5: exercise grouping — links exercises in same superset/giant set/circuit. */
  groupId?: string;
  groupType?: ExerciseGroupType;
  groupPosition?: number;
}

export interface GenerationTrace {
  appliedRules: string[];
  excludedExercisesCount: number;
  seed: number;
  engineVersion: string;
  catalogVersion: string;
  timestamp: string;
}

export interface GeneratedWorkout {
  id: string;
  name: string;
  goal: FitnessGoal | string;
  difficulty: ExperienceLevel;
  duration: number; // in minutes
  targetMuscles: string[];
  equipment: string[];
  exercises: GeneratedWorkoutExercise[];
  trace?: GenerationTrace;
  createdAt: string;
  /** Phase 2H.5: self-logged vs guided presentation. Default: 'self_logged'. */
  presentationMode?: WorkoutPresentationMode;
  /** Phase 2H.5: duration profile classification. */
  quickProfile?: QuickWorkoutProfile;
}

export interface WorkoutTemplate {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  goal: FitnessGoal | string;
  difficulty: ExperienceLevel;
  duration: number;
  targetMuscles: string[];
  equipment: string[];
  exercises: GeneratedWorkoutExercise[];
  isFavorite: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  /** Phase 2H.5: self-logged vs guided presentation. Default: 'self_logged'. */
  presentationMode?: WorkoutPresentationMode;
  /** Phase 2H.5: duration profile classification. */
  quickProfile?: QuickWorkoutProfile;
}

export interface WorkoutSet {
  id: string;
  sessionExerciseId: string;
  setNumber: number;
  type: SetType;
  /** Phase 2H.5: unilateral vs bilateral. Missing = 'bilateral'. */
  side?: SetSide;
  targetReps?: number;
  actualReps?: number;
  loadValue?: number;
  loadUnit?: 'kg' | 'lbs' | 'bodyweight' | string;
  targetWeight?: number;
  actualWeight?: number;
  weightUnit?: 'kg' | 'lbs';
  durationSeconds?: number;
  distanceValue?: number;
  distanceUnit?: string;
  rpe?: number; // 1-10
  rir?: number; // reps in reserve
  restSeconds?: number;
  tempo?: string;
  status: SetStatus;
  notes?: string;
  completedAt?: string;
  deletedAt?: string;
}

export interface SessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  name: string;
  order: number;
  status: SessionExerciseStatus;
  targetMuscles: string[];
  equipment: string[];
  sets: WorkoutSet[];
  plannedSets?: number;
  plannedReps?: string | number;
  plannedRestSeconds?: number;
  substitutedFromExerciseId?: string;
  substitutionReason?: string;
  notes?: string;
  completedAt?: string;
  /** Phase 2H.5: exercise grouping — links exercises in same superset/giant set/circuit. */
  groupId?: string;
  groupType?: ExerciseGroupType;
  groupPosition?: number;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutPlanId?: string;
  name: string;
  status: SessionStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number; // total duration in seconds
  durationMinutes?: number;
  totalCaloriesBurned?: number;
  totalVolume?: number; // kg or lbs total moved
  exercises: SessionExercise[];
  notes?: string;
  feedback?: WorkoutFeedback;
}

export interface PreviousPerformanceRecord {
  sessionId: string;
  completedAt: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  weightUnit?: string;
  rpe?: number;
  notes?: string;
}

export interface PreviousPerformanceSummary {
  exerciseId: string;
  lastPerformedAt?: string;
  maxWeight?: number;
  maxReps?: number;
  totalSetsCompleted: number;
  recentSets: PreviousPerformanceRecord[];
}

export interface WorkoutFeedback {
  id?: string;
  sessionId?: string;
  workoutPlanId?: string;
  rating: number; // 1-5
  perceivedDifficulty?: 'too_easy' | 'just_right' | 'too_hard';
  difficulty?: 'too_easy' | 'just_right' | 'too_hard';
  paceRating?: 'too_slow' | 'just_right' | 'too_fast';
  comments?: string;
  tags?: string[];
  notes?: string;
  targetMusclesFeedback?: Record<string, 'underworked' | 'good' | 'overworked'>;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  workoutId?: string;
  name: string;
  reason: string;
  score: number;
  source: 'collaborative' | 'content_based' | 'deterministic_rules';
  muscleGroups: string[];
  equipment: string[];
  difficulty: ExperienceLevel | string;
  duration: number;
}

export interface RecommendationEvent {
  id: string;
  userId: string;
  recommendationType: string;
  entityId: string;
  action: 'shown' | 'accepted' | 'dismissed' | 'rated';
  score?: number;
  context?: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardMetrics {
  totalWorkoutsCompleted: number;
  totalDurationMinutes: number;
  totalCaloriesBurned: number;
  totalVolumeMoved: number;
  currentStreakDays: number;
  longestStreakDays: number;
  weeklyWorkoutsCount: number;
  weeklyWorkoutsTarget: number;
  workoutsByDayOfWeek: { day: string; count: number; date: string }[];
  categoryDistribution: { category: string; count: number; percentage: number }[];
  recentWorkouts: {
    id: string;
    name: string;
    date: string;
    duration: number;
    exercisesCount: number;
    difficulty?: string;
  }[];
}

// ==========================================
// USER DOMAIN — Training Preferences & Constraints
// ==========================================

/**
 * User training preferences. All fields optional — do not require during onboarding.
 * Persistence: domain-only for now (future: IndexedDB local_profiles → Supabase profiles).
 */
export interface TrainingPreferences {
  preferredLocation?: 'home' | 'gym' | 'outdoor' | 'anywhere';
  preferredEquipment?: string[];
  defaultWorkoutDuration?: number; // minutes
  defaultRestSeconds?: number;
  voiceCoach?: boolean;
  autoAdvance?: boolean;
  keepScreenAwake?: boolean;
  hapticFeedback?: boolean;
  /** Constraint-style preferences (non-medical exercise-selection filters). */
  constraints?: TrainingConstraint[];
}

// ==========================================
// PROGRAMMING DOMAIN — Programs / Cycles
// ==========================================

/**
 * Training program — a multi-week structured plan.
 * Persistence: IndexedDB (DB_VERSION 2) + Supabase Sync.
 */
export interface Program {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  goal?: FitnessGoal | string;
  difficulty?: ExperienceLevel;
  weeks: ProgramWeek[];
  status: ProgramStatus;
  startDate?: string;
  completedAt?: string;
  currentWeekNumber?: number;
  currentDayNumber?: number;
  isCustom?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramWeek {
  id: string;
  programId: string;
  weekNumber: number;
  label?: string;
  days: ProgramDay[];
}

export interface ProgramDay {
  id: string;
  programId: string;
  programWeekId: string;
  dayNumber: number; // 1-7
  type: ProgramDayType; // 'workout' | 'rest' | 'recovery' | 'mobility'
  label?: string;
  /** Reference to an existing WorkoutTemplate ID. */
  workoutTemplateId?: string;
  status: ProgramDayStatus;
  /** Original planned date (YYYY-MM-DD) */
  scheduledDate?: string;
  /** Actual / rescheduled date (YYYY-MM-DD) */
  effectiveDate?: string;
  /** Primary successful session ID */
  completedSessionId?: string;
  completedAt?: string;
  notes?: string;
}

// ==========================================
// PROGRESS DOMAIN — Goals, PRs, Streaks
// ==========================================

/**
 * User-level fitness goal target (separate from workout-level FitnessGoal).
 * Persistence: IndexedDB (DB_VERSION 2) + Supabase Sync.
 */
export interface FitnessGoalTarget {
  id: string;
  userId?: string;
  type: GoalTargetType;
  direction: GoalDirection;
  label?: string;
  targetValue: number;
  unit: string;
  startValue?: number;
  startDate: string;
  targetDate?: string;
  exerciseId?: string; // for strength/personal_record goals
  status: GoalTargetStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Personal record for a specific exercise.
 * Persistence: domain-only for now.
 */
export interface PersonalRecord {
  id: string;
  userId?: string;
  exerciseId: string;
  recordType: PersonalRecordType;
  value: number;
  unit: string;
  sessionId?: string;
  setId?: string;
  achievedAt: string;
  previousValue?: number;
  createdAt: string;
}

/**
 * Streak tracking for consecutive workout days or weeks.
 * Persistence: domain-only for now.
 */
export interface Streak {
  id: string;
  userId?: string;
  type: 'daily' | 'weekly';
  currentCount: number;
  longestCount: number;
  lastActivityDate: string;
  startDate: string;
  updatedAt: string;
}

// ==========================================
// USER DOMAIN — Body Metrics
// ==========================================

/**
 * Body metric snapshot. All measurements optional except id, date.
 * Persistence: domain-only for now.
 */
export interface BodyMetricEntry {
  id: string;
  userId?: string;
  date: string;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  bodyFatPercentage?: number;
  waist?: number;
  chest?: number;
  arm?: number;
  thigh?: number;
  measurementUnit?: 'cm' | 'in';
  notes?: string;
  createdAt: string;
}

// ==========================================
// SESSION DOMAIN — Recovery
// ==========================================

/**
 * Non-medical recovery/readiness snapshot.
 * readinessScore is a product-derived signal, NOT a medical measurement.
 * Persistence: domain-only for now.
 */
export interface RecoverySnapshot {
  id: string;
  userId?: string;
  date: string;
  sleepDuration?: number; // hours
  perceivedRecovery?: number; // 1-10 scale
  fatigue?: number; // 1-10 scale
  soreness?: number; // 1-10 scale
  readinessScore?: number; // product-derived 0-100
  notes?: string;
  createdAt: string;
}

// ==========================================
// ENGAGEMENT DOMAIN — Reminders, Challenges, Sharing
// ==========================================

/**
 * Scheduled reminder. Persistence: domain-only for now.
 */
export interface Reminder {
  id: string;
  userId?: string;
  type: ReminderType;
  schedule: string; // cron expression or time string
  enabled: boolean;
  message?: string;
  goalId?: string;
  programId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Challenge definition. Statically cataloged or custom.
 */
export interface Challenge {
  id: string;
  name: string;
  description?: string;
  type: ChallengeMetricType;
  targetValue: number;
  unit: string;
  durationDays?: number;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  createdAt: string;
}

/**
 * User's participation state in a Challenge.
 * Persistence: IndexedDB (DB_VERSION 2) + Supabase Sync.
 */
export interface ChallengeProgress {
  id: string;
  challengeId: string;
  userId?: string;
  status: 'active' | 'completed' | 'abandoned';
  joinedAt: string;
  completedAt?: string;
  updatedAt: string;
}

/**
 * Workout sharing metadata. Designed for privacy from the beginning.
 * Does NOT expose private user data (session details, body metrics, etc.).
 * Persistence: domain-only for now.
 */
export interface ShareableWorkout {
  id: string;
  workoutTemplateId: string;
  ownerId?: string;
  name: string;
  description?: string;
  goal?: FitnessGoal | string;
  difficulty?: ExperienceLevel;
  exerciseCount: number;
  duration: number;
  isPublic: boolean;
  createdAt: string;
}

export interface WorkoutShare {
  id: string;
  shareableWorkoutId: string;
  sharedByUserId?: string;
  sharedWithUserId?: string;
  shareCode?: string;
  expiresAt?: string;
  createdAt: string;
}

// ==========================================
// INTEGRATION DOMAIN — External Providers
// ==========================================

/**
 * External integration provider definition.
 * Provider-specific APIs are kept out of core workout entities.
 * Persistence: domain-only for now.
 */
export interface IntegrationProvider {
  id: string;
  name: string;
  slug: string;
  capabilities: IntegrationCapability[];
  isAvailable: boolean;
  iconUrl?: string;
}

export interface IntegrationCapability {
  type: IntegrationCapabilityType;
  description?: string;
  requiresAuth: boolean;
}

/**
 * User's connection to an integration provider.
 * Persistence: domain-only for now.
 */
export interface IntegrationConnection {
  id: string;
  userId?: string;
  providerId: string;
  providerName: string;
  isConnected: boolean;
  lastSyncAt?: string;
  accessToken?: string; // encrypted in persistence layer
  refreshToken?: string; // encrypted in persistence layer
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// AI DOMAIN — Coach Messages
// ==========================================

/**
 * AI coach message for future conversational coaching.
 * Persistence: domain-only for now.
 */
export interface AICoachMessage {
  id: string;
  userId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  context?: Record<string, unknown>;
  createdAt: string;
}
