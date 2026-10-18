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
    <div className="px-4 pt-8">
      <h1 className="text-2xl font-bold text-content">{copy.stats.title}</h1>
      <div className="mt-5">
        <StatsOverview />
      </div>
    </div>
  );
}
