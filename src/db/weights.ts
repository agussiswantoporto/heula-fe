/**
 * Weight persistence helpers over the Dexie `weights` table (design Sections
 * 9 & 18).
 *
 * Every call is wrapped in try/catch so quota/blocked failures are recoverable
 * no-ops rather than thrown errors: the UI surfaces a friendly toast while a
 * dev-only `console.error` keeps the detail for debugging.
 *
 * Client-only: this module imports `db` and may be imported ONLY from
 * "use client" modules (ESLint-enforced, design Section 9).
 */
import { db } from "@/db/db";
import type { WeightRecord } from "@/types";

const DEV = process.env.NODE_ENV !== "production";

function devError(message: string, err: unknown): void {
  if (DEV) console.error(`[weights] ${message}`, err);
}

/** Insert a new weight record; returns the generated id or null on failure. */
export async function add(record: WeightRecord): Promise<number | null> {
  try {
    return await db.weights.add(record);
  } catch (err) {
    devError("add failed", err);
    return null;
  }
}

/** Delete a weight record by id; resolves to whether the delete succeeded. */
export async function remove(id: number): Promise<boolean> {
  try {
    await db.weights.delete(id);
    return true;
  } catch (err) {
    devError("remove failed", err);
    return false;
  }
}

/** All weight records ordered by recordedAt ascending (oldest first). */
export async function all(): Promise<WeightRecord[]> {
  try {
    return await db.weights.orderBy("recordedAt").toArray();
  } catch (err) {
    devError("all failed", err);
    return [];
  }
}

/** Clear every weight record (used by resetAll); resolves to success. */
export async function clear(): Promise<boolean> {
  try {
    await db.weights.clear();
    return true;
  } catch (err) {
    devError("clear failed", err);
    return false;
  }
}
