"use client";

/**
 * FastingTimer (design Section 15) — the Home centerpiece.
 *
 * Reads `activeFast` from the store and ticks once per second (only while a fast
 * is active; the interval clears on unmount). The tick feeds `nowMs` into the
 * pure `computeTimer`, driving the ProgressRing, the big HH:MM:SS readout, the
 * target-end / remaining labels, and the StageIndicator.
 *
 * Hydration safety: `nowMs` is null until the first client tick, so SSR and the
 * first client render show a stable placeholder (no `Date.now()` in render).
 *
 * Auto-complete: when `isComplete` flips true, a no-emoji prompt lets the user
 * either stop (write the session) or keep counting toward Deep fast.
 */
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastProvider";
import { copy } from "@/lib/copy";
import { clearScheduled } from "@/lib/notifications";
import { stageForElapsed } from "@/lib/stages";
import { computeTimer, formatHMS } from "@/lib/timer";
import { formatClock } from "@/lib/time";
import { useAppStore } from "@/store/useAppStore";
import { ProgressRing } from "@/features/timer/ProgressRing";
import { StageIndicator } from "@/features/timer/StageIndicator";
import { TimerControls } from "@/features/timer/TimerControls";
import { useTimer } from "@/features/timer/useTimer";

export function FastingTimer() {
  const activeFast = useAppStore((s) => s.activeFast);
  const stopFast = useAppStore((s) => s.stopFast);
  const { show } = useToast();

  const nowMs = useTimer(activeFast !== null);
  // true after the user chooses "Lanjut" on the complete prompt (keep counting).
  const [dismissedComplete, setDismissedComplete] = useState(false);

  // Idle: no active fast. Stable render that matches SSR.
  if (!activeFast) {
    return (
      <div className="flex min-h-full flex-col px-4 pt-8">
        <h1 className="text-2xl font-bold text-content">Heula</h1>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
          <ProgressRing progress={0}>
            <p className="font-mono text-4xl font-bold tabular-nums text-content">
              00:00:00
            </p>
            <p className="mt-1 text-sm text-content-muted">
              {copy.timer.idleTitle}
            </p>
          </ProgressRing>
          <p className="max-w-xs text-sm text-content-muted">
            {copy.timer.idleBody}
          </p>
        </div>
        <div className="mt-auto pb-4">
          <TimerControls activeFast={null} />
        </div>
      </div>
    );
  }

  // Before the first client tick, render a stable placeholder (no clock read).
  if (nowMs === null) {
    return (
      <div className="flex min-h-full flex-col px-4 pt-8">
        <h1 className="text-2xl font-bold text-content">Heula</h1>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
          <ProgressRing progress={0}>
            <p className="font-mono text-4xl font-bold tabular-nums text-content">
              00:00:00
            </p>
            <p className="mt-1 text-sm text-content-muted">
              {activeFast.planLabel}
            </p>
          </ProgressRing>
        </div>
      </div>
    );
  }

  const t = computeTimer({
    startMs: activeFast.startMs,
    targetHours: activeFast.targetHours,
    nowMs,
  });
  const stage = stageForElapsed(t.elapsedMs);
  const showCompletePrompt = t.isComplete && !dismissedComplete;

  async function handleStop() {
    await stopFast();
    clearScheduled();
    setDismissedComplete(false);
    show(copy.toasts.fastCompleted, "success");
  }

  return (
    <div className="flex min-h-full flex-col gap-5 px-4 pt-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-content">Heula</h1>
        <span className="text-sm font-medium text-content-muted">
          {copy.timer.planLabel}: {activeFast.planLabel}
        </span>
      </div>

      <ProgressRing progress={t.progress}>
        <p className="font-mono text-4xl font-bold tabular-nums text-content">
          {formatHMS(t.elapsedMs)}
        </p>
        <p className="mt-1 text-sm text-content-muted">
          {copy.timer.elapsedLabel}
        </p>
      </ProgressRing>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-xs text-content-muted">
            {copy.timer.targetEndLabel}
          </p>
          <p className="mt-1 text-lg font-semibold text-content">
            {formatClock(t.targetEndMs)}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-content-muted">
            {t.isComplete ? copy.timer.overfastLabel : copy.timer.remainingLabel}
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-content">
            {t.isComplete
              ? formatHMS(t.elapsedMs - t.targetMs)
              : formatHMS(t.remainingMs)}
          </p>
        </Card>
      </div>

      <StageIndicator stage={stage} />

      {showCompletePrompt && (
        <Card className="border-brand bg-surface-2">
          <p className="text-sm font-semibold text-content">
            {copy.timer.completeTitle}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setDismissedComplete(true)}
            >
              {copy.timer.completeContinue}
            </Button>
            <Button variant="primary" fullWidth onClick={handleStop}>
              {copy.timer.completeStop}
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-auto pb-4">
        <TimerControls activeFast={activeFast} />
      </div>
    </div>
  );
}
