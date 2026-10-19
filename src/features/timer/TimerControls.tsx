"use client";

/**
 * TimerControls (design Section 15).
 *
 * - Start: `startFast()` then schedule the end reminder when enabled.
 * - Stop: opens a ConfirmDialog; on confirm `stopFast()` writes the session,
 *   clears scheduled reminders, and shows a friendly toast.
 * - Edit start time: opens the StartTimeSheet.
 *
 * All copy is emoji-free from copy.ts; icons go through the Icon choke point.
 */
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/ToastProvider";
import { copy } from "@/lib/copy";
import {
  clearScheduled,
  scheduleEndReminder,
} from "@/lib/notifications";
import { useAppStore } from "@/store/useAppStore";
import { StartTimeSheet } from "@/features/timer/StartTimeSheet";
import { MoodNoteSheet } from "@/features/history/MoodNoteSheet";
import type { ActiveFast } from "@/store/types";

const MS_PER_HOUR = 3_600_000;

export interface TimerControlsProps {
  activeFast: ActiveFast | null;
}

export function TimerControls({ activeFast }: TimerControlsProps) {
  const startFast = useAppStore((s) => s.startFast);
  const stopFast = useAppStore((s) => s.stopFast);
  const editStartTime = useAppStore((s) => s.editStartTime);
  const reminders = useAppStore((s) => s.reminders);
  const { show } = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Id of the just-saved session to attach an optional mood/note to; null hides
  // the skippable capture sheet.
  const [moodSessionId, setMoodSessionId] = useState<number | null>(null);

  function handleStart() {
    startFast();
    if (reminders.endEnabled) {
      // startFast has snapshotted activeFast with the resolved target hours.
      const started = useAppStore.getState().activeFast;
      if (started) {
        const endMs = started.startMs + started.targetHours * MS_PER_HOUR;
        scheduleEndReminder(endMs, started.planLabel);
      }
    }
    show(copy.toasts.fastStarted, "success");
  }

  async function handleStopConfirm() {
    setConfirmOpen(false);
    const id = await stopFast();
    clearScheduled();
    show(copy.toasts.fastStopped, "info");
    // Offer the skippable mood/note capture for the just-saved row.
    if (id !== null) setMoodSessionId(id);
  }

  function handleSaveStart(startMs: number) {
    editStartTime(startMs);
    show(copy.toasts.startTimeUpdated, "info");
  }

  if (!activeFast) {
    return (
      <Button variant="primary" fullWidth onClick={handleStart}>
        <Icon name="play" size={20} />
        {copy.timer.start}
      </Button>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button
          variant="destructive"
          fullWidth
          onClick={() => setConfirmOpen(true)}
        >
          <Icon name="stop" size={20} />
          {copy.timer.stop}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => setSheetOpen(true)}>
          <Icon name="edit" size={20} />
          {copy.timer.editStart}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={copy.timer.stopConfirmTitle}
        description={copy.timer.stopConfirmBody}
        confirmLabel={copy.timer.stopConfirmYes}
        cancelLabel={copy.timer.stopConfirmNo}
        confirmVariant="destructive"
        onConfirm={handleStopConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      <StartTimeSheet
        open={sheetOpen}
        startMs={activeFast.startMs}
        onClose={() => setSheetOpen(false)}
        onSave={handleSaveStart}
      />

      <MoodNoteSheet
        open={moodSessionId !== null}
        sessionId={moodSessionId}
        onClose={() => setMoodSessionId(null)}
      />
    </>
  );
}
