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
import { bmiCategory, computeBmi, type BmiCategory } from "@/lib/bmi";

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

/** Methods considered "stricter than 14:10" for the underweight guard. */
const NON_GENTLE: MethodId[] = ["16:8", "18:6", "20:4", "omad"];
/** Methods underweight users must never be nudged toward in alternatives. */
const UNDERWEIGHT_FORBIDDEN: MethodId[] = ["18:6", "20:4", "omad"];

/**
 * BMI post-process (FEAT-002).
 *
 * Chosen approach: BMI is a PURE POST-PROCESS that only ever SHARPENS the
 * framing or SOFTENS the primary method — it never overrides the safety model.
 * Three hard rules make this safe:
 *   1. The R1 heavy-exercise branch returns in recommendMethod BEFORE this
 *      function runs, so a heavy exerciser is NEVER BMI-adjusted (heavy always
 *      wins: 14:10 + non-null warning for any goal and any BMI).
 *   2. canOfferAggressive stays the SOLE aggressive gatekeeper. This function
 *      never adds 20:4/omad and never widens eligibility; it only reorders
 *      methods already present in `base.alternatives`.
 *   3. "normal" (the safe default, including NaN/invalid BMI) returns base
 *      unchanged, so a transient bad value never triggers a strict adjustment.
 *
 * Per-category behaviour:
 *   underweight -> soften the primary to 14:10 if it is anything stricter,
 *     drop 18:6/20:4/omad from alternatives (keep 16:8 only), and always carry
 *     a caring note in `warning` plus a caring prefix in `rationale`.
 *   normal      -> return base unchanged.
 *   overweight/obese -> ONLY when goal === "weight_loss" AND
 *     canOfferAggressive(answers) is already true, reorder alternatives so 18:6
 *     is more prominent (no new aggressive method added) and append a
 *     firmer-but-safe note to rationale; the primary stays the gentle default
 *     (never auto-jumps to 20:4/omad).
 *   all other goals/states -> return base unchanged.
 */
export function applyBmiAdjustment(
  base: Recommendation,
  category: BmiCategory,
  answers: ProfilingAnswers,
): Recommendation {
  switch (category) {
    case "underweight": {
      const method: MethodId = NON_GENTLE.includes(base.method)
        ? "14:10"
        : base.method;
      const alternatives = base.alternatives.filter(
        (m) => !UNDERWEIGHT_FORBIDDEN.includes(m),
      );
      // Caring note always present via warning so it surfaces regardless of goal.
      const warning = copy.recommendation.underweightNote;
      const rationale = `${copy.recommendation.underweightRationale} ${base.rationale}`;
      return { method, rationale, warning, alternatives };
    }
    case "overweight":
    case "obese": {
      if (answers.goal !== "weight_loss" || !canOfferAggressive(answers)) {
        return base;
      }
      // Reorder only: pull an already-present 18:6 to the front; never add it.
      const alternatives: MethodId[] = base.alternatives.includes("18:6")
        ? ["18:6", ...base.alternatives.filter((m) => m !== "18:6")]
        : [...base.alternatives];
      const rationale = `${base.rationale} ${copy.recommendation.overweightNote}`;
      return {
        method: base.method,
        rationale,
        warning: base.warning,
        alternatives,
      };
    }
    case "normal":
      return base;
  }
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
  // Returns BEFORE any BMI logic, so heavy exercisers are never BMI-adjusted.
  if (answers.exercises && answers.intensity === "heavy") return buildHeavy();

  const ex = exerciseState(answers); // "none" | "light" | "moderate"
  let base: Recommendation;
  switch (answers.goal) {
    case "weight_loss":
      base = buildWeightLoss(ex);
      break;
    case "metabolic":
      base = buildMetabolic(ex);
      break;
    case "focus":
      base = buildFocus(ex);
      break;
    case "maintain":
      base = buildMaintain(ex);
      break;
    case "general":
      base = buildGeneral(ex);
      break;
    default: {
      // Compile-time exhaustiveness: adding a Goal member makes this a type error.
      /* v8 ignore next 2 */
      const _exhaustive: never = answers.goal;
      base = GENTLE_16_8;
    }
  }

  // BMI is a pure post-process layer applied AFTER the switch(goal) resolves
  // base. "normal" (and invalid/NaN BMI) returns base unchanged.
  const category = bmiCategory(computeBmi(answers.heightCm, answers.weightKg));
  return applyBmiAdjustment(base, category, answers);
}
