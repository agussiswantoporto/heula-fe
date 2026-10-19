"use client";

/**
 * Weight tracker route (FEAT-002, Feature 1).
 *
 * Thin client host nested under /stats so Chrome.isTabRoute (startsWith
 * "/stats") keeps the floating tab bar visible without touching any layout
 * file. WeightTracker owns the Dexie live query, the pure trend derivations,
 * logging/validation, the entry list, and the trend chart.
 */
import { WeightTracker } from "@/features/weight/WeightTracker";
import { copy } from "@/lib/copy";

export default function WeightPage() {
  return (
    <div className="safe-top px-4 pt-8">
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-content">
        {copy.weight.screenTitle}
      </h1>
      <div className="mt-6">
        <WeightTracker />
      </div>
    </div>
  );
}
