'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGoals } from '@/hooks/use-goals';
import { GoalCard } from './goal-card';
import { CreateGoalModal } from './create-goal-modal';
import { Target, Plus, Trophy, CheckCircle2, TrendingUp, ArrowLeft } from 'lucide-react';

export function GoalsView() {
  const { evaluatedGoals, loading, saveGoal, deleteGoal } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeGoals = evaluatedGoals.filter((g) => !g.isAchieved);
  const completedGoals = evaluatedGoals.filter((g) => g.isAchieved);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="text-xs text-slate-500 font-medium">Evaluating fitness goals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            title="Back to Home / Dashboard"
            aria-label="Back to Home / Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Fitness Goals</h1>
            <p className="text-xs text-slate-500">
              Set quantifiable milestones for volume, frequency, strength, and session completion.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          id="btn-create-goal"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <Plus className="h-4 w-4" />
          Set New Goal
        </button>
      </div>

      {/* Active Goals Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Active Targets ({activeGoals.length})</h2>
          </div>
        </div>

        {activeGoals.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((eg) => (
              <GoalCard key={eg.goal.id} evaluatedGoal={eg} onDelete={deleteGoal} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">No Active Goals Set</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Define a weekly frequency target, total volume goal, or strength benchmark to track your ongoing progress.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <Plus className="h-3.5 w-3.5" />
              Create First Goal
            </button>
          </div>
        )}
      </section>

      {/* Completed Milestones */}
      {completedGoals.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900">
              Achieved Milestones ({completedGoals.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((eg) => (
              <GoalCard key={eg.goal.id} evaluatedGoal={eg} onDelete={deleteGoal} />
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      <CreateGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={saveGoal}
      />
    </div>
  );
}
