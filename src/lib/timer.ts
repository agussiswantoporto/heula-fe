/**
 * Fasting timer math (design Section 7.1).
 *
 * computeTimer is pure: `nowMs` is injected (the UI tick feeds Date.now()), so
 * the module never reads the clock itself and is fully unit-testable. Elapsed
 * may exceed target (overfast); `progress` clamps at 1 while elapsedMs keeps
 * counting past target so the Deep fast stage stays reachable.
 */

const MS_PER_HOUR = 3_600_000;

export interface TimerState {
  startMs: number;
  targetHours: number;
  nowMs: number; // injected (from tick), never read internally -> pure/testable
}

export interface TimerComputed {
  elapsedMs: number; // max(0, nowMs - startMs)
  targetMs: number; // targetHours * 3_600_000
  remainingMs: number; // max(0, targetMs - elapsedMs)
  targetEndMs: number; // startMs + targetMs
  progress: number; // clamp(elapsedMs / targetMs, 0, 1)
  isComplete: boolean; // elapsedMs >= targetMs
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeTimer(s: TimerState): TimerComputed {
  const elapsedMs = Math.max(0, s.nowMs - s.startMs);
  const targetMs = s.targetHours * MS_PER_HOUR;
  const remainingMs = Math.max(0, targetMs - elapsedMs);
  const targetEndMs = s.startMs + targetMs;
  const progress = targetMs > 0 ? clamp(elapsedMs / targetMs, 0, 1) : 0;
  const isComplete = elapsedMs >= targetMs;
  return { elapsedMs, targetMs, remainingMs, targetEndMs, progress, isComplete };
}

/** Format a duration in ms as "HH:MM:SS" with uncapped hours (e.g. 26:03:11). */
export function formatHMS(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
