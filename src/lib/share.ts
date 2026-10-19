/**
 * Pure share-card stat formatting (FEAT-006, Feature 7).
 *
 * Framework-free (NO React, NO @/db) so it stays unit-testable. Produces the
 * emoji-free Indonesian stat lines that ShareCard draws onto the Canvas, using
 * the centralized copy voice. `now` is never read here — the caller injects the
 * already-derived totals/streaks, keeping this a pure projection.
 */
import { copy } from "@/lib/copy";

export interface ShareStatsInput {
  currentStreak: number;
  totalHours: number;
  totalFasts: number;
  methodLabel: string;
}

/**
 * Emoji-free stat lines for the share card, in display order:
 * streak, total jam, total puasa, metode. Hours are rounded to a whole number
 * so the card stays clean; counts pass through as-is.
 */
export function formatShareStats(input: ShareStatsInput): string[] {
  const { currentStreak, totalHours, totalFasts, methodLabel } = input;
  return [
    `${copy.share.statStreak}: ${currentStreak} ${copy.share.unitDay}`,
    `${copy.share.statTotalHours}: ${Math.round(totalHours)} ${copy.share.unitHour}`,
    `${copy.share.statTotalFasts}: ${totalFasts} ${copy.share.unitFast}`,
    `${copy.share.statMethod}: ${methodLabel}`,
  ];
}
