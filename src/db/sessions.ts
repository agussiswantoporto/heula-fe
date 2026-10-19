/**
 * Session persistence helpers over the Dexie `sessions` table (design Sections
 * 9 & 18).
 *
 * Every call is wrapped in try/catch so quota/blocked failures are recoverable
 * no-ops rather than thrown errors: the UI surfaces a friendly toast while a
 * dev-only `console.error` keeps the detail for debugging. `now` is injected
 * into `last7Days` so the trailing-window math stays deterministic.
 *
 * Client-only: this module imports `db` and may be imported ONLY from
 * "use client" modules (ESLint-enforced, design Section 9).
 */
import { db } from "@/db/db";
import type { FastingSessionRecord, Mood } from "@/types";

const DEV = process.env.NODE_ENV !== "production";
const MS_PER_DAY = 86_400_000;

function devError(message: string, err: unknown): void {
  if (DEV) console.error(`[sessions] ${message}`, err);
}

/** Insert a new session; returns the generated id or null on failure. */
export async function add(
  record: FastingSessionRecord,
): Promise<number | null> {
  try {
    return await db.sessions.add(record);
  } catch (err) {
    devError("add failed", err);
    return null;
  }
}

/** Delete a session by id; resolves to whether the delete succeeded. */
export async function remove(id: number): Promise<boolean> {
  try {
    await db.sessions.delete(id);
    return true;
  } catch (err) {
    devError("remove failed", err);
    return false;
  }
}

/** All sessions ordered by startMs descending (newest first). */
export async function all(): Promise<FastingSessionRecord[]> {
  try {
    return await db.sessions.orderBy("startMs").reverse().toArray();
  } catch (err) {
    devError("all failed", err);
    return [];
  }
}

/** Attach/overwrite the optional mood/note on a session; resolves to success. */
export async function setMoodNote(
  id: number,
  patch: { mood?: Mood; note?: string },
): Promise<boolean> {
  try {
    await db.sessions.update(id, patch);
    return true;
  } catch (err) {
    devError("setMoodNote failed", err);
    return false;
  }
}

/** Clear every session (used by resetAll); resolves to success. */
export async function clear(): Promise<boolean> {
  try {
    await db.sessions.clear();
    return true;
  } catch (err) {
    devError("clear failed", err);
    return false;
  }
}

/**
 * Sessions started within the trailing 7 calendar days (startMs >= now - 7d),
 * ordered by startMs descending.
 */
export async function last7Days(
  now: number,
): Promise<FastingSessionRecord[]> {
  try {
    const since = now - 7 * MS_PER_DAY;
    return await db.sessions
      .where("startMs")
      .aboveOrEqual(since)
      .reverse()
      .sortBy("startMs");
  } catch (err) {
    devError("last7Days failed", err);
    return [];
  }
}
