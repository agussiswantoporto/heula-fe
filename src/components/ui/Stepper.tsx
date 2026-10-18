/**
 * Stepper (design Section 3). Onboarding progress dots.
 */
import { cn } from "@/lib/cn";

export interface StepperProps {
  total: number;
  current: number; // zero-based index of the active step
}

export function Stepper({ total, current }: StepperProps) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 rounded-pill transition-all",
            i === current ? "w-6 bg-brand" : "w-2 bg-border",
          )}
        />
      ))}
    </div>
  );
}
