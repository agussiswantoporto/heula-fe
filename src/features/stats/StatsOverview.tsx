"use client";

/**
 * StatsOverview (design Section 10).
 *
 * Live-queries every session and derives streaks/totals/average via the pure
 * `src/lib/stats` functions, then renders them as stat cards plus the weekly
 * bar chart. It also surfaces the profiling goal read straight from the Zustand
 * store and mapped through GOAL_LABELS, with a neutral "Belum ada tujuan"
 * placeholder when profiling is null (design Section 10, AC13).
 *
 * The stats derivations are pure over FastingSessionRecord[]; `now` is injected
 * here from the client clock. Client-only (imports db + dexie-react-hooks).
 */
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { copy, GOAL_LABELS, MOOD_LABELS } from "@/lib/copy";
import {
  bmiCategory,
  computeBmi,
  isValidBmiInput,
  type BmiCategory,
} from "@/lib/bmi";
import { evaluateAchievements, unlockedCount } from "@/lib/achievements";
import { moodBreakdown } from "@/lib/mood";
import { streaks, totals, weekly } from "@/lib/stats";
import { deltas, latest } from "@/lib/weight";
import { db } from "@/db/db";
import { useAppStore } from "@/store/useAppStore";
import { WeeklyBarChart } from "@/features/stats/WeeklyBarChart";
import { AdaptiveCard } from "@/features/adaptive/AdaptiveCard";
import type { IconKey, Mood, WeightRecord } from "@/types";

const BMI_TEXT: Record<BmiCategory, string> = {
  underweight: copy.stats.bmiUnderweight,
  normal: copy.stats.bmiNormal,
  overweight: copy.stats.bmiOverweight,
  obese: copy.stats.bmiObese,
};

/** Mood -> Icon choke-point key, ordered best -> hardest for the summary. */
const MOOD_SUMMARY: { value: Mood; icon: IconKey }[] = [
  { value: "energik", icon: "mood_energik" },
  { value: "biasa", icon: "mood_biasa" },
  { value: "lemes", icon: "mood_lemes" },
  { value: "lapar", icon: "mood_lapar" },
];

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="text-center">
      <p className="text-xs text-content-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-content">{value}</p>
    </Card>
  );
}

/**
 * Compact "Berat badan" summary that links to /stats/berat. Shows the latest
 * weight + delta from the previous entry (via @/lib/weight) when entries exist,
 * otherwise a friendly empty hint. Nested route keeps the tab bar (startsWith
 * "/stats"). Live query is undefined until Dexie resolves.
 */
function WeightSummaryCard({ list }: { list: WeightRecord[] | undefined }) {
  const current = list ? latest(list) : null;
  const { fromPrevious } = list
    ? deltas(list)
    : { fromPrevious: null };

  return (
    <Link href="/stats/berat" className="block">
      <Card className="flex items-center gap-3 active:opacity-80">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand">
          <Icon name="weight" size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-content-muted">{copy.weight.summaryLabel}</p>
          {current ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold tabular-nums text-content">
              <span>
                {current.weightKg} {copy.weight.inputUnit}
              </span>
              {fromPrevious !== null && fromPrevious !== 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-content-muted">
                  <Icon
                    name={fromPrevious < 0 ? "trend_down" : "trend_up"}
                    size={14}
                  />
                  {fromPrevious > 0 ? "+" : ""}
                  {fromPrevious.toFixed(1)}
                </span>
              )}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-content-muted">
              {copy.weight.summaryEmpty}
            </p>
          )}
        </div>
        <Icon name="chevron" size={20} className="shrink-0 text-content-muted" />
      </Card>
    </Link>
  );
}

/**
 * Compact "Rasa puasamu" summary showing how many sessions fell under each mood
 * (via the pure moodBreakdown). Rows with undefined mood are ignored by the lib,
 * so the card renders only when at least one session has a mood recorded.
 */
