import { describe, expect, it } from "vitest";
import { streaks, totals, weekly } from "@/lib/stats";
import type { FastingSessionRecord } from "@/types";

const H = 3_600_000;
const DAY = 24 * H;

// Fixed reference now: 2024-06-10T12:00:00Z.
const NOW = Date.UTC(2024, 5, 10, 12, 0, 0);

function session(
  startMs: number,
  durationHours: number,
  completed = true,
): FastingSessionRecord {
  const durationMs = durationHours * H;
  return {
    planId: "16:8",
    planLabel: "16:8",
    targetHours: 16,
    startMs,
    endMs: startMs + durationMs,
    durationMs,
    completed,
    createdAt: startMs,
  };
}

describe("totals", () => {
  it("sums counts, hours, and average", () => {
    const sessions = [
      session(NOW - DAY, 16),
      session(NOW - 2 * DAY, 18),
      session(NOW - 3 * DAY, 14),
    ];
    const t = totals(sessions);
    expect(t.totalFasts).toBe(3);
    expect(t.totalHours).toBeCloseTo(48, 10);
    expect(t.averageHours).toBeCloseTo(16, 10);
  });

  it("returns zeros for no sessions", () => {
    const t = totals([]);
    expect(t).toEqual({ totalFasts: 0, totalHours: 0, averageHours: 0 });
  });
});

describe("streaks", () => {
  it("returns zeros for no sessions", () => {
    expect(streaks([], NOW)).toEqual({ current: 0, longest: 0 });
  });

  it("counts a consecutive run ending today", () => {
    const sessions = [
      session(NOW, 16), // today
      session(NOW - DAY, 16), // yesterday
      session(NOW - 2 * DAY, 16), // 2 days ago
    ];
    const s = streaks(sessions, NOW);
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
  });

  it("allows a 1-day grace (most recent day = yesterday)", () => {
    const sessions = [
      session(NOW - DAY, 16), // yesterday
      session(NOW - 2 * DAY, 16),
    ];
    const s = streaks(sessions, NOW);
    expect(s.current).toBe(2);
    expect(s.longest).toBe(2);
  });

  it("breaks the current streak when the gap exceeds the grace", () => {
    const sessions = [
      session(NOW - 3 * DAY, 16),
      session(NOW - 4 * DAY, 16),
    ];
    const s = streaks(sessions, NOW);
    expect(s.current).toBe(0);
    expect(s.longest).toBe(2);
  });

  it("tracks the longest run independent of the current run", () => {
    const sessions = [
      session(NOW, 16), // today (current run = 1)
      session(NOW - 5 * DAY, 16), // older run of 3
      session(NOW - 6 * DAY, 16),
      session(NOW - 7 * DAY, 16),
    ];
    const s = streaks(sessions, NOW);
    expect(s.current).toBe(1);
    expect(s.longest).toBe(3);
  });

  it("counts multiple sessions on the same day as one day", () => {
    const sessions = [
      session(NOW, 16),
      session(NOW + H, 10),
      session(NOW - DAY, 16),
    ];
    const s = streaks(sessions, NOW);
    expect(s.current).toBe(2);
    expect(s.longest).toBe(2);
  });
});

describe("weekly", () => {
  it("returns 7 buckets oldest -> newest ending today", () => {
    const w = weekly([], NOW);
    expect(w).toHaveLength(7);
    const todayKey = w[6].dayKey;
    expect(todayKey).toBe("2024-06-10");
  });

  it("sums fasting hours into the correct day bucket", () => {
    const sessions = [
      session(NOW, 16), // today
      session(NOW - 2 * DAY, 18), // 2 days ago
      session(NOW - 10 * DAY, 20), // outside the window -> ignored
    ];
    const w = weekly(sessions, NOW);
    const byKey = Object.fromEntries(w.map((b) => [b.dayKey, b.totalHours]));
    expect(byKey["2024-06-10"]).toBeCloseTo(16, 10);
    expect(byKey["2024-06-08"]).toBeCloseTo(18, 10);
    const total = w.reduce((sum, b) => sum + b.totalHours, 0);
    expect(total).toBeCloseTo(34, 10);
  });
});
