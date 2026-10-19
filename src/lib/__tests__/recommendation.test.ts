import { describe, expect, it } from "vitest";
import {
  canOfferAggressive,
  exerciseState,
  recommendMethod,
} from "@/lib/recommendation";
import type {
  Goal,
  Intensity,
  MethodId,
  ProfilingAnswers,
} from "@/types";

const GOALS: Goal[] = [
  "weight_loss",
  "metabolic",
  "focus",
  "maintain",
  "general",
];

const EXERCISE_INPUTS: Array<
  Pick<ProfilingAnswers, "exercises" | "intensity">
> = [
  { exercises: false, intensity: null }, // -> exerciseState "none"
  { exercises: true, intensity: null }, // -> "none" (degenerate, Finding 1)
  { exercises: true, intensity: "light" }, // -> "light"
  { exercises: true, intensity: "moderate" }, // -> "moderate"
  { exercises: true, intensity: "heavy" }, // -> R1 guard (14:10 + warning)
];

const AGGRESSIVE: MethodId[] = ["20:4", "omad"];

function answers(
  goal: Goal,
  exercises: boolean,
  intensity: Intensity | null,
): ProfilingAnswers {
  // Normal-BMI height/weight (170cm/65kg => BMI ~22.5 => "normal") so BMI stays
  // a pure no-op on these R1-R16 rows until FEAT-002 wires the adjustment.
  return { goal, exercises, intensity, heightCm: 170, weightKg: 65 };
}

interface Row {
  id: string;
  input: ProfilingAnswers;
  method: MethodId;
  alternatives: MethodId[];
  warning: boolean;
}

// Exact decision table R1-R16 from design Section 6.2.
const ROWS: Row[] = [
  // R1 heavy, representative goal (any goal collapses to the same heavy result).
  {
    id: "R1",
    input: answers("weight_loss", true, "heavy"),
    method: "14:10",
    alternatives: ["16:8"],
    warning: true,
  },
  // weight_loss
  {
    id: "R2",
    input: answers("weight_loss", false, null),
    method: "16:8",
    alternatives: ["18:6", "20:4", "omad"],
    warning: false,
  },
  {
    id: "R3",
    input: answers("weight_loss", true, "light"),
    method: "16:8",
    alternatives: ["18:6", "20:4", "omad"],
    warning: false,
  },
  {
    id: "R4",
    input: answers("weight_loss", true, "moderate"),
    method: "16:8",
    alternatives: ["18:6"],
    warning: false,
  },
  // metabolic
  {
    id: "R5",
    input: answers("metabolic", false, null),
    method: "18:6",
    alternatives: ["16:8"],
    warning: false,
  },
  {
    id: "R6",
    input: answers("metabolic", true, "light"),
    method: "16:8",
    alternatives: ["18:6"],
    warning: false,
  },
  {
    id: "R7",
    input: answers("metabolic", true, "moderate"),
    method: "16:8",
    alternatives: ["18:6"],
    warning: false,
  },
  // focus
  {
    id: "R8",
    input: answers("focus", false, null),
    method: "16:8",
    alternatives: ["18:6", "14:10"],
    warning: false,
  },
  {
    id: "R9",
    input: answers("focus", true, "light"),
    method: "16:8",
    alternatives: ["18:6", "14:10"],
    warning: false,
  },
  {
    id: "R10",
    input: answers("focus", true, "moderate"),
    method: "16:8",
    alternatives: ["18:6", "14:10"],
    warning: false,
  },
  // maintain
  {
    id: "R11",
    input: answers("maintain", false, null),
    method: "14:10",
    alternatives: ["16:8"],
    warning: false,
  },
  {
    id: "R12",
    input: answers("maintain", true, "light"),
    method: "14:10",
    alternatives: ["16:8"],
    warning: false,
  },
  {
    id: "R13",
    input: answers("maintain", true, "moderate"),
    method: "16:8",
    alternatives: ["14:10", "18:6"],
    warning: false,
  },
  // general
  {
    id: "R14",
    input: answers("general", false, null),
    method: "16:8",
    alternatives: ["14:10", "18:6"],
    warning: false,
  },
  {
    id: "R15",
    input: answers("general", true, "light"),
    method: "16:8",
    alternatives: ["14:10", "18:6"],
    warning: false,
  },
  {
    id: "R16",
    input: answers("general", true, "moderate"),
    method: "16:8",
    alternatives: ["14:10", "18:6"],
    warning: false,
  },
];

