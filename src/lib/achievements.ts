/**
 * Achievements / milestones (FEAT-005, Feature 5).
 *
 * Pure and framework-free: every milestone is DERIVED from fasting history +
 * the existing stats helpers (streaks + totals) at evaluation time. NO badge
 * state is ever persisted — unlock status and progress are recomputed on demand
 * so the data model stays append-only (just the sessions table).
 *
 * `now` is injected for determinism (streaks bucket by calendar day relative to
 * it), mirroring the other core libs. IconKey comes from @/types and copy from
 * @/lib/copy so this module never imports from components/ or @/db.
 */
import type { FastingSessionRecord, IconKey } from "@/types";
import { copy } from "@/lib/copy";
import { streaks, totals } from "@/lib/stats";

const MS_PER_HOUR = 3_600_000;

/** Precomputed values an achievement predicate reads, derived once per eval. */
export interface AchievementContext {
  sessions: FastingSessionRecord[];
  now: number;
  totalFasts: number;
  totalHours: number;
  longestStreak: number;
  currentStreak: number;
  longestFastHours: number;
  longest18hFastHours: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: IconKey;
  isUnlocked(ctx: AchievementContext): boolean;
  /** 0..1 fraction toward unlocking (1 once unlocked). */
  progress(ctx: AchievementContext): number;
}

export interface AchievementResult {
  achievement: Achievement;
  unlocked: boolean;
  progress: number;
}

/** Clamp a raw ratio into the 0..1 progress range. */
function clamp01(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  return ratio >= 1 ? 1 : ratio;
}

/** A count-toward-target milestone (fasts, hours, streak days). */
function countMilestone(
  id: string,
  title: string,
  description: string,
  icon: IconKey,
  target: number,
  value: (ctx: AchievementContext) => number,
): Achievement {
  return {
    id,
    title,
    description,
    icon,
    isUnlocked: (ctx) => value(ctx) >= target,
    progress: (ctx) => clamp01(value(ctx) / target),
  };
}

/** A pass/fail milestone (no meaningful partial progress). */
function flagMilestone(
  id: string,
  title: string,
  description: string,
  icon: IconKey,
  unlocked: (ctx: AchievementContext) => boolean,
): Achievement {
  return {
    id,
    title,
    description,
    icon,
    isUnlocked: unlocked,
    progress: (ctx) => (unlocked(ctx) ? 1 : 0),
  };
}

/**
 * The milestone catalog, ordered from easiest to hardest. Deterministic and
 * stable; ids are referenced by the UI for keys.
 */
export const ACHIEVEMENTS: readonly Achievement[] = [
  flagMilestone(
    "first_fast",
    copy.achievements.firstFastTitle,
    copy.achievements.firstFastDesc,
    "ribbon",
    (ctx) => ctx.totalFasts >= 1,
  ),
  flagMilestone(
    "first_18h",
    copy.achievements.first18Title,
    copy.achievements.first18Desc,
    "milestone",
    (ctx) => ctx.longest18hFastHours >= 18,
  ),
  countMilestone(
    "fasts_10",
    copy.achievements.fasts10Title,
    copy.achievements.fasts10Desc,
    "milestone",
    10,
    (ctx) => ctx.totalFasts,
  ),
  countMilestone(
    "streak_7",
    copy.achievements.streak7Title,
    copy.achievements.streak7Desc,
    "achievement",
    7,
    (ctx) => ctx.longestStreak,
  ),
  countMilestone(
    "hours_100",
    copy.achievements.hours100Title,
    copy.achievements.hours100Desc,
    "achievement",
    100,
    (ctx) => ctx.totalHours,
  ),
  flagMilestone(
    "longest_fast",
    copy.achievements.longestTitle,
    copy.achievements.longestDesc,
    "milestone",
    (ctx) => ctx.longestFastHours >= 24,
  ),
  countMilestone(
    "fasts_50",
    copy.achievements.fasts50Title,
    copy.achievements.fasts50Desc,
    "milestone",
    50,
    (ctx) => ctx.totalFasts,
  ),
  countMilestone(
    "streak_30",
    copy.achievements.streak30Title,
    copy.achievements.streak30Desc,
    "achievement",
    30,
    (ctx) => ctx.longestStreak,
  ),
  countMilestone(
    "fasts_100",
    copy.achievements.fasts100Title,
    copy.achievements.fasts100Desc,
    "achievement",
    100,
    (ctx) => ctx.totalFasts,
  ),
];

/** Build the derived context from raw sessions + injected `now`. */
export function buildContext(
  sessions: FastingSessionRecord[],
  now: number,
): AchievementContext {
  const t = totals(sessions);
  const s = streaks(sessions, now);

  let longestFastHours = 0;
  let longest18hFastHours = 0;
  for (const session of sessions) {
    const hours = session.durationMs / MS_PER_HOUR;
    if (hours > longestFastHours) longestFastHours = hours;
    if (hours >= 18 && hours > longest18hFastHours) longest18hFastHours = hours;
  }

  return {
    sessions,
    now,
    totalFasts: t.totalFasts,
    totalHours: t.totalHours,
    longestStreak: s.longest,
    currentStreak: s.current,
    longestFastHours,
    longest18hFastHours,
  };
}

/**
 * Evaluate every milestone against the history. Returns the catalog in order,
 * each tagged with its unlocked flag + 0..1 progress. Derived only; nothing is
 * written anywhere.
 */
export function evaluateAchievements(ctx: {
  sessions: FastingSessionRecord[];
  now: number;
}): AchievementResult[] {
  const context = buildContext(ctx.sessions, ctx.now);
  return ACHIEVEMENTS.map((achievement) => ({
    achievement,
    unlocked: achievement.isUnlocked(context),
    progress: achievement.progress(context),
  }));
}

/** Count of unlocked milestones (for the Stats summary entry). */
export function unlockedCount(results: AchievementResult[]): number {
  return results.reduce((sum, r) => (r.unlocked ? sum + 1 : sum), 0);
}