function MoodSummaryCard({ breakdown }: { breakdown: Record<Mood, number> }) {
  const total = MOOD_SUMMARY.reduce((sum, m) => sum + breakdown[m.value], 0);
  if (total === 0) return null;

  return (
    <Card>
      <p className="text-xs text-content-muted">{copy.mood.summaryTitle}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {MOOD_SUMMARY.map((m) => (
          <div
            key={m.value}
            className="flex items-center gap-2 text-sm text-content"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-content-muted">
              <Icon name={m.icon} size={18} />
            </span>
            <span className="min-w-0 flex-1 truncate">
              {MOOD_LABELS[m.value]}
            </span>
            <span className="font-semibold tabular-nums">
              {breakdown[m.value]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Compact "Pencapaian" summary that links to /stats/pencapaian. Shows how many
 * milestones are unlocked out of the full catalog, derived purely from history
 * via evaluateAchievements (no badge state stored). Nested route keeps the tab
 * bar (startsWith "/stats").
 */
function AchievementsSummaryCard({
  unlocked,
  total,
}: {
  unlocked: number;
  total: number;
}) {
  return (
    <Link href="/stats/pencapaian" className="block">
      <Card className="flex items-center gap-3 active:opacity-80">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand">
          <Icon name="achievement" size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-content-muted">
            {copy.achievements.summaryLabel}
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-content">
            {copy.achievements.summaryCount(unlocked, total)}
          </p>
        </div>
        <Icon name="chevron" size={20} className="shrink-0 text-content-muted" />
      </Card>
    </Link>
  );
}

export function StatsOverview() {
  const profiling = useAppStore((s) => s.profiling);
  const list = useLiveQuery(
    () => db.sessions.orderBy("startMs").reverse().toArray(),
    [],
  );
  const weightList = useLiveQuery(
    () => db.weights.orderBy("recordedAt").toArray(),
    [],
  );

  const goalLabel = profiling
    ? GOAL_LABELS[profiling.goal]
    : copy.states.noGoal;

  // Older persisted profiling predates BMI, so height/weight may be undefined.
  // Guard with isValidBmiInput and only surface the card when both are valid.
  const heightCm = profiling?.heightCm;
  const weightKg = profiling?.weightKg;
  const hasBmi =
    heightCm !== undefined &&
    weightKg !== undefined &&
    isValidBmiInput(heightCm, weightKg);
  const bmi = hasBmi ? computeBmi(heightCm, weightKg) : NaN;
  const bmiCat = hasBmi ? bmiCategory(bmi) : null;

  if (list === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={28} label={copy.states.loading} />
      </div>
    );
  }

  const now = Date.now();
  const t = totals(list);
  const s = streaks(list, now);
  const buckets = weekly(list, now);
  const moods = moodBreakdown(list);
  const achievements = evaluateAchievements({ sessions: list, now });

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand">
          <Icon name="goal" size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-content-muted">{copy.stats.goalLabel}</p>
          <p className="text-sm font-semibold text-content">{goalLabel}</p>
        </div>
      </Card>

      {hasBmi && bmiCat && (
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand">
            <Icon name="bmi" size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-content-muted">{copy.stats.bmiLabel}</p>
            <p className="text-sm font-semibold tabular-nums text-content">
              {bmi.toFixed(1)}
            </p>
            <p className="mt-0.5 text-xs text-content-muted">
              {BMI_TEXT[bmiCat]}
            </p>
          </div>
        </Card>
      )}

      <WeightSummaryCard list={weightList} />

      {list.length > 0 && (
        <AchievementsSummaryCard
          unlocked={unlockedCount(achievements)}
          total={achievements.length}
        />
      )}

      <AdaptiveCard />

      {list.length === 0 ? (
        <EmptyState icon="tab_stats" title={copy.states.statsEmpty} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label={copy.stats.currentStreak}
              value={`${s.current} ${copy.stats.dayUnit}`}
            />
            <StatCard
              label={copy.stats.longestStreak}
              value={`${s.longest} ${copy.stats.dayUnit}`}
            />
            <StatCard
              label={copy.stats.totalFasts}
              value={`${t.totalFasts} ${copy.stats.fastUnit}`}
            />
            <StatCard
              label={copy.stats.totalHours}
              value={`${Math.round(t.totalHours)} ${copy.stats.hourUnit}`}
            />
            <StatCard
              label={copy.stats.averageLength}
              value={`${t.averageHours.toFixed(1)} ${copy.stats.hourUnit}`}
            />
          </div>

          <Card>
            <WeeklyBarChart buckets={buckets} />
          </Card>

          <MoodSummaryCard breakdown={moods} />
        </>
      )}
    </div>
  );
}
