"use client";

/**
 * AchievementsGrid (FEAT-005, Feature 5).
 *
 * Live-queries every session and evaluates the milestone catalog via the pure
 * `evaluateAchievements` (derived from history + stats, NO badge state stored).
 * Unlocked and locked milestones render as iOS cards split into two sections;
 * countable milestones show a progress bar whose fill is scaled like
 * WeeklyBarChart (ratio vs the full target, clamped). Icons go through the Icon
 * choke point. Client-only (db + dexie-react-hooks live query).
 */
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { copy } from "@/lib/copy";
import {
  evaluateAchievements,
  unlockedCount,
  type AchievementResult,
} from "@/lib/achievements";
import { db } from "@/db/db";

export function AchievementsGrid() {
  const list = useLiveQuery(() => db.sessions.toArray(), []);

  if (list === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={28} label={copy.states.loading} />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <EmptyState
        icon="achievement"
        title={copy.achievements.emptyTitle}
        description={copy.achievements.emptyBody}
      />
    );
  }

  const results = evaluateAchievements({ sessions: list, now: Date.now() });
  const unlocked = results.filter((r) => r.unlocked);
  const locked = results.filter((r) => !r.unlocked);

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand">
          <Icon name="achievement" size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-content-muted">
            {copy.achievements.summaryLabel}
          </p>
          <p className="text-sm font-semibold tabular-nums text-content">
            {copy.achievements.summaryCount(
              unlockedCount(results),
              results.length,
            )}
          </p>
        </div>
      </Card>

      {unlocked.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-content">
            {copy.achievements.unlockedTitle}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {unlocked.map((r) => (
              <AchievementCard key={r.achievement.id} result={r} />
            ))}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-content">
            {copy.achievements.lockedTitle}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {locked.map((r) => (
              <AchievementCard key={r.achievement.id} result={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AchievementCard({ result }: { result: AchievementResult }) {
  const { achievement, unlocked, progress } = result;
  // Scale the progress bar fill like WeeklyBarChart (ratio vs full target).
  const fillPct = Math.round(progress * 100);
  const showProgress = !unlocked && progress > 0;

  return (
    <Card
      className={`flex flex-col gap-2 ${unlocked ? "border-brand" : "opacity-90"}`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-pill ${
          unlocked ? "bg-brand text-brand-fg" : "bg-surface-2 text-content-muted"
        }`}
      >
        <Icon
          name={unlocked ? achievement.icon : "achievement_locked"}
          size={22}
        />
      </span>
      <div className="min-w-0">
        <p
          className={`text-sm font-semibold ${
            unlocked ? "text-content" : "text-content-muted"
          }`}
        >
          {achievement.title}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-content-muted">
          {achievement.description}
        </p>
      </div>

      {showProgress && (
        <div className="mt-auto">
          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-surface-2">
            <motion.div
              className="h-full rounded-pill bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="mt-1 text-[10px] tabular-nums text-content-muted">
            {copy.achievements.progressLabel} {fillPct}%
          </p>
        </div>
      )}
    </Card>
  );
}
