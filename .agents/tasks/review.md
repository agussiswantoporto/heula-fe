# Service Worker reminders with in-page fallback and permission UI for Heula

The change moves Heula's best-effort fasting reminders out of the page and into the Service Worker so they can fire after the app is closed, with an in-page `setTimeout` fallback when no SW is available. It adds a Profile reminder-status section that names all four permission states in Gojek voice with io5 icons, reworks the subtitle to stop promising "selama tab kebuka," and adds a dismissible iOS "install to Home Screen" card gated to iOS Safari that is not already installed. No backend, push, or VAPID is introduced; everything stays client-only and SSR-safe.

Watch for: the SW-first path reports success the instant the message is posted and silently drops the reminder if delivery fails, with no fallback (confirmed, best-effort by design but worth knowing); `scheduleStartReminder` stays exported but is never wired to the `startEnabled` toggle, so turning on "Ingatkan saat mulai puasa" stores a preference that arms nothing (confirmed, pre-existing, kept intentionally per the stable-surface requirement); a now-unused `reminderUnsupported` copy key is left behind as dead string (confirmed, cosmetic).

**Verdict**: APPROVED

## High-level view

Scheduling now routes SW-first: `notifications.ts` posts a namespaced `heula/schedule-reminder` message, and `sw.ts` arms a per-kind `setTimeout` that calls `self.registration.showNotification`. When the SW is unavailable the wrapper falls back to an in-page `setTimeout + new Notification`, and it arms exactly one path per schedule so there is no double-fire. `clearScheduled` cancels both paths. The exported surface of `notifications.ts` is unchanged, so the three call sites (`useAppStore`, `TimerControls`, `FastingTimer`) needed no edits.

The SW message handler is correctly isolated from Serwist: `serwist.addEventListeners()` runs first, and the custom `message` listener early-returns on anything whose `type` is not a string starting with `heula/`, leaving `SKIP_WAITING` and precache/offline handling untouched. The namespaced strings are present in the emitted `public/sw.js`.

The honesty of the feature rests in the right places: the subtitle and README no longer claim tab-bound delivery, and both `sw.ts` and `notifications.ts` carry frank comments that `setTimeout` inside the SW only survives while the OS keeps the worker alive, and that a PWA cannot touch the phone's native alarm.

The Profile status row renders a distinct io5 icon and copy for granted / default / denied / unsupported, surfaces an "Izinkan notifikasi" action only in the default state, and tells denied users to re-enable in browser/OS settings because the page cannot re-prompt. The iOS install card is read after mount so SSR and first client render agree, is feature-detected via `shouldShowIOSInstallHint()`, and is dismissible; it never shows on Android, desktop, or an installed PWA.

The reliability ceiling is the one thing to keep in mind: `schedule()` returns `{ ok: true }` the moment the SW message is posted, with no confirmation the worker armed anything, and no fallback if `postToSW` finds no controller and `navigator.serviceWorker.ready` rejects. This is consistent with the stated best-effort contract but means a lost SW message is a silently lost reminder.

<details>
<summary>Issues (3)</summary>

1. **SW-first silent drop** — `schedule()` reports `{ ok: true }` as soon as the `heula/schedule-reminder` message is posted and does not fall back to the in-page timer if SW delivery fails (no controller and `ready` rejects). Acceptable under the best-effort contract; consider an in-page fallback arm if the post cannot be confirmed, or leave as-is and document.
2. **Unwired start reminder** — `scheduleStartReminder` is exported but never called; the `startEnabled` toggle persists a preference that arms no reminder. Pre-existing and intentionally kept to preserve the stable surface; either wire it to a start-time schedule or note in UI that it is not yet active.
3. **Dead copy key** — `copy.settings.reminderUnsupported` is now unused (the UI reads `reminderUnsupportedHint`, an identical string). Remove the stale key.

</details>

<details>
<summary>Details</summary>

### SW message handler isolated from Serwist

`sw.ts` registers its own `message` listener after `serwist.addEventListeners()`, and the first thing that listener does is bail on anything that is not a `heula/`-prefixed string type:

```ts
const data = event.data as { type?: unknown } | null | undefined;
if (!data || typeof data.type !== "string" || !data.type.startsWith("heula/")) {
  return; // not ours; let Serwist's own handlers deal with it
}
```

Because both listeners run independently and the custom one ignores non-`heula/` traffic, Serwist's `SKIP_WAITING` messaging, precaching, navigation preload, and the `/offline` document fallback are all left intact. The namespaced `heula/schedule-reminder` and `heula/cancel-reminder` strings are both present in the compiled `public/sw.js` (confirmed, grep count 1 each). Re-scheduling the same kind replaces rather than stacks via the `tag: msg.kind` de-dupe and an explicit `clearReminderTimer` at the top of `armReminder` (confirmed).

### SW-first routing with a single armed path

`schedule()` clears any existing in-page timer for the kind, then branches: if `canUseSW()` it posts the SW message and returns, otherwise it arms the in-page `setTimeout`. Only one path is armed per schedule, so there is no double-fire (confirmed). `canUseSW()` is SSR-safe — it guards `typeof navigator`, `"serviceWorker" in navigator`, and `typeof ServiceWorkerRegistration` before touching `ServiceWorkerRegistration.prototype` (confirmed).

