/**
 * Canonical Auth / Guest & Onboarding State Provider (Part A, B, C, H)
 * 
 * AUTHORITY RULES:
 * 1. Supabase is authoritative for authentication.
 * 2. IndexedDB (STORES.META) is authoritative for durable local application state.
 * 3. localStorage is ONLY a synchronous bootstrap cache.
 *    - localStorage.accessMode = "authenticated" is NEVER proof of authentication.
 * 
 * RESOLUTION ORDER:
 * 1. Restore local bootstrap state (localStorage).
 * 2. Restore/read durable IndexedDB META state.
 * 3. Restore/check Supabase authentication session.
 * 4. Reconcile resulting state (IndexedDB wins for local state; Supabase wins for auth; repair localStorage).
 * 5. Set AuthGuardStatus = 'ready'.
 * 6. Only then determine which application screen to render.
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES, MetaRecord, LocalProfileRecord, GeneratedWorkoutRecord } from '@/lib/storage/indexeddb-schema';
import { associateGuestDataWithUser } from '@/lib/sync/guest-migration';

export type AccessMode = 'unselected' | 'guest' | 'authenticated';
export type OnboardingState = 'incomplete' | 'complete';
export type AuthGuardStatus = 'initializing' | 'ready';
export type AuthTransitionKind = 'signup' | 'signin';

export interface AuthTransitionState {
  kind: AuthTransitionKind;
  displayName: string | null;
}

export const ACCESS_MODE_KEY = 'replyf_access_mode';
export const ONBOARDING_STATE_KEY = 'replyf_onboarding_state';
export const ONBOARDING_COMPLETED_AT_KEY = 'replyf_onboarding_completed_at';
export const ONBOARDING_VERSION_KEY = 'replyf_onboarding_version';
export const ONBOARDING_DRAFT_KEY = 'replyf_onboarding_draft';
export const CURRENT_ONBOARDING_VERSION = '1.0';

export type AppRouteDecision = 'initializing' | 'auth_guest_screen' | 'onboarding' | 'workout_hub';

/**
 * Pure route resolution function enforcing canonical guard matrix:
 * status === 'initializing'                -> initializing
 * unselected                              -> auth_guest_screen
 * guest + onboarding incomplete          -> onboarding
 * authenticated + onboarding incomplete  -> onboarding
 * guest + onboarding complete            -> workout_hub
 * authenticated + onboarding complete    -> workout_hub
 */
export function resolveAppRoute(
  accessMode: AccessMode,
  onboardingState: OnboardingState,
  status: AuthGuardStatus = 'ready'
): AppRouteDecision {
  if (status === 'initializing') {
    return 'initializing';
  }
  if (accessMode === 'unselected') {
    return 'auth_guest_screen';
  }
  if (onboardingState === 'incomplete') {
    return 'onboarding';
  }
  return 'workout_hub';
}

/**
 * Pure reconciliation function implementing the Part A & C resolution order
 */
export function reconcileAccessState(params: {
  localAccess: string | null;
  localOnboarding: string | null;
  idbAccess: string | null;
  idbOnboarding: string | null;
  hasSupabaseSession: boolean;
  supabaseUserEmail?: string | null;
}): {
  resolvedAccess: AccessMode;
  resolvedOnboarding: OnboardingState;
  shouldRepairLocal: boolean;
} {
  const {
    localAccess,
    localOnboarding,
    idbAccess,
    idbOnboarding,
    hasSupabaseSession,
  } = params;

  let resolvedAccess: AccessMode = 'unselected';
  let resolvedOnboarding: OnboardingState = 'incomplete';

  // Rule 1: Supabase is authoritative for authentication
  if (hasSupabaseSession) {
    resolvedAccess = 'authenticated';
  } else {
    // Rule 2: If no Supabase session, IndexedDB is authoritative for durable local state
    // localStorage 'authenticated' CANNOT fake authentication!
    if (idbAccess === 'guest') {
      resolvedAccess = 'guest';
    } else if (localAccess === 'guest' && !idbAccess) {
      // First bootstrap scenario before IDB write completed
      resolvedAccess = 'guest';
    } else {
      // Even if localAccess === 'authenticated', without Supabase session it is unselected!
      resolvedAccess = 'unselected';
    }
  }

  // Rule 3: IndexedDB is authoritative for durable onboarding state
  if (idbOnboarding === 'complete') {
    resolvedOnboarding = 'complete';
  } else if (idbOnboarding === 'incomplete') {
    resolvedOnboarding = 'incomplete';
  } else if (localOnboarding === 'complete' || localOnboarding === 'incomplete') {
    resolvedOnboarding = localOnboarding as OnboardingState;
  }

  // Check if localStorage needs repair to match authoritative resolved state
  const shouldRepairLocal =
    localAccess !== resolvedAccess || localOnboarding !== resolvedOnboarding;

  return {
    resolvedAccess,
    resolvedOnboarding,
    shouldRepairLocal,
  };
}

