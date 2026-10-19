"use client";

/**
 * SessionRow (design Section 3).
 *
 * One row in the History list: the fasting method label, the formatted
 * duration, and a completed/stopped badge. Deleting opens a ConfirmDialog and,
 * on confirm, removes the session from Dexie (the live query refreshes the list
 * automatically). All copy is emoji-free from copy.ts; icons go through the
 * Icon choke point.
 */
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/ToastProvider";
import { copy, MOOD_LABELS } from "@/lib/copy";
import { cn } from "@/lib/cn";
import { formatHMS } from "@/lib/timer";
import { formatClock } from "@/lib/time";
import * as sessions from "@/db/sessions";
import { MoodNoteSheet } from "@/features/history/MoodNoteSheet";
import type { FastingSessionRecord, IconKey, Mood } from "@/types";

/** Mood -> Icon choke-point key for the small History indicator. */
const MOOD_ICON: Record<Mood, IconKey> = {
  energik: "mood_energik",
  biasa: "mood_biasa",
  lemes: "mood_lemes",
  lapar: "mood_lapar",
};

export interface SessionRowProps {
  session: FastingSessionRecord;
}

export function SessionRow({ session }: SessionRowProps) {
  const { show } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    setConfirmOpen(false);
    if (session.id === undefined) return;
    const ok = await sessions.remove(session.id);
    show(ok ? copy.toasts.deleted : copy.toasts.saveFailed, ok ? "info" : "info");
  }

  return (
    <>
      <Card className="flex items-center gap-3">
        <button
          type="button"
          aria-label={copy.mood.editAria}
          onClick={() => setEditOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-80"
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-pill",
              session.completed
                ? "bg-brand-soft text-brand"
                : "bg-surface-2 text-content-muted",
            )}
          >
            <Icon name={session.completed ? "check" : "stop"} size={22} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-content">
                {session.planLabel}
              </span>
              <span
                className={cn(
                  "rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  session.completed
                    ? "bg-brand-soft text-brand"
                    : "bg-surface-2 text-content-muted",
                )}
              >
                {session.completed
                  ? copy.history.completedBadge
                  : copy.history.stoppedBadge}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-content-muted">
              {copy.history.durationLabel}: {formatHMS(session.durationMs)}
              {" - "}
              {formatClock(session.startMs)}
            </p>
            {session.mood !== undefined && (
              <span
                aria-label={copy.mood.indicatorAria}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-content-muted"
              >
                <Icon name={MOOD_ICON[session.mood]} size={14} />
                {MOOD_LABELS[session.mood]}
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          aria-label={copy.history.deleteConfirmYes}
          onClick={() => setConfirmOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill text-content-muted active:bg-surface-2"
        >
          <Icon name="trash" size={20} />
        </button>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title={copy.history.deleteConfirmTitle}
        description={copy.history.deleteConfirmBody}
        confirmLabel={copy.history.deleteConfirmYes}
        cancelLabel={copy.history.deleteConfirmNo}
        confirmVariant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <MoodNoteSheet
        open={editOpen}
        sessionId={session.id ?? null}
        initialMood={session.mood}
        initialNote={session.note}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}
