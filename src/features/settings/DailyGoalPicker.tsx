"use client";

/**
 * DailyGoalPicker (design Section 8).
 *
 * Sets the daily fasting-hours goal with a simple minus/plus stepper, clamped
 * to a sensible 8..23 range. The value is persisted immediately via the store.
 * Emoji-free copy from copy.ts; icons go through the Icon choke point.
 */
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/lib/copy";
import { useAppStore } from "@/store/useAppStore";

const GOAL_MIN = 8;
const GOAL_MAX = 23;

export function DailyGoalPicker() {
  const dailyGoalHours = useAppStore((s) => s.dailyGoalHours);
  const setDailyGoalHours = useAppStore((s) => s.setDailyGoalHours);

  function step(delta: number) {
    const next = Math.min(GOAL_MAX, Math.max(GOAL_MIN, dailyGoalHours + delta));
    setDailyGoalHours(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-semibold text-content">
          {copy.settings.dailyGoalTitle}
        </p>
        <p className="mt-0.5 text-xs text-content-muted">
          {copy.settings.dailyGoalHint}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-control border border-border bg-surface px-4 py-3">
        <button
          type="button"
          aria-label={copy.settings.dailyGoalTitle}
          onClick={() => step(-1)}
          disabled={dailyGoalHours <= GOAL_MIN}
          className="flex h-10 w-10 items-center justify-center rounded-pill bg-surface-2 text-content disabled:opacity-40"
        >
          <Icon name="chevron" size={20} className="rotate-180" />
        </button>
        <span className="text-xl font-bold tabular-nums text-content">
          {dailyGoalHours} {copy.stats.hourUnit}
        </span>
        <button
          type="button"
          aria-label={copy.settings.dailyGoalTitle}
          onClick={() => step(1)}
          disabled={dailyGoalHours >= GOAL_MAX}
          className="flex h-10 w-10 items-center justify-center rounded-pill bg-surface-2 text-content disabled:opacity-40"
        >
          <Icon name="chevron" size={20} />
        </button>
      </div>
    </div>
  );
}
