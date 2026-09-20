'use client';

import React from 'react';
import Link from 'next/link';
import { usePrograms } from '@/hooks/use-programs';
import { ActiveProgramCard } from './active-program-card';
import { ProgramCatalogCard } from './program-catalog-card';
import { Plus, BookOpen, Layers, CheckCircle2, Play, Pause, Trash2, Calendar, ArrowLeft } from 'lucide-react';

export function ProgramsView() {
  const {
    programs,
    activeProgram,
    adherence,
    todaysDay,
    catalogPrograms,
    loading,
    adoptProgram,
    rescheduleDay,
    skipDay,
    setActive,
    pauseProgram,
    deleteProgram,
  } = usePrograms();

  const inactivePrograms = programs.filter((p) => p.id !== activeProgram?.id);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="text-xs text-slate-500 font-medium">Loading training programs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Navigation & Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            aria-label="Back to Home / Dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            title="Back to Home / Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Training Programs</h1>
            <p className="text-xs text-slate-500">
              Structured periodization cycles, multi-week progressions, and daily adherence tracking.
            </p>
          </div>
        </div>

        <Link
          href="/programs/builder"
          id="btn-create-program"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <Plus className="h-4 w-4" />
          Create Custom Program
        </Link>
      </div>

      {/* Active Program Section */}
      {activeProgram ? (
        <section className="space-y-3">
          <ActiveProgramCard
            program={activeProgram}
            adherence={adherence}
            todaysDay={todaysDay}
            onRescheduleDay={rescheduleDay}
            onSkipDay={skipDay}
            onPause={() => pauseProgram(activeProgram.id)}
          />
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-base font-bold text-slate-900">No Active Program Selected</h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            Adopt a battle-tested routine from the platform catalog below or design your own custom multi-week cycle to unlock automated scheduling.
          </p>
        </div>
      )}

      {/* Saved / Inactive Programs */}
      {inactivePrograms.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">My Other Saved Programs</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactivePrograms.map((prog) => (
              <div
                key={prog.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                      {prog.status}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {prog.weeks.length} Weeks
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-slate-900 line-clamp-1">
                    {prog.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {prog.description || 'Custom user training plan.'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <Link
                    href={`/programs/${prog.id}`}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    View Plan
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActive(prog.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/60 hover:bg-indigo-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Set Active
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this program?')) {
                          deleteProgram(prog.id);
                        }
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      title="Delete Program"
                      aria-label={`Delete ${prog.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Platform Program Catalog */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Platform Program Catalog</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {catalogPrograms.length} Curated Plans
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalogPrograms.map((catProg) => (
            <ProgramCatalogCard
              key={catProg.id}
              program={catProg}
              onAdopt={adoptProgram}
              isCurrentActive={activeProgram?.name === catProg.name}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
