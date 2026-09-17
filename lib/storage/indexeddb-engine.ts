/**
 * IndexedDB Database Engine
 * Pure TypeScript, zero external dependencies.
 * Handles database lifecycle, store creation, compound indexes, transactions, and seeding.
 */

import {
  DB_NAME,
  DB_VERSION,
  STORES,
  StoreName,
  MetaRecord,
} from './indexeddb-schema';
import { ExerciseCatalog } from '@/lib/data/exercise-catalog';

export class IndexedDBEngine {
  private static instance: IndexedDBEngine | null = null;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  public static getInstance(): IndexedDBEngine {
    if (!IndexedDBEngine.instance) {
      IndexedDBEngine.instance = new IndexedDBEngine();
    }
    return IndexedDBEngine.instance;
  }

  /**
   * For testing: resets singleton instance or injects custom DB
   */
  public static resetInstance(): void {
    if (IndexedDBEngine.instance?.db) {
      try {
        IndexedDBEngine.instance.db.close();
      } catch {
        // ignore close error
      }
    }
    IndexedDBEngine.instance = null;
  }

  public async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.openDatabase();
    this.db = await this.initPromise;
    this.initPromise = null;
    return this.db;
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const indexedDBFactory =
        typeof window !== 'undefined' ? window.indexedDB : (globalThis as any).indexedDB;

      if (!indexedDBFactory) {
        return reject(
          new Error('[IndexedDBEngine] IndexedDB is not available in the current environment.')
        );
      }

