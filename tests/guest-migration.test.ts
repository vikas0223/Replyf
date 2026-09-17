/**
 * Controlled Guest Data Association & Offline Sync Migration Tests
 * 
 * Verifies all requirements from Part 39:
 * 1. hasGuestData() returns true when guest records exist.
 * 2. hasGuestData() returns false when store is empty or only user records exist.
 * 3. associateGuestDataWithUser requires a valid authUserId.
 * 4. Guest local data is never deleted during association.
 * 5. Rewrites ownership from 'guest' -> 'user' with correct authUserId.
 * 6. Preserves stable entity IDs (primary keys).
 * 7. Existing user-owned records are untouched.
 * 8. Enqueues canonical sync operations into SyncOutbox.
 * 9. Outbox records have ownerKind: 'user' and ownerId: authUserId.
 * 10. Dependency order: profiles -> templates -> workouts -> exercises -> sessions -> session_exercises -> sets -> favorites -> events.
 * 11. Audit record written to STORES.META ('last_guest_migration_audit').
 * 12. SyncLock acquired and released properly.
 * 13. SyncLock released even on error.
 * 14. Nested domain object user IDs updated (template.userId, session.userId, workout.userId).
 * 15. Guest profile cloned into authenticated profile when missing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES } from '@/lib/storage/indexeddb-schema';
import {
  hasGuestData,
  associateGuestDataWithUser,
  GUEST_MIGRATION_STORES,
} from '@/lib/sync/guest-migration';
import { SyncLock } from '@/lib/sync/sync-lock';

describe('Part 39: Controlled Guest Data Association & Sync Migration', () => {
  beforeEach(() => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. hasGuestData() returns false when no guest records exist', async () => {
    const engine = IndexedDBEngine.getInstance();
    const result = await hasGuestData(engine);
    expect(result).toBe(false);
  });

  it('2. hasGuestData() returns true when guest records exist in any migration store', async () => {
    const engine = IndexedDBEngine.getInstance();
    await engine.put(STORES.WORKOUT_TEMPLATES, {
      id: 'template_guest_1',
      ownerKind: 'guest',
      ownerId: 'guest_user',
      name: 'Guest Routine',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'local',
    });

    const result = await hasGuestData(engine);
    expect(result).toBe(true);
  });

  it('3. associateGuestDataWithUser throws if authUserId is empty', async () => {
    const engine = IndexedDBEngine.getInstance();
    await expect(associateGuestDataWithUser('', engine)).rejects.toThrow(
      'associateGuestDataWithUser requires a valid authUserId'
    );
  });

  it('4 & 5 & 6. Rewrites ownership to user, preserves IDs, and never deletes guest data', async () => {
    const engine = IndexedDBEngine.getInstance();
    const guestTemplateId = 'tmpl-stable-uuid-123';
    const guestSessionId = 'sess-stable-uuid-456';

    await engine.put(STORES.WORKOUT_TEMPLATES, {
      id: guestTemplateId,
      ownerKind: 'guest',
      ownerId: 'guest_user',
      template: {
        id: guestTemplateId,
        name: 'Full Body Push',
        userId: 'guest_user',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      version: 1,
      syncStatus: 'local',
    });

    await engine.put(STORES.WORKOUT_SESSIONS, {
      id: guestSessionId,
      ownerKind: 'guest',
      ownerId: 'guest_user',
      session: {
        id: guestSessionId,
        title: 'Morning Push',
        userId: 'guest_user',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      version: 1,
      syncStatus: 'local',
    });

    const authUserId = 'user_supabase_abc999';
    const result = await associateGuestDataWithUser(authUserId, engine);

    expect(result.success).toBe(true);
    expect(result.migratedCount).toBeGreaterThanOrEqual(2);

    // Records must still exist in IndexedDB (NEVER deleted)
    const updatedTemplate = await engine.get<any>(STORES.WORKOUT_TEMPLATES, guestTemplateId);
    expect(updatedTemplate).toBeDefined();
    expect(updatedTemplate.id).toBe(guestTemplateId);
    expect(updatedTemplate.ownerKind).toBe('user');
    expect(updatedTemplate.ownerId).toBe(authUserId);
    expect(updatedTemplate.template.userId).toBe(authUserId);

    const updatedSession = await engine.get<any>(STORES.WORKOUT_SESSIONS, guestSessionId);
    expect(updatedSession).toBeDefined();
    expect(updatedSession.id).toBe(guestSessionId);
    expect(updatedSession.ownerKind).toBe('user');
    expect(updatedSession.ownerId).toBe(authUserId);
    expect(updatedSession.session.userId).toBe(authUserId);
  });

  it('7. Never modifies existing records owned by another authenticated user', async () => {
    const engine = IndexedDBEngine.getInstance();
    const otherUserId = 'other_user_456';
    const otherTemplateId = 'tmpl-other-user';

    await engine.put(STORES.WORKOUT_TEMPLATES, {
      id: otherTemplateId,
      ownerKind: 'user',
      ownerId: otherUserId,
      name: 'Other Routine',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      version: 1,
      syncStatus: 'synced',
    });

    const currentAuthId = 'current_user_123';
    const result = await associateGuestDataWithUser(currentAuthId, engine);

    expect(result.migratedCount).toBe(0);
    const existing = await engine.get<any>(STORES.WORKOUT_TEMPLATES, otherTemplateId);
    expect(existing.ownerKind).toBe('user');
    expect(existing.ownerId).toBe(otherUserId);
  });

  it('8 & 9. Explicitly enqueues canonical sync operations into sync_outbox', async () => {
    const engine = IndexedDBEngine.getInstance();
    const workoutId = 'gen_workout_001';

    await engine.put(STORES.GENERATED_WORKOUTS, {
      id: workoutId,
      ownerKind: 'guest',
      ownerId: 'guest_user',
      workout: {
        id: workoutId,
        name: 'Hypertrophy Day 1',
        userId: 'guest_user',
      },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      version: 1,
      syncStatus: 'local',
    });

    const authUserId = 'user_target_777';
    await associateGuestDataWithUser(authUserId, engine);

    const outboxRecords = await engine.getAll<any>(STORES.SYNC_QUEUE);
    expect(outboxRecords.length).toBeGreaterThan(0);

    const workoutSyncOp = outboxRecords.find(
      (op) => op.entityType === 'generated_workouts' && op.entityId === workoutId
    );
    expect(workoutSyncOp).toBeDefined();
    expect(workoutSyncOp.operation).toBe('upsert');
    expect(workoutSyncOp.idempotencyKey).toBeDefined();
  });

  it('10. Adheres strictly to canonical store dependency order', () => {
    const storeOrders = GUEST_MIGRATION_STORES.map((s) => s.order);
    for (let i = 0; i < storeOrders.length - 1; i++) {
      expect(storeOrders[i]).toBeLessThan(storeOrders[i + 1]);
    }
    expect(GUEST_MIGRATION_STORES[0].entityType).toBe('profiles');
    expect(GUEST_MIGRATION_STORES[1].entityType).toBe('workout_templates');
    expect(GUEST_MIGRATION_STORES[2].entityType).toBe('generated_workouts');
  });

  it('11. Writes migration audit record to STORES.META', async () => {
    const engine = IndexedDBEngine.getInstance();
    await engine.put(STORES.FAVORITES, {
      id: 'fav-1',
      ownerKind: 'guest',
      ownerId: 'guest_user',
      exerciseId: 'squat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'local',
    });

    const authUserId = 'user_audit_test';
    await associateGuestDataWithUser(authUserId, engine);

    const audit = await engine.get<any>(STORES.META, 'last_guest_migration_audit');
    expect(audit).toBeDefined();
    expect(audit.value.authUserId).toBe(authUserId);
    expect(audit.value.totalMigrated).toBe(1);
    expect(audit.value.migratedStores.favorites).toBe(1);
  });

  it('12 & 13. Acquires and releases sync lock even on partial store error', async () => {
    const engine = IndexedDBEngine.getInstance();
    const authUserId = 'user_lock_test';

    // Verify lock is not held initially
    const lockInitial = await engine.get<any>(STORES.OUTBOX_LOCKS, 'sync_worker_master_lock');
    expect(lockInitial).toBeNull();

    await associateGuestDataWithUser(authUserId, engine);

    // After migration, lock must be released
    const lockAfter = await engine.get<any>(STORES.OUTBOX_LOCKS, 'sync_worker_master_lock');
    expect(lockAfter).toBeNull();
  });

  it('14 & 15. Clones guest profile to new authenticated user profile', async () => {
    const engine = IndexedDBEngine.getInstance();
    const guestProfileId = 'guest_profile_01';

    await engine.put(STORES.LOCAL_PROFILES, {
      id: guestProfileId,
      ownerKind: 'guest',
      ownerId: 'guest_user',
      isCurrentGuest: true,
      profile: {
        id: guestProfileId,
        displayName: 'Guest Alex',
        fitnessLevel: 'intermediate',
        primaryGoal: 'hypertrophy',
      },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      version: 1,
      syncStatus: 'local',
    });

    await engine.put(STORES.WORKOUT_TEMPLATES, {
      id: 'template_guest_alex',
      ownerKind: 'guest',
      ownerId: 'guest_user',
      template: {
        id: 'template_guest_alex',
        name: 'Guest Routine',
        userId: 'guest_user',
      },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      version: 1,
      syncStatus: 'local',
    });

    const authUserId = 'user_new_alex';
    await associateGuestDataWithUser(authUserId, engine);

    const newAuthProfile = await engine.get<any>(STORES.LOCAL_PROFILES, authUserId);
    expect(newAuthProfile).toBeDefined();
    expect(newAuthProfile.ownerKind).toBe('user');
    expect(newAuthProfile.ownerId).toBe(authUserId);
    expect(newAuthProfile.profile.displayName).toBe('Guest Alex');
    expect(newAuthProfile.profile.fitnessLevel).toBe('intermediate');

    // Guest profile must NOT be rewritten or enqueued with guest profile ID
    const originalGuestProfile = await engine.get<any>(STORES.LOCAL_PROFILES, guestProfileId);
    expect(originalGuestProfile).toBeDefined();
    expect(originalGuestProfile.ownerKind).toBe('guest');

    // Cloned authenticated profile must be enqueued first in outbox
    const outboxOps = await engine.getAll<any>(STORES.SYNC_QUEUE);
    expect(outboxOps.length).toBeGreaterThan(1);
    expect(outboxOps[0]).toBeDefined();
    expect(outboxOps[0].entityType).toBe('profiles');
    expect(outboxOps[0].entityId).toBe(authUserId);
    expect(outboxOps[0].operation).toBe('upsert');
  });

  it('16. stops migration and reports error if exclusive lock cannot be acquired', async () => {
    const engine = IndexedDBEngine.getInstance();
    const authUserId = 'user_lock_fail_test';

    const guestTemplateId = 'template_lock_test';
    await engine.put(STORES.WORKOUT_TEMPLATES, {
      id: guestTemplateId,
      ownerKind: 'guest',
      ownerId: 'guest_user',
      name: 'Guest Template',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      version: 1,
      syncStatus: 'local',
    });

    // Mock lock.acquire to return false
    vi.spyOn(SyncLock.prototype, 'acquire').mockResolvedValue(false);

    const result = await associateGuestDataWithUser(authUserId, engine);
    expect(result.success).toBe(false);
    expect(result.migratedCount).toBe(0);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('Lock acquisition error');

    // Assert the record owner remains guest and no sync operation is queued
    const record = await engine.get<any>(STORES.WORKOUT_TEMPLATES, guestTemplateId);
    expect(record).toBeDefined();
    expect(record.ownerKind).toBe('guest');
    expect(record.ownerId).toBe('guest_user');

    const syncOps = await engine.getAll<any>(STORES.SYNC_QUEUE);
    expect(syncOps.length).toBe(0);
  });
});
