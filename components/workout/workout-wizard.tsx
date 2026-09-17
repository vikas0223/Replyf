/**
 * Workout Generation Questionnaire Wizard Component
 *
 * Polished 3-column SaaS dashboard layout:
 * - Left (~22%): Vertical step navigation (Steps 1–6) + "Need help?" card
 * - Center (~50%): Main question card with progress, options, context tip, loading/error states, footer
 * - Right (~28%): "Your Selections" (exactly 6 rows) + "What's Next?" + inspirational quote card
 *
 * Implements exactly 6 steps:
 * 1. Goal (What do you want to achieve?)
 * 2. Experience (Your training background)
 * 3. Location (Where do you work out?)
 * 4. Equipment (What do you have available?)
 * 5. Schedule (How many days per week?)
 * 6. Duration (How much time per session?)
 *
 * Implements accessible, production-grade LOADING and ERROR states:
 * - Double-submission prevention
 * - Stale asynchronous result protection via generationIdRef
 * - Whole-wizard interaction disabling during generation
 * - Respects reduced motion preferences
 * - Preserves all 6 questionnaire selections upon error
 * - Primary "Try Again" (retries generation) and Secondary "Edit Plan" (returns to idle)
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FitnessGoal, ExperienceLevel, GeneratedWorkout } from '@/types/domain';
import { WorkoutEngine, WorkoutEngineInput } from '@/features/workout-engine';
import { CANONICAL_GOALS, EXPERIENCE_LEVELS } from '@/lib/domain/workout-draft';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Dumbbell,
  Target,
  Clock,
  Flame,
  Calendar,
  Check,
  Building,
  Home as HomeIcon,
  Loader2,
  AlertCircle,
  RotateCcw,
  Edit3,
  Trophy,
  HeartPulse,
  Activity,
  Leaf,
  MapPin,
  Trash2,
  Lightbulb,
  Compass,
  Quote,
  BarChart2,
} from 'lucide-react';
import { useAuthGuard, ONBOARDING_DRAFT_KEY } from '@/contexts/auth-guard-context';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES, MetaRecord, LocalProfileRecord } from '@/lib/storage/indexeddb-schema';

export type PlannerState = 'idle' | 'loading' | 'error';

export interface PlannerErrorMessage {
  title: string;
  description: string;
}

export interface WorkoutWizardProps {
  onWorkoutGenerated: (workout: GeneratedWorkout) => void;
  onCancel?: () => void;
}

const EQUIPMENT_LIST = [
  'Dumbbells',
  'Barbell',
  'Bodyweight',
  'Cables',
  'Machines',
  'Kettlebells',
  'Resistance Bands',
  'Pull-up Bar',
  'Bench',
];

const DURATION_PRESETS = [15, 30, 45, 60, 90];

/** Step metadata for left-hand vertical navigation */
interface StepMeta {
  number: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PLANNER_STEPS: StepMeta[] = [
  { number: 1, title: 'Goal', description: 'What do you want to achieve?', icon: Target },
  { number: 2, title: 'Experience', description: 'Your training background', icon: Flame },
  { number: 3, title: 'Location', description: 'Where do you work out?', icon: MapPin },
  { number: 4, title: 'Equipment', description: 'What do you have available?', icon: Dumbbell },
  { number: 5, title: 'Schedule', description: 'How many days per week?', icon: Calendar },
  { number: 6, title: 'Duration', description: 'How much time per session?', icon: Clock },
];

/** Goal icons with specific thematic styling */
const GOAL_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; text: string }> = {
  hypertrophy: { icon: Dumbbell, bg: 'bg-indigo-50 text-indigo-600', text: 'text-indigo-600' },
  strength: { icon: Trophy, bg: 'bg-amber-50 text-amber-600', text: 'text-amber-600' },
  fat_loss: { icon: Flame, bg: 'bg-rose-50 text-rose-600', text: 'text-rose-600' },
  endurance: { icon: HeartPulse, bg: 'bg-pink-50 text-pink-600', text: 'text-pink-600' },
  general_fitness: { icon: Leaf, bg: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-600' },
  mobility: { icon: Activity, bg: 'bg-blue-50 text-blue-600', text: 'text-blue-600' },
};

/** Canonical 6 generation stages for post-Step-6 loading animation */
const LOADING_STAGES = [
  'Understanding your training goals',
  'Matching your experience level',
  'Considering your available equipment',
  'Balancing your training volume',
  'Selecting the right exercises',
  'Finalizing your workout plan',
] as const;

/**
 * Loading messages contract (~1000ms / 1200ms synchronized stage rotation):
 * 'Understanding your training goals…', 'Matching your experience level…',
 * 'Working with your available equipment…', 'Balancing your training volume…',
 * 'Selecting exercises for your plan…', 'Finalizing your workout…'
 */
const LOADING_MESSAGES = [
  'Understanding your training goals…',
  'Matching your experience level…',
  'Working with your available equipment…',
  'Balancing your training volume…',
  'Selecting exercises for your plan…',
  'Finalizing your workout…',
];

const IS_TEST_BUILD =
  process.env.NEXT_PUBLIC_ENABLE_TEST_HELPERS === 'true' ||
  process.env.NODE_ENV === 'test' ||
  process.env.NODE_ENV === 'development';

export function WorkoutWizard({ onWorkoutGenerated, onCancel }: WorkoutWizardProps) {
  const { completeOnboarding } = useAuthGuard();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  // Form State — undefined/empty = no selection yet (fresh user begins with zero answers selected)
  const [goal, setGoal] = useState<FitnessGoal | undefined>(undefined);
  const [experience, setExperience] = useState<ExperienceLevel | undefined>(undefined);
  const [location, setLocation] = useState<'gym' | 'home' | undefined>(undefined);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState<number | undefined>(undefined);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);

  // Validation: tracks whether user attempted to proceed without selecting
  const [showValidation, setShowValidation] = useState<boolean>(false);

  // Synchronized loading presentation stage: 0 to 6 (advanced every 1.2s / 1200ms)
  const [currentGenerationStage, setCurrentGenerationStage] = useState<number>(0);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState<number>(0);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Explicit Planner Lifecycle State: 'idle' | 'loading' | 'error'
  const [plannerState, setPlannerState] = useState<PlannerState>('idle');
  const [errorMessage, setErrorMessage] = useState<PlannerErrorMessage | null>(null);

  // Stale Request & Mounting Protection
  const generationIdRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const errorContainerRef = useRef<HTMLDivElement>(null);

  // Resume onboarding answers from local draft or durable store
  useEffect(() => {
    let isCancelled = false;

    async function hydrateSelections() {
      try {
        let draft: any = null;
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
          if (raw) {
            draft = JSON.parse(raw);
          }
        }

        // If not in localStorage, check IndexedDB durable meta record
        if (!draft) {
          try {
            const engine = IndexedDBEngine.getInstance();
            const idbDraft = await engine.get<MetaRecord>(STORES.META, ONBOARDING_DRAFT_KEY);
            if (idbDraft?.value && typeof idbDraft.value === 'object') {
              draft = idbDraft.value;
            }
          } catch {
            // IndexedDB read skipped/failed
          }
        }

        if (isCancelled) return;

        if (draft && typeof draft === 'object') {
          if (draft.goal) setGoal(draft.goal);
          if (draft.experience) setExperience(draft.experience);
          if (draft.location) setLocation(draft.location);
          if (Array.isArray(draft.selectedEquipment)) setSelectedEquipment(draft.selectedEquipment);
          if (typeof draft.daysPerWeek === 'number') setDaysPerWeek(draft.daysPerWeek);
          if (typeof draft.duration === 'number') setDuration(draft.duration);
          if (Array.isArray(draft.selectedMuscles)) setSelectedMuscles(draft.selectedMuscles);
          if (typeof draft.currentStep === 'number' && draft.currentStep >= 1 && draft.currentStep <= totalSteps) {
            setCurrentStep(draft.currentStep);
          }
        } else {
          // If no draft exists, check for existing known profile information to reuse
          try {
            const engine = IndexedDBEngine.getInstance();
            const profiles = await engine.getAll<LocalProfileRecord>(STORES.LOCAL_PROFILES);
            if (profiles.length > 0 && !isCancelled) {
              const prof = profiles[0]?.profile;
              if (prof) {
                if (prof.primaryGoal) setGoal(prof.primaryGoal);
                if (prof.fitnessLevel) setExperience(prof.fitnessLevel);
                if (Array.isArray(prof.preferredEquipment) && prof.preferredEquipment.length > 0) {
                  setSelectedEquipment(prof.preferredEquipment);
                }
              }
            }
          } catch {
            // Profile check skipped
          }
        }
      } catch {
        // Ignore draft parsing error
      }
    }

    hydrateSelections();

    return () => {
      isCancelled = true;
    };
  }, [totalSteps]);

  // Synchronize partial answers to persistent draft storage whenever selections change
  useEffect(() => {
    const hasAnySelection =
      goal !== undefined ||
      experience !== undefined ||
      location !== undefined ||
      selectedEquipment.length > 0 ||
      daysPerWeek !== undefined ||
      duration !== undefined ||
      selectedMuscles.length > 0;

    // Never create a draft if user has not made any selection and is on step 1
    if (!hasAnySelection && currentStep === 1) {
      return;
    }

    const draft = {
      currentStep,
      goal,
      experience,
      location,
      selectedEquipment,
      daysPerWeek,
      duration,
      selectedMuscles,
    };

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
      }
      const engine = IndexedDBEngine.getInstance();
      engine.put(STORES.META, {
        key: ONBOARDING_DRAFT_KEY,
        value: draft,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    } catch {
      // Non-blocking draft persistence
    }
  }, [currentStep, goal, experience, location, selectedEquipment, daysPerWeek, duration, selectedMuscles]);

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && IS_TEST_BUILD) {
      (window as any).__setPlannerStateForTesting = (
        state: PlannerState,
        msg?: PlannerErrorMessage
      ) => {
        setPlannerState(state);
        if (msg) setErrorMessage(msg);
      };
    }
    return () => {
      isMountedRef.current = false;
      if (typeof window !== 'undefined' && IS_TEST_BUILD) {
        delete (window as any).__setPlannerStateForTesting;
      }
    };
  }, []);

  // Synchronized 1.2s (1200ms) stage progression; clean up on success/error/unmount
  useEffect(() => {
    if (plannerState === 'loading') {
      setCurrentGenerationStage(0);
      setLoadingMsgIndex(0);
      loadingIntervalRef.current = setInterval(() => {
        setCurrentGenerationStage((prev) => {
          const next = prev < 6 ? prev + 1 : prev;
          setLoadingMsgIndex(Math.min(next, LOADING_STAGES.length - 1));
          return next;
        });
      }, 1200);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    }
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    };
  }, [plannerState]);

  /** Returns whether the current step has a valid user selection */
  const isCurrentStepValid = useCallback((): boolean => {
    switch (currentStep) {
      case 1: return goal !== undefined;
      case 2: return experience !== undefined;
      case 3: return location !== undefined;
      case 4: return selectedEquipment.length > 0;
      case 5: return daysPerWeek !== undefined;
      case 6: return duration !== undefined;
      default: return true;
    }
  }, [currentStep, goal, experience, location, selectedEquipment, daysPerWeek, duration]);

  /** Human-readable validation message per step */
  const getValidationMessage = (): string => {
    switch (currentStep) {
      case 1: return 'Choose a goal to continue.';
      case 2: return 'Choose your experience level to continue.';
      case 3: return 'Choose your training location to continue.';
      case 4: return 'Choose at least one piece of equipment to continue.';
      case 5: return 'Choose how many days you want to train.';
      case 6: return 'Choose a workout duration.';
      default: return 'Please make a selection to continue.';
    }
  };

  // Keyboard accessibility: route focus to error alert container when error occurs
  useEffect(() => {
    if (plannerState === 'error' && errorContainerRef.current) {
      errorContainerRef.current.focus();
    }
  }, [plannerState]);

  const toggleEquipment = (item: string) => {
    if (plannerState === 'loading') return;
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  const handleNext = () => {
    if (plannerState === 'loading') return;

    // Validate current step before proceeding
    if (!isCurrentStepValid()) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (plannerState === 'loading') return;
    setShowValidation(false);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleEditPlan = () => {
    if (plannerState === 'loading') return;
    setErrorMessage(null);
    setPlannerState('idle');
    setCurrentGenerationStage(0);
    setLoadingMsgIndex(0);
  };

  const handleClearAll = () => {
    if (plannerState === 'loading') return;
    setGoal(undefined);
    setExperience(undefined);
    setLocation(undefined);
    setSelectedEquipment([]);
    setDaysPerWeek(undefined);
    setDuration(undefined);
    setSelectedMuscles([]);
    setShowValidation(false);
    setCurrentStep(1);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      }
      const engine = IndexedDBEngine.getInstance();
      engine.delete(STORES.META, ONBOARDING_DRAFT_KEY).catch(() => {});
    } catch {
      // Non-blocking
    }
  };

  const handleGenerate = async () => {
    // 1. Double-submission protection: ignore duplicate invocations while loading
    if (plannerState === 'loading') {
      return;
    }

    const currentAttempt = ++generationIdRef.current;
    setCurrentGenerationStage(0);
    setLoadingMsgIndex(0);
    setPlannerState('loading');
    setErrorMessage(null);

    try {
      if (typeof window !== 'undefined' && IS_TEST_BUILD) {
        const urlParams = new URLSearchParams(window.location.search);
        const simDelay =
          (window as any).__REPLYF_SIMULATE_DELAY ||
          (urlParams.get('simDelay') ? Number(urlParams.get('simDelay')) : 0);
        if (simDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, simDelay));
        }
        const simError =
          (window as any).__REPLYF_SIMULATE_ERROR ||
          urlParams.get('simError') === '1';
        if (simError) {
          throw new Error('Simulated engine failure for verification');
        }
      }

      const input: WorkoutEngineInput = {
        name: `${CANONICAL_GOALS.find((g) => g.value === goal)?.label.split(' ')[0] || 'Custom'} Routine`,
        fitnessLevel: experience ?? 'intermediate',
        primaryGoal: goal ?? 'hypertrophy',
        targetMuscles: selectedMuscles.length > 0 ? selectedMuscles : ['Full Body'],
        equipment: selectedEquipment.length > 0 ? selectedEquipment : ['bodyweight'],
        durationMinutes: duration ?? 45,
        daysPerWeek: daysPerWeek ?? 3,
        seed: Date.now(),
      };

      // Real deterministic generation via pure domain engine
      const plan = WorkoutEngine.generateWorkoutPlan(input);

      // Validate plan before downstream transitions
      if (!plan || !plan.id || !Array.isArray(plan.exercises) || plan.exercises.length === 0) {
        throw new Error('Generated workout plan contains no exercises.');
      }

      // Stale check
      if (currentAttempt !== generationIdRef.current || !isMountedRef.current) {
        return;
      }

      // Provide generated plan to parent before completing onboarding so stagedPlan is ready
      onWorkoutGenerated(plan);

      // Complete onboarding safely without treating metadata write errors as plan generation failures
      await completeOnboarding().catch((onboardingErr) => {
        console.error('Failed to update onboarding metadata:', onboardingErr);
      });
    } catch (err: unknown) {
      // Ignore stale errors
      if (currentAttempt !== generationIdRef.current || !isMountedRef.current) {
        return;
      }

      console.error('Workout generation failed:', err);
      setErrorMessage({
        title: "We couldn't build your workout",
        description: "Something went wrong while creating your plan. Your planner inputs are still saved.",
      });
      setPlannerState('error');
    }
  };

  const remainingSteps = totalSteps - currentStep;
  const progressPercentage = (currentStep / totalSteps) * 100;
  const isLoading = (plannerState as string) === 'loading';
  const isError = plannerState === 'error';
  const stepValid = isCurrentStepValid();

  /** Helpers for "Your Selections" rows */
  const selectedGoalLabel = CANONICAL_GOALS.find((g) => g.value === goal)?.label;
  const selectedExpLabel = EXPERIENCE_LEVELS.find((e) => e.value === experience)?.label;
  const selectedLocationLabel =
    location === 'gym' ? 'Commercial Gym' : location === 'home' ? 'Home / Limited' : undefined;
  const selectedEquipmentSummary =
    selectedEquipment.length > 0
      ? selectedEquipment.length <= 2
        ? selectedEquipment.join(', ')
        : `${selectedEquipment.slice(0, 2).join(', ')} +${selectedEquipment.length - 2}`
      : undefined;
  const selectedScheduleSummary =
    daysPerWeek ? `${daysPerWeek} ${daysPerWeek === 1 ? 'day' : 'days'} / week` : undefined;
  const selectedDurationSummary = duration ? `${duration} minutes` : undefined;

  /** Step-specific "Why this matters" educational tips */
  const getStepWhyThisMatters = () => {
    switch (currentStep) {
      case 1:
        return 'Your goal helps us choose the right exercises, sets, reps, and progression strategy to create a plan that actually works for you.';
      case 2:
        return 'Your experience level calibrates training volume and exercise complexity to maximize progress while preventing burnout.';
      case 3:
        return 'Knowing where you train ensures every exercise selected matches your available facility and space.';
      case 4:
        return 'We filter all exercise variations so your plan only includes movements you can actually perform with available gear.';
      case 5:
        return 'Weekly frequency determines how your muscle groups are split to ensure optimal stimulus and adequate recovery.';
      case 6:
        return 'Target duration ensures each workout fits comfortably into your schedule while maintaining proper training density.';
      default:
        return 'Every response helps us craft a balanced, effective workout routine tailored to your lifestyle.';
    }
  };

  return (
    <div className="w-full md:max-w-[860px] lg:max-w-[1320px] mx-auto">
      {isLoading ? (
        /* Dedicated Full-Page Centered Generation Loading Screen (matches reference mockup) */
        <div
          role="status"
          aria-live="polite"
          aria-busy={isLoading}
          className="fixed inset-0 z-50 bg-[#f6f8fc] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300"
        >
          <div className="w-full max-w-[560px] bg-white rounded-[28px] sm:rounded-[32px] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.08)] p-6 sm:p-10 md:p-12 flex flex-col items-center text-center space-y-6 my-auto">
            {/* GENERATE PLAN Eyebrow Badge */}
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#eef2ff] border border-indigo-100/80 text-[#4f46e5] text-[11px] font-bold tracking-widest uppercase shadow-2xs">
              <span>GENERATE PLAN</span>
            </div>

            {/* Heading & Subtitle */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
                Building your workout plan…
              </h2>
              <span className="sr-only">Building your workout… Building Workout…</span>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                We&apos;re creating a personalized plan based on your answers.
                <span className="block mt-0.5 text-slate-400">This only takes a few seconds.</span>
              </p>
            </div>

            {/* Dumbbell Icon with Dual-Arc Continuous Loading Animation */}
            <div
              className="relative my-2 sm:my-4 flex items-center justify-center"
              data-testid="loading-dual-arc-container"
            >
              {/* Outer soft ambient glow ring */}
              <div
                className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-b from-indigo-50/50 to-purple-50/20 border border-indigo-100/40 shadow-[0_0_40px_rgba(99,102,241,0.12)] pointer-events-none"
                aria-hidden="true"
              />

              {/* Dual-Arc SVG Animation */}
              <svg
                className="w-36 h-36 sm:w-40 sm:h-40"
                viewBox="0 0 140 140"
                aria-hidden="true"
              >
                {/* Stationary guide track */}
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  className="text-indigo-50/80"
                  strokeWidth="4"
                />

                {/* Arc A: Clockwise continuous rotation (~2s, longer arc) */}
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  className="text-indigo-600 animate-[spin_2s_linear_infinite] motion-reduce:animate-none origin-center"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="145 207"
                  data-testid="loading-arc-a"
                />

                {/* Arc B: Counter-clockwise continuous rotation (~2.8s, slightly shorter arc) */}
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  className="text-indigo-400 animate-[spin_2.8s_linear_infinite_reverse] motion-reduce:animate-none origin-center"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="85 267"
                  data-testid="loading-arc-b"
                />
              </svg>

              {/* Centered Dumbbell Icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-white border border-indigo-50 flex items-center justify-center shadow-xs">
                  <Dumbbell
                    className="w-9 h-9 sm:w-10 sm:h-10 text-indigo-600"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            {/* Integrated Six-row Generation Checklist Card */}
            <div
              className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-2 sm:p-2.5 shadow-xs space-y-0.5 text-left divide-y divide-slate-50"
              aria-label="Generation checklist"
            >
              {LOADING_STAGES.map((stageText, idx) => {
                const isCompleted = currentGenerationStage > idx;
                const isActive = currentGenerationStage === idx;

                return (
                  <div
                    key={stageText}
                    className={`min-h-[46px] px-3.5 py-2.5 rounded-xl border flex items-center gap-3 transition-all duration-300 ${
                      isActive
                        ? 'bg-[#f0f3ff] border-indigo-100/90 shadow-2xs'
                        : 'border-transparent'
                    }`}
                  >
                    {/* Status Indicator */}
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-[#4f46e5] text-white flex items-center justify-center transition-all duration-200 scale-100 shadow-2xs animate-in zoom-in-75 fade-in motion-reduce:animate-none">
                          <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                        </div>
                      ) : isActive ? (
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin motion-reduce:animate-none flex items-center justify-center transition-all duration-200" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white transition-all duration-200" />
                      )}
                    </div>

                    {/* Dynamic Text with smooth fade & stable row height */}
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-xs sm:text-sm block transition-all duration-250 ${
                          isActive
                            ? 'text-indigo-950 font-bold tracking-tight translate-y-0 opacity-100'
                            : isCompleted
                            ? 'text-slate-800 font-medium'
                            : 'text-slate-400 font-normal'
                        }`}
                      >
                        {stageText}{isActive ? '…' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Card Footer Microcopy */}
            <div className="pt-2 text-center text-xs text-slate-500 space-y-1">
              <p className="flex items-center justify-center gap-1.5 font-medium text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
                <span>Good things take a moment</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Your personalized plan is on the way.
              </p>
            </div>

            {/* Screen-reader live announcement of stage changes */}
            <p className="sr-only">
              Stage {loadingMsgIndex + 1} of 6: {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
          </div>
        </div>
      ) : (
        /* =========================================================================
            DESKTOP 3-COLUMN / MOBILE-STACKED LAYOUT
            Left (~22%): Step Navigation & Guidance
            Center (~50%): Main Question Card
            Right (~28%): Selections Summary & What's Next
           ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ───────────────────────────────────────────────────────────────────────
            LEFT COLUMN (lg:col-span-3, ~22%): Step Navigation Panel
           ─────────────────────────────────────────────────────────────────────── */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Vertical Step Navigation Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Setup Steps
              </span>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {currentStep} of {totalSteps}
              </span>
            </div>

            <nav aria-label="Planner steps" className="space-y-1.5">
              {PLANNER_STEPS.map((step) => {
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                const isUpcoming = currentStep < step.number;

                return (
                  <button
                    key={step.number}
                    type="button"
                    disabled={plannerState === 'loading' || isUpcoming}
                    onClick={() => {
                      if (!isLoading && isCompleted) {
                        setShowValidation(false);
                        setCurrentStep(step.number);
                      }
                    }}
                    aria-current={isActive ? 'step' : undefined}
                    className={`w-full text-left rounded-xl p-2.5 transition-all flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                      isActive
                        ? 'bg-indigo-50/90 border border-indigo-200/90 shadow-2xs'
                        : isCompleted
                        ? 'hover:bg-slate-50 cursor-pointer text-slate-700'
                        : 'opacity-60 cursor-not-allowed text-slate-400'
                    }`}
                  >
                    {/* Step Number Circle */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'border border-slate-300 text-slate-400 bg-white'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" aria-hidden="true" />
                      ) : (
                        step.number
                      )}
                    </div>

                    {/* Step Title & Supporting Description */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold truncate ${
                            isActive ? 'text-indigo-950' : isCompleted ? 'text-slate-900' : 'text-slate-500'
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] truncate leading-tight mt-0.5 ${
                          isActive ? 'text-indigo-600/90 font-medium' : 'text-slate-400'
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Need Help Card (Left Sidebar) */}
          <div className="hidden lg:block bg-indigo-50/70 border border-indigo-100/90 rounded-2xl p-4 text-left shadow-2xs">
            <div className="flex items-start gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900">Need help?</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  You can always adjust these settings later or regenerate your plan whenever your routine changes.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ───────────────────────────────────────────────────────────────────────
            CENTER COLUMN (lg:col-span-6, ~50%): Main Question Card
           ─────────────────────────────────────────────────────────────────────── */}
        <main
          className="lg:col-span-6 bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 pt-6 md:pt-10 pb-8 px-4 sm:px-8 shadow-xs flex flex-col justify-between min-h-[560px]"
          aria-busy={isLoading}
        >
          <div>
            {/* Step Counter & Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span className="text-indigo-600 font-semibold">
                  Step {currentStep} of {totalSteps}
                </span>
                <span>
                  {remainingSteps === 0 ? 'Final step' : `${remainingSteps} steps remaining`}
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className="h-2 bg-slate-100"
                aria-label={`Workout setup progress (${remainingSteps} steps remaining)`}
              />
            </div>

            {/* Fieldset disables all wizard inputs during loading while preserving visibility */}
            <fieldset
              disabled={isLoading}
              className="border-0 p-0 m-0 min-w-0"
              aria-busy={isLoading}
            >
            {/* Step 1: Goal */}
              {currentStep === 1 && (
                <div>
                  <div className="mt-7">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                      <Target className="w-6 h-6 text-indigo-600 shrink-0" aria-hidden="true" />
                      <span>What is your primary fitness goal?</span>
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Your goal drives exercise selection, rep ranges, and rest intervals.
                    </p>
                  </div>

                  <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {CANONICAL_GOALS.map((g) => {
                      const isSelected = goal !== undefined && goal === g.value;
                      const iconConfig = GOAL_ICONS[g.value] || { icon: Target, bg: 'bg-indigo-50 text-indigo-600', text: 'text-indigo-600' };
                      const CardIcon = iconConfig.icon;

                      return (
                        <button
                          key={g.value}
                          type="button"
                          disabled={isLoading}
                          onClick={() => !isLoading && setGoal(g.value)}
                          className={`min-h-[116px] p-5 rounded-2xl text-left border transition-all flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 w-full">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconConfig.bg}`}>
                                <CardIcon className="w-5 h-5" aria-hidden="true" />
                              </div>
                              <span className="font-bold text-sm text-slate-900 leading-snug">
                                {g.label}
                              </span>
                            </div>
                            {/* Selection Indicator */}
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all mt-0.5 ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" aria-hidden="true" />}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {g.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Experience */}
              {currentStep === 2 && (
                <div>
                  <div className="mt-7">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                      <Flame className="w-6 h-6 text-indigo-600 shrink-0" aria-hidden="true" />
                      <span>What is your training experience?</span>
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Calibrates exercise complexity and volume to prevent overtraining.
                    </p>
                  </div>

                  <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {EXPERIENCE_LEVELS.map((lvl) => {
                      const isSelected = experience !== undefined && experience === lvl.value;
                      const desc =
                        lvl.value === 'beginner'
                          ? 'Fundamental movement patterns, motor learning, and foundation building.'
                          : lvl.value === 'intermediate'
                          ? 'Progressive overload, varied compound lifts, and periodization.'
                          : 'High-intensity volume, advanced variations, and specialization.';

                      return (
                        <button
                          key={lvl.value}
                          type="button"
                          disabled={isLoading}
                          onClick={() => !isLoading && setExperience(lvl.value)}
                          className={`min-h-[116px] p-5 rounded-2xl text-left border transition-all flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                            isLoading ? 'opacity-60' : ''
                          } ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 w-full">
                            <span className="font-bold text-sm text-slate-900">{lvl.label}</span>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all mt-0.5 ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" aria-hidden="true" />}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                            {desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Location & Equipment */}
              {currentStep === 3 && (
                <div>
                  <div className="mt-7">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                      <MapPin className="w-6 h-6 text-indigo-600 shrink-0" aria-hidden="true" />
                      <span>Where do you work out?</span>
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Choose your primary workout environment.
                    </p>
                  </div>

                  <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        if (isLoading) return;
                        setLocation('gym');
                        if (selectedEquipment.length === 0) {
                          setSelectedEquipment(['Dumbbells', 'Barbell', 'Cables', 'Machines', 'Bench', 'Bodyweight']);
                        }
                      }}
                      className={`min-h-[116px] p-5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                        isLoading ? 'opacity-60' : ''
                      } ${
                        location === 'gym'
                          ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <Building className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-900 block">Commercial Gym</span>
                          <span className="text-xs text-slate-500 mt-0.5 block">Full machines, barbells, and free weights</span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          location === 'gym'
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {location === 'gym' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" aria-hidden="true" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        if (isLoading) return;
                        setLocation('home');
                        if (selectedEquipment.length === 0) {
                          setSelectedEquipment(['Dumbbells', 'Bodyweight', 'Resistance Bands']);
                        }
                      }}
                      className={`min-h-[116px] p-5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                        isLoading ? 'opacity-60' : ''
                      } ${
                        location === 'home'
                          ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <HomeIcon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-900 block">Home / Limited</span>
                          <span className="text-xs text-slate-500 mt-0.5 block">Bodyweight, dumbbells, bands, and portable items</span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          location === 'home'
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {location === 'home' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" aria-hidden="true" />}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Days per Week */}
              {currentStep === 4 && (
                <div>
                  <div className="mt-7">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                      <Dumbbell className="w-6 h-6 text-indigo-600 shrink-0" aria-hidden="true" />
                      <span>What equipment do you have available?</span>
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Select all equipment you have access to for your workouts.
                    </p>
                  </div>

                  <div className="mt-7">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {EQUIPMENT_LIST.map((eq) => {
                        const isSelected = selectedEquipment.includes(eq);
                        return (
                          <button
                            key={eq}
                            type="button"
                            disabled={isLoading}
                            onClick={() => toggleEquipment(eq)}
                            className={`min-h-[56px] p-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                              isLoading ? 'opacity-60' : ''
                            } ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                                : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{eq}</span>
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                                isSelected
                                  ? 'border-white bg-white text-indigo-600'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Duration */}
              {currentStep === 5 && (
                <div>
                  <div className="mt-7">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                      <Calendar className="w-6 h-6 text-indigo-600 shrink-0" aria-hidden="true" />
                      <span>How many days per week do you plan to train?</span>
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Helps configure appropriate weekly split density.
                    </p>
                  </div>

                  <div className="mt-7 grid grid-cols-7 gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                      const isSelected = daysPerWeek === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={isLoading}
                          onClick={() => !isLoading && setDaysPerWeek(num)}
                          className={`min-h-[72px] py-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                            isLoading ? 'opacity-60' : ''
                          } ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white font-black shadow-md shadow-indigo-200'
                              : 'border-slate-200 hover:border-slate-300 text-slate-800 font-bold hover:bg-slate-50/80 bg-white'
                          }`}
                        >
                          <span className="text-lg block leading-none">{num}</span>
                          <span className="text-[10px] uppercase font-semibold opacity-80 mt-1">
                            {num === 1 ? 'day' : 'days'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-center text-xs text-slate-500 mt-4">
                    Recommended for your goal: <strong className="text-slate-800 font-bold">3 to 4 days</strong> per week.
                  </p>
                </div>
              )}

              {/* Step 6: Target Muscle Focus */}
              {currentStep === 6 && (
                <div>
                  <div className="mt-7">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                      <Clock className="w-6 h-6 text-indigo-600 shrink-0" aria-hidden="true" />
                      <span>Target workout duration</span>
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Sets the overall exercise count and density of your session.
                    </p>
                  </div>

                  <div className="mt-7 grid grid-cols-5 gap-2 sm:gap-3">
                    {DURATION_PRESETS.map((mins) => {
                      const isSelected = duration === mins;
                      return (
                        <button
                          key={mins}
                          type="button"
                          disabled={isLoading}
                          onClick={() => !isLoading && setDuration(mins)}
                          className={`min-h-[72px] py-3 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                            isLoading ? 'opacity-60' : ''
                          } ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200'
                              : 'border-slate-200 text-slate-800 font-semibold hover:bg-slate-50/80 bg-white'
                          }`}
                        >
                          <span className="text-base sm:text-lg block leading-none">{mins}</span>
                          <span className="text-[10px] uppercase mt-1">min</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-center text-xs text-slate-600 mt-5">
                    Estimated structure: <strong className="text-slate-900 font-bold">{Math.round((duration ?? 45) / 9)} compound/isolation exercises</strong> with warm-up and cool-down intervals.
                  </div>
                </div>
              )}
              </fieldset>

            {/* Step-Specific "Why this matters" Guidance Card */}
            {!isLoading && !isError && (
              <div className="mt-6 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3 text-left animate-in fade-in duration-200">
                <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart2 className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">Why this matters</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {getStepWhyThisMatters()}
                  </p>
                </div>
              </div>
            )}

            {/* Accessible Error State Banner */}
            {isError && (
              <div
                ref={errorContainerRef}
                tabIndex={-1}
                role="alert"
                aria-live="assertive"
                className="mt-6 p-5 sm:p-6 rounded-2xl bg-rose-50/90 border border-rose-200/80 shadow-xs space-y-4 focus:outline-none focus:ring-2 focus:ring-rose-500/20 animate-in fade-in duration-200"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {errorMessage?.title || "We couldn't build your workout"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {errorMessage?.description || "Something went wrong while creating your plan. Your planner inputs are still saved."}
                    </p>
                  </div>
                </div>

                {/* In-Card Recovery Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    onClick={handleGenerate}
                    className="min-h-[44px] px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" aria-hidden="true" />
                    <span>Try Again</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleEditPlan}
                    className="min-h-[44px] px-5 rounded-xl border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <Edit3 className="w-4 h-4 mr-1 text-slate-500" aria-hidden="true" />
                    <span>Edit Plan</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Validation Feedback */}
            {showValidation && !stepValid && (
              <p className="mt-4 text-xs sm:text-sm text-rose-600 font-medium animate-in fade-in duration-200" role="alert">
                {getValidationMessage()}
              </p>
            )}
          </div>

          {/* Options -> Divider (28px: mt-7) -> Divider -> Footer buttons (24px: pt-6) */}
          <div className="mt-7 border-t border-slate-200/80 pt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
              className="min-h-[44px] px-5 rounded-xl border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" aria-hidden="true" />
              <span>{currentStep === 1 ? 'Cancel' : 'Back'}</span>
            </Button>

            {isError ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEditPlan}
                  className="min-h-[44px] px-4 sm:px-5 rounded-xl border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4 mr-1 text-slate-500" aria-hidden="true" />
                  <span>Edit Plan</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerate}
                  className="min-h-[44px] px-5 sm:px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 mr-1" aria-hidden="true" />
                  <span>Try Again</span>
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="min-h-[44px] px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {currentStep === totalSteps ? (
                  isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      <span>Building Workout…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      <span>Generate Workout</span>
                    </>
                  )
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            )}
          </div>
        </main>

        {/* ───────────────────────────────────────────────────────────────────────
            RIGHT COLUMN (lg:col-span-3, ~28%): Selections Summary & What's Next
           ─────────────────────────────────────────────────────────────────────── */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Your Selections Card — Exactly 6 rows */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Your Selections
              </h3>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isLoading}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3 text-slate-400" />
                <span>Clear All</span>
              </button>
            </div>

            {/* Exactly 6 Rows: Goal, Experience, Location, Equipment, Schedule, Duration */}
            <div className="space-y-2.5 text-xs">
              {/* Row 1: Goal */}
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100/80">
                <div className="flex items-center gap-2 text-slate-600">
                  <Target className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-medium">Goal</span>
                </div>
                <span
                  className={`font-semibold text-right truncate max-w-[140px] ${
                    selectedGoalLabel ? 'text-indigo-700' : 'text-slate-400 font-normal'
                  }`}
                >
                  {selectedGoalLabel ? selectedGoalLabel.split(' (')[0] : 'Not selected'}
                </span>
              </div>

              {/* Row 2: Experience */}
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100/80">
                <div className="flex items-center gap-2 text-slate-600">
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-medium">Experience</span>
                </div>
                <span
                  className={`font-semibold text-right truncate max-w-[140px] ${
                    selectedExpLabel ? 'text-indigo-700' : 'text-slate-400 font-normal'
                  }`}
                >
                  {selectedExpLabel ? selectedExpLabel.split(' ')[0] : 'Not selected'}
                </span>
              </div>

              {/* Row 3: Location */}
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100/80">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-medium">Location</span>
                </div>
                <span
                  className={`font-semibold text-right truncate max-w-[140px] ${
                    selectedLocationLabel ? 'text-indigo-700' : 'text-slate-400 font-normal'
                  }`}
                >
                  {selectedLocationLabel || 'Not selected'}
                </span>
              </div>

              {/* Row 4: Equipment */}
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100/80">
                <div className="flex items-center gap-2 text-slate-600">
                  <Dumbbell className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-medium">Equipment</span>
                </div>
                <span
                  className={`font-semibold text-right truncate max-w-[140px] ${
                    selectedEquipmentSummary ? 'text-indigo-700' : 'text-slate-400 font-normal'
                  }`}
                  title={selectedEquipment.join(', ')}
                >
                  {selectedEquipmentSummary || 'Not selected'}
                </span>
              </div>

              {/* Row 5: Schedule */}
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100/80">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-medium">Schedule</span>
                </div>
                <span
                  className={`font-semibold text-right truncate max-w-[140px] ${
                    selectedScheduleSummary ? 'text-indigo-700' : 'text-slate-400 font-normal'
                  }`}
                >
                  {selectedScheduleSummary || 'Not selected'}
                </span>
              </div>

              {/* Row 6: Duration */}
              <div className="flex items-center justify-between gap-2 py-1.5">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-medium">Duration</span>
                </div>
                <span
                  className={`font-semibold text-right truncate max-w-[140px] ${
                    selectedDurationSummary ? 'text-indigo-700' : 'text-slate-400 font-normal'
                  }`}
                >
                  {selectedDurationSummary || 'Not selected'}
                </span>
              </div>
            </div>
          </div>

          {/* What's Next? Guidance Card */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-xs text-left">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" aria-hidden="true" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                What’s Next?
              </h4>
            </div>

            <ol className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span className="leading-snug">Complete all 6 steps</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span className="leading-snug">We’ll build your personalized plan</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span className="leading-snug">Review and make adjustments</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <span className="leading-snug">Start your first workout</span>
              </li>
            </ol>
          </div>

          {/* Inspirational Quote Card */}
          <div className="bg-white/80 backdrop-blur-xs rounded-2xl border border-slate-200/70 p-4 shadow-2xs flex items-start gap-3">
            <div className="text-indigo-500 shrink-0 mt-0.5">
              <Quote className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs italic text-slate-700 leading-relaxed font-medium">
                “A goal without a plan is just a wish.”
              </p>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">
                — Antoine de Saint-Exupéry
              </p>
            </div>
          </div>
        </aside>

      </div>
    )}
  </div>
);
}
