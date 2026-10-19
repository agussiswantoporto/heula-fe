"use client";

/**
 * WeightTracker (FEAT-002, Feature 1).
 *
 * Live-queries the Dexie `weights` table (oldest -> newest), lets the user log
 * a numeric weight with validation + Gojek-voice copy, lists entries with a
 * delete-confirm (mirrors SessionRow.tsx), and renders latest/change readouts
 * plus a no-charting-lib trend chart. All trend math comes from the pure
 * @/lib/weight; weight bounds/validation + BMI from @/lib/bmi. The BMI-over-
 * time readout only appears when profiling.heightCm is valid; otherwise a
 * friendly note shows and logging still works. Client-only (db + live query).
 */
import { useId, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";
import { copy } from "@/lib/copy";
import { formatDate } from "@/lib/time";
import { WEIGHT_MAX_KG, WEIGHT_MIN_KG, isValidWeight } from "@/lib/bmi";
import {
  bmiSeries,
  changeOverPeriod,
  latest,
  sortByTime,
} from "@/lib/weight";
import { WeightTrendChart } from "@/features/weight/WeightTrendChart";
import { db } from "@/db/db";
import * as weights from "@/db/weights";
import { useAppStore } from "@/store/useAppStore";
import type { WeightRecord } from "@/types";

/** Parse a numeric field; empty string -> null, otherwise a finite number. */
function parseField(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** Format a signed delta in kg, e.g. "+1.2 kg" / "-0.5 kg" / "0 kg". */
function formatDelta(kg: number): string {
  const sign = kg > 0 ? "+" : "";
  return `${sign}${kg.toFixed(1)} ${copy.weight.inputUnit}`;
}

const CHANGE_WINDOW_DAYS = 30;

export function WeightTracker() {
  const { show } = useToast();
  const inputId = useId();
  const errorId = useId();
  const heightCm = useAppStore((s) => s.profiling?.heightCm);

  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const list = useLiveQuery(
    () => db.weights.orderBy("recordedAt").toArray(),
    [],
  );

  const invalid = weightKg !== null && !isValidWeight(weightKg);
  const canLog = weightKg !== null && isValidWeight(weightKg);

  async function handleLog() {
    if (weightKg === null || !isValidWeight(weightKg)) return;
    const id = await weights.add({ weightKg, recordedAt: Date.now() });
    if (id === null) {
      show(copy.toasts.saveFailed, "info");
      return;
    }
    setWeightKg(null);
    show(copy.weight.saved, "info");
  }

  async function handleDelete() {
    const id = pendingDelete;
    setPendingDelete(null);
    if (id === null) return;
    const ok = await weights.remove(id);
    show(ok ? copy.toasts.deleted : copy.toasts.saveFailed, "info");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Logging form */}
      <Card className="flex flex-col gap-3">
        <label htmlFor={inputId} className="text-sm font-medium text-content">
          {copy.weight.inputLabel}
        </label>
        <div className="flex items-center gap-2 rounded-control border border-border bg-surface px-4 focus-within:border-brand">
          <input
            id={inputId}
            type="number"
            inputMode="decimal"
            min={WEIGHT_MIN_KG}
            max={WEIGHT_MAX_KG}
            placeholder={copy.weight.inputPlaceholder}
            value={weightKg ?? ""}
            onChange={(e) => setWeightKg(parseField(e.target.value))}
            aria-label={copy.weight.inputLabel}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
            className="min-h-12 w-full bg-transparent text-base tabular-nums text-content outline-none placeholder:text-content-muted"
          />
          <span className="shrink-0 text-sm text-content-muted">
            {copy.weight.inputUnit}
          </span>
        </div>
        {invalid && (
          <p id={errorId} className="text-xs text-danger">
            {copy.weight.invalidRange}
          </p>
        )}
        <Button variant="primary" fullWidth disabled={!canLog} onClick={handleLog}>
          <Icon name="plus" size={20} />
          {copy.weight.logButton}
        </Button>
      </Card>

      {list === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size={28} label={copy.states.loading} />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon="weight"
          title={copy.weight.emptyTitle}
          description={copy.weight.emptyBody}
        />
      ) : (
        <WeightBody
          list={list}
          heightCm={heightCm}
          onRequestDelete={(id) => setPendingDelete(id)}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={copy.weight.deleteConfirmTitle}
        description={copy.weight.deleteConfirmBody}
        confirmLabel={copy.weight.deleteConfirmYes}
        cancelLabel={copy.weight.deleteConfirmNo}
        confirmVariant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

interface WeightBodyProps {
  list: WeightRecord[];
  heightCm: number | undefined;
  onRequestDelete: (id: number) => void;
}

/** Readouts + chart + entry list, rendered only when entries exist. */
function WeightBody({ list, heightCm, onRequestDelete }: WeightBodyProps) {
  const now = Date.now();
  const current = latest(list);
  const change = changeOverPeriod(list, now, CHANGE_WINDOW_DAYS);
  const series = bmiSeries(list, heightCm);
  const bmiChange =
    series.length >= 2 ? series[series.length - 1].bmi - series[0].bmi : null;
  const hasHeight = series.length > 0;

  const points = sortByTime(list).map((r) => ({
    recordedAt: r.recordedAt,
    weightKg: r.weightKg,
  }));

  // Newest-first for the readable entry list.
  const rows = [...sortByTime(list)].reverse();

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-xs text-content-muted">{copy.weight.latestLabel}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-content">
            {current ? `${current.weightKg} ${copy.weight.inputUnit}` : "-"}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-content-muted">{copy.weight.changeLabel}</p>
          {change === null ? (
            <p className="mt-1 text-xs text-content-muted">
              {copy.weight.changeNone}
            </p>
          ) : (
            <p className="mt-1 flex items-center justify-center gap-1 text-xl font-bold tabular-nums text-content">
              {change !== 0 && (
                <Icon name={change < 0 ? "trend_down" : "trend_up"} size={18} />
              )}
              {formatDelta(change)}
            </p>
          )}
        </Card>
      </div>

      {hasHeight ? (
        bmiChange !== null && (
          <Card className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand">
              <Icon name="bmi" size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-content-muted">
                {copy.weight.bmiChangeLabel}
              </p>
              <p className="text-sm font-semibold tabular-nums text-content">
                {bmiChange > 0 ? "+" : ""}
                {bmiChange.toFixed(1)}
              </p>
            </div>
          </Card>
        )
      ) : (
        <Card>
          <p className="text-sm text-content-muted">
            {copy.weight.heightMissingNote}
          </p>
        </Card>
      )}

      <Card>
        <WeightTrendChart points={points} />
      </Card>

      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <Card key={r.id} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand">
              <Icon name="weight" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tabular-nums text-content">
                {r.weightKg} {copy.weight.inputUnit}
              </p>
              <p className="mt-0.5 text-xs text-content-muted">
                {formatDate(r.recordedAt)}
              </p>
            </div>
            <button
              type="button"
              aria-label={copy.weight.deleteLabel}
              onClick={() => r.id !== undefined && onRequestDelete(r.id)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill text-content-muted active:bg-surface-2"
            >
              <Icon name="trash" size={20} />
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}
