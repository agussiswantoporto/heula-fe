/**
 * date-fns-based time formatting + day-grouping helpers (design Section 10).
 *
 * Pure where possible: `now` is injected by callers rather than read from the
 * clock, keeping grouping deterministic and testable.
 */
import { format, startOfDay } from "date-fns";

/** "HH:mm" clock label for a timestamp (e.g. target end time). */
export function formatClock(ms: number): string {
  return format(ms, "HH:mm");
}

/** Full date label, e.g. "Sen, 14 Okt 2024" style via date-fns tokens. */
export function formatDate(ms: number): string {
  return format(ms, "EEE, d MMM yyyy");
}

/** Stable day key (yyyy-MM-dd) used to group sessions by calendar day. */
export function dayKey(ms: number): string {
  return format(startOfDay(ms), "yyyy-MM-dd");
}

/** Short weekday label (e.g. "Sen") for chart axes. */
export function weekdayLabel(ms: number): string {
  return format(ms, "EEE");
}
