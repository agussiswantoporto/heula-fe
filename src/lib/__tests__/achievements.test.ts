import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  unlockedCount,
} from "@/lib/achievements";
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

/** N consecutive days ending today, one `hours`-long fast each. */
function consecutiveDays(count: number, hours: number): FastingSessionRecord[] {
  return Array.from({ length: count }, (_, i) =>
    session(NOW - i * DAY, hours),
  );
}

function resultById(
  sessions: FastingSessionRecord[],
  id: string,
) {
  const results = evaluateAchievements({ sessions, now: NOW });
  const found = results.find((r) => r.achievement.id === id);
  if (!found) throw new Error(`missing achievement ${id}`);
  return found;
}

describe("evaluateAchievements — empty history", () => {
  it("unlocks nothing and reports zero progress", () => {
    const results = evaluateAchievements({ sessions: [], now: NOW });
    expect(results).toHaveLength(ACHIEVEMENTS.length);
    expect(unlockedCount(results)).toBe(0);
    for (const r of results) {
      expect(r.unlocked).toBe(false);
      expect(r.progress).toBe(0);
    }
  });
});

describe("first_fast milestone", () => {
  it("locked at 0 fasts, unlocked at 1", () => {
    expect(resultById([], "first_fast").unlocked).toBe(false);
    expect(resultById([session(NOW, 10)], "first_fast").unlocked).toBe(true);
  });
});

describe("first_18h milestone", () => {
  it("locked just below 18h, unlocked at 18h", () => {
    expect(resultById([session(NOW, 17.99)], "first_18h").unlocked).toBe(false);
    expect(resultById([session(NOW, 18)], "first_18h").unlocked).toBe(true);
  });
});

describe("longest_fast milestone (24h)", () => {
  it("locked just below 24h, unlocked at 24h", () => {
    expect(resultById([session(NOW, 23.99)], "longest_fast").unlocked).toBe(
      false,
    );
    expect(resultById([session(NOW, 24)], "longest_fast").unlocked).toBe(true);
  });
});

describe("fasts count milestones (10/50/100)", () => {
  it("fasts_10 boundary + progress", () => {
    const nine = Array.from({ length: 9 }, () => session(NOW, 12));
    const ten = Array.from({ length: 10 }, () => session(NOW, 12));
    expect(resultById(nine, "fasts_10").unlocked).toBe(false);
    expect(resultById(nine, "fasts_10").progress).toBeCloseTo(0.9, 10);
    expect(resultById(ten, "fasts_10").unlocked).toBe(true);
    expect(resultById(ten, "fasts_10").progress).toBe(1);
  });

  it("fasts_50 boundary", () => {
    const n49 = Array.from({ length: 49 }, () => session(NOW, 12));
    const n50 = Array.from({ length: 50 }, () => session(NOW, 12));
    expect(resultById(n49, "fasts_50").unlocked).toBe(false);
    expect(resultById(n50, "fasts_50").unlocked).toBe(true);
  });

  it("fasts_100 boundary", () => {
    const n99 = Array.from({ length: 99 }, () => session(NOW, 12));
    const n100 = Array.from({ length: 100 }, () => session(NOW, 12));
    expect(resultById(n99, "fasts_100").unlocked).toBe(false);
    expect(resultById(n100, "fasts_100").unlocked).toBe(true);
  });
});

describe("hours_100 milestone", () => {
  it("locked just below 100h, unlocked at 100h, progress scales", () => {
    // 5 fasts * 19.8h = 99h total.
    const under = Array.from({ length: 5 }, () => session(NOW, 19.8));
    // 5 fasts * 20h = 100h total.
    const at = Array.from({ length: 5 }, () => session(NOW, 20));
    expect(resultById(under, "hours_100").unlocked).toBe(false);
    expect(resultById(under, "hours_100").progress).toBeCloseTo(0.99, 10);
    expect(resultById(at, "hours_100").unlocked).toBe(true);
    expect(resultById(at, "hours_100").progress).toBe(1);
  });
});

describe("streak milestones (7/30)", () => {
  it("streak_7 boundary + progress", () => {
    const six = consecutiveDays(6, 12);
    const seven = consecutiveDays(7, 12);
    expect(resultById(six, "streak_7").unlocked).toBe(false);
    expect(resultById(six, "streak_7").progress).toBeCloseTo(6 / 7, 10);
    expect(resultById(seven, "streak_7").unlocked).toBe(true);
    expect(resultById(seven, "streak_7").progress).toBe(1);
  });

  it("streak_30 boundary", () => {
    const n29 = consecutiveDays(29, 12);
    const n30 = consecutiveDays(30, 12);
    expect(resultById(n29, "streak_30").unlocked).toBe(false);
    expect(resultById(n30, "streak_30").unlocked).toBe(true);
  });
});

describe("unlockedCount", () => {
  it("counts how many milestones are unlocked", () => {
    // One 24h fast unlocks: first_fast, first_18h, longest_fast.
    const results = evaluateAchievements({
      sessions: [session(NOW, 24)],
      now: NOW,
    });
    expect(unlockedCount(results)).toBe(3);
  });
});
