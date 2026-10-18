"use client";

/**
 * GoalStep (design Section 14, step 2).
 *
 * Five goal options as stacked, tappable cards. A goal is required: `onNext` is
 * disabled until one is selected. Labels come from GOAL_LABELS (copy.ts).
 */
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { GOAL_LABELS, copy } from "@/lib/copy";
import type { Goal } from "@/types";

export interface GoalStepProps {
  value: Goal | null;
  onChange: (goal: Goal) => void;
  onNext: () => void;
  onBack: () => void;
}

const GOAL_ORDER: Goal[] = [
  "weight_loss",
  "metabolic",
  "focus",
  "maintain",
  "general",
];

export function GoalStep({ value, onChange, onNext, onBack }: GoalStepProps) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-2xl font-bold tracking-tight text-content">
        {copy.onboarding.goalQuestion}
      </h1>

      <div className="mt-5 flex flex-1 flex-col gap-2">
        {GOAL_ORDER.map((goal) => {
          const active = goal === value;
          return (
            <button
              key={goal}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(goal)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-control border px-4 py-4 text-left transition-colors",
                active
                  ? "border-brand bg-surface-2"
                  : "border-border bg-surface",
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  active ? "text-content" : "text-content-muted",
                )}
              >
                {GOAL_LABELS[goal]}
              </span>
              {active && (
                <Icon name="check" size={22} className="shrink-0 text-brand" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" onClick={onBack}>
          {copy.onboarding.back}
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={value === null}
          onClick={onNext}
        >
          {copy.onboarding.next}
        </Button>
      </div>
    </div>
  );
}
