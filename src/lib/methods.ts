/**
 * IF method catalog — single source of truth (design Section 5).
 *
 * `METHODS` maps every MethodId to its metadata. `custom` carries a default
 * fastingHours of 16 that is overridden at runtime by the user's chosen hours
 * (settings store). 5:2 is NOT in this catalog; it is rendered as a static info
 * card in PlanPicker and is not a selectable timer target.
 */
import type { MethodId, MethodMeta } from "@/types";
import { copy } from "@/lib/copy";

export const METHOD_ORDER: MethodId[] = [
  "14:10",
  "16:8",
  "18:6",
  "20:4",
  "omad",
  "custom",
];

/** Fasting hours per method. custom default = 16 (overridden at runtime 8..23). */
const FASTING_HOURS: Record<MethodId, number> = {
  "14:10": 14,
  "16:8": 16,
  "18:6": 18,
  "20:4": 20,
  omad: 23,
  custom: 16,
};

/** 20:4 and omad are advanced. */
const ADVANCED: Record<MethodId, boolean> = {
  "14:10": false,
  "16:8": false,
  "18:6": false,
  "20:4": true,
  omad: true,
  custom: false,
};

const LABELS: Record<MethodId, string> = {
  "14:10": "14:10",
  "16:8": "16:8",
  "18:6": "18:6",
  "20:4": "20:4",
  omad: "OMAD",
  custom: "Custom",
};

function buildMeta(id: MethodId): MethodMeta {
  const fastingHours = FASTING_HOURS[id];
  return {
    id,
    label: LABELS[id],
    fastingHours,
    eatingHours: 24 - fastingHours,
    tagline: copy.methodTaglines[id],
    advanced: ADVANCED[id],
  };
}

export const METHODS: Record<MethodId, MethodMeta> = {
  "14:10": buildMeta("14:10"),
  "16:8": buildMeta("16:8"),
  "18:6": buildMeta("18:6"),
  "20:4": buildMeta("20:4"),
  omad: buildMeta("omad"),
  custom: buildMeta("custom"),
};
