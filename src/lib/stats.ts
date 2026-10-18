/**
 * Pure stats derivations over FastingSessionRecord[] (design Section 10).
 *
 * All functions are pure; `now` is injected for streak/weekly bucketing so the
 * results are deterministic and unit-testable. Date bucketing uses date-fns.
 */
import {
  differenceInCalendarDays,
  format,
  startOfDay,
} from "date-fns";
import type { FastingSessionRecord } from "@/types";

const MS_PER_HOUR = 3_600_000;

export interface Totals {
  totalFasts: number;
  totalHours: number;
  averageHours: number;
}

export interface Streaks {
  current: number;
  longest: number;
}

export interface WeeklyBucket {
  dayKey: string;
  label: string;
  totalHours: number;
}

/** Totals across all sessions (average over all recorded durations). */
export function totals(sessions: FastingSessionRecord[]): Totals {
  const totalFasts = sessions.length;
  const totalMs = sessions.reduce((sum, s) => sum + s.durationMs, 0);
  const totalHours = totalMs / MS_PER_HOUR;
  const averageHours = totalFasts > 0 ? totalHours / totalFasts : 0;
  return { totalFasts, totalHours, averageHours };
}

/**
 * Current and longest streaks of consecutive days with at least one session.
 * Current streak counts consecutive days ending today or yesterday (a 1-day
 * grace so an in-progress day does not break the streak).
 */
export function streaks(
  sessions: FastingSessionRecord[],
  now: number,
): Streaks {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  // Distinct calendar days (as day-start epoch ms) that have >= 1 session.
  const dayStarts = new Set<number>();
  for (const s of sessions) {
    dayStarts.add(startOfDay(s.startMs).getTime());
  }
  const days = [...dayStarts].sort((a, b) => a - b);

  // Longest run of consecutive calendar days.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = differenceInCalendarDays(days[i], days[i - 1]);
    if (gap === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }

  // Current streak: walk back from the most recent active day, which must be
  // today or yesterday (grace of 1 day) to count as current.
  const today = startOfDay(now).getTime();
  const mostRecent = days[days.length - 1];
  const gapFromToday = differenceInCalendarDays(today, mostRecent);
  let current = 0;
  if (gapFromToday <= 1) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (differenceInCalendarDays(days[i], days[i - 1]) === 1) {
        current += 1;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

/**
 * Last 7 calendar days (oldest -> newest) of total fasting hours, for the bar
 * chart. Each bucket sums the durations of sessions started on that day.
 */
export function weekly(
  sessions: FastingSessionRecord[],
  now: number,
): WeeklyBucket[] {
  const todayStart = startOfDay(now);
  const buckets: WeeklyBucket[] = [];

  for (let offset = 6; offset >= 0; offset--) {
    const dayStart = new Date(todayStart);
    dayStart.setDate(dayStart.getDate() - offset);
    buckets.push({
      dayKey: format(dayStart, "yyyy-MM-dd"),
      label: format(dayStart, "EEE"),
      totalHours: 0,
    });
  }

  const indexByKey = new Map<string, number>();
  buckets.forEach((b, i) => indexByKey.set(b.dayKey, i));

  for (const s of sessions) {
    const key = format(startOfDay(s.startMs), "yyyy-MM-dd");
    const idx = indexByKey.get(key);
    if (idx !== undefined) {
      buckets[idx].totalHours += s.durationMs / MS_PER_HOUR;
    }
  }

  return buckets;
}
