"use client";

/**
 * Stats route (design Section 10).
 *
 * Thin client host; StatsOverview owns the Dexie live query, the pure stat
 * derivations, the profiling-goal card, and the weekly chart.
 */
import { StatsOverview } from "@/features/stats/StatsOverview";
import { copy } from "@/lib/copy";

export default function StatsPage() {
  return (
    <div className="safe-top px-4 pt-8">
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-content">
        {copy.stats.title}
      </h1>
      <div className="mt-6">
        <StatsOverview />
      </div>
    </div>
  );
}
