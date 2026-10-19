import { describe, expect, it } from "vitest";
import { moodBreakdown } from "@/lib/mood";
import type { FastingSessionRecord, Mood } from "@/types";

const H = 3_600_000;

function session(mood?: Mood): FastingSessionRecord {
  const durationMs = 16 * H;
  return {
    planId: "16:8",
    planLabel: "16:8",
    targetHours: 16,
    startMs: 0,
    endMs: durationMs,
    durationMs,
    completed: true,
    createdAt: 0,
    mood,
  };
}

describe("moodBreakdown", () => {
  it("returns all zeros for an empty list", () => {
    expect(moodBreakdown([])).toEqual({
      energik: 0,
      biasa: 0,
      lemes: 0,
      lapar: 0,
    });
  });

  it("ignores rows where mood is undefined", () => {
    const sessions = [session(), session(), session("energik")];
    expect(moodBreakdown(sessions)).toEqual({
      energik: 1,
      biasa: 0,
      lemes: 0,
      lapar: 0,
    });
  });

  it("counts sessions per mood across a mixed list", () => {
    const sessions = [
      session("energik"),
      session("energik"),
      session("biasa"),
      session("lemes"),
      session(),
      session("lapar"),
      session("lemes"),
      session("lemes"),
    ];
    expect(moodBreakdown(sessions)).toEqual({
      energik: 2,
      biasa: 1,
      lemes: 3,
      lapar: 1,
    });
  });
});
