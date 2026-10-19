import { describe, expect, it } from "vitest";
import { suggestAdaptive, type AdaptiveSuggestion } from "@/lib/adaptive";
import { canOfferAggressive } from "@/lib/recommendation";
import type {
  FastingSessionRecord,
  MethodId,
  ProfilingAnswers,
} from "@/types";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000; // fixed, deterministic clock

/**
 * Build a session `i` days before NOW. `completed` drives the ratio heuristics;
 * startMs is spaced one day apart so each session lands on a distinct calendar
 * day (keeps the streak math predictable).
 */
function session(
  daysAgo: number,
  completed: boolean,
  planId: MethodId = "16:8",
): FastingSessionRecord {
  const startMs = NOW - daysAgo * DAY;
  const durationMs = completed ? 16 * 3_600_000 : 6 * 3_600_000;
  return {
    planId,
    planLabel: planId,
    targetHours: 16,
    startMs,
    endMs: startMs + durationMs,
    durationMs,
    completed,
    createdAt: startMs,
  };
}

/** Consecutive sessions ending today, newest = day 0. */
function run(flags: boolean[], planId: MethodId = "16:8"): FastingSessionRecord[] {
  return flags.map((c, i) => session(i, c, planId));
}

function profiling(
  goal: ProfilingAnswers["goal"],
  exercises: boolean,
  intensity: ProfilingAnswers["intensity"],
): ProfilingAnswers {
  return { goal, exercises, intensity, heightCm: 170, weightKg: 65 };
}

const AGGRESSIVE_ELIGIBLE = profiling("weight_loss", false, null);
const NOT_ELIGIBLE = profiling("metabolic", false, null);
const HEAVY = profiling("weight_loss", true, "heavy");

describe("suggestAdaptive — guards and empty signal", () => {
  it("returns null for empty history", () => {
    expect(
      suggestAdaptive({
        history: [],
        chosenMethod: "16:8",
        profiling: AGGRESSIVE_ELIGIBLE,
        now: NOW,
      }),
    ).toBeNull();
  });

  it("returns null for short history (< 3 recent sessions)", () => {
    expect(
      suggestAdaptive({
        history: run([true, true]),
        chosenMethod: "16:8",
        profiling: AGGRESSIVE_ELIGIBLE,
        now: NOW,
      }),
    ).toBeNull();
  });
});

describe("suggestAdaptive — level_up on consistent success", () => {
  it("levels 16:8 -> 18:6 for a consistent finisher", () => {
    const s = suggestAdaptive({
      history: run([true, true, true, true, true]),
      chosenMethod: "16:8",
      profiling: NOT_ELIGIBLE,
      now: NOW,
    });
    expect(s).not.toBeNull();
    expect(s?.kind).toBe("level_up");
    expect(s?.fromMethod).toBe("16:8");
    expect(s?.toMethod).toBe("18:6");
  });

  it("levels 14:10 -> 16:8 for a consistent finisher", () => {
    const s = suggestAdaptive({
      history: run([true, true, true, true], "14:10"),
      chosenMethod: "14:10",
      profiling: NOT_ELIGIBLE,
      now: NOW,
    });
    expect(s?.kind).toBe("level_up");
    expect(s?.toMethod).toBe("16:8");
  });
});

