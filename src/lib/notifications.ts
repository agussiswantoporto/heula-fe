/**
 * Best-effort, client-only notifications wrapper (design Section 11).
 *
 * All functions are safe to call in any environment: unsupported/denied/SSR
 * paths return a typed status and never throw to the UI. Bodies come from
 * copy.ts and the exported surface is stable (call sites import these by name).
 *
 * Delivery routes SW-first with an in-page fallback:
 * - SW-first: when a Service Worker is available we post a `heula/*` message so
 *   the worker arms the timer and calls `showNotification(...)`. That can fire
 *   even after the app/tab is closed, as long as the OS keeps the SW alive.
 * - Fallback: when no SW is available we arm an in-page `setTimeout` and call
 *   `new Notification(...)`, which only fires while the tab is alive.
 *
 * Honest reliability ceiling: both paths are best-effort. SW `setTimeout`
 * survives only while the OS keeps the worker alive (not a guaranteed native
 * alarm), and the in-page path dies with the tab. A PWA also cannot integrate
 * with the phone's native Alarm/Clock app -- web notifications are the only
 * mechanism available (no API to set a device alarm from the web).
 *
 * To avoid a double-fire we arm EITHER the SW path OR the in-page path for a
 * given schedule, never both.
 */
import { copy } from "@/lib/copy";

export type PermissionStatus = "granted" | "denied" | "default" | "unsupported";

export type ScheduleStatus =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" | "past" | "error" };

const DEV = process.env.NODE_ENV !== "production";

type ReminderKind = "end" | "start";

/** Namespaced SW message types (kept in sync with src/app/sw.ts). */
const SCHEDULE_MESSAGE = "heula/schedule-reminder" as const;
const CANCEL_MESSAGE = "heula/cancel-reminder" as const;

interface ScheduleReminderMessage {
  type: typeof SCHEDULE_MESSAGE;
  kind: ReminderKind;
  fireAtMs: number;
  title: string;
  body: string;
}

interface CancelReminderMessage {
  type: typeof CANCEL_MESSAGE;
  kind: ReminderKind;
}

/** Pending in-page fallback timers keyed by reminder kind. */
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

/** True when the SW path (showNotification via a registration) is usable. */
function canUseSW(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof ServiceWorkerRegistration !== "undefined" &&
    "showNotification" in ServiceWorkerRegistration.prototype
  );
}

/** Fire-and-forget post to the active Service Worker (best-effort). */
function postToSW(payload: ScheduleReminderMessage | CancelReminderMessage): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage(payload);
      return;
    }
    // No controller yet (e.g. first load before claim): wait for the active reg.
    void navigator.serviceWorker.ready
      .then((reg) => reg.active?.postMessage(payload))
      .catch((err) => devWarn("postToSW ready failed", err));
  } catch (err) {
    devWarn("postToSW failed", err);
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
  kind: ReminderKind,
  fireAtMs: number,
  title: string,
  body: string,
): ScheduleStatus {
  if (!isSupported()) return { ok: false, reason: "unsupported" };
  if (Notification.permission !== "granted") return { ok: false, reason: "denied" };

  const delay = fireAtMs - Date.now();
  if (delay <= 0) return { ok: false, reason: "past" };

  try {
    // Clear any existing in-page timer for this kind regardless of path.
    if (timers[kind]) {
      clearTimeout(timers[kind]!);
      timers[kind] = null;
    }

    if (canUseSW()) {
      // SW-first: the worker arms the timer and can fire after the tab closes.
      // Do NOT also arm an in-page timer, to avoid a double-fire.
      postToSW({ type: SCHEDULE_MESSAGE, kind, fireAtMs, title, body });
      return { ok: true };
    }

    // Fallback: in-page timer, only fires while the tab is alive.
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

/**
 * Clear any pending scheduled reminders (best-effort). Cancels BOTH the
 * SW-armed reminder (via a cancel message) and any in-page fallback timer, so
 * a reminder is cleared regardless of which path armed it.
 */
export function clearScheduled(): void {
  const kinds: ReminderKind[] = ["end", "start"];
  for (const kind of kinds) {
    if (canUseSW()) postToSW({ type: CANCEL_MESSAGE, kind });
    if (timers[kind]) {
      clearTimeout(timers[kind]!);
      timers[kind] = null;
    }
  }
}
