/**
 * Main Application Entry Point & Canonical Route Guard
 *
 * Responsive header design:
 * - Mobile (< 768px): Compact header with logo + hamburger menu button.
 *   Navigation lives in a slide-in Sheet drawer.
 * - Desktop (≥ 768px): Full inline navigation with route links and account pill.
 *
 * Implements the required 2-factor state model:
 *   APP ENTRY → access selected? → onboarding done? → Workout Hub
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid, BarChart2, User, LogOut, Loader2, Menu } from 'lucide-react';
import { useAuthGuard } from '@/contexts/auth-guard-context';
import { AuthGuestScreen } from '@/components/auth/auth-guest-screen';
import { WelcomeScreen } from '@/components/auth/welcome-screen';
import { WorkoutWizard } from '@/components/workout/workout-wizard';
import { WorkoutHub } from '@/components/workout/workout-hub';
import { MobileNavDrawer } from '@/components/layout/mobile-nav-drawer';
import { GeneratedWorkout } from '@/types/domain';

export default function Home() {
  const {
    accessMode,
    onboardingState,
    status,
    isInitializing,
    userEmail,
    authTransition,
    completeAuthTransition,
    signOut,
    switchAccess,
    resetFlow,
  } = useAuthGuard();
  const [stagedPlan, setStagedPlan] = useState<GeneratedWorkout | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Production Root Entry: If accessed directly at root "/", redirect to "/landing"
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      window.location.replace('/landing');
    }
  }, []);

  // While checking local-first storage & Supabase session, show deterministic, hydration-safe skeleton
  if (status === 'initializing' || isInitializing) {
    return (
      <main className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 text-slate-800 min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl shadow-md shadow-indigo-200">
            <Image
              src="/icons/icon-192x192.png"
              alt="Replyf logo"
              width={48}
              height={48}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span>Initializing Replyf workspace...</span>
          </div>
        </div>
      </main>
    );
  }

  // Transient in-memory authentication welcome screen (user-controlled with Continue button)
  if (authTransition) {
    return (
      <WelcomeScreen
        kind={authTransition.kind}
        displayName={authTransition.displayName}
        onContinue={completeAuthTransition}
      />
    );
  }

  // Guard Branch 1: Access not selected -> Fresh user must see Auth / Guest screen
  if (accessMode === 'unselected') {
    return (
      <main className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 text-slate-800 min-h-screen flex items-center justify-center py-6 sm:py-10 px-4 sm:px-6">
        <div className="w-full max-w-[1320px] mx-auto flex items-center justify-center">
          <AuthGuestScreen />
        </div>
      </main>
    );
  }

  // Handle plan generated during onboarding
  const handleOnboardingWorkoutGenerated = (plan: GeneratedWorkout) => {
    setStagedPlan(plan);
  };

  // Guard Branch 2: Authenticated / Guest with Incomplete Onboarding -> Dedicated Header-Free Onboarding Shell
  if (onboardingState === 'incomplete') {
    return (
      <main className="bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 text-slate-800 min-h-screen flex flex-col items-center justify-center py-6 sm:py-10 px-4 sm:px-6">
        <div className="w-full max-w-[1320px] mx-auto flex flex-col items-center">
          <WorkoutWizard onWorkoutGenerated={handleOnboardingWorkoutGenerated} />
        </div>
      </main>
    );
  }

  // Guard Branch 3: Authenticated / Guest with Completed Onboarding -> Standard Application Shell
  return (
    <main className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 text-slate-800 min-h-screen">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 py-4 md:py-6 lg:py-10 space-y-5 md:space-y-6">

        {/* ======================================================
            HEADER — Responsive: Mobile + Desktop
            ====================================================== */}
        <header className="flex items-center justify-between h-[56px] md:h-auto p-3 md:p-4 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xs">

          {/* LEFT: Replyf logo + wordmark (always visible) */}
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 md:h-9 md:w-9 overflow-hidden rounded-xl shadow-sm shadow-indigo-200">
              <Image
                src="/icons/icon-192x192.png"
                alt="Replyf logo"
                width={36}
                height={36}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black text-slate-900 tracking-tight leading-tight">
                Replyf
              </h1>
              <p className="text-[10px] md:text-[11px] text-slate-500 font-medium hidden sm:block">
                Local-first fitness planning
              </p>
            </div>
          </div>

          {/* RIGHT MOBILE: Hamburger menu button (visible < md) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* RIGHT DESKTOP: Full inline navigation (hidden < md) */}
          <div className="hidden md:flex flex-wrap items-center gap-1.5 lg:gap-2">
            <Link
              href="/programs"
              className="min-h-[40px] text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100/80 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <span>Programs</span>
            </Link>
            <Link
              href="/goals"
              className="min-h-[40px] text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100/80 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <span>Goals</span>
            </Link>
            <Link
              href="/challenges"
              className="min-h-[40px] text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100/80 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <span>Challenges</span>
            </Link>
            <Link
              href="/exercises"
              aria-label="Exercises"
              className="min-h-[40px] text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100/80 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Exercises</span>
            </Link>
            <Link
              href="/dashboard"
              className="min-h-[40px] text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100/80 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            {/* Access Mode Pill / Sign Out (desktop only) */}
            <div className="ml-1 pl-1 lg:pl-2 border-l border-slate-200 flex items-center gap-1">
              {accessMode === 'authenticated' ? (
                <button
                  type="button"
                  onClick={signOut}
                  title={`Signed in as ${userEmail || 'user'}. Click to sign out.`}
                  className="min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  aria-label="Sign out"
                >
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden lg:inline max-w-[120px] truncate">{userEmail || 'Account'}</span>
                  <LogOut className="w-3 h-3 text-slate-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={switchAccess}
                  className="min-h-[36px] px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  title="Running in local Guest Mode. Click to sign in or switch account."
                  aria-label="Guest Mode. Click to sign in or switch account"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>Guest</span>
                  <span className="text-[10px] text-indigo-600 font-semibold ml-0.5 hover:underline">Switch</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <MobileNavDrawer
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          accessMode={accessMode}
          userEmail={userEmail}
          onSignOut={signOut}
          onResetFlow={resetFlow}
          onSwitchAccess={switchAccess}
        />

        {/* ======================================================
            CONTENT — Workout Hub (Onboarding complete)
            ====================================================== */}
        <WorkoutHub initialWorkout={stagedPlan} />
      </div>
    </main>
  );
}
