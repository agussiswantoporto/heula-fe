"use client";

/**
 * HistoryList (design Section 3).
 *
 * Live-queries every session (newest first) via `useLiveQuery` and groups them
 * by calendar day using the pure helpers in `src/lib/time.ts`. Each group shows
 * a friendly day heading (Hari ini / Kemarin / full date) over its rows. A
 * loading state shows while the query resolves; an empty state uses the Gojek
 * voice from copy.ts.
 *
 * Client-only: imports `db` + dexie-react-hooks, allowed only from "use client".
 */
import { useLiveQuery } from "dexie-react-hooks";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { copy } from "@/lib/copy";
import { dayKey, formatDate } from "@/lib/time";
import { db } from "@/db/db";
import type { FastingSessionRecord } from "@/types";
import { SessionRow } from "@/features/history/SessionRow";

interface DayGroup {
  key: string;
  label: string;
  sessions: FastingSessionRecord[];
}

/** Friendly day heading: today, yesterday, or the full date. */
function dayLabel(sessionMs: number, nowMs: number): string {
  const sessionKey = dayKey(sessionMs);
  if (sessionKey === dayKey(nowMs)) return copy.history.todayLabel;
  if (sessionKey === dayKey(nowMs - 86_400_000)) return copy.history.yesterdayLabel;
  return formatDate(sessionMs);
}

/** Group an already-sorted (newest-first) session list by calendar day. */
function groupByDay(
  list: FastingSessionRecord[],
  nowMs: number,
): DayGroup[] {
  const groups: DayGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const session of list) {
    const key = dayKey(session.startMs);
    let idx = indexByKey.get(key);
    if (idx === undefined) {
      idx = groups.length;
      indexByKey.set(key, idx);
      groups.push({ key, label: dayLabel(session.startMs, nowMs), sessions: [] });
    }
    groups[idx].sessions.push(session);
  }

  return groups;
}

export function HistoryList() {
  const list = useLiveQuery(
    () => db.sessions.orderBy("startMs").reverse().toArray(),
    [],
  );

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
        icon="tab_history"
        title={copy.states.historyEmpty}
      />
    );
  }

  const groups = groupByDay(list, Date.now());

  return (
    <div className="flex flex-col gap-7">
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-content-muted">
            {group.label}
          </h2>
          <div className="flex flex-col gap-2">
            {group.sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
