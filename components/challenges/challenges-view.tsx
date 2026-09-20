'use client';

import React from 'react';
import Link from 'next/link';
import { useChallenges } from '@/hooks/use-challenges';
import { ChallengeCard } from './challenge-card';
import { Trophy, Flame, Sparkles, CheckCircle2, Layers, ArrowLeft } from 'lucide-react';

export function ChallengesView() {
  const { evaluatedChallenges, loading, joinChallenge, leaveChallenge } = useChallenges();

  const joinedChallenges = evaluatedChallenges.filter((ec) => ec.isJoined && !ec.isCompleted);
  const completedChallenges = evaluatedChallenges.filter((ec) => ec.isCompleted);
  const availableChallenges = evaluatedChallenges.filter((ec) => !ec.isJoined && !ec.isCompleted);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="text-xs text-slate-500 font-medium">Evaluating community challenges...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Community & Fitness Challenges</h1>
          <p className="text-xs text-slate-500">
            Join targeted training milestones to test your consistency, set volume, and workout streaks.
          </p>
        </div>
      </div>

      {/* Active Participations */}
      {joinedChallenges.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              My Active Challenges ({joinedChallenges.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {joinedChallenges.map((ec) => (
              <ChallengeCard
                key={ec.challenge.id}
                evaluated={ec}
                onJoin={joinChallenge}
                onLeave={leaveChallenge}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900">
              Completed Challenges ({completedChallenges.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedChallenges.map((ec) => (
              <ChallengeCard
                key={ec.challenge.id}
                evaluated={ec}
                onJoin={joinChallenge}
                onLeave={leaveChallenge}
              />
            ))}
          </div>
        </section>
      )}

      {/* Available Platform Challenges */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            Available Challenges ({availableChallenges.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableChallenges.map((ec) => (
            <ChallengeCard
              key={ec.challenge.id}
              evaluated={ec}
              onJoin={joinChallenge}
              onLeave={leaveChallenge}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
