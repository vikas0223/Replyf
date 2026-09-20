/**
 * Routine Builder Showcase Section (Flexibility — Generator vs Builder)
 *
 * Demonstrates Replyf's dual flexibility:
 * - Heading: "Train your way."
 * - Description: "Generate a structured workout in seconds or build every detail yourself."
 * - Option A: Workout Generator (Try Generator →)
 * - Option B: Custom Builder (Build Custom →)
 */

'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Sliders,
  ArrowRight,
  Check,
  Dumbbell,
  Calendar,
  Target,
  Plus,
  Timer,
  Layers,
} from 'lucide-react';

export function RoutineBuilderShowcase() {
  return (
    <section
      id="how-it-works"
      className="relative w-full px-4 sm:px-6 py-16 md:py-24 scroll-mt-24 border-b border-slate-200/60 dark:border-slate-800"
      aria-label="How it Works"
    >
      <div className="mx-auto max-w-[1320px]">
        {/* Section Header */}
        <div className="text-center max-w-[680px] mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 block">
            Flexible Workout Creation
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Train your way.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
            Generate a structured workout in seconds or build every detail yourself.
          </p>
        </div>

        {/* 2 High-Fidelity Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1100px] mx-auto">
          {/* =========================================================================
              Option A: Workout Generator
          ========================================================================= */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Option A</span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Workout Generator</h3>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Start with a goal, schedule, experience level, and equipment. Replyf creates the structure.
              </p>

              {/* Realistic Phone Mini Mockup */}
              <div className="mx-auto w-full max-w-[280px] rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 mb-6 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white text-[11px]">Generate Workout</span>
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold">Fast Setup</span>
                </div>

                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between items-center p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <span className="text-slate-500">Goal</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Muscle Growth</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <span className="text-slate-500">Schedule</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">4 days / week</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <span className="text-slate-500">Equipment</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Full Gym</span>
                  </div>
                </div>

                <div className="w-full py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-center text-[10px]">
                  Build Workout
                </div>
              </div>
            </div>

            <Link
              href="/app"
              className="min-h-[44px] w-full rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span>Try Generator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* =========================================================================
              Option B: Custom Builder
          ========================================================================= */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Option B</span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Custom Builder</h3>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Choose exercises, configure sets and reps, organize the workout, and build it manually.
              </p>

              {/* Realistic Phone Mini Mockup */}
              <div className="mx-auto w-full max-w-[280px] rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 mb-6 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white text-[11px]">Custom Workout</span>
                  <span className="text-[9px] text-emerald-600 font-bold">Manual Control</span>
                </div>

                <div className="space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                      <Plus className="w-3 h-3 text-indigo-600" />
                      Add Exercise
                    </span>
                    <span className="text-slate-400">1,400+ Catalog</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                      <Timer className="w-3 h-3 text-indigo-600" />
                      Rest Timer
                    </span>
                    <span className="text-slate-400">Custom thresholds</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                      <Layers className="w-3 h-3 text-indigo-600" />
                      Organize
                    </span>
                    <span className="text-slate-400">Supersets & Order</span>
                  </div>
                </div>

                <div className="w-full py-1.5 rounded-lg bg-slate-900 text-white font-bold text-center text-[10px]">
                  Save Custom Workout
                </div>
              </div>
            </div>

            <Link
              href="/app"
              className="min-h-[44px] w-full rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Build Custom</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Global CTA bridge */}
        <div className="text-center mt-10">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
          >
            <span>Build your first workout in Replyf →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