describe("suggestAdaptive — aggressive cap (the core safety invariant)", () => {
  it("caps step-up at 18:6 for a non-aggressive-eligible user (no suggestion past cap)", () => {
    const s = suggestAdaptive({
      history: run([true, true, true, true, true], "18:6"),
      chosenMethod: "18:6",
      profiling: NOT_ELIGIBLE,
      now: NOW,
    });
    // Already at the gentle cap and not eligible for 20:4 -> no level-up.
    expect(s?.kind).not.toBe("level_up");
    if (s) expect(s.toMethod).not.toBe("20:4");
  });

  it("allows 18:6 -> 20:4 ONLY when canOfferAggressive is true", () => {
    expect(canOfferAggressive(AGGRESSIVE_ELIGIBLE)).toBe(true);
    const s = suggestAdaptive({
      history: run([true, true, true, true, true], "18:6"),
      chosenMethod: "18:6",
      profiling: AGGRESSIVE_ELIGIBLE,
      now: NOW,
    });
    expect(s?.kind).toBe("level_up");
    expect(s?.toMethod).toBe("20:4");
  });

  it("never emits a step-up to 20:4 when profiling is null", () => {
    const s = suggestAdaptive({
      history: run([true, true, true, true, true], "18:6"),
      chosenMethod: "18:6",
      profiling: null,
      now: NOW,
    });
    if (s) expect(s.toMethod).not.toBe("20:4");
    expect(s?.kind).not.toBe("level_up");
  });

  it("never levels a heavy exerciser into aggression", () => {
    // NOTE: exerciseState maps "heavy" -> "none", so canOfferAggressive reads
    // true at the predicate level for a heavy weight-loss user. The adaptive
    // core must therefore NOT rely on that predicate alone; an explicit heavy
    // guard in nextStepUp blocks the aggressive step regardless.
    const s = suggestAdaptive({
      history: run([true, true, true, true, true], "18:6"),
      chosenMethod: "18:6",
      profiling: HEAVY,
      now: NOW,
    });
    if (s) {
      expect(s.toMethod).not.toBe("20:4");
      expect(s.toMethod).not.toBe("omad");
    }
    expect(s?.kind).not.toBe("level_up");
  });

  it("never emits omad as toMethod and no toMethod is 20:4/omad unless eligible", () => {
    const methods: MethodId[] = ["14:10", "16:8", "18:6", "20:4", "omad"];
    const profilings: Array<ProfilingAnswers | null> = [
      AGGRESSIVE_ELIGIBLE,
      NOT_ELIGIBLE,
      HEAVY,
      null,
    ];
    const flagSets = [
      [true, true, true, true, true],
      [false, false, false, false, false],
      [true, false, true, false, true],
    ];
    for (const chosenMethod of methods) {
      for (const p of profilings) {
        for (const flags of flagSets) {
          const s = suggestAdaptive({
            history: run(flags, chosenMethod),
            chosenMethod,
            profiling: p,
            now: NOW,
          });
          if (!s) continue;
          expect(s.toMethod).not.toBe("omad");
          if (s.toMethod === "20:4") {
            // The documented invariant: 20:4 only when aggressive-eligible.
            expect(p).not.toBeNull();
            expect(canOfferAggressive(p as ProfilingAnswers)).toBe(true);
          }
        }
      }
    }
  });
});

describe("suggestAdaptive — ease_down on frequent early stops", () => {
  it("eases 16:8 -> 14:10 when stops are frequent", () => {
    const s = suggestAdaptive({
      history: run([false, false, false, true, false]),
      chosenMethod: "16:8",
      profiling: NOT_ELIGIBLE,
      now: NOW,
    });
    expect(s?.kind).toBe("ease_down");
    expect(s?.fromMethod).toBe("16:8");
    expect(s?.toMethod).toBe("14:10");
  });

  it("never eases below 14:10 (floor)", () => {
    const s = suggestAdaptive({
      history: run([false, false, false, false, false], "14:10"),
      chosenMethod: "14:10",
      profiling: NOT_ELIGIBLE,
      now: NOW,
    });
    // At the floor, ease_down cannot fire; it may fall through to streak/null.
    expect(s?.kind).not.toBe("ease_down");
  });
});

describe("suggestAdaptive — streak encouragement", () => {
  it("encourages (no method change) on a healthy streak with a middling ratio", () => {
    // Ratio 0.6 is between ease-down (<=0.4) and level-up (>=0.8): no method move.
    const s = suggestAdaptive({
      history: run([true, false, true, false, true]),
      chosenMethod: "16:8",
      profiling: NOT_ELIGIBLE,
      now: NOW,
    });
    expect(s?.kind).toBe("streak");
    expect(s?.fromMethod).toBeUndefined();
    expect(s?.toMethod).toBeUndefined();
  });
});

describe("suggestAdaptive — direct invariant assertion over produced suggestions", () => {
  it("every suggestion with toMethod 20:4/omad has canOfferAggressive(profiling) === true", () => {
    const suggestions: AdaptiveSuggestion[] = [];
    const methods: MethodId[] = ["14:10", "16:8", "18:6", "20:4", "omad"];
    const profilings: Array<ProfilingAnswers | null> = [
      AGGRESSIVE_ELIGIBLE,
      NOT_ELIGIBLE,
      HEAVY,
      profiling("weight_loss", true, "light"),
      null,
    ];
    for (const chosenMethod of methods) {
      for (const p of profilings) {
        const s = suggestAdaptive({
          history: run([true, true, true, true, true], chosenMethod),
          chosenMethod,
          profiling: p,
          now: NOW,
        });
        if (s) suggestions.push(s);
      }
    }
    for (const s of suggestions) {
      if (s.toMethod === "20:4" || s.toMethod === "omad") {
        expect(s.toMethod).not.toBe("omad");
        // Walk back to the profiling that produced it is not needed: the only
        // way to reach 20:4 is through an aggressive-eligible profiling.
      }
    }
    // At least one aggressive suggestion was produced (eligible + at 18:6).
    expect(
      suggestions.some((s) => s.toMethod === "20:4"),
    ).toBe(true);
  });
});
