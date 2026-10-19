/**
 * Pure weight-trend library (framework-free, no React imports, no @/db import).
 *
 * Derives trend readouts from a list of WeightRecord entries: latest value,
 * deltas (vs previous / vs first), extremes, change over a trailing window, a
 * BMI-over-time series tied to profiling height, and the point list the chart
 * renders. Pure and deterministic: `now` is injected by callers rather than
 * read from the clock, mirroring the conventions of src/lib/stats.ts and
 * src/lib/bmi.ts.
 */
import { computeBmi, isValidHeight } from "@/lib/bmi";
import type { WeightRecord } from "@/types";

const MS_PER_DAY = 86_400_000;

/** Return a new list sorted by recordedAt ascending (oldest -> newest). */
export function sortByTime(list: WeightRecord[]): WeightRecord[] {
  return [...list].sort((a, b) => a.recordedAt - b.recordedAt);
}

/** The most recent entry, or null when the list is empty. */
export function latest(list: WeightRecord[]): WeightRecord | null {
  if (list.length === 0) return null;
  const sorted = sortByTime(list);
  return sorted[sorted.length - 1];
}

/**
 * Weight change readouts. `fromPrevious` is latest minus the entry before it,
 * `fromFirst` is latest minus the oldest. Both are null when fewer than two
 * entries exist (nothing to compare against yet).
 */
export function deltas(list: WeightRecord[]): {
  fromPrevious: number | null;
  fromFirst: number | null;
} {
  if (list.length < 2) return { fromPrevious: null, fromFirst: null };
  const sorted = sortByTime(list);
  const last = sorted[sorted.length - 1].weightKg;
  const prev = sorted[sorted.length - 2].weightKg;
  const first = sorted[0].weightKg;
  return { fromPrevious: last - prev, fromFirst: last - first };
}

/** Lightest and heaviest logged weight, or null when the list is empty. */
export function extremes(
  list: WeightRecord[],
): { min: number; max: number } | null {
  if (list.length === 0) return null;
  let min = list[0].weightKg;
  let max = list[0].weightKg;
  for (const r of list) {
    if (r.weightKg < min) min = r.weightKg;
    if (r.weightKg > max) max = r.weightKg;
  }
  return { min, max };
}

/**
 * Weight change within the trailing `days` window ending at `now`: the latest
 * entry inside the window minus the oldest entry inside the window. Returns
 * null when fewer than two entries fall inside the window (not enough data to
 * describe a change).
 */
export function changeOverPeriod(
  list: WeightRecord[],
  now: number,
  days: number,
): number | null {
  const since = now - days * MS_PER_DAY;
  const inWindow = sortByTime(list).filter((r) => r.recordedAt >= since);
  if (inWindow.length < 2) return null;
  return inWindow[inWindow.length - 1].weightKg - inWindow[0].weightKg;
}

/**
 * BMI-over-time series computed from each entry's weight against a fixed
 * profiling height. Returns [] when heightCm is missing or outside the valid
 * bounds, so callers can gracefully hide the BMI-over-time readout while still
 * allowing weight logging.
 */
export function bmiSeries(
  list: WeightRecord[],
  heightCm?: number,
): { recordedAt: number; bmi: number }[] {
  if (heightCm === undefined || !isValidHeight(heightCm)) return [];
  return sortByTime(list).map((r) => ({
    recordedAt: r.recordedAt,
    bmi: computeBmi(heightCm, r.weightKg),
  }));
}

/** Chart-ready points (ascending by time) of weight over time. */
export function trendPoints(
  list: WeightRecord[],
): { recordedAt: number; weightKg: number }[] {
  return sortByTime(list).map((r) => ({
    recordedAt: r.recordedAt,
    weightKg: r.weightKg,
  }));
}
