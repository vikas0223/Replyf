/**
 * Workout Hub Container Component
 * 
 * Top-level coordinator managing the workout lifecycle:
 * - Wizard (Deterministic Generation)
 * - Review (Generated Plan Overview)
 * - Builder (Manual creation & Generated plan editing)
 * - Session (Live set-by-set execution)
 * - Completion (Summary & Feedback)
 * - Saved (Offline Templates Library)
 * 
 * Supports session reconstruction across browser refresh and offline execution.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  GeneratedWorkout,
  WorkoutTemplate,
  WorkoutSession,
  WorkoutFeedback,
} from '@/types/domain';
import {
  WorkoutDraft,
  generatedWorkoutToDraft,
  templateToDraft,
  createEmptyWorkoutDraft,
  draftToWorkoutTemplate,
} from '@/lib/domain/workout-draft';
import { WorkoutWizard } from './workout-wizard';
import { WorkoutReview } from './workout-review';
import { WorkoutBuilder } from './workout-builder';
import { WorkoutSessionView } from './workout-session-view';
import { WorkoutCompletionView } from './workout-completion-view';
import { SavedWorkoutsList } from './saved-workouts-list';
import { SessionCommandService } from '@/features/workout-session/session-command-service';
import { LocalWorkoutRepository } from '@/lib/repositories/local/local-workout-repository';
import { LocalCompletionRepository } from '@/lib/repositories/local/local-completion-repository';
import { LocalGoalRepository } from '@/lib/repositories/local/local-goal-repository';
import { ProgressInvalidationBus } from '@/lib/events/progress-invalidation-bus';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Pencil,
  Bookmark,
  Flame,
  Check,
  Target,
  ArrowRight,
  X,
} from 'lucide-react';
import { generateId } from '@/lib/utils/id';
import { useRecommendations } from '@/hooks/use-recommendations';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { useRouter } from 'next/navigation';
import { DeterministicRecommendation } from '@/lib/domain/recommendations';

export type WorkoutHubView =
  | 'wizard'
  | 'review'
  | 'builder'
  | 'session'
  | 'completed'
  | 'saved';

export interface WorkoutHubProps {
  initialView?: WorkoutHubView;
  initialWorkout?: GeneratedWorkout | null;
}

export function WorkoutHub({ initialView, initialWorkout = null }: WorkoutHubProps = {}) {
  const router = useRouter();
  const [sessionService] = useState(() => new SessionCommandService());
  const [workoutRepo] = useState(() => new LocalWorkoutRepository());
  const [completionRepo] = useState(() => new LocalCompletionRepository());

  const {
    primaryRecommendation,
    dismissRecommendation,
    acceptRecommendation,
  } = useRecommendations({ limit: 1 });

  const [activeView, setActiveView] = useState<WorkoutHubView>(
    initialView || (initialWorkout ? 'review' : 'saved')
  );
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(initialWorkout);
  const [workoutDraft, setWorkoutDraft] = useState<WorkoutDraft | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [completedSession, setCompletedSession] = useState<WorkoutSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showWeeklyBanner, setShowWeeklyBanner] = useState<boolean>(true);
  const [completedThisWeek, setCompletedThisWeek] = useState<number>(0);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(3);

  // Derive completed and remaining sessions dynamically from weekly goal and session completion data
  useEffect(() => {
    let isCancelled = false;

    async function loadWeeklyProgress() {
      try {
        const [allGoals, allSessions] = await Promise.all([
          new LocalGoalRepository().listGoals(),
          completionRepo.listSessions({ status: 'completed' }),
        ]);
        if (isCancelled) return;

        // Find active weekly goal if any
        const freqGoal = allGoals.find(
          (g) => (g.type === 'frequency' || g.type === 'workouts_completed') && g.status === 'active'
        );
        const target = freqGoal?.targetValue ?? 3;
        setWeeklyTarget(target);

        // Count completed sessions in the current calendar week (Monday to Sunday)
        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = (currentDay + 6) % 7;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const count = allSessions.filter((s) => {
          if (s.status !== 'completed') return false;
          const d = new Date(s.completedAt || s.startedAt || 0);
          return d >= startOfWeek && d <= now;
        }).length;

        setCompletedThisWeek(count);
      } catch (err) {
        console.warn('Failed to load weekly progress in WorkoutHub:', err);
      }
    }

    loadWeeklyProgress();

    const bus = ProgressInvalidationBus.getInstance();
    const unsubscribe = bus.subscribe((e) => {
      if (e.type === 'session_changed' || e.type === 'goal_changed') {
        loadWeeklyProgress();
      }
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [completionRepo, completedSession]);

  const remainingSessions = Math.max(0, weeklyTarget - completedThisWeek);

  // Synchronize generated workout and switch to review view immediately when initialWorkout arrives
  useEffect(() => {
    if (initialWorkout) {
      setGeneratedWorkout(initialWorkout);
      setActiveView('review');
    } else if (initialView) {
      setActiveView(initialView);
    }
  }, [initialWorkout, initialView]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyRecommendation = async (rec: DeterministicRecommendation) => {
    await acceptRecommendation(rec);
    if (rec.actionPayload.navigationTarget) {
      router.push(rec.actionPayload.navigationTarget);
    } else if (rec.actionPayload.type === 'start_program_day' && rec.actionPayload.programId) {
      router.push(`/programs/${rec.actionPayload.programId}`);
    } else if (rec.actionPayload.type === 'view_goal') {
      router.push('/goals');
    } else {
      setActiveView('wizard');
    }
  };

  // Reconstruct active session on mount if one is in progress
  useEffect(() => {
    async function checkActiveSession() {
      try {
        const active = await sessionService.getActiveSession('guest_user');
        if (active && active.status === 'active') {
          setActiveSessionId(active.id);
          setActiveView('session');
        }
      } catch (err) {
        console.warn('Failed to check active session on mount:', err);
      }
    }
    checkActiveSession();
  }, [sessionService]);

  // 1. Wizard -> Generation complete
  const handleWorkoutGenerated = (workout: GeneratedWorkout) => {
    setGeneratedWorkout(workout);
    setActiveView('review');
  };

  // 2. Review -> Start Generated Workout
  const handleStartFromGenerated = async (workout: GeneratedWorkout) => {
    try {
      const session = await sessionService.startSession({
        name: workout.name,
        workout,
        userId: 'guest_user',
      });

      setActiveSessionId(session.id);
      setActiveView('session');
      showToast(`Started "${workout.name}"`);
    } catch (err: any) {
      console.error('Failed to start session from generated workout:', err);
      showToast(err?.message || 'Failed to start workout');
    }
  };

  // 3. Review -> Edit in Builder
  const handleEditFromGenerated = (workout: GeneratedWorkout) => {
    const draft = generatedWorkoutToDraft(workout);
    setWorkoutDraft(draft);
    setActiveView('builder');
  };

  // 4. Review / Builder -> Save as Template
  const handleSaveTemplate = async (template: WorkoutTemplate) => {
    setIsSaving(true);
    try {
      await workoutRepo.saveTemplate(template);
      setIsSaving(false);
      showToast(`Saved "${template.name}" template to your library`);
      setActiveView('saved');
    } catch (err: any) {
      setIsSaving(false);
      console.error('Failed to save template:', err);
      showToast('Failed to save workout template');
    }
  };

  // 5. Builder -> Start Workout from Draft
  const handleStartFromDraft = async (draft: WorkoutDraft) => {
    try {
      const template = draftToWorkoutTemplate(draft, 'guest_user');
      const session = await sessionService.startSession({
        name: draft.name,
        workout: template,
        templateId: template.id,
        userId: 'guest_user',
      });

      setActiveSessionId(session.id);
      setActiveView('session');
      showToast(`Started "${draft.name}"`);
    } catch (err: any) {
      console.error('Failed to start session from draft:', err);
      showToast(err?.message || 'Failed to start workout');
    }
  };

  // 6. Saved -> Start Workout from Template
  const handleStartFromTemplate = async (template: WorkoutTemplate) => {
    // Stage template in review view so user can inspect adaptive calibrations
    setGeneratedWorkout(template as any);
    setActiveView('review');
  };

  // 7. Saved -> Edit Template
  const handleEditTemplate = (template: WorkoutTemplate) => {
    const draft = templateToDraft(template);
    setWorkoutDraft(draft);
    setActiveView('builder');
  };

  // 8. Session -> Session Complete
  const handleSessionCompleted = (session: WorkoutSession) => {
    setCompletedSession(session);
    setActiveSessionId(null);
    setActiveView('completed');
  };

  // 9. Completion -> Submit Feedback
  const handleSubmitFeedback = async (
    feedbackData: {
      rating: number;
      difficulty: 'too_easy' | 'just_right' | 'too_hard';
      tags: string[];
      notes?: string;
    }
  ) => {
    if (!completedSession) return;
    const now = new Date().toISOString();
    const feedback: WorkoutFeedback = {
      id: generateId(),
      sessionId: completedSession.id,
      rating: feedbackData.rating,
      perceivedDifficulty: feedbackData.difficulty,
      difficulty: feedbackData.difficulty,
      tags: feedbackData.tags,
      notes: feedbackData.notes,
      comments: feedbackData.notes,
      createdAt: now,
    };

    await completionRepo.saveFeedback(feedback);
    showToast('Feedback recorded. Great workout!');
  };

  // 10. Completion -> Save Completed as Template
  const handleSaveCompletedAsTemplate = async (session: WorkoutSession) => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const template: WorkoutTemplate = {
        id: generateId(),
        userId: 'guest_user',
        name: `${session.name} (Template)`,
        goal: 'hypertrophy',
        difficulty: 'intermediate',
        duration: session.durationMinutes || 45,
        targetMuscles: ['Full Body'],
        equipment: ['Dumbbells', 'Bodyweight'],
        exercises: session.exercises.map((ex, idx) => ({
          id: generateId(),
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: ex.plannedSets || 3,
          reps: String(ex.plannedReps || '8-12'),
          rest: ex.plannedRestSeconds ? `${ex.plannedRestSeconds}s` : '90s',
          targetMuscles: ['Full Body'],
          equipment: ['Dumbbells'],
          order: idx,
        })),
        isFavorite: false,
        isCustom: true,
        createdAt: now,
        updatedAt: now,
      };

      await workoutRepo.saveTemplate(template);
      setIsSaving(false);
      showToast(`Saved "${template.name}" as template`);
    } catch (err) {
      setIsSaving(false);
      console.error('Failed to save completed session as template:', err);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs text-white shadow-xl animate-in slide-in-from-bottom-3 duration-300"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Contextual Recommendation Banner */}
      {primaryRecommendation && activeView !== 'session' && activeView !== 'completed' && (
        <RecommendationCard
          recommendation={primaryRecommendation}
          onApply={handleApplyRecommendation}
          onDismiss={dismissRecommendation}
          compact
        />
      )}

      {/* Weekly Goal Progress Banner */}
      {!primaryRecommendation && showWeeklyBanner && activeView !== 'session' && activeView !== 'completed' && (
        <div className="flex items-center justify-between p-3 sm:p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs flex-wrap sm:flex-nowrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
              <Target className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Weekly Goal: {remainingSessions} {remainingSessions === 1 ? 'Session' : 'Sessions'} to Go
                </span>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  High Confidence
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                You&apos;ve completed {completedThisWeek} of {weeklyTarget} {weeklyTarget === 1 ? 'workout' : 'workouts'} this week. Let&apos;s build a plan that keeps you on track.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              size="sm"
              onClick={() => setActiveView('wizard')}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
            >
              <span>Take Action</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <button
              type="button"
              onClick={() => setShowWeeklyBanner(false)}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Hub Navigation Bar */}
      <div className="flex items-center justify-between p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveView('wizard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'wizard' || activeView === 'review'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Plan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkoutDraft(createEmptyWorkoutDraft());
              setActiveView('builder');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'builder'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Custom Builder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('saved')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'saved'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Routines</span>
          </button>
        </div>

        {/* Active Session Indicator Button */}
        {activeSessionId && (
          <Button
            type="button"
            size="sm"
            onClick={() => setActiveView('session')}
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            <Flame className="w-3.5 h-3.5 mr-1 text-amber-300" />
            Resume Active Workout
          </Button>
        )}
      </div>

      {/* Main Hub View Router */}
      <div className="min-h-[400px]">
        {activeView === 'wizard' && (
          <WorkoutWizard
            onWorkoutGenerated={handleWorkoutGenerated}
            onCancel={() => setActiveView('saved')}
          />
        )}

        {activeView === 'review' && generatedWorkout && (
          <WorkoutReview
            workout={generatedWorkout}
            onStart={handleStartFromGenerated}
            onEdit={handleEditFromGenerated}
            onSaveTemplate={(gw) => {
              const draft = generatedWorkoutToDraft(gw);
              const tpl = templateToDraft(draft as any);
              handleSaveTemplate(tpl as any);
            }}
            onRegenerate={() => setActiveView('wizard')}
            isSaving={isSaving}
          />
        )}

        {activeView === 'builder' && (
          <WorkoutBuilder
            initialDraft={workoutDraft || createEmptyWorkoutDraft()}
            onSaveTemplate={handleSaveTemplate}
            onStartSession={handleStartFromDraft}
            onCancel={() => setActiveView('saved')}
            isSaving={isSaving}
          />
        )}

        {activeView === 'session' && (
          <WorkoutSessionView
            initialSessionId={activeSessionId || undefined}
            onSessionCompleted={handleSessionCompleted}
            onAbandon={() => {
              setActiveSessionId(null);
              setActiveView('saved');
            }}
          />
        )}

        {activeView === 'completed' && completedSession && (
          <WorkoutCompletionView
            session={completedSession}
            onSubmitFeedback={handleSubmitFeedback}
            onSaveAsTemplate={handleSaveCompletedAsTemplate}
            onReturnHome={() => setActiveView('saved')}
            isSavingTemplate={isSaving}
          />
        )}

        {activeView === 'saved' && (
          <SavedWorkoutsList
            onStartWorkout={handleStartFromTemplate}
            onEditWorkout={handleEditTemplate}
            onCreateNew={() => {
              setWorkoutDraft(createEmptyWorkoutDraft());
              setActiveView('builder');
            }}
            onGenerateNew={() => setActiveView('wizard')}
          />
        )}
      </div>
    </div>
  );
}
