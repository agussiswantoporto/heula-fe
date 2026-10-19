"use client";

/**
 * Achievements route (FEAT-005, Feature 5).
 *
 * Thin client host nested under /stats so Chrome.isTabRoute (startsWith
 * "/stats") keeps the floating tab bar visible without touching any layout
 * file. AchievementsGrid owns the Dexie live query, the pure milestone
 * evaluation, and the unlocked/locked card layout.
 */
import { AchievementsGrid } from "@/features/achievements/AchievementsGrid";
import { copy } from "@/lib/copy";

export default function AchievementsPage() {
  return (
    <div className="safe-top px-4 pt-8">
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-content">
        {copy.achievements.screenTitle}
      </h1>
      <div className="mt-6">
        <AchievementsGrid />
      </div>
    </div>
  );
}
