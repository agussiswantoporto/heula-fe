"use client";

/**
 * ExerciseStep (design Section 14, step 3).
 *
 * "Apakah kamu olahraga?" ya/tidak. When "ya", the intensity choice
 * (Ringan/Sedang/Berat) is revealed in the same step via a motion height
 * animation and becomes required; when "tidak", intensity is forced to null and
 * next is enabled. All copy is emoji-free from copy.ts.
 */
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { Intensity } from "@/types";

export interface ExerciseStepProps {
  exercises: boolean | null;
  intensity: Intensity | null;
  onExercisesChange: (exercises: boolean) => void;
  onIntensityChange: (intensity: Intensity) => void;
  onNext: () => void;
  onBack: () => void;
}

const INTENSITY_ORDER: { value: Intensity; label: string }[] = [
  { value: "light", label: copy.onboarding.intensityLight },
  { value: "moderate", label: copy.onboarding.intensityModerate },
  { value: "heavy", label: copy.onboarding.intensityHeavy },
];

function Choice({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-card border px-4 py-4 text-sm font-medium transition-colors",
        active
          ? "border-brand bg-surface-2 text-content"
          : "border-border bg-surface text-content-muted",
      )}
    >
      {active && <Icon name="check" size={18} className="text-brand" />}
      {label}
    </button>
  );
}

export function ExerciseStep({
  exercises,
  intensity,
  onExercisesChange,
  onIntensityChange,
  onNext,
  onBack,
}: ExerciseStepProps) {
  const canNext =
    exercises === false || (exercises === true && intensity !== null);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-xl font-bold text-content">
        {copy.onboarding.exerciseQuestion}
      </h1>

      <div className="mt-5 flex gap-2">
        <Choice
          label={copy.onboarding.exerciseYes}
          active={exercises === true}
          onClick={() => onExercisesChange(true)}
        />
        <Choice
          label={copy.onboarding.exerciseNo}
          active={exercises === false}
          onClick={() => onExercisesChange(false)}
        />
      </div>

      <AnimatePresence initial={false}>
        {exercises === true && (
          <motion.div
            key="intensity"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="overflow-hidden"
          >
            <p className="mt-6 text-sm font-medium text-content">
              {copy.onboarding.intensityQuestion}
            </p>
            <div className="mt-3 flex gap-2">
              {INTENSITY_ORDER.map((opt) => (
                <Choice
                  key={opt.value}
                  label={opt.label}
                  active={intensity === opt.value}
                  onClick={() => onIntensityChange(opt.value)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto flex gap-2 pt-6">
        <Button variant="ghost" onClick={onBack}>
          {copy.onboarding.back}
        </Button>
        <Button variant="primary" fullWidth disabled={!canNext} onClick={onNext}>
          {copy.onboarding.next}
        </Button>
      </div>
    </div>
  );
}