describe("recommendMethod — decision table (R1-R16)", () => {
  for (const row of ROWS) {
    it(`${row.id}: returns the exact method and alternatives`, () => {
      const rec = recommendMethod(row.input);
      expect(rec.method).toBe(row.method);
      expect(rec.alternatives).toEqual(row.alternatives);
      if (row.warning) {
        expect(rec.warning).not.toBeNull();
      } else {
        expect(rec.warning).toBeNull();
      }
    });
  }

  it("covers all 16 rows", () => {
    expect(ROWS).toHaveLength(16);
  });
});

describe("recommendMethod — invariants over the 25 raw inputs", () => {
  const allInputs: ProfilingAnswers[] = [];
  for (const goal of GOALS) {
    for (const ex of EXERCISE_INPUTS) {
      allInputs.push({
        goal,
        exercises: ex.exercises,
        intensity: ex.intensity,
        heightCm: 170,
        weightKg: 65,
      });
    }
  }

  it("enumerates exactly 25 raw inputs", () => {
    expect(allInputs).toHaveLength(25);
  });

  for (const input of allInputs) {
    const label = `${input.goal}/exercises=${input.exercises}/intensity=${input.intensity}`;
    it(`invariants hold for ${label}`, () => {
      const rec = recommendMethod(input);

      // method is never "custom" and never a 5:2 value.
      expect(rec.method).not.toBe("custom");
      expect(rec.method as string).not.toBe("5:2");

      // 20:4/omad never appear as the recommended method.
      expect(AGGRESSIVE).not.toContain(rec.method);

      // Heavy inputs -> 14:10 + non-null warning; non-heavy -> null warning.
      const isHeavy = input.exercises && input.intensity === "heavy";
      if (isHeavy) {
        expect(rec.method).toBe("14:10");
        expect(rec.warning).not.toBeNull();
      } else {
        expect(rec.warning).toBeNull();
      }

      // Aggressive alternatives only when goal === weight_loss AND bucket none/light.
      const hasAggressive = rec.alternatives.some((m) =>
        AGGRESSIVE.includes(m),
      );
      if (hasAggressive) {
        expect(canOfferAggressive(input)).toBe(true);
        expect(input.goal).toBe("weight_loss");
        expect(["none", "light"]).toContain(exerciseState(input));
      }

      // rationale is a non-empty string.
      expect(typeof rec.rationale).toBe("string");
      expect(rec.rationale.length).toBeGreaterThan(0);

      // alternatives exclude the recommended method and have no duplicates.
      expect(rec.alternatives).not.toContain(rec.method);
      expect(new Set(rec.alternatives).size).toBe(rec.alternatives.length);
    });
  }

  it("aggressive methods appear in alternatives ONLY for weight_loss none/light", () => {
    for (const input of allInputs) {
      const rec = recommendMethod(input);
      for (const m of AGGRESSIVE) {
        if (rec.alternatives.includes(m)) {
          expect(input.goal).toBe("weight_loss");
          expect(["none", "light"]).toContain(exerciseState(input));
        }
      }
    }
  });
});

describe("recommendMethod — degenerate-input equivalence (Finding 1/2)", () => {
  for (const goal of GOALS) {
    it(`${goal}: exercises:true/intensity:null deep-equals exercises:false/intensity:null`, () => {
      const degenerate = recommendMethod({
        goal,
        exercises: true,
        intensity: null,
        heightCm: 170,
        weightKg: 65,
      });
      const none = recommendMethod({
        goal,
        exercises: false,
        intensity: null,
        heightCm: 170,
        weightKg: 65,
      });
      expect(degenerate).toEqual(none);
    });
  }
});

describe("exerciseState classifier", () => {
  it("maps the degenerate and false cases to none", () => {
    expect(exerciseState(answers("general", false, null))).toBe("none");
    expect(exerciseState(answers("general", true, null))).toBe("none");
  });

  it("maps light and moderate through", () => {
    expect(exerciseState(answers("general", true, "light"))).toBe("light");
    expect(exerciseState(answers("general", true, "moderate"))).toBe("moderate");
  });
});
