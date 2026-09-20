/**
 * Automated Test Suite: Replyf Pre-Login Hero & Features Landing Page
 * 
 * Tests compliance with:
 * - Product positioning & copywriting contracts (Parts 1, 4, 5, 11, 25, 26, 27, 33)
 * - Navigation anchors & primary CTA conversion routing (Parts 2, 3, 6, 45, 46, 47)
 * - Mobile responsive drawer & accessibility semantics (Parts 3, 9, 25, 42, 43)
 * - PWA installation copy & guidance modal (Parts 19, 20, 27, 28, 30, 31)
 * - Separation from authenticated Workout Hub (Parts 2, 3, 53)
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { LANDING_FEATURES } from '../lib/landing/landing-features';

describe('Replyf Pre-Login Landing Page — Technical Specification Verification', () => {
  const landingPageFile = fs.readFileSync(
    path.resolve(__dirname, '../app/landing/page.tsx'),
    'utf-8'
  );
  const heroSectionFile = fs.readFileSync(
    path.resolve(__dirname, '../components/landing/hero-section.tsx'),
    'utf-8'
  );
  const landingHeaderFile = fs.readFileSync(
    path.resolve(__dirname, '../components/landing/landing-header.tsx'),
    'utf-8'
  );
  const featureStoryFile = fs.readFileSync(
    path.resolve(__dirname, '../components/landing/feature-story.tsx'),
    'utf-8'
  );
  const progressShowcaseFile = fs.readFileSync(
    path.resolve(__dirname, '../components/landing/progress-showcase.tsx'),
    'utf-8'
  );
  const routineBuilderFile = fs.readFileSync(
    path.resolve(__dirname, '../components/landing/routine-builder-showcase.tsx'),
    'utf-8'
  );
  const offlinePwaFile = fs.readFileSync(
    path.resolve(__dirname, '../components/landing/offline-pwa-section.tsx'),
    'utf-8'
  );
  const finalCtaFile = fs.readFileSync(
    path.resolve(__dirname, '../components/landing/final-cta.tsx'),
    'utf-8'
  );
  const landingFooterFile = fs.readFileSync(
    path.resolve(__dirname, '../components/landing/landing-footer.tsx'),
    'utf-8'
  );
  const authGuestFile = fs.readFileSync(
    path.resolve(__dirname, '../components/auth/auth-guest-screen.tsx'),
    'utf-8'
  );

  describe('1. Copywriting & Positioning Contracts (Parts 1, 4, 5, 11, 25, 26, 27, 33)', () => {
    it('hero section contains the approved headline and positioning copy', () => {
      expect(heroSectionFile).toContain('Stop guessing what to do next.');
      expect(heroSectionFile).toContain(
        'Build workouts in seconds, log every set, and turn your training history into clear next steps — all in one fast, local-first fitness app.'
      );
      expect(heroSectionFile).toContain('Plans adapt to your training, not the other way around.');
      expect(heroSectionFile).toContain('Local-first fitness');
    });

    it('defines exactly four feature chapters in correct order (Plan, Train, Track, Improve)', () => {
      expect(LANDING_FEATURES).toHaveLength(4);
      expect(LANDING_FEATURES.map((f) => f.id)).toEqual(['plan', 'train', 'track', 'improve']);
      expect(LANDING_FEATURES[0].title).toBe('Start with a workout that fits you.');
      expect(LANDING_FEATURES[1].title).toBe('Log every set without breaking your flow.');
      expect(LANDING_FEATURES[2].title).toBe('Turn workouts into progress.');
      expect(LANDING_FEATURES[3].title).toBe('Know what to do next.');
    });

    it('progress section contains the exact required headline and labeled snapshot notice', () => {
      expect(progressShowcaseFile).toContain('Your training history becomes useful.');
      expect(progressShowcaseFile).toContain("See the work you&apos;ve done, the progress you&apos;ve made, and where your next improvement can come from.");
      expect(progressShowcaseFile).toContain('Example training snapshot');
      expect(progressShowcaseFile).toContain('12');
      expect(progressShowcaseFile).toContain('+18%');
      expect(progressShowcaseFile).toContain('4 PRs');
      expect(progressShowcaseFile).toContain('86%');
    });

    it('routine builder section shows Workout Generator and Custom Builder options', () => {
      expect(routineBuilderFile).toContain('Train your way.');
      expect(routineBuilderFile).toContain('Generate a structured workout in seconds or build every detail yourself.');
      expect(routineBuilderFile).toContain('Workout Generator');
      expect(routineBuilderFile).toContain('Custom Builder');
      // Must not falsely claim to be an AI generator in consumer copy
      expect(routineBuilderFile).not.toContain('AI / Algorithmic Generator');
    });

    it('offline PWA section communicates offline training without internal jargon like IndexedDB', () => {
      expect(offlinePwaFile).toContain('No signal? Keep training.');
      expect(offlinePwaFile).toContain('Gym basements and spotty Wi-Fi');
      expect(offlinePwaFile).toContain('hold your session back.');
      expect(offlinePwaFile).toContain('Saved locally');
      // Must not expose internal storage engine names to normal users
      expect(offlinePwaFile).not.toContain('IndexedDB');
    });

    it('final CTA contains the approved kicker and conversion action', () => {
      expect(finalCtaFile).toContain('Make your next workout count.');
      expect(finalCtaFile).toContain('Build it. Train it. Track it. Improve it.');
      expect(finalCtaFile).toContain('Start Training');
    });
  });

  describe('2. Navigation, Anchors & Conversion Funnel (Parts 2, 8, 9, 33, 46)', () => {
    it('landing header contains explicit anchors: #features, #how-it-works, #progress', () => {
      expect(landingHeaderFile).toContain('href="#features"');
      expect(landingHeaderFile).toContain('href="#how-it-works"');
      expect(landingHeaderFile).toContain('href="#progress"');
    });

    it('sections have matching id tags for smooth scrolling', () => {
      expect(featureStoryFile).toContain('id="features"');
      expect(routineBuilderFile).toContain('id="how-it-works"');
      expect(progressShowcaseFile).toContain('id="progress"');
    });

    it('primary conversion CTAs route to application entry "/app", never directly to /onboarding', () => {
      // In hero section
      expect(heroSectionFile).toContain('href="/app"');
      expect(heroSectionFile).not.toContain('href="/onboarding"');

      // In landing header
      expect(landingHeaderFile).toContain('href="/app"');
      expect(landingHeaderFile).not.toContain('href="/onboarding"');

      // In final CTA
      expect(finalCtaFile).toContain('href="/app"');
      expect(finalCtaFile).not.toContain('href="/onboarding"');
    });

    it('AuthGuestScreen provides a discoverability bridge linking to /landing', () => {
      expect(authGuestFile).toContain('href="/landing"');
      expect(authGuestFile).toContain('Explore features & how Replyf works');
    });
  });

  describe('3. Mobile Responsive & Accessibility Semantics (Parts 3, 9, 18, 42, 43)', () => {
    it('landing header hides desktop nav at mobile breakpoints and provides accessible hamburger button', () => {
      expect(landingHeaderFile).toContain('hidden md:flex');
      expect(landingHeaderFile).toContain('md:hidden');
      expect(landingHeaderFile).toContain('aria-label="Open navigation"');
      expect(landingHeaderFile).toContain('min-h-[44px] min-w-[44px]');
      expect(landingHeaderFile).toContain('aria-label="Close navigation"');
    });

    it('mobile feature story avoids sticky locking and renders clean stacked cards on small screens', () => {
      expect(featureStoryFile).toContain('hidden lg:grid');
      expect(featureStoryFile).toContain('lg:hidden space-y-12');
    });

    it('interactive buttons meet minimum 44px touch target guidelines', () => {
      expect(heroSectionFile).toContain('min-h-[48px]');
      expect(landingHeaderFile).toContain('min-h-[44px]');
      expect(finalCtaFile).toContain('min-h-[52px]');
    });

    it('semantic elements used appropriately (header, nav, main, section, footer)', () => {
      expect(landingPageFile).toContain('<main');
      expect(landingHeaderFile).toContain('<header');
      expect(landingHeaderFile).toContain('<nav');
      expect(landingFooterFile).toContain('<footer');
      expect(featureStoryFile).toContain('<section');
    });
  });

  describe('4. PWA Installation Integration (Parts 19, 20, 27, 28, 30, 31)', () => {
    it('uses "Install Replyf" copy rather than technical "Install as PWA"', () => {
      expect(heroSectionFile).toContain('Install Replyf');
      expect(offlinePwaFile).toContain('Install Replyf');
      expect(heroSectionFile).not.toContain('Install as PWA');
      expect(heroSectionFile).not.toContain('Install PWA');
      expect(offlinePwaFile).not.toContain('Install as PWA');
      expect(offlinePwaFile).not.toContain('Install PWA');
    });

    it('InstallReplyfModal component provides accessible platform guidance', () => {
      const modalFile = fs.readFileSync(
        path.resolve(__dirname, '../components/landing/install-replyf-modal.tsx'),
        'utf-8'
      );
      expect(modalFile).toContain('Install Replyf');
      expect(modalFile).toContain('iPhone & iPad (Safari)');
      expect(modalFile).toContain('Add to Home Screen');
      expect(modalFile).toContain('Android (Chrome)');
      expect(modalFile).toContain('Desktop (Chrome / Edge)');
      expect(modalFile).toContain('min-h-[44px]');
    });
  });

  describe('5. Clean Architecture & Code Splitting (Parts 2, 38, 53)', () => {
    it('landing page does not eagerly import authenticated WorkoutHub or active workout session engines', () => {
      expect(landingPageFile).not.toContain('WorkoutHub');
      expect(landingPageFile).not.toContain('SessionCommandService');
      expect(landingPageFile).not.toContain('LocalWorkoutRepository');
      expect(landingPageFile).not.toContain('WorkoutSessionView');
    });

    it('uses the approved Replyf logo path /icons/icon-192x192.png throughout landing', () => {
      expect(landingHeaderFile).toContain('/icons/icon-192x192.png');
      expect(heroSectionFile).toContain('/icons/icon-192x192.png');
      expect(offlinePwaFile).toContain('/icons/icon-192x192.png');
      expect(landingFooterFile).toContain('/icons/icon-192x192.png');
    });
  });
});