      let isSettled = false;
      const timeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          console.warn('[IndexedDBEngine] openDatabase timed out after 3000ms');
          reject(new Error('IndexedDB open timeout'));
        }
      }, 3000);

      const request = indexedDBFactory.open(DB_NAME, DB_VERSION);

      request.onblocked = () => {
        console.warn('[IndexedDBEngine] Database open blocked by another connection');
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createSchema(db);
      };

      request.onsuccess = async (event: Event) => {
        clearTimeout(timeoutId);
        if (isSettled) return;
        const db = (event.target as IDBOpenDBRequest).result;
        try {
          await this.initializeDefaults(db);
          if (!isSettled) {
            isSettled = true;
            resolve(db);
          }
        } catch (err) {
          console.error('[IndexedDBEngine] Post-init failure:', err);
          if (!isSettled) {
            isSettled = true;
            resolve(db);
          }
        }
      };

      request.onerror = (event: Event) => {
        clearTimeout(timeoutId);
        if (isSettled) return;
        isSettled = true;
        const error = (event.target as IDBOpenDBRequest).error;
        console.error('[IndexedDBEngine] Failed to open IndexedDB database:', error);
        reject(error || new Error('Unknown IndexedDB open error'));
      };
    });
  }

  private createSchema(db: IDBDatabase): void {
    // 1. Meta store (key-value)
    if (!db.objectStoreNames.contains(STORES.META)) {
      db.createObjectStore(STORES.META, { keyPath: 'key' });
    }

    // 2. Local Profiles
    if (!db.objectStoreNames.contains(STORES.LOCAL_PROFILES)) {
      const store = db.createObjectStore(STORES.LOCAL_PROFILES, { keyPath: 'id' });
      store.createIndex('ownerKind', 'ownerKind', { unique: false });
      store.createIndex('ownerId', 'ownerId', { unique: false });
      store.createIndex('ownerId_updatedAt', ['ownerId', 'updatedAt'], { unique: false });
      store.createIndex('isCurrentGuest', 'isCurrentGuest', { unique: false });
    }

    // 3. Catalog Stores
    if (!db.objectStoreNames.contains(STORES.EXERCISE_CATALOG)) {
      const store = db.createObjectStore(STORES.EXERCISE_CATALOG, { keyPath: 'id' });
      store.createIndex('slug', 'slug', { unique: false });
      store.createIndex('difficulty', 'difficulty', { unique: false });
    }
    if (!db.objectStoreNames.contains(STORES.MUSCLE_CATALOG)) {
      db.createObjectStore(STORES.MUSCLE_CATALOG, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(STORES.EQUIPMENT_CATALOG)) {
      db.createObjectStore(STORES.EQUIPMENT_CATALOG, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(STORES.JOINT_CATALOG)) {
      db.createObjectStore(STORES.JOINT_CATALOG, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(STORES.EXERCISE_MUSCLES)) {
      const store = db.createObjectStore(STORES.EXERCISE_MUSCLES, { keyPath: 'id' });
      store.createIndex('exerciseId', 'exerciseId', { unique: false });
      store.createIndex('muscleId', 'muscleId', { unique: false });
    }
    if (!db.objectStoreNames.contains(STORES.EXERCISE_EQUIPMENT)) {
      const store = db.createObjectStore(STORES.EXERCISE_EQUIPMENT, { keyPath: 'id' });
      store.createIndex('exerciseId', 'exerciseId', { unique: false });
      store.createIndex('equipmentId', 'equipmentId', { unique: false });
    }
    if (!db.objectStoreNames.contains(STORES.EXERCISE_JOINTS)) {
      const store = db.createObjectStore(STORES.EXERCISE_JOINTS, { keyPath: 'id' });
      store.createIndex('exerciseId', 'exerciseId', { unique: false });
      store.createIndex('jointId', 'jointId', { unique: false });
    }
    if (!db.objectStoreNames.contains(STORES.EXERCISE_MEDIA)) {
      const store = db.createObjectStore(STORES.EXERCISE_MEDIA, { keyPath: 'id' });
      store.createIndex('exerciseId', 'exerciseId', { unique: false });
    }
    if (!db.objectStoreNames.contains(STORES.EXERCISE_ALTERNATIVES)) {
      const store = db.createObjectStore(STORES.EXERCISE_ALTERNATIVES, { keyPath: 'id' });
      store.createIndex('exerciseId', 'exerciseId', { unique: false });
      store.createIndex('alternativeExerciseId', 'alternativeExerciseId', { unique: false });
    }

    // 4. Workout Stores
    if (!db.objectStoreNames.contains(STORES.WORKOUT_TEMPLATES)) {
      const store = db.createObjectStore(STORES.WORKOUT_TEMPLATES, { keyPath: 'id' });
      store.createIndex('ownerId', 'ownerId', { unique: false });
      store.createIndex('ownerId_updatedAt', ['ownerId', 'updatedAt'], { unique: false });
      store.createIndex('ownerId_syncStatus', ['ownerId', 'syncStatus'], { unique: false });
      store.createIndex('ownerId_deletedAt', ['ownerId', 'deletedAt'], { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.GENERATED_WORKOUTS)) {
      const store = db.createObjectStore(STORES.GENERATED_WORKOUTS, { keyPath: 'id' });
      store.createIndex('ownerId', 'ownerId', { unique: false });
      store.createIndex('ownerId_updatedAt', ['ownerId', 'updatedAt'], { unique: false });
      store.createIndex('ownerId_syncStatus', ['ownerId', 'syncStatus'], { unique: false });
      store.createIndex('workoutTemplateId', 'workoutTemplateId', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.GENERATED_WORKOUT_EXERCISES)) {
      const store = db.createObjectStore(STORES.GENERATED_WORKOUT_EXERCISES, { keyPath: 'id' });
      store.createIndex('generatedWorkoutId', 'generatedWorkoutId', { unique: false });
      store.createIndex('ownerId', 'ownerId', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.WORKOUT_SESSIONS)) {
      const store = db.createObjectStore(STORES.WORKOUT_SESSIONS, { keyPath: 'id' });
      store.createIndex('ownerId', 'ownerId', { unique: false });
      store.createIndex('ownerId_updatedAt', ['ownerId', 'updatedAt'], { unique: false });
      store.createIndex('ownerId_syncStatus', ['ownerId', 'syncStatus'], { unique: false });
      store.createIndex('generatedWorkoutId', 'generatedWorkoutId', { unique: false });
      store.createIndex('workoutTemplateId', 'workoutTemplateId', { unique: false });
      store.createIndex('status', 'session.status', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.SESSION_EXERCISES)) {
      const store = db.createObjectStore(STORES.SESSION_EXERCISES, { keyPath: 'id' });
      store.createIndex('workoutSessionId', 'workoutSessionId', { unique: false });
      store.createIndex('exerciseId', 'exerciseId', { unique: false });
      store.createIndex('ownerId', 'ownerId', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.SETS)) {
      const store = db.createObjectStore(STORES.SETS, { keyPath: 'id' });
      store.createIndex('workoutSessionId', 'workoutSessionId', { unique: false });
      store.createIndex('sessionExerciseId', 'sessionExerciseId', { unique: false });
      store.createIndex('sessionExerciseId_setNumber', ['sessionExerciseId', 'setNumber'], {
        unique: false,
      });
      store.createIndex('ownerId', 'ownerId', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.FAVORITES)) {
      const store = db.createObjectStore(STORES.FAVORITES, { keyPath: 'id' });
      store.createIndex('ownerId', 'ownerId', { unique: false });
      store.createIndex('entityId', 'entityId', { unique: false });
      store.createIndex('ownerId_entityId', ['ownerId', 'entityId'], { unique: true });
    }

    // 5. Phase 2J Programming & Progress Stores
    if (!db.objectStoreNames.contains(STORES.PROGRAMS)) {
      const store = db.createObjectStore(STORES.PROGRAMS, { keyPath: 'id' });
      store.createIndex('ownerId', 'ownerId', { unique: false });
      store.createIndex('ownerId_updatedAt', ['ownerId', 'updatedAt'], { unique: false });
      store.createIndex('ownerId_syncStatus', ['ownerId', 'syncStatus'], { unique: false });
      store.createIndex('ownerId_deletedAt', ['ownerId', 'deletedAt'], { unique: false });
      store.createIndex('status', 'program.status', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.PROGRAM_WEEKS)) {
      const store = db.createObjectStore(STORES.PROGRAM_WEEKS, { keyPath: 'id' });
      store.createIndex('programId', 'programId', { unique: false });
      store.createIndex('ownerId', 'ownerId', { unique: false });
      store.createIndex('ownerId_updatedAt', ['ownerId', 'updatedAt'], { unique: false });
      store.createIndex('ownerId_deletedAt', ['ownerId', 'deletedAt'], { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.PROGRAM_DAYS)) {
      const store = db.createObjectStore(STORES.PROGRAM_DAYS, { keyPath: 'id' });
      store.createIndex('programId', 'programId', { unique: false });
      store.createIndex('programWeekId', 'programWeekId', { unique: false });
      store.createIndex('workoutTemplateId', 'workoutTemplateId', { unique: false });
      store.createIndex('ownerId', 'ownerId', { unique: false });
      store.createIndex('ownerId_deletedAt', ['ownerId', 'deletedAt'], { unique: false });
      store.createIndex('status', 'status', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.FITNESS_GOALS)) {
      const store = db.createObjectStore(STORES.FITNESS_GOALS, { keyPath: 'id' });
      store.createIndex('ownerId', 'ownerId', { unique: false });
      store.createIndex('ownerId_updatedAt', ['ownerId', 'updatedAt'], { unique: false });
      store.createIndex('ownerId_syncStatus', ['ownerId', 'syncStatus'], { unique: false });
      store.createIndex('ownerId_deletedAt', ['ownerId', 'deletedAt'], { unique: false });
      store.createIndex('type', 'goal.type', { unique: false });
      store.createIndex('status', 'goal.status', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.CHALLENGES)) {
      const store = db.createObjectStore(STORES.CHALLENGES, { keyPath: 'id' });
      store.createIndex('ownerId', 'ownerId', { unique: false });
      store.createIndex('ownerId_updatedAt', ['ownerId', 'updatedAt'], { unique: false });
      store.createIndex('ownerId_deletedAt', ['ownerId', 'deletedAt'], { unique: false });
      store.createIndex('type', 'challenge.type', { unique: false });
      store.createIndex('status', 'challenge.status', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.CHALLENGE_PROGRESS)) {
      const store = db.createObjectStore(STORES.CHALLENGE_PROGRESS, { keyPath: 'id' });
      store.createIndex('challengeId', 'challengeId', { unique: false });
      store.createIndex('ownerId', 'ownerId', { unique: false });
      store.createIndex('ownerId_updatedAt', ['ownerId', 'updatedAt'], { unique: false });
      store.createIndex('status', 'progress.status', { unique: false });
    }

    // 6. Events & AI Cache
    if (!db.objectStoreNames.contains(STORES.RECOMMENDATION_EVENTS)) {
      const store = db.createObjectStore(STORES.RECOMMENDATION_EVENTS, { keyPath: 'id' });
      store.createIndex('ownerId', 'ownerId', { unique: false });
    }
    if (!db.objectStoreNames.contains(STORES.AI_COACH_CACHE)) {
      const store = db.createObjectStore(STORES.AI_COACH_CACHE, { keyPath: 'id' });
      store.createIndex('promptHash', 'promptHash', { unique: true });
    }

    // 6. Sync Architecture Future Stores
    if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
      const store = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
      store.createIndex('status', 'status', { unique: false });
      store.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
      store.createIndex('nextAttemptAt', 'nextAttemptAt', { unique: false });
    }
    if (!db.objectStoreNames.contains(STORES.SYNC_CONFLICTS)) {
      const store = db.createObjectStore(STORES.SYNC_CONFLICTS, { keyPath: 'id' });
      store.createIndex('entityId', 'entityId', { unique: false });
    }
    if (!db.objectStoreNames.contains(STORES.SYNC_CURSORS)) {
      db.createObjectStore(STORES.SYNC_CURSORS, { keyPath: 'storeName' });
    }
    if (!db.objectStoreNames.contains(STORES.OUTBOX_LOCKS)) {
      db.createObjectStore(STORES.OUTBOX_LOCKS, { keyPath: 'lockKey' });
    }
  }

  private async initializeDefaults(db: IDBDatabase): Promise<void> {
    const tx = db.transaction([STORES.META, STORES.EXERCISE_CATALOG], 'readwrite');
    const metaStore = tx.objectStore(STORES.META);
    const catalogStore = tx.objectStore(STORES.EXERCISE_CATALOG);

    const now = new Date().toISOString();

    // 1. Seed meta values if absent
    metaStore.put({ key: 'schema_version', value: DB_VERSION, updatedAt: now } as MetaRecord);
    metaStore.put({ key: 'catalog_version', value: '1.0.0', updatedAt: now } as MetaRecord);
    metaStore.put({ key: 'engine_version', value: '1.0.0', updatedAt: now } as MetaRecord);

    return new Promise((resolve) => {
      let isDone = false;
      const done = () => {
        if (!isDone) {
          isDone = true;
          resolve();
        }
      };

      const timer = setTimeout(done, 1500);

      tx.oncomplete = () => {
        clearTimeout(timer);
        done();
      };
      tx.onerror = () => {
        clearTimeout(timer);
        done();
      };
      tx.onabort = () => {
        clearTimeout(timer);
        done();
      };

      try {
        const countReq = catalogStore.count();
        countReq.onsuccess = () => {
          try {
            if (countReq.result === 0) {
              const exercises = ExerciseCatalog.listExercises();
              exercises.forEach((ex) => {
                catalogStore.put(ex);
              });
            }
          } catch {
            // Ignore if tx committed
          }
        };
        countReq.onerror = () => {
          // Non-blocking
        };
      } catch {
        done();
      }
    });
  }

  // ==========================================
  // Generic Transaction & Query Helpers
  // ==========================================

  public async get<T>(storeName: StoreName, key: IDBValidKey): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async put<T>(storeName: StoreName, value: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async delete(storeName: StoreName, key: IDBValidKey): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async getByIndex<T>(
    storeName: StoreName,
    indexName: string,
    query: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(query);
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async clear(storeName: StoreName): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async transaction<R>(
    storeNames: StoreName[],
    mode: IDBTransactionMode,
    callback: (stores: Record<StoreName, IDBObjectStore>) => Promise<R> | R
  ): Promise<R> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, mode);
      const storeMap = {} as Record<StoreName, IDBObjectStore>;
      storeNames.forEach((s) => {
        storeMap[s] = tx.objectStore(s);
      });

      let callbackResult: R;
      let executed = false;

      try {
        const res = callback(storeMap);
        if (res instanceof Promise) {
          res
            .then((r) => {
              callbackResult = r;
              executed = true;
            })
            .catch((err) => {
              try {
                tx.abort();
              } catch {
                // ignore
              }
              reject(err);
            });
        } else {
          callbackResult = res;
          executed = true;
        }
      } catch (err) {
        try {
          tx.abort();
        } catch {
          // ignore
        }
        reject(err);
      }

      tx.oncomplete = () => {
        resolve(callbackResult);
      };
      tx.onerror = () => {
        reject(tx.error || new Error('Transaction failed'));
      };
      tx.onabort = () => {
        reject(tx.error || new Error('Transaction aborted'));
      };
    });
  }
}

export function getIndexedDBEngine(): IndexedDBEngine {
  return IndexedDBEngine.getInstance();
}

