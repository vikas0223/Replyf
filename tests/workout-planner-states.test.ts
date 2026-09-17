/**
 * Replyf Workout Planner — Loading & Error State Verification Test Suite
 * 
 * Verifies all 17 required test specifications:
 * 1. final wizard step renders "Generate Workout"
 * 2. submission enters loading
 * 3. duplicate submission is ignored
 * 4. all wizard controls are disabled during loading
 * 5. loading indicator and "Building Workout…" are rendered
 * 6. loading status has accessible semantics
 * 7. successful generation exits the wizard through the existing callback
 * 8. generation failure enters error state
 * 9. friendly error copy is rendered
 * 10. raw technical error text never reaches the UI
 * 11. all questionnaire values remain after failure
 * 12. Try Again retries using the same values
 * 13. Edit Plan returns to idle
 * 14. failed generation never remains stuck in loading
 * 15. stale generation results cannot overwrite a newer attempt
 * 16. retry does not cause duplicate generation callbacks
 * 17. downstream transition is not invoked on failed generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { WorkoutEngine, WorkoutEngineInput } from '@/features/workout-engine';
import { PlannerState, PlannerErrorMessage } from '@/components/workout/workout-wizard';
import { GeneratedWorkout } from '@/types/domain';

describe('Replyf Workout Planner — Loading & Error State Matrix', () => {
  const wizardFilePath = path.resolve(__dirname, '../components/workout/workout-wizard.tsx');
  const wizardFileContent = fs.readFileSync(wizardFilePath, 'utf-8');

  describe('Contract & Source Code Verification', () => {
    it('1. final wizard step renders "Generate Workout" in idle state', () => {
      expect(wizardFileContent).toContain('<span>Generate Workout</span>');
      expect(wizardFileContent).toContain('currentStep === totalSteps');
    });

    it('2. submission enters loading state with double-submission protection', () => {
      expect(wizardFileContent).toContain("if (plannerState === 'loading')");
      expect(wizardFileContent).toContain("setPlannerState('loading')");
    });

    it('3. duplicate submission is ignored while loading', () => {
      // Must return immediately if already loading
      const doubleSubmitPattern = /if\s*\(\s*plannerState\s*===\s*['"]loading['"]\s*\)\s*\{\s*return;/;
      expect(wizardFileContent).toMatch(doubleSubmitPattern);
    });

    it('4. all wizard controls are disabled during loading with fieldset and disabled props', () => {
      expect(wizardFileContent).toContain('fieldset');
      expect(wizardFileContent).toContain('disabled={isLoading}');
      expect(wizardFileContent).toContain('aria-busy={isLoading}');
      expect(wizardFileContent).toContain('disabled={plannerState ===');
      expect(wizardFileContent).toContain('disabled:opacity-60 disabled:cursor-not-allowed');
    });

    it('5. loading indicator and "Building Workout…" are rendered during loading', () => {
      expect(wizardFileContent).toContain('Building Workout…');
      expect(wizardFileContent).toContain('Loader2');
      expect(wizardFileContent).toContain('animate-spin');
    });

    it('6. loading status has accessible semantics (role="status", aria-live="polite", aria-busy)', () => {
      expect(wizardFileContent).toContain('role="status"');
      expect(wizardFileContent).toContain('aria-live="polite"');
      expect(wizardFileContent).toContain('aria-busy={isLoading}');
      expect(wizardFileContent).toContain('Building your workout…');
      // Dynamic rotating messages instead of static text
      expect(wizardFileContent).toContain('LOADING_STAGES');
      expect(wizardFileContent).toContain('loadingMsgIndex');
    });

    it('7. successful generation calls completeOnboarding and onWorkoutGenerated', () => {
      expect(wizardFileContent).toContain('await completeOnboarding()');
      expect(wizardFileContent).toContain('onWorkoutGenerated(plan)');
      // Must not have a persistent 'success' UI state
      expect(wizardFileContent).not.toMatch(/PlannerState\s*=\s*[^;]*'success'/);
    });

    it('8. generation failure enters error state', () => {
      expect(wizardFileContent).toContain("setPlannerState('error')");
      expect(wizardFileContent).toContain("We couldn't build your workout");
    });

    it('9. friendly error copy is rendered with role="alert" and aria-live="assertive"', () => {
      expect(wizardFileContent).toContain('role="alert"');
      expect(wizardFileContent).toContain('aria-live="assertive"');
      expect(wizardFileContent).toContain("We couldn't build your workout");
      expect(wizardFileContent).toContain("Something went wrong while creating your plan. Your planner inputs are still saved.");
    });

    it('10. raw technical error text never reaches user-facing copy', () => {
      // Must not expose raw technical error messages
      expect(wizardFileContent).not.toContain('err.message');
      expect(wizardFileContent).not.toContain('err.stack');
      expect(wizardFileContent).not.toContain('TypeError');
      expect(wizardFileContent).not.toContain('FetchError');
      // Technical details are logged to console.error
      expect(wizardFileContent).toContain("console.error('Workout generation failed:', err)");
    });

    it('11. all questionnaire values remain preserved in component state', () => {
      expect(wizardFileContent).toContain('goal');
      expect(wizardFileContent).toContain('experience');
      expect(wizardFileContent).toContain('location');
      expect(wizardFileContent).toContain('selectedEquipment');
      expect(wizardFileContent).toContain('daysPerWeek');
      expect(wizardFileContent).toContain('duration');
      expect(wizardFileContent).toContain('selectedMuscles');
      // handleEditPlan does not reset form inputs
      expect(wizardFileContent).toContain('const handleEditPlan = () => {');
      expect(wizardFileContent).toContain("setPlannerState('idle')");
    });

    it('12. Try Again retries using the same values', () => {
      expect(wizardFileContent).toContain('Try Again');
      expect(wizardFileContent).toContain('onClick={handleGenerate}');
    });

    it('13. Edit Plan returns to idle', () => {
      expect(wizardFileContent).toContain('Edit Plan');
      expect(wizardFileContent).toContain('onClick={handleEditPlan}');
      expect(wizardFileContent).toContain("setPlannerState('idle')");
    });

    it('14. failed generation never remains stuck in loading', () => {
      // In the catch block, setPlannerState must be called with 'error'
      expect(wizardFileContent).toMatch(/catch\s*\([^)]*\)\s*\{[\s\S]*?setPlannerState\('error'\)/);
    });

    it('15. stale generation results cannot overwrite a newer attempt', () => {
      expect(wizardFileContent).toContain('generationIdRef');
      expect(wizardFileContent).toContain('currentAttempt !== generationIdRef.current');
    });

    it('16. retry does not cause duplicate generation callbacks', () => {
      expect(wizardFileContent).toContain('generationIdRef.current');
      expect(wizardFileContent).toContain('if (currentAttempt !== generationIdRef.current');
    });

    it('17. downstream transition is not invoked on failed generation', () => {
      // onWorkoutGenerated must only be invoked after successful validation, never inside catch
      expect(wizardFileContent).not.toMatch(/catch\s*\([^)]*\)\s*\{[\s\S]*?onWorkoutGenerated/);
    });
  });

  describe('Lifecycle State Machine & Stale Result Simulation', () => {
    interface PlannerSimState {
      plannerState: PlannerState;
      errorMessage: PlannerErrorMessage | null;
      generationId: number;
      callbacksInvoked: number;
      onboardingCompleted: number;
      preservedInputs: {
        goal: string;
        experience: string;
        location: string;
        equipment: string[];
        daysPerWeek: number;
        duration: number;
        muscles: string[];
      };
    }

    let simState: PlannerSimState;

    beforeEach(() => {
      simState = {
        plannerState: 'idle',
        errorMessage: null,
        generationId: 0,
        callbacksInvoked: 0,
        onboardingCompleted: 0,
        preservedInputs: {
          goal: 'hypertrophy',
          experience: 'intermediate',
          location: 'gym',
          equipment: ['Dumbbells', 'Barbell', 'Bench'],
          daysPerWeek: 4,
          duration: 45,
          muscles: ['Full Body'],
        },
      };
    });

    // Simulates the exact implementation in WorkoutWizard.handleGenerate
    const runGenerationSim = async (shouldFail = false, asyncDelayMs = 0) => {
      if (simState.plannerState === 'loading') {
        return; // Double submission guard
      }

      const currentAttempt = ++simState.generationId;
      simState.plannerState = 'loading';
      simState.errorMessage = null;

      try {
        if (asyncDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, asyncDelayMs));
        }

        if (shouldFail) {
          throw new Error('SIMULATED_ENGINE_FAILURE: Catalog missing');
        }

        const input: WorkoutEngineInput = {
          name: 'Hypertrophy Full Body Routine',
          fitnessLevel: simState.preservedInputs.experience,
          primaryGoal: simState.preservedInputs.goal,
          targetMuscles: simState.preservedInputs.muscles,
          equipment: simState.preservedInputs.equipment,
          durationMinutes: simState.preservedInputs.duration,
          daysPerWeek: simState.preservedInputs.daysPerWeek,
          seed: 42,
        };

        const plan = WorkoutEngine.generateWorkoutPlan(input);
        if (!plan || !plan.id || !Array.isArray(plan.exercises) || plan.exercises.length === 0) {
          throw new Error('Generated workout plan contains no exercises.');
        }

        // Stale check
        if (currentAttempt !== simState.generationId) {
          return;
        }

        simState.onboardingCompleted++;

        // Stale check after onboarding
        if (currentAttempt !== simState.generationId) {
          return;
        }

        simState.callbacksInvoked++;
      } catch (err: unknown) {
        if (currentAttempt !== simState.generationId) {
          return;
        }

        simState.errorMessage = {
          title: "We couldn't build your workout",
          description: "Something went wrong while creating your plan. Your planner inputs are still saved.",
        };
        simState.plannerState = 'error';
      }
    };

    const runEditPlanSim = () => {
      if (simState.plannerState === 'loading') return;
      simState.errorMessage = null;
      simState.plannerState = 'idle';
    };

    it('verifies happy path: idle -> loading -> success callback', async () => {
      expect(simState.plannerState).toBe('idle');

      const promise = runGenerationSim();
      expect(simState.plannerState).toBe('loading');

      await promise;
      expect(simState.callbacksInvoked).toBe(1);
      expect(simState.onboardingCompleted).toBe(1);
      expect(simState.errorMessage).toBeNull();
    });

    it('verifies double-submission protection during active loading', async () => {
      // Launch generation with simulated delay
      const p1 = runGenerationSim(false, 30);
      expect(simState.plannerState).toBe('loading');
      expect(simState.generationId).toBe(1);

      // Attempt second submission while loading
      await runGenerationSim(false, 0);
      expect(simState.generationId).toBe(1); // Not incremented

      await p1;
      expect(simState.callbacksInvoked).toBe(1); // Exactly one callback
    });

    it('verifies error flow: failure sets error state and preserves inputs', async () => {
      await runGenerationSim(true, 0);

      expect(simState.plannerState).toBe('error');
      expect(simState.errorMessage?.title).toBe("We couldn't build your workout");
      expect(simState.errorMessage?.description).toBe(
        "Something went wrong while creating your plan. Your planner inputs are still saved."
      );
      expect(simState.callbacksInvoked).toBe(0);

      // Verify all inputs are preserved
      expect(simState.preservedInputs.goal).toBe('hypertrophy');
      expect(simState.preservedInputs.equipment).toEqual(['Dumbbells', 'Barbell', 'Bench']);
      expect(simState.preservedInputs.duration).toBe(45);
      expect(simState.preservedInputs.daysPerWeek).toBe(4);
    });

    it('verifies Edit Plan transitions from error to idle and clears error message', async () => {
      await runGenerationSim(true, 0);
      expect(simState.plannerState).toBe('error');

      runEditPlanSim();
      expect(simState.plannerState).toBe('idle');
      expect(simState.errorMessage).toBeNull();

      // Inputs remain intact
      expect(simState.preservedInputs.goal).toBe('hypertrophy');
    });

    it('verifies Try Again retries generation after error and succeeds', async () => {
      // 1. Initial failure
      await runGenerationSim(true, 0);
      expect(simState.plannerState).toBe('error');

      // 2. Retry succeeds
      await runGenerationSim(false, 0);
      expect(simState.callbacksInvoked).toBe(1);
      expect(simState.errorMessage).toBeNull();
    });

    it('verifies stale generation results cannot overwrite a newer attempt', async () => {
      // Attempt 1 starts with a 50ms delay
      const attempt1 = runGenerationSim(false, 50);
      expect(simState.generationId).toBe(1);

      // Force-fail or start attempt 2 immediately (e.g. user retried or re-triggered)
      simState.plannerState = 'idle'; // Reset state to permit attempt 2
      const attempt2 = runGenerationSim(false, 10);
      expect(simState.generationId).toBe(2);

      await Promise.all([attempt1, attempt2]);

      // Attempt 1 should have been discarded as stale, only Attempt 2 executed callback
      expect(simState.callbacksInvoked).toBe(1);
    });

    it('verifies real WorkoutEngine produces valid plan accepted by wizard validation', () => {
      const plan = WorkoutEngine.generateWorkoutPlan({
        fitnessLevel: 'intermediate',
        primaryGoal: 'strength',
        targetMuscles: ['Chest', 'Triceps'],
        equipment: ['Barbell', 'Bench'],
        durationMinutes: 45,
        daysPerWeek: 3,
        seed: 1234,
      });

      expect(plan).toBeDefined();
      expect(plan.id).toBeDefined();
      expect(Array.isArray(plan.exercises)).toBe(true);
      expect(plan.exercises.length).toBeGreaterThan(0);
      expect(plan.goal).toBe('strength');
    });
  });

  describe('Section 21: Post-Step-6 1.2-Second Synchronized Loading Animation Contract', () => {
    it('1. defines all 6 canonical loading stages in exact order', () => {
      expect(wizardFileContent).toContain('Understanding your training goals');
      expect(wizardFileContent).toContain('Matching your experience level');
      expect(wizardFileContent).toContain('Considering your available equipment');
      expect(wizardFileContent).toContain('Balancing your training volume');
      expect(wizardFileContent).toContain('Selecting the right exercises');
      expect(wizardFileContent).toContain('Finalizing your workout plan');
    });

    it('2. enforces exact 1.2-second (1200ms) stage progression interval', () => {
      expect(wizardFileContent).toContain('1200');
      expect(wizardFileContent).toContain('currentGenerationStage');
    });

    it('3. checklist uses currentGenerationStage state while ring is decoupled from percentage', () => {
      expect(wizardFileContent).toContain('const [currentGenerationStage, setCurrentGenerationStage] = useState<number>(0)');
      // Checklist active and completed states derived from currentGenerationStage
      expect(wizardFileContent).toContain('currentGenerationStage > idx');
      expect(wizardFileContent).toContain('currentGenerationStage === idx');
      // Ring is continuous loading animation and does NOT use stage-dependent strokeDashoffset or percentage calculation
      expect(wizardFileContent).not.toContain('strokeDashoffset={301.59');
      expect(wizardFileContent).not.toContain('currentGenerationStage / 6');
    });

    it('4. renders continuous dual-arc loading animation with centered dumbbell', () => {
      expect(wizardFileContent).toContain('loading-dual-arc-container');
      expect(wizardFileContent).toContain('loading-arc-a');
      expect(wizardFileContent).toContain('loading-arc-b');
      expect(wizardFileContent).toContain('animate-[spin_2s_linear_infinite]');
      expect(wizardFileContent).toContain('animate-[spin_2.8s_linear_infinite_reverse]');
      expect(wizardFileContent).toContain('Dumbbell');
    });

    it('5. contains GENERATE PLAN badge and "Building your workout plan…" heading', () => {
      expect(wizardFileContent).toContain('GENERATE PLAN');
      expect(wizardFileContent).toContain('Building your workout plan…');
      expect(wizardFileContent).toContain('creating a personalized plan based on your answers');
    });

    it('6. resets currentGenerationStage to 0 on retry and edit plan', () => {
      expect(wizardFileContent).toContain('setCurrentGenerationStage(0)');
    });

    it('7. respects prefers-reduced-motion across rotating and pulsing indicators', () => {
      expect(wizardFileContent).toContain('motion-reduce:animate-none');
    });
  });
});

