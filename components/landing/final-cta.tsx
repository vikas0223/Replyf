/**
 * Final Call to Action Section
 *
 * High-conversion CTA banner matching Image 1 Panel 11:
 * - Eyebrow: "READY FOR YOUR NEXT SET?"
 * - Headline: "Make your next workout count."
 * - Subheading: "Build it. Train it. Track it. Improve it."
 * - Primary CTA: "Start Training" (routes to /)
 * - Secondary CTA: "Install Replyf"
 * - Microcopy: "No account required to start · Free · Works offline"
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { InstallReplyfButton } from './install-replyf-button';

export function FinalCta() {
  return (
    <section className="relative w-full px-4 sm:px-6 py-20 md:py-28 bg-gradient-to-b from-white to-indigo-50/40 dark:from-slate-950 dark:to-indigo-950/20 border-t border-slate-200/60 dark:border-slate-800 overflow-hidden">
      <div className="mx-auto max-w-[900px] text-center space-y-6">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-400">
          <Zap className="w-3.5 h-3.5" />
          <span>READY FOR YOUR NEXT SET?</span>
        </div>

        {/* Main Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Make your next workout count.
        </h2>

        {/* Supporting Slogan */}
        <p className="text-lg sm:text-xl font-semibold text-slate-600 dark:text-slate-300 max-w-[620px] mx-auto">
          Build it. Train it. Track it. Improve it.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/app"
            className="min-h-[52px] w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-base font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-150 inline-flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <span>Start Training</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </Link>

          <InstallReplyfButton variant="secondary" size="lg" className="w-full sm:w-auto min-h-[52px]" />
        </div>

        {/* Microcopy Trust Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            No account required to start
          </span>
          <span>•</span>
          <span>Free</span>
          <span>•</span>
          <span>Works offline</span>
        </div>
      </div>
    </section>
  );
}