export interface AuthGuardContextType {
  accessMode: AccessMode;
  onboardingState: OnboardingState;
  status: AuthGuardStatus;
  isInitializing: boolean;
  isLoading: boolean; // backward-compatibility alias for isInitializing
  userEmail: string | null;
  displayName: string | null;
  authTransition: AuthTransitionState | null;
  selectGuestMode: () => Promise<void>;
  authenticateUser: (
    email: string,
    displayName?: string,
    kind?: AuthTransitionKind,
    authUserId?: string,
    userMetadata?: Record<string, unknown>
  ) => Promise<void>;
  completeAuthTransition: () => void;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  switchAccess: () => Promise<void>;
  resetFlow: () => Promise<void>;
}

const AuthGuardContext = createContext<AuthGuardContextType | undefined>(undefined);

export function AuthGuardProvider({ children }: { children: React.ReactNode }) {
  const [accessMode, setAccessModeState] = useState<AccessMode>('unselected');
  const [onboardingState, setOnboardingStateState] = useState<OnboardingState>('incomplete');
  const [status, setStatus] = useState<AuthGuardStatus>('initializing');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [authTransition, setAuthTransition] = useState<AuthTransitionState | null>(null);

  // Initialize state following strict Part A & Part C authority rules
  useEffect(() => {
    let isMounted = true;

    async function initAuthGuard() {
      try {
        // Step 1: Restore local bootstrap cache (synchronous read)
        const localAccess = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_MODE_KEY) : null;
        const localOnboarding = typeof window !== 'undefined' ? localStorage.getItem(ONBOARDING_STATE_KEY) : null;

        // Step 2: Restore/read durable IndexedDB META state (durable local authority)
        let idbAccess: string | null = null;
        let idbOnboarding: string | null = null;

        try {
          const engine = IndexedDBEngine.getInstance();
          const timeoutPromise = new Promise<null>((r) => setTimeout(() => r(null), 1500));
          const metaAccess = await Promise.race([
            engine.get<MetaRecord>(STORES.META, ACCESS_MODE_KEY),
            timeoutPromise,
          ]);
          if (metaAccess?.value && typeof metaAccess.value === 'string') {
            idbAccess = metaAccess.value;
          }

          const metaOnboarding = await Promise.race([
            engine.get<MetaRecord>(STORES.META, ONBOARDING_STATE_KEY),
            timeoutPromise,
          ]);
          if (metaOnboarding?.value && typeof metaOnboarding.value === 'string') {
            idbOnboarding = metaOnboarding.value;
          }
        } catch (dbErr) {
          console.debug('[AuthGuard] IndexedDB meta check failed/skipped:', dbErr);
        }

        // Step 3: Restore/check Supabase authentication session (auth authority)
        let hasSupabaseSession = false;
        let email: string | null = null;
        let initialName: string | null = null;

        try {
          const supabase = getBrowserSupabaseClient();
          const sessionPromise = supabase.auth.getSession();
          const { data: sessionData } = (await Promise.race([
            sessionPromise,
            new Promise<any>((r) => setTimeout(() => r({ data: null }), 1500)),
          ])) || { data: null };
          if (sessionData?.session?.user) {
            hasSupabaseSession = true;
            email = sessionData.session.user.email || null;
            const meta = sessionData.session.user.user_metadata;
            initialName = meta?.display_name || meta?.full_name || meta?.name || null;
            if (meta?.onboarding_completed === true) {
              idbOnboarding = 'complete';
            }
          }
        } catch (supabaseErr) {
          console.debug('[AuthGuard] Supabase session check skipped/failed:', supabaseErr);
        }

        // Step 4: Reconcile resulting state
        const { resolvedAccess, resolvedOnboarding, shouldRepairLocal } = reconcileAccessState({
          localAccess,
          localOnboarding,
          idbAccess,
          idbOnboarding,
          hasSupabaseSession,
          supabaseUserEmail: email,
        });

        // Repair localStorage from the resolved state if necessary
        if (shouldRepairLocal && typeof window !== 'undefined') {
          try {
            if (resolvedAccess === 'unselected') {
              localStorage.removeItem(ACCESS_MODE_KEY);
            } else {
              localStorage.setItem(ACCESS_MODE_KEY, resolvedAccess);
            }

            if (resolvedOnboarding === 'incomplete' && !localOnboarding) {
              // Leave clean or set incomplete
            } else {
              localStorage.setItem(ONBOARDING_STATE_KEY, resolvedOnboarding);
            }
          } catch (storageErr) {
            console.warn('[AuthGuard] Failed to repair localStorage bootstrap cache:', storageErr);
          }
        }

        if (isMounted) {
          setAccessModeState(resolvedAccess);
          setOnboardingStateState(resolvedOnboarding);
          setUserEmail(email);
          setDisplayName(initialName);
          // Step 5: Set status to ready (authTransition remains null on startup/refresh)
          setStatus('ready');
        }
      } catch (err) {
        console.warn('[AuthGuard] Initialization error:', err);
        if (isMounted) {
          setStatus('ready');
        }
      }
    }

    initAuthGuard();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectGuestMode = useCallback(async () => {
    setAccessModeState('guest');
    try {
      localStorage.setItem(ACCESS_MODE_KEY, 'guest');
      const engine = IndexedDBEngine.getInstance();
      await engine.put(STORES.META, {
        key: ACCESS_MODE_KEY,
        value: 'guest',
        updatedAt: new Date().toISOString(),
      });

      // Resolve guest onboarding state: complete only if guest actually completed workout generation
      let guestCompleted = false;
      try {
        const metaCompleted = await engine.get<MetaRecord>(STORES.META, ONBOARDING_COMPLETED_AT_KEY);
        const metaState = await engine.get<MetaRecord>(STORES.META, ONBOARDING_STATE_KEY);
        if (metaCompleted?.value && metaState?.value === 'complete') {
          const workouts = await engine.getAll<GeneratedWorkoutRecord>(STORES.GENERATED_WORKOUTS);
          if (workouts.some((w) => w.ownerKind === 'guest' || w.ownerId === 'guest_user')) {
            guestCompleted = true;
          }
        }
      } catch (dbErr) {
        console.debug('[AuthGuard] Guest onboarding check error:', dbErr);
      }

      if (guestCompleted) {
        setOnboardingStateState('complete');
        if (typeof window !== 'undefined') {
          localStorage.setItem(ONBOARDING_STATE_KEY, 'complete');
        }
      } else {
        setOnboardingStateState('incomplete');
        if (typeof window !== 'undefined') {
          localStorage.setItem(ONBOARDING_STATE_KEY, 'incomplete');
        }
        await engine.put(STORES.META, {
          key: ONBOARDING_STATE_KEY,
          value: 'incomplete',
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('[AuthGuard] Failed to persist guest mode:', e);
    }
  }, []);

  const authenticateUser = useCallback(
    async (
      email: string,
      providedName?: string,
      kind: AuthTransitionKind = 'signin',
      authUserId?: string,
      userMetadata?: Record<string, unknown>
    ) => {
      // 1. Resolve safe display name synchronously without blocking on network/profile lookups
      const resolvedName = (providedName && providedName.trim()) || null;

      // 2. Set transient in-memory Welcome transition and authenticated state immediately
      setAuthTransition({
        kind,
        displayName: resolvedName,
      });
      setAccessModeState('authenticated');
      setUserEmail(email);
      setDisplayName(resolvedName);

      // Check whether onboarding has already been completed in any entry mode
      let isAlreadyCompleted = false;
      const engine = IndexedDBEngine.getInstance();

      if (kind === 'signup') {
        // A new signup only inherits completion if the user was actively in guest mode with completed onboarding
        if (accessMode === 'guest' && onboardingState === 'complete') {
          isAlreadyCompleted = true;
        }
      } else {
        // Returning user (signin): check user metadata, user profile, and user workouts
        if (userMetadata?.onboarding_completed === true) {
          isAlreadyCompleted = true;
        } else if (authUserId) {
          try {
            const allProfiles = await engine.getAll<LocalProfileRecord>(STORES.LOCAL_PROFILES);
            const userProf = allProfiles.find(
              (p) => p.id === authUserId || p.ownerId === authUserId
            );
            if (userProf?.profile?.fitnessLevel && userProf?.profile?.primaryGoal) {
              isAlreadyCompleted = true;
            }
            if (!isAlreadyCompleted) {
              const workouts = await engine.getAll<GeneratedWorkoutRecord>(STORES.GENERATED_WORKOUTS);
              if (workouts.some((w) => w.ownerId === authUserId)) {
                isAlreadyCompleted = true;
              }
            }
          } catch (dbErr) {
            console.debug('[AuthGuard] Onboarding IDB check:', dbErr);
          }
        }
      }

      // 3. Resolve authoritative onboarding completion state.
      // Preserves completed onboarding for guest-to-account and account-scoped returning users
      if (isAlreadyCompleted) {
        setOnboardingStateState('complete');
      } else {
        setOnboardingStateState('incomplete');
      }

      // 4. Persist local authenticated mode and onboarding state in non-blocking try/catch
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(ACCESS_MODE_KEY, 'authenticated');
          if (isAlreadyCompleted) {
            localStorage.setItem(ONBOARDING_STATE_KEY, 'complete');
          } else {
            localStorage.setItem(ONBOARDING_STATE_KEY, 'incomplete');
            localStorage.removeItem(ONBOARDING_COMPLETED_AT_KEY);
            localStorage.removeItem(ONBOARDING_VERSION_KEY);
          }
        }
        await engine.put(STORES.META, {
          key: ACCESS_MODE_KEY,
          value: 'authenticated',
          updatedAt: new Date().toISOString(),
        });
        if (isAlreadyCompleted) {
          await engine.put(STORES.META, {
            key: ONBOARDING_STATE_KEY,
            value: 'complete',
            updatedAt: new Date().toISOString(),
          });
        } else {
          await engine.put(STORES.META, {
            key: ONBOARDING_STATE_KEY,
            value: 'incomplete',
            updatedAt: new Date().toISOString(),
          });
          await engine.delete(STORES.META, ONBOARDING_COMPLETED_AT_KEY);
          await engine.delete(STORES.META, ONBOARDING_VERSION_KEY);
        }
      } catch (e) {
        console.warn('[AuthGuard] Non-blocking mode persistence warning:', e);
      }

      // 5. Controlled guest data migration in detached background async boundary
      if (authUserId) {
        associateGuestDataWithUser(authUserId).catch((migErr) => {
          console.warn('[AuthGuard] Non-blocking guest migration warning:', migErr);
        });
      }
    },
    [accessMode, onboardingState]
  );

  const completeAuthTransition = useCallback(() => {
    setAuthTransition(null);
  }, []);

  const signOut = useCallback(async () => {
    setAccessModeState('unselected');
    setOnboardingStateState('incomplete');
    setUserEmail(null);
    setDisplayName(null);
    setAuthTransition(null);
    try {
      localStorage.removeItem(ACCESS_MODE_KEY);
      localStorage.removeItem(ONBOARDING_STATE_KEY);
      const engine = IndexedDBEngine.getInstance();
      await engine.delete(STORES.META, ACCESS_MODE_KEY);
      await engine.delete(STORES.META, ONBOARDING_STATE_KEY);
      const supabase = getBrowserSupabaseClient();
      await supabase.auth.signOut().catch(() => {});
    } catch (e) {
      console.warn('[AuthGuard] Failed to clear access mode on sign out:', e);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    setOnboardingStateState('complete');
    const now = new Date().toISOString();
    try {
      localStorage.setItem(ONBOARDING_STATE_KEY, 'complete');
      const engine = IndexedDBEngine.getInstance();
      await engine.put(STORES.META, {
        key: ONBOARDING_STATE_KEY,
        value: 'complete',
        updatedAt: now,
      });
      await engine.put(STORES.META, {
        key: ONBOARDING_COMPLETED_AT_KEY,
        value: now,
        updatedAt: now,
      });
      await engine.put(STORES.META, {
        key: ONBOARDING_VERSION_KEY,
        value: CURRENT_ONBOARDING_VERSION,
        updatedAt: now,
      });

      // Best-effort background sync of completion flag to Supabase user metadata
      try {
        const supabase = getBrowserSupabaseClient();
        supabase.auth.updateUser({
          data: { onboarding_completed: true },
        }).catch(() => {});
      } catch {}
    } catch (e) {
      console.warn('[AuthGuard] Failed to persist onboarding completion metadata:', e);
    }
  }, []);

  const switchAccess = useCallback(async () => {
    setAccessModeState('unselected');
    setUserEmail(null);
    setDisplayName(null);
    setAuthTransition(null);
    try {
      localStorage.removeItem(ACCESS_MODE_KEY);
      const engine = IndexedDBEngine.getInstance();
      await engine.delete(STORES.META, ACCESS_MODE_KEY);
    } catch (e) {
      console.warn('[AuthGuard] Failed to switch access:', e);
    }
  }, []);

  const resetFlow = useCallback(async () => {
    setAccessModeState('unselected');
    setOnboardingStateState('incomplete');
    setUserEmail(null);
    setDisplayName(null);
    setAuthTransition(null);
    try {
      localStorage.removeItem(ACCESS_MODE_KEY);
      localStorage.removeItem(ONBOARDING_STATE_KEY);
      localStorage.removeItem(ONBOARDING_COMPLETED_AT_KEY);
      localStorage.removeItem(ONBOARDING_VERSION_KEY);
      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      const engine = IndexedDBEngine.getInstance();
      await engine.delete(STORES.META, ACCESS_MODE_KEY);
      await engine.delete(STORES.META, ONBOARDING_STATE_KEY);
      await engine.delete(STORES.META, ONBOARDING_COMPLETED_AT_KEY);
      await engine.delete(STORES.META, ONBOARDING_VERSION_KEY);
      await engine.delete(STORES.META, ONBOARDING_DRAFT_KEY);
    } catch (e) {
      console.warn('[AuthGuard] Failed to reset flow:', e);
    }
  }, []);

  const isInitializing = status === 'initializing';

  return React.createElement(
    AuthGuardContext.Provider,
    {
      value: {
        accessMode,
        onboardingState,
        status,
        isInitializing,
        isLoading: isInitializing,
        userEmail,
        displayName,
        authTransition,
        selectGuestMode,
        authenticateUser,
        completeAuthTransition,
        signOut,
        completeOnboarding,
        switchAccess,
        resetFlow,
      },
    },
    children
  );
}

export function useAuthGuard() {
  const context = useContext(AuthGuardContext);
  if (!context) {
    throw new Error('useAuthGuard must be used within an AuthGuardProvider');
  }
  return context;
}
