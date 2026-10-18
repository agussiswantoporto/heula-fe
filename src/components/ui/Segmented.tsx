"use client";

/**
 * Segmented (design Section 3). iOS segmented control with a motion highlight
 * that slides behind the selected option.
 */
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label"?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex gap-1 rounded-pill bg-surface-2 p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className="relative flex-1 rounded-pill px-3 py-2 text-sm font-medium"
          >
            {active && (
              <motion.span
                layoutId={`seg-${ariaLabel ?? "default"}`}
                className="absolute inset-0 rounded-pill bg-surface shadow-card"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span
              className={cn(
                "relative z-10",
                active ? "text-content" : "text-content-muted",
              )}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
