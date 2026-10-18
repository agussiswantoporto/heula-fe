/**
 * Best-effort, client-only notifications wrapper (design Section 11).
 *
 * All functions are safe to call in any environment: unsupported/denied/SSR
 * paths return a typed status and never throw to the UI. Scheduling uses
 * setTimeout for near-term fires while the tab is alive; delivery is explicitly
 * best-effort (no push backend). Bodies come from copy.ts.
 */
import { copy } from "@/lib/copy";

export type PermissionStatus = "granted" | "denied" | "default" | "unsupported";

export type ScheduleStatus =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" | "past" | "error" };

const DEV = process.env.NODE_ENV !== "production";

/** Pending scheduled timers keyed by reminder kind. */
const timers: { end: ReturnType<typeof setTimeout> | null; start: ReturnType<typeof setTimeout> | null } = {
  end: null,
  start: null,
};

function devWarn(message: string, err?: unknown): void {
  if (DEV) console.warn(`[notifications] ${message}`, err ?? "");
}

export function isSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPermission(): PermissionStatus {
  if (!isSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestPermission(): Promise<PermissionStatus> {
  if (!isSupported()) return "unsupported";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    devWarn("requestPermission failed", err);
    return "denied";
  }
}

function fire(title: string, body: string): void {
  try {
    if (!isSupported() || Notification.permission !== "granted") return;
    new Notification(title, { body });
  } catch (err) {
    // Some browsers require SW notifications; swallow and warn in dev only.
    devWarn("fire failed", err);
  }
}

function schedule(
  kind: "end" | "start",
  fireAtMs: number,
  title: string,
  body: string,
): ScheduleStatus {
  if (!isSupported()) return { ok: false, reason: "unsupported" };
  if (Notification.permission !== "granted") return { ok: false, reason: "denied" };

  const delay = fireAtMs - Date.now();
  if (delay <= 0) return { ok: false, reason: "past" };

  try {
    if (timers[kind]) clearTimeout(timers[kind]!);
    timers[kind] = setTimeout(() => {
      fire(title, body);
      timers[kind] = null;
    }, delay);
    return { ok: true };
  } catch (err) {
    devWarn(`schedule ${kind} failed`, err);
    return { ok: false, reason: "error" };
  }
}

/** Schedule the "buka puasa" reminder for the target end time. */
export function scheduleEndReminder(
  targetEndMs: number,
  _planLabel?: string,
): ScheduleStatus {
  return schedule(
    "end",
    targetEndMs,
    copy.notifications.endTitle,
    copy.notifications.endBody,
  );
}

/** Schedule the "mulai puasa" reminder for a chosen start time. */
export function scheduleStartReminder(startAtMs: number): ScheduleStatus {
  return schedule(
    "start",
    startAtMs,
    copy.notifications.startTitle,
    copy.notifications.startBody,
  );
}

/** Clear any pending scheduled reminders (best-effort). */
export function clearScheduled(): void {
  if (timers.end) {
    clearTimeout(timers.end);
    timers.end = null;
  }
  if (timers.start) {
    clearTimeout(timers.start);
    timers.start = null;
  }
}
