/**
 * Pure recommendation engine (design Section 6).
 *
 * recommendMethod maps a user's profiling answers to a recommended IF method
 * plus ordered alternatives, a rationale, and (for heavy exercisers) a warning.
 * Pure and deterministic: no I/O, no Date.now().
 *
 * Control flow (single technique): a heavy-exercise early guard (R1) returns
 * gentle 14:10 + mandatory warning for any goal, then `switch (goal)` resolves
 * R2-R16 with a `const _exhaustive: never` default as the compile-time
 * exhaustiveness guard.
 */
import type { MethodId, ProfilingAnswers, Recommendation } from "@/types";
import { copy } from "@/lib/copy";

type NonHeavyState = "none" | "light" | "moderate";

/**
 * Classify the exercise load into the three non-heavy buckets used by the
 * decision table. The heavy case (exercises === true && intensity === "heavy")
 * is handled by the R1 early guard in recommendMethod and never reaches here.
 *
 * Mapping (total over all reachable inputs):
 *   exercises === false                              -> "none"  (intensity is null by FR1.3)
 *   exercises === true  && intensity === null         -> "none"  (unspecified load -> gentlest safe default)
 *   exercises === true  && intensity === "light"      -> "light"
 *   exercises === true  && intensity === "moderate"   -> "moderate"
 *   exercises === true  && intensity === "heavy"      -> (unreachable: returned by R1 guard)
 */
export function exerciseState(a: ProfilingAnswers): NonHeavyState {
  if (!a.exercises || a.intensity === null) return "none";
  // intensity is "light" | "moderate" here; "heavy" already returned by the R1 guard.
  return a.intensity === "heavy" ? "none" : a.intensity;
}

function build(
  method: MethodId,
  rationale: string,
  alternatives: MethodId[],
  warning: string | null = null,
): Recommendation {
  return { method, rationale, warning, alternatives };
}

/** R1: heavy exercise, any goal -> gentle 14:10 + mandatory warning. */
function buildHeavy(): Recommendation {
  return build(
    "14:10",
    copy.recommendation.heavyRationale,
    ["16:8"],
    copy.recommendation.heavyWarning,
  );
}

/** Fallback for the unreachable exhaustiveness default. */
const GENTLE_16_8: Recommendation = build(
  "16:8",
  copy.recommendation.generalNone,
  ["14:10", "18:6"],
);

function buildWeightLoss(ex: NonHeavyState): Recommendation {
  switch (ex) {
    case "none": // R2
      return build("16:8", copy.recommendation.weightLossNone, [
        "18:6",
        "20:4",
        "omad",
      ]);
    case "light": // R3
      return build("16:8", copy.recommendation.weightLossLight, [
        "18:6",
        "20:4",
        "omad",
      ]);
    case "moderate": // R4
      return build("16:8", copy.recommendation.weightLossModerate, ["18:6"]);
  }
}

function buildMetabolic(ex: NonHeavyState): Recommendation {
  switch (ex) {
    case "none": // R5
      return build("18:6", copy.recommendation.metabolicNone, ["16:8"]);
    case "light": // R6
      return build("16:8", copy.recommendation.metabolicLight, ["18:6"]);
    case "moderate": // R7
      return build("16:8", copy.recommendation.metabolicModerate, ["18:6"]);
  }
}

function buildFocus(ex: NonHeavyState): Recommendation {
  switch (ex) {
    case "none": // R8
      return build("16:8", copy.recommendation.focusNone, ["18:6", "14:10"]);
    case "light": // R9
      return build("16:8", copy.recommendation.focusLight, ["18:6", "14:10"]);
    case "moderate": // R10
      return build("16:8", copy.recommendation.focusModerate, [
        "18:6",
        "14:10",
      ]);
  }
}

function buildMaintain(ex: NonHeavyState): Recommendation {
  switch (ex) {
    case "none": // R11
      return build("14:10", copy.recommendation.maintainNone, ["16:8"]);
    case "light": // R12
      return build("14:10", copy.recommendation.maintainLight, ["16:8"]);
    case "moderate": // R13
      return build("16:8", copy.recommendation.maintainModerate, [
        "14:10",
        "18:6",
      ]);
  }
}

function buildGeneral(ex: NonHeavyState): Recommendation {
  switch (ex) {
    case "none": // R14
      return build("16:8", copy.recommendation.generalNone, ["14:10", "18:6"]);
    case "light": // R15
      return build("16:8", copy.recommendation.generalLight, ["14:10", "18:6"]);
    case "moderate": // R16
      return build("16:8", copy.recommendation.generalModerate, [
        "14:10",
        "18:6",
      ]);
  }
}

/**
 * Aggressive-method invariant (design-review Finding 1, resolved exactly).
 *
 * 20:4 and omad may appear in `alternatives` ONLY for R2/R3:
 *   goal === "weight_loss" AND the exercise bucket is "none" or "light"
 * (the bucket is exactly exerciseState(answers); heavy already returned by R1).
 * They are never the recommended `method`. This predicate is the single source
 * of truth that the decision table above is checked against in the unit tests.
 */
export function canOfferAggressive(answers: ProfilingAnswers): boolean {
  const canOfferAggressive =
    answers.goal === "weight_loss" &&
    (exerciseState(answers) === "none" || exerciseState(answers) === "light");
  return canOfferAggressive;
}

/**
 * Recommend an IF method for the given profiling answers.
 *
 * @returns a Recommendation whose `method` is always a timer-capable MethodId
 * other than "custom", with a non-empty Indonesian rationale, a warning string
 * for heavy exercisers (null otherwise), and gentle->aggressive alternatives.
 */
export function recommendMethod(answers: ProfilingAnswers): Recommendation {
  // R1: heavy exercise, any goal -> gentle 14:10 + mandatory warning.
  if (answers.exercises && answers.intensity === "heavy") return buildHeavy();

  const ex = exerciseState(answers); // "none" | "light" | "moderate"
  switch (answers.goal) {
    case "weight_loss":
      return buildWeightLoss(ex);
    case "metabolic":
      return buildMetabolic(ex);
    case "focus":
      return buildFocus(ex);
    case "maintain":
      return buildMaintain(ex);
    case "general":
      return buildGeneral(ex);
    default: {
      // Compile-time exhaustiveness: adding a Goal member makes this a type error.
      /* v8 ignore next 2 */
      const _exhaustive: never = answers.goal;
      return GENTLE_16_8;
    }
  }
}
