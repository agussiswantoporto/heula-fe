/**
 * Dexie IndexedDB database (design Section 9).
 *
 * Top-level singleton with NO `typeof window` guard and NO factory. Correctness
 * depends on a single enforced rule: `src/db/*` is imported ONLY from
 * "use client" modules. Dexie 4 tolerates `new Dexie(...)` without `indexedDB`
 * present (it does not touch IndexedDB until a query runs), but server imports
 * are forbidden so no server render ever constructs or queries the DB.
 */
import Dexie, { type Table } from "dexie";
import type { FastingSessionRecord } from "@/types";

export class HeulaDB extends Dexie {
  sessions!: Table<FastingSessionRecord, number>;

  constructor() {
    super("heula");
    this.version(1).stores({
      // ++id auto PK; index startMs & createdAt for ordering/grouping;
      // completed for stats; planId for per-plan filtering.
      sessions: "++id, startMs, createdAt, completed, planId",
    });
  }
}

export const db = new HeulaDB();