The reliability gap is in how success is reported. `postToSW` is fire-and-forget: if there is no controller it waits on `navigator.serviceWorker.ready` and posts to `reg.active`, but `schedule()` has already returned `{ ok: true }` and there is no in-page fallback if that post never lands (confirmed). The comments are honest about the best-effort ceiling, but a dropped SW message is a silently dropped reminder with no second chance.

`clearScheduled` posts `heula/cancel-reminder` for both kinds when the SW is usable and also clears both in-page timers, so cancellation covers whichever path armed the reminder (confirmed).

### Stable exported surface, call sites untouched

`isSupported`, `getPermission`, `requestPermission`, `scheduleEndReminder`, `scheduleStartReminder`, `clearScheduled`, `PermissionStatus`, and `ScheduleStatus` are all still exported with their prior signatures. `scheduleEndReminder` keeps its `(targetEndMs, planLabel?)` shape even though the label is now unused (`_planLabel`), which preserves the three call sites in `useAppStore`, `TimerControls`, and `FastingTimer` with no edits (confirmed). `scheduleStartReminder` remains exported but has no caller anywhere in `src`; the `startEnabled` toggle only persists a preference. That is pre-existing — this diff did not remove a working start reminder — and keeping the export matches the task's stable-surface requirement, but the toggle currently arms nothing.

### Permission status UI and honest copy

The four `PermissionStatus` values map to distinct io5 icons and copy via `STATUS_META`, with `unsupported` overriding whatever `getPermission` returns, and the "Izinkan notifikasi" action appears only in the supported-and-`default` state. The denied state carries `reminderDeniedHint`, which tells the user the page cannot re-prompt and to re-enable in browser or OS settings (confirmed) — the right guidance, since a page cannot escalate a denied permission.

### iOS install card dismissal is per-session

The install card is gated correctly (`shouldShowIOSInstallHint()` read after mount, so no hydration mismatch; never shown on Android, desktop, or an installed PWA). The one behavioral note: `iosDismissed` is local state, not persisted, so the card reappears on a later visit (confirmed). Acceptable for a soft nudge, but worth knowing it is not a permanent dismissal.

### Test coverage

The new `src/lib/__tests__/pwa.test.ts` checks the SSR-safe defaults of the detection helpers, and the no-emoji scan now also covers `pwa.ts`. Not tested: the SW `message` handler and timer arming in `sw.ts` (worker-global behavior, hard to unit test), the SW-first vs in-page branch selection in `schedule()`, and the ReminderSettings status-row rendering across the four permission states. These are the paths where the behavioral risk actually lives, so the added coverage, while fine, does not exercise the new logic.

### Hard constraints

Zero emoji in all changed files (confirmed by scan). Icons flow only through `Icon.tsx` from `react-icons/io5`, with `install`, `share`, and `status_*` added to both the `IconKey` union in `src/types` and the `ICONS` map, kept in lockstep by the `satisfies Record<IconKey, IconType>` assertion (confirmed). No lucide anywhere in `src` (confirmed). No backend, push, or VAPID introduced (confirmed). SSR guards are present on every `window`/`navigator`/`Notification`/`ServiceWorkerRegistration` access.

### Out of scope

The working tree has uncommitted edits to `src/app/layout.tsx`, `src/components/layout/AppShell.tsx`, and a new `src/components/layout/Chrome.tsx`. These are not part of the reviewed commit `bea8bed` and relate to the earlier layout fix, so they are excluded from this review.

### Verification evidence

Per `verification-notifications.md` and the commit message: build exit 0 (first run, no flaky `/offline` double-build this time), vitest 155/155 (up from 149 via the new pwa tests and no-emoji scan picking up the new files), lint exit 0 with only the two pre-existing underscore-var warnings (`_planLabel`, `_exhaustive`). Grep evidence independently re-confirmed in this review: `heula/schedule-reminder` and `heula/cancel-reminder` each present once in `public/sw.js`, no lucide in `src`, react-icons imported only in `Icon.tsx`, zero emoji in the changed files.

</details>

<details>
<summary>File map</summary>

- `src/app/sw.ts` — namespaced `heula/*` message handler arming per-kind `showNotification` timers, isolated from Serwist.
- `src/lib/notifications.ts` — SW-first routing with in-page fallback, single armed path, `clearScheduled` cancels both; stable exported surface.
- `src/lib/pwa.ts` (new) — SSR-safe `isStandalone` / `isIOS` / `shouldShowIOSInstallHint`.
- `src/features/settings/ReminderSettings.tsx` — four-state permission status row, allow action, dismissible iOS install card.
- `src/lib/copy.ts` — reworded subtitle, new status/install strings (stale `reminderUnsupported` left behind).
- `src/components/ui/Icon.tsx` — added `install`/`share`/`status_*` io5 mappings.
- `src/types/index.ts` — added matching `IconKey` entries.
- `src/lib/__tests__/pwa.test.ts` (new) — SSR-default checks for detection helpers.
- `README.md` — Pengingat section reworded for SW best-effort behavior.

Full diff: `git show bea8bed`.

</details>
