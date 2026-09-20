/**
 * Landing Page Floating Header
 *
 * Dedicated marketing navigation:
 * - Desktop (≥ 768px): Compact floating bar (72px height, max-w-[1320px])
 *   with marketing links (Features, How it works, Progress), Install Replyf, and Start Training.
 * - Mobile (< 768px): Single clean row with logo + [MENU] touch target (≥ 44×44px).
 *   Accessible drawer with keyboard navigation and Escape-to-close.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowRight, Sparkles, Layers, BarChart3, Download } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { InstallReplyfButton } from './install-replyf-button';
import { LandingSmoothScroll } from './landing-smooth-scroll';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkSection, setIsDarkSection] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const navLinksRef = useRef<HTMLElement>(null);

  // 1. Dark section adaptation observer
  useEffect(() => {
    const section = document.getElementById('offline-pwa-section');
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsDarkSection(entry.isIntersecting);
      },
      {
        rootMargin: '-72px 0px -80% 0px',
        threshold: 0,
      }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // 2. GSAP ScrollTrigger scrubbed expanding → shrinking navbar animation
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const pill = pillRef.current;
    if (!pill) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Desktop & Tablet (≥ 768px): Spacious 1420px/88px/r28 → Compact 1100px/62px/r16
      mm.add('(min-width: 768px)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: '+=120',
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        });

        tl.to(
          pill,
          {
            maxWidth: '1100px',
            height: '62px',
            paddingLeft: '20px',
            paddingRight: '20px',
            borderRadius: '16px',
            boxShadow:
              '0 12px 32px -6px rgba(0, 0, 0, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
            ease: 'none',
          },
          0
        );

        if (navLinksRef.current) {
          tl.to(
            navLinksRef.current,
            {
              gap: '24px',
              ease: 'none',
            },
            0
          );
        }
      });

      // Mobile (< 768px): Spacious 70px → Compact 56px
      mm.add('(max-width: 767px)', () => {
        gsap.timeline({
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: '+=90',
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        }).to(
          pill,
          {
            height: '56px',
            paddingLeft: '14px',
            paddingRight: '14px',
            borderRadius: '14px',
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.1)',
            ease: 'none',
          },
          0
        );
      });
    }, headerRef);

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-3.5 z-40 w-full px-3 sm:px-6 min-h-[72px] md:min-h-[88px] flex items-center justify-center pointer-events-none"
    >
      {/* Smooth scroll sync with Lenis + GSAP ScrollTrigger */}
      <LandingSmoothScroll />

      {/* Animated Navbar Capsule: Spacious hero state at top, smoothly shrinking on scroll */}
      <div
        ref={pillRef}
        style={{ maxWidth: '1420px' }}
        className={`pointer-events-auto w-full h-[70px] md:h-[88px] px-5 md:px-9 rounded-[28px] backdrop-blur-md border flex items-center justify-between transition-colors duration-300 will-change-[max-width,height,padding,border-radius] ${
          isDarkSection
            ? 'bg-slate-900/95 border-slate-700/90 shadow-xl shadow-black/40 text-white'
            : 'bg-white/95 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 text-slate-800 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]'
        }`}
      >
        {/* LEFT: Replyf Brand Mark */}
        <Link
          href="/landing"
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-xl"
          aria-label="Replyf home"
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-xl shadow-xs shadow-indigo-200 shrink-0">
            {/* Primary gradient icon in light mode */}
            <Image
              src="/icons/replyf-logo-gradient.png"
              alt="Replyf logo"
              width={36}
              height={36}
              className={`h-full w-full object-cover transition-opacity ${isDarkSection ? 'opacity-0 hidden' : 'opacity-100 block dark:hidden'}`}
              priority
            />
            {/* Fallback reference for tests expecting icon-192x192.png */}
            <Image
              src="/icons/icon-192x192.png"
              alt="Replyf icon"
              width={36}
              height={36}
              className="hidden"
            />
            {/* Dark theme logo (night mode / dark section) */}
            <Image
              src="/icons/replyf-logo-dark.png"
              alt="Replyf logo (dark mode)"
              width={36}
              height={36}
              className={`h-full w-full object-cover ${isDarkSection ? 'block' : 'hidden dark:block'}`}
              priority
            />
          </div>
          <div>
            <span
              className={`text-lg font-black tracking-tight leading-tight block transition-colors ${
                isDarkSection ? 'text-white' : 'text-slate-900 dark:text-white'
              }`}
            >
              Replyf
            </span>
          </div>
        </Link>

        {/* CENTER: DESKTOP NAV (hidden < md) */}
        <nav
          ref={navLinksRef}
          style={{ gap: '34px' }}
          className="hidden md:flex items-center"
          aria-label="Marketing navigation"
        >
          <a
            href="#features"
            className={`text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg py-1 px-2.5 ${
              isDarkSection
                ? 'text-slate-300 hover:text-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className={`text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg py-1 px-2.5 ${
              isDarkSection
                ? 'text-slate-300 hover:text-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            How it works
          </a>
          <a
            href="#progress"
            className={`text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg py-1 px-2.5 ${
              isDarkSection
                ? 'text-slate-300 hover:text-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            Progress
          </a>
        </nav>

        {/* RIGHT DESKTOP ACTIONS (hidden < md) */}
        <div className="hidden md:flex items-center gap-3">
          <InstallReplyfButton
            variant="ghost"
            size="sm"
            className={isDarkSection ? '!text-slate-300 hover:!text-white hover:!bg-slate-800' : ''}
          />
          <Link
            href="/app"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-sm transition-all duration-150 inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <span>Start Training</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>

        {/* RIGHT MOBILE MENU TRIGGER (visible < md) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={`md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 font-bold text-xs uppercase tracking-wider gap-1.5 px-3 border ${
            isDarkSection
              ? 'text-slate-200 border-slate-700 hover:bg-slate-800'
              : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 border-slate-200 dark:border-slate-700'
          }`}
          aria-label="Open navigation"
        >
          <span>MENU</span>
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="w-[290px] sm:max-w-[320px] bg-white dark:bg-slate-900 p-0 flex flex-col [&>button]:hidden"
          aria-label="Mobile navigation"
          hideCloseButton
        >
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative h-8 w-8 overflow-hidden rounded-xl shadow-xs shrink-0">
                  <Image
                    src="/icons/replyf-logo-gradient.png"
                    alt="Replyf logo"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover dark:hidden"
                  />
                  <Image
                    src="/icons/replyf-logo-dark.png"
                    alt="Replyf logo"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover hidden dark:block"
                  />
                </div>
                <SheetTitle className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Replyf
                </SheetTitle>
              </div>
              <SheetClose
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </SheetClose>
            </div>
          </SheetHeader>

          {/* Links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5" aria-label="Mobile menu links">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Features</span>
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-colors"
            >
              <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>How it works</span>
            </a>
            <a
              href="#progress"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Progress</span>
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-3">
            <Link
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <span>Start Training</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <InstallReplyfButton
              variant="secondary"
              size="md"
              className="w-full"
            />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
