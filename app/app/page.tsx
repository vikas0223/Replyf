/**
 * Dedicated Application Entry Route (/app)
 *
 * Provides the clean canonical entry point for the Replyf workout application
 * once the user proceeds from the public Landing Page (/landing).
 *
 * Implements the 2-factor state model:
 *   APP ENTRY (/app) -> access selected? -> onboarding complete? -> Workout Hub
 */

'use client';

import Home from '../page';

export default function AppPage() {
  return <Home />;
}
