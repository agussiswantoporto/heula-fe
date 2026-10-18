"use client";

/**
 * WeeklyBarChart (design Section 3/10).
 *
 * Renders the last 7 days of total fasting hours as a simple column chart built
 * from plain divs — NO charting library. Each bar's height is scaled against
 * the busiest day in the window; a zero-hour day shows a thin baseline. The
 * buckets come from the pure `weekly(sessions, now)` derivation.
 */
import { copy } from "@/lib/copy";
import type { WeeklyBucket } from "@/lib/stats";

export interface WeeklyBarChartProps {
  buckets: WeeklyBucket[];
}

export function WeeklyBarChart({ buckets }: WeeklyBarChartProps) {
  const maxHours = Math.max(1, ...buckets.map((b) => b.totalHours));

  return (
    <div>
      <p className="mb-4 text-base font-semibold text-content">
        {copy.stats.weeklyTitle}
      </p>
      <div className="flex h-32 items-end justify-between gap-2">
        {buckets.map((bucket) => {
          const ratio = bucket.totalHours / maxHours;
          const heightPct = Math.max(4, Math.round(ratio * 100));
          return (
            <div
              key={bucket.dayKey}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div className="flex h-24 w-full items-end justify-center">
                <div
                  className="w-6 rounded-control bg-brand"
                  style={{ height: `${heightPct}%` }}
                  aria-hidden
                />
              </div>
              <span className="text-[10px] font-medium text-content-muted">
                {bucket.label}
              </span>
              <span className="text-[10px] tabular-nums text-content-muted">
                {Math.round(bucket.totalHours)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
