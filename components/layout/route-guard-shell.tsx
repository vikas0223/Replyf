/**
 * Route Guard Shell for Deep Links (Part I & K)
 * 
 * Enforces access initialization before rendering protected routes:
 * /dashboard, /programs, /goals, /challenges, /exercises.
 * 
 * - While initializing: displays lightweight, hydration-safe loading skeleton.
 * - If unselected access or incomplete onboarding: redirects to "/app" to enforce
 *   the canonical Auth/Guest or Onboarding flow.
 * - If access is established and onboarding complete: renders children within
 *   the canonical content boundary (max-w-[1320px] mx-auto px-4 sm:px-6).
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useAuthGuard } from '@/contexts/auth-guard-context';

export interface RouteGuardShellProps {
  children: React.ReactNode;
}

export function RouteGuardShell({ children }: RouteGuardShellProps) {
  const router = useRouter();
  const { accessMode, onboardingState, status } = useAuthGuard();

  useEffect(() => {
    if (status === 'ready') {
      if (accessMode === 'unselected' || onboardingState === 'incomplete') {
        router.replace('/app');
      }
    }
  }, [status, accessMode, onboardingState, router]);

  // While initializing, render hydration-safe deterministic loading skeleton
  if (status === 'initializing') {
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

  // If ready but unauthorized / incomplete onboarding, hold render while redirect occurs
  if (accessMode === 'unselected' || onboardingState === 'incomplete') {
    return (
      <main className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 text-slate-800 min-h-screen flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          <span>Redirecting to Replyf entry gate...</span>
        </div>
      </main>
    );
  }

  // Access confirmed and onboarding complete: Render content inside canonical shell
  return (
    <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6">
      {children}
    </div>
  );
}
