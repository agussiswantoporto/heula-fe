import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [{ url: "/offline", matcher: ({ request }) => request.destination === "document" }],
  },
});
serwist.addEventListeners();

/**
 * Heula best-effort reminder scheduling inside the Service Worker.
 *
 * Why here: a SW can call `self.registration.showNotification(...)` even when
 * no page/tab is open, so a reminder armed here can still fire after the user
 * closes the app. This is the SW-first path; `src/lib/notifications.ts` falls
 * back to an in-page `setTimeout + new Notification()` when the SW is not
 * available.
 *
 * Honest reliability ceiling: this uses `setTimeout` inside the SW, which only
 * survives while the OS/browser keeps the worker alive. If the system evicts
 * the SW (common after a while, especially on mobile), a pending timer is lost.
 * So this is best-effort, NOT a guaranteed native alarm.
 *
 * Hard platform limit: a PWA cannot integrate with the phone's native
 * Alarm/Clock app. Web notifications are the only mechanism available here;
 * there is no API to set a device alarm from the web.
 *
 * The listener only acts on namespaced `heula/*` message types and ignores
 * everything else, so Serwist's own messaging (SKIP_WAITING etc.) is untouched.
 */
type ReminderKind = "end" | "start";

interface ScheduleReminderMessage {
  type: "heula/schedule-reminder";
  kind: ReminderKind;
  fireAtMs: number;
  title: string;
  body: string;
}

interface CancelReminderMessage {
  type: "heula/cancel-reminder";
  kind: ReminderKind;
}

/** Pending SW-side timers keyed by reminder kind. */
const reminderTimers = new Map<ReminderKind, ReturnType<typeof setTimeout>>();

function clearReminderTimer(kind: ReminderKind): void {
  const existing = reminderTimers.get(kind);
  if (existing !== undefined) {
    clearTimeout(existing);
    reminderTimers.delete(kind);
  }
}

function armReminder(msg: ScheduleReminderMessage): void {
  clearReminderTimer(msg.kind);
  const delay = msg.fireAtMs - Date.now();
  if (delay <= 0) return; // already past; nothing to arm

  const timer = setTimeout(() => {
    reminderTimers.delete(msg.kind);
    void self.registration.showNotification(msg.title, {
      body: msg.body,
      tag: msg.kind, // re-scheduling the same kind replaces instead of stacking
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      requireInteraction: false,
    });
  }, delay);

  reminderTimers.set(msg.kind, timer);
}

self.addEventListener("message", (event) => {
  const data = event.data as { type?: unknown } | null | undefined;
  if (!data || typeof data.type !== "string" || !data.type.startsWith("heula/")) {
    return; // not ours; let Serwist's own handlers deal with it
  }

  if (data.type === "heula/schedule-reminder") {
    armReminder(data as unknown as ScheduleReminderMessage);
    return;
  }

  if (data.type === "heula/cancel-reminder") {
    const { kind } = data as unknown as CancelReminderMessage;
    clearReminderTimer(kind);
  }
});
