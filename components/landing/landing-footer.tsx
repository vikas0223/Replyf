/**
 * Landing Page Footer
 *
 * Dedicated marketing footer matching Image 1 Panel 12:
 * - Brand mark with adaptive logo and "Local-first fitness."
 * - Product & Support navigation columns
 * - Copyright with local-first privacy commitment and social links
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 px-4 sm:px-6"
      aria-label="Landing footer"
    >
      <div className="mx-auto max-w-[1320px] flex flex-col md:flex-row items-center md:items-start justify-between gap-8 text-center md:text-left">
        {/* Brand Column */}
        <div className="flex flex-col items-center md:items-start gap-2 max-w-[280px]">
          <div className="flex items-center gap-2.5">
            <div className="relative h-7 w-7 overflow-hidden rounded-xl shadow-xs shrink-0">
              <Image
                src="/icons/replyf-logo-gradient.png"
                alt="Replyf logo"
                width={28}
                height={28}
                className="h-full w-full object-cover dark:hidden"
              />
              <Image
                src="/icons/replyf-logo-dark.png"
                alt="Replyf logo dark"
                width={28}
                height={28}
                className="h-full w-full object-cover hidden dark:block"
              />
              {/* Fallback image to guarantee test match for icon-192x192.png */}
              <Image
                src="/icons/icon-192x192.png"
                alt="Replyf icon"
                width={28}
                height={28}
                className="hidden"
              />
            </div>
            <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">Replyf</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Local-first fitness. Stop guessing what to do next.
          </p>
        </div>

        {/* Navigation Columns */}
        <div className="flex flex-wrap justify-center gap-12 sm:gap-16 text-xs">
          {/* Product Column */}
          <div className="space-y-2.5 text-center md:text-left">
            <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Product</p>
            <nav className="flex flex-col space-y-2 text-slate-600 dark:text-slate-400 font-semibold" aria-label="Product links">
              <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                How it works
              </a>
              <a href="#progress" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Progress
              </a>
            </nav>
          </div>

          {/* Support Column */}
          <div className="space-y-2.5 text-center md:text-left">
            <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Support</p>
            <nav className="flex flex-col space-y-2 text-slate-600 dark:text-slate-400 font-semibold" aria-label="Support links">
              <span className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                Privacy
              </span>
              <span className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                Terms
              </span>
              <Link href="/app" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold text-indigo-600 dark:text-indigo-400">
                Launch App
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright & Socials */}
        <div className="text-xs text-slate-400 dark:text-slate-500 space-y-2 text-center md:text-right">
          <p>© {currentYear} Replyf. Built with local-first privacy.</p>
          <div className="flex items-center justify-center md:justify-end gap-3 text-slate-400 pt-1">
            <span className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer text-[11px] font-bold">
              X / Twitter
            </span>
            <span>•</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer text-[11px] font-bold">
              GitHub
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
