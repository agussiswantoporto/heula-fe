"use client";

/**
 * BmiStep (FEAT-003) — mandatory onboarding step between Exercise and
 * Recommendation. Follows the ExerciseStep/GoalStep structure: an h1 title from
 * copy, labelled numeric inputs, a live BMI result + animated segmented gauge,
 * and a Button footer (ghost Back + primary Lanjut).
 *
 * Pure/presentational: all BMI math comes from the framework-free @/lib/bmi,
 * all copy from @/lib/copy, all icons via Icon.tsx. Lanjut stays disabled until
 * isValidBmiInput(height, weight) is true, so the parent flow can also gate
 * advancement on the same predicate. Emoji-free; reads cleanly in light + dark.
 */
import { useId } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy";
import {
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
  WEIGHT_MAX_KG,
  WEIGHT_MIN_KG,
  bmiCategory,
  computeBmi,
  isValidBmiInput,
  isValidHeight,
  isValidWeight,
  type BmiCategory,
} from "@/lib/bmi";

export interface BmiStepProps {
  heightCm: number | null;
  weightKg: number | null;
  onHeightChange: (cm: number | null) => void;
  onWeightChange: (kg: number | null) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Display range for the gauge. Boundaries at 18.5 / 23 / 25 line up with the
 * Asia-Pacific segment edges (see @/lib/bmi). Clamp keeps the marker on-scale.
 */
const DISPLAY_MIN = 15;
const DISPLAY_MAX = 35;

interface Segment {
  category: BmiCategory;
  /** Upper bound of this segment on the BMI scale. */
  to: number;
  className: string;
}

/** Segments span DISPLAY_MIN..DISPLAY_MAX; last one runs to DISPLAY_MAX. */
const SEGMENTS: Segment[] = [
  { category: "underweight", to: 18.5, className: "bg-content-muted/35" },
  { category: "normal", to: 23, className: "bg-brand" },
  { category: "overweight", to: 25, className: "bg-brand-soft" },
  { category: "obese", to: DISPLAY_MAX, className: "bg-danger" },
];

const CATEGORY_LABEL: Record<BmiCategory, string> = {
  underweight: copy.bmi.underweightLabel,
  normal: copy.bmi.normalLabel,
  overweight: copy.bmi.overweightLabel,
  obese: copy.bmi.obeseLabel,
};

const CATEGORY_DESC: Record<BmiCategory, string> = {
  underweight: copy.bmi.underweightDesc,
  normal: copy.bmi.normalDesc,
  overweight: copy.bmi.overweightDesc,
  obese: copy.bmi.obeseDesc,
};

/** Map a BMI value to a 0-100 position across the display range. */
function markerPercent(bmi: number): number {
  const clamped = Math.min(Math.max(bmi, DISPLAY_MIN), DISPLAY_MAX);
  return ((clamped - DISPLAY_MIN) / (DISPLAY_MAX - DISPLAY_MIN)) * 100;
}

/** Segment flex-basis percentage from its BMI span over the display range. */
function segmentPercent(seg: Segment, index: number): number {
  const from = index === 0 ? DISPLAY_MIN : SEGMENTS[index - 1].to;
  return ((seg.to - from) / (DISPLAY_MAX - DISPLAY_MIN)) * 100;
}

/** Parse a numeric field; empty string -> null, otherwise a finite number. */
function parseField(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function BmiStep({
  heightCm,
  weightKg,
  onHeightChange,
  onWeightChange,
  onNext,
  onBack,
}: BmiStepProps) {
  const heightId = useId();
  const weightId = useId();
  const heightErrorId = useId();
  const weightErrorId = useId();

  const heightInvalid = heightCm !== null && !isValidHeight(heightCm);
  const weightInvalid = weightKg !== null && !isValidWeight(weightKg);

  const valid =
    heightCm !== null &&
    weightKg !== null &&
    isValidBmiInput(heightCm, weightKg);

  const bmi = valid ? computeBmi(heightCm, weightKg) : NaN;
  const category = bmiCategory(bmi);
  const showResult = Number.isFinite(bmi);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-2xl font-bold tracking-tight text-content">
        {copy.bmi.stepTitle}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-content-muted">
        {copy.bmi.stepIntro}
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {/* Height */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={heightId}
            className="text-sm font-medium text-content"
          >
            {copy.bmi.heightLabel}
          </label>
          <div className="flex items-center gap-2 rounded-control border border-border bg-surface px-4 focus-within:border-brand">
            <input
              id={heightId}
              type="number"
              inputMode="numeric"
              min={HEIGHT_MIN_CM}
              max={HEIGHT_MAX_CM}
              placeholder={copy.bmi.heightPlaceholder}
              value={heightCm ?? ""}
              onChange={(e) => onHeightChange(parseField(e.target.value))}
              aria-label={copy.bmi.heightLabel}
              aria-invalid={heightInvalid}
              aria-describedby={heightInvalid ? heightErrorId : undefined}
              className="min-h-12 w-full bg-transparent text-base tabular-nums text-content outline-none placeholder:text-content-muted"
            />
            <span className="shrink-0 text-sm text-content-muted">
              {copy.bmi.heightUnit}
            </span>
          </div>
          {heightInvalid && (
            <p id={heightErrorId} className="text-xs text-danger">
              {copy.bmi.heightInvalid}
            </p>
          )}
        </div>

        {/* Weight */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={weightId}
            className="text-sm font-medium text-content"
          >
            {copy.bmi.weightLabel}
          </label>
          <div className="flex items-center gap-2 rounded-control border border-border bg-surface px-4 focus-within:border-brand">
            <input
              id={weightId}
              type="number"
              inputMode="decimal"
              min={WEIGHT_MIN_KG}
              max={WEIGHT_MAX_KG}
              placeholder={copy.bmi.weightPlaceholder}
              value={weightKg ?? ""}
              onChange={(e) => onWeightChange(parseField(e.target.value))}
              aria-label={copy.bmi.weightLabel}
              aria-invalid={weightInvalid}
              aria-describedby={weightInvalid ? weightErrorId : undefined}
              className="min-h-12 w-full bg-transparent text-base tabular-nums text-content outline-none placeholder:text-content-muted"
            />
            <span className="shrink-0 text-sm text-content-muted">
              {copy.bmi.weightUnit}
            </span>
          </div>
          {weightInvalid && (
            <p id={weightErrorId} className="text-xs text-danger">
              {copy.bmi.weightInvalid}
            </p>
          )}
        </div>
      </div>

      {/* Live BMI result + animated segmented gauge */}
      {showResult && (
        <div className="mt-6 rounded-card border border-border bg-surface p-4">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-content-muted">{copy.bmi.resultLabel}</p>
              <p className="text-2xl font-bold tabular-nums text-content">
                {bmi.toFixed(1)}
              </p>
            </div>
            <span className="shrink-0 rounded-pill bg-surface-2 px-3 py-1 text-xs font-semibold text-content">
              {CATEGORY_LABEL[category]}
            </span>
          </div>

          <p className="mt-2 text-sm text-content-muted">
            {CATEGORY_DESC[category]}
          </p>

          <div className="relative mt-4">
            <div className="flex h-3 overflow-hidden rounded-pill">
              {SEGMENTS.map((seg, index) => (
                <div
                  key={seg.category}
                  className={seg.className}
                  style={{ flexBasis: `${segmentPercent(seg, index)}%` }}
                />
              ))}
            </div>
            {/* Animated marker/needle driven by a motion spring. */}
            <motion.div
              className="pointer-events-none absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-pill border border-surface bg-content shadow-card"
              initial={false}
              animate={{ left: `${markerPercent(bmi)}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-content-muted">
        {copy.bmi.disclaimer}
      </p>

      <div className="mt-auto flex gap-2 pt-6">
        <Button variant="ghost" onClick={onBack}>
          {copy.onboarding.back}
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={!valid}
          onClick={onNext}
        >
          {copy.onboarding.next}
        </Button>
      </div>
    </div>
  );
}
