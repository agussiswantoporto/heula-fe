/**
 * Pure adaptive recommendation (FEAT-003).
 *
 * `suggestAdaptive` reads fasting history + the chosen method + profiling and
 * returns a single, nullable, additive suggestion that LEARNS from behaviour:
 * level up when the user is consistently finishing, ease down when they keep
 * stopping early, or just encourage an active streak. It NEVER auto-changes the
 * method — the UI only navigates to the Plan Picker where the user confirms.
 *
 * Framework-free (no React, no @/db) and deterministic: `now` is injected, so
 * there is no Date.now() in the core.
 *
 * SAFETY INVARIANTS (must stay intact — see recommendation.ts):
 *   - The step-up ladder is 14:10 -> 16:8 -> 18:6 and is CAPPED at 18:6 unless
 *     canOfferAggressive(profiling) is true.
 *   - 20:4 may be emitted as `toMethod` ONLY when profiling is non-null AND
 *     canOfferAggressive(profiling) is true. omad is NEVER a `toMethod`.
 *   - A heavy exerciser is never leveled into aggression: canOfferAggressive is
 *     false for them, so the cap at 18:6 always holds. An explicit heavy guard
 *     keeps that intent obvious even if the predicate ever changes.
 *   - When profiling is null, no aggressive suggestion can ever be produced.
 */
import type {
  FastingSessionRecord,
  MethodId,
  ProfilingAnswers,
} from "@/types";
import { canOfferAggressive } from "@/lib/recommendation";
import { streaks } from "@/lib/stats";
import { copy } from "@/lib/copy";
import { METHODS } from "@/lib/methods";

/** The gentle->firm step ladder. Step-ups walk forward; ease-downs walk back. */
const LADDER: MethodId[] = ["14:10", "16:8", "18:6"];

/** The single aggressive step a weight-loss, aggressive-eligible user may reach. */
const AGGRESSIVE_NEXT: MethodId = "20:4";

/** How many of the most recent sessions the heuristics look at. */
const WINDOW = 5;
/** Need at least this many recent sessions before suggesting anything. */
const MIN_SESSIONS = 3;
/** completed-ratio at/above this over the window => "consistent" (level up). */
const LEVEL_UP_RATIO = 0.8;
/** completed-ratio at/below this over the window => "frequent early stops". */
const EASE_DOWN_RATIO = 0.4;
/** A current streak at/above this counts as "healthy" for encouragement. */
const HEALTHY_STREAK = 3;

export interface AdaptiveSuggestion {
  kind: "level_up" | "ease_down" | "streak";
  fromMethod?: MethodId;
  toMethod?: MethodId;
  message: string;
}

export interface AdaptiveInput {
  history: FastingSessionRecord[];
  chosenMethod: MethodId;
  profiling: ProfilingAnswers | null;
  now: number;
}

/** Human-facing method label, falling back to the id for any custom plan. */
function label(method: MethodId): string {
  return METHODS[method]?.label ?? method;
}

/** True when the profiling describes a heavy exerciser (never aggress them). */
function isHeavyExerciser(profiling: ProfilingAnswers | null): boolean {
  return (
    profiling !== null &&
    profiling.exercises === true &&
    profiling.intensity === "heavy"
  );
}

/**
 * The next ladder step up from `method`, respecting the aggressive cap.
 *
 * Returns null when the user is already at the top they are allowed to reach:
 *   - At or past 18:6 and not aggressive-eligible -> capped, no suggestion.
 *   - At 18:6 and aggressive-eligible -> may step to 20:4 (never omad).
 *   - Off-ladder (custom / 20:4 / omad already) -> no level-up suggestion.
 */
function nextStepUp(
  method: MethodId,
  profiling: ProfilingAnswers | null,
): MethodId | null {
  const idx = LADDER.indexOf(method);
  if (idx === -1) return null; // off the gentle ladder: do not level up.

  const next = LADDER[idx + 1];
  if (next !== undefined) return next; // 14:10->16:8 or 16:8->18:6.

  // At the top of the gentle ladder (18:6). Only an aggressive-eligible,
  // non-heavy, profiled user may step once more, and only to 20:4.
  if (
    profiling !== null &&
    !isHeavyExerciser(profiling) &&
    canOfferAggressive(profiling)
  ) {
    return AGGRESSIVE_NEXT;
  }
  return null; // capped at 18:6.
}

/** The next ladder step down from `method`, never below 14:10. */
function nextStepDown(method: MethodId): MethodId | null {
  const idx = LADDER.indexOf(method);
  if (idx <= 0) return null; // already at the floor or off the ladder.
  return LADDER[idx - 1];
}

/**
 * Produce a single adaptive suggestion from recent history, or null.
 *
 * Rule order (first match wins):
 *   (a) fewer than MIN_SESSIONS recent sessions -> null.
 *   (b) consistent completion over the window and a valid step-up -> level_up.
 *   (c) frequent early stops over the window and a valid step-down -> ease_down.
 *   (d) otherwise a healthy current streak -> streak encouragement (no method).
 *   else -> null.
 */
export function suggestAdaptive(
  input: AdaptiveInput,
): AdaptiveSuggestion | null {
  const { history, chosenMethod, profiling, now } = input;

  // Most recent WINDOW sessions by start time (newest first), copy before sort.
  const recent = [...history]
    .sort((a, b) => b.startMs - a.startMs)
    .slice(0, WINDOW);

  // (a) Not enough signal yet.
  if (recent.length < MIN_SESSIONS) return null;

  const completedCount = recent.filter((s) => s.completed).length;
  const ratio = completedCount / recent.length;

  // (b) Consistent finisher -> propose the next (capped/safe) step up.
  if (ratio >= LEVEL_UP_RATIO) {
    const toMethod = nextStepUp(chosenMethod, profiling);
    if (toMethod !== null) {
      return {
        kind: "level_up",
        fromMethod: chosenMethod,
        toMethod,
        message: copy.adaptive.levelUp(label(chosenMethod), label(toMethod)),
      };
    }
  }

  // (c) Frequent early stops -> propose easing down one step (never below 14:10).
  if (ratio <= EASE_DOWN_RATIO) {
    const toMethod = nextStepDown(chosenMethod);
    if (toMethod !== null) {
      return {
        kind: "ease_down",
        fromMethod: chosenMethod,
        toMethod,
        message: copy.adaptive.easeDown(label(chosenMethod), label(toMethod)),
      };
    }
  }

  // (d) No clear level signal but an active streak -> encourage, no method change.
  const { current } = streaks(history, now);
  if (current >= HEALTHY_STREAK) {
    return { kind: "streak", message: copy.adaptive.streak };
  }

  return null;
}
