/**
 * Fasting stage selection (design Section 7.2).
 *
 * Half-open bounds [minHours, maxHours): the 24h boundary resolves to Deep fast
 * (Autophagy is [16, 24), Deep fast is >= 24). Pure and framework-free; IconKey
 * is imported from @/types so this module stays decoupled from components/.
 */
import type { IconKey } from "@/types";
import { copy } from "@/lib/copy";

const MS_PER_HOUR = 3_600_000;

export type StageKey =
  | "pencernaan"
  | "bakar_lemak"
  | "ketosis"
  | "autophagy"
  | "deep_fast";

export interface Stage {
  key: StageKey;
  label: string;
  description: string;
  iconKey: IconKey;
  minHours: number;
  maxHours: number | null;
}

const STAGES: Stage[] = [
  {
    key: "pencernaan",
    label: copy.stages.pencernaanLabel,
    description: copy.stages.pencernaanDesc,
    iconKey: "stage_pencernaan",
    minHours: 0,
    maxHours: 4,
  },
  {
    key: "bakar_lemak",
    label: copy.stages.bakarLemakLabel,
    description: copy.stages.bakarLemakDesc,
    iconKey: "stage_bakar_lemak",
    minHours: 4,
    maxHours: 12,
  },
  {
    key: "ketosis",
    label: copy.stages.ketosisLabel,
    description: copy.stages.ketosisDesc,
    iconKey: "stage_ketosis",
    minHours: 12,
    maxHours: 16,
  },
  {
    key: "autophagy",
    label: copy.stages.autophagyLabel,
    description: copy.stages.autophagyDesc,
    iconKey: "stage_autophagy",
    minHours: 16,
    maxHours: 24,
  },
  {
    key: "deep_fast",
    label: copy.stages.deepFastLabel,
    description: copy.stages.deepFastDesc,
    iconKey: "stage_deep_fast",
    minHours: 24,
    maxHours: null,
  },
];

export const STAGE_LIST: readonly Stage[] = STAGES;

/** Resolve the fasting stage for a given elapsed duration (ms). */
export function stageForElapsed(elapsedMs: number): Stage {
  const hours = Math.max(0, elapsedMs) / MS_PER_HOUR;
  for (const stage of STAGES) {
    const underMax = stage.maxHours === null || hours < stage.maxHours;
    if (hours >= stage.minHours && underMax) return stage;
  }
  // Unreachable: bounds cover [0, inf). Return the last (Deep fast) defensively.
  return STAGES[STAGES.length - 1];
}
