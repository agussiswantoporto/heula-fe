import { describe, expect, it } from "vitest";
import {
  bmiSeries,
  changeOverPeriod,
  deltas,
  extremes,
  latest,
  sortByTime,
  trendPoints,
} from "@/lib/weight";
import { computeBmi } from "@/lib/bmi";
import type { WeightRecord } from "@/types";

const DAY = 86_400_000;

// Fixed reference now: 2024-06-10T12:00:00Z.
const NOW = Date.UTC(2024, 5, 10, 12, 0, 0);

function record(recordedAt: number, weightKg: number): WeightRecord {
  return { recordedAt, weightKg };
}

describe("empty list", () => {
  it("returns safe null/empty values", () => {
    expect(latest([])).toBeNull();
    expect(deltas([])).toEqual({ fromPrevious: null, fromFirst: null });
    expect(extremes([])).toBeNull();
    expect(bmiSeries([], 170)).toEqual([]);
    expect(trendPoints([])).toEqual([]);
    expect(changeOverPeriod([], NOW, 7)).toBeNull();
  });
});

describe("single entry", () => {
  const list = [record(NOW - DAY, 70)];

  it("has no deltas and equal extremes", () => {
    expect(deltas(list)).toEqual({ fromPrevious: null, fromFirst: null });
    const ext = extremes(list);
    expect(ext).not.toBeNull();
    expect(ext?.min).toBe(70);
    expect(ext?.max).toBe(70);
  });

  it("returns the single entry as latest", () => {
    expect(latest(list)?.weightKg).toBe(70);
  });

  it("has no change over period with a single entry in-window", () => {
    expect(changeOverPeriod(list, NOW, 7)).toBeNull();
  });
});

describe("multi-entry", () => {
  // Intentionally unsorted input to exercise sortByTime.
  const list = [
    record(NOW - 1 * DAY, 68),
    record(NOW - 5 * DAY, 72),
    record(NOW - 3 * DAY, 70),
  ];

  it("sorts ascending by recordedAt", () => {
    const sorted = sortByTime(list);
    expect(sorted.map((r) => r.weightKg)).toEqual([72, 70, 68]);
  });

  it("picks the most recent as latest", () => {
    expect(latest(list)?.weightKg).toBe(68);
  });

  it("computes deltas from previous and first", () => {
    const d = deltas(list);
    expect(d.fromPrevious).toBeCloseTo(68 - 70, 10);
    expect(d.fromFirst).toBeCloseTo(68 - 72, 10);
  });

  it("finds min and max extremes", () => {
    expect(extremes(list)).toEqual({ min: 68, max: 72 });
  });

  it("returns ascending chart points", () => {
    expect(trendPoints(list)).toEqual([
      { recordedAt: NOW - 5 * DAY, weightKg: 72 },
      { recordedAt: NOW - 3 * DAY, weightKg: 70 },
      { recordedAt: NOW - 1 * DAY, weightKg: 68 },
    ]);
  });
});

describe("changeOverPeriod window boundary", () => {
  // One entry well outside the 7-day window, two inside it.
  const list = [
    record(NOW - 20 * DAY, 80), // outside
    record(NOW - 6 * DAY, 74), // inside (oldest in-window)
    record(NOW - 1 * DAY, 71), // inside (latest in-window)
  ];

  it("only counts entries inside the trailing window", () => {
    // Latest in-window minus oldest in-window: 71 - 74 = -3.
    expect(changeOverPeriod(list, NOW, 7)).toBeCloseTo(-3, 10);
  });

  it("returns null when fewer than two entries fall inside the window", () => {
    const sparse = [record(NOW - 20 * DAY, 80), record(NOW - 1 * DAY, 71)];
    // 30-day window catches both entries -> real change.
    expect(changeOverPeriod(sparse, NOW, 30)).toBeCloseTo(71 - 80, 10);
    // 7-day window leaves only the newest entry inside -> null.
    expect(changeOverPeriod(sparse, NOW, 7)).toBeNull();
  });
});

describe("bmiSeries", () => {
  const list = [record(NOW - 3 * DAY, 70), record(NOW - 1 * DAY, 68)];

  it("recomputes BMI against a valid height", () => {
    const series = bmiSeries(list, 170);
    expect(series).toHaveLength(2);
    expect(series[0]).toEqual({
      recordedAt: NOW - 3 * DAY,
      bmi: computeBmi(170, 70),
    });
    expect(series[1].bmi).toBeCloseTo(computeBmi(170, 68), 10);
  });

  it("returns [] when height is missing", () => {
    expect(bmiSeries(list)).toEqual([]);
  });

  it("returns [] when height is out of valid bounds", () => {
    expect(bmiSeries(list, 10)).toEqual([]);
  });
});
