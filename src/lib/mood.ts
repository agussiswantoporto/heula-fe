/**
 * Pure mood-aggregation library (framework-free, no React imports, no @/db
 * import).
 *
 * Counts how a fast felt across a list of sessions. The optional `mood` field
 * is undefined on older persisted rows (added in FEAT-001), so those rows are
 * ignored rather than crashing the tally. Pure and deterministic, mirroring the
 * conventions of src/lib/stats.ts and src/lib/weight.ts.
 */
import type { FastingSessionRecord, Mood } from "@/types";

/** Every Mood initialised to zero, used as the aggregation seed. */
function emptyBreakdown(): Record<Mood, number> {
  return { energik: 0, biasa: 0, lemes: 0, lapar: 0 };
}

/**
 * Count sessions per mood. Rows where `mood` is undefined (older records that
 * predate the capture sheet) are skipped, so an empty or mood-less list yields
 * all zeros.
 */
export function moodBreakdown(
  sessions: FastingSessionRecord[],
): Record<Mood, number> {
  const acc = emptyBreakdown();
  for (const s of sessions) {
    if (s.mood === undefined) continue;
    acc[s.mood] += 1;
  }
  return acc;
}
