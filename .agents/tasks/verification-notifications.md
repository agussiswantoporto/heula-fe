# Verification — SW-based reminders, permission/status UI, iOS install prompt

Ran from `/private/var/www/html/heula`. All commands below were executed, not assumed.

## Build
- `npm run build` -> exit 0 on the FIRST run (no flaky `/offline` page-data error this time).
- Serwist bundled the service worker: "(serwist) Bundling the service worker script with the URL '/sw.js'".
- All 10 routes prerendered; "Compiled successfully".

## Tests
- `npm run test` (vitest run) -> all passing: 155/155 tests across 7 files.
  - Was 149; the increase is from the new no-emoji scan picking up `src/lib/pwa.ts` and `src/lib/pwa.test.ts` plus 4 new `pwa.test.ts` cases. No existing test was weakened; the no-emoji scan is intact (67 files scanned, all clean).

## Lint
- `npm run lint` -> exit 0. Two WARNINGS only, both pre-existing-style unused-underscore vars:
  - `src/lib/notifications.ts:162` `_planLabel` (intentionally kept to preserve the exported `scheduleEndReminder(targetEndMs, planLabel?)` signature; matches the existing `_exhaustive` convention in `recommendation.ts`).
  - `src/lib/recommendation.ts:176` `_exhaustive` (pre-existing).
- No errors.

## Grep confirmations
- `grep -c "heula/schedule-reminder" public/sw.js` -> 1 (SW schedule handler compiled into the emitted worker).
- `grep -c "heula/cancel-reminder" public/sw.js` -> 1 (SW cancel handler compiled in).
- react-icons imported ONLY in `src/components/ui/Icon.tsx`, and only from `react-icons/io5` (plus the `import type { IconType } from "react-icons"` type-only import that already existed).
- `grep -rni lucide src` -> no matches (exit 1).
- No emoji across `src` (enforced by the passing `no-emoji.test.ts` scan over 67 files) and README kept emoji-free.

## What changed
- `src/app/sw.ts`: added a dedicated `self.addEventListener("message", ...)` AFTER `serwist.addEventListeners()`, handling namespaced `heula/schedule-reminder` / `heula/cancel-reminder`; arms a per-kind SW `setTimeout` calling `self.registration.showNotification(...)` with `tag` de-dupe; ignores non-`heula/` messages so Serwist is untouched. Honest comments on the best-effort ceiling and the impossibility of native alarm integration for a PWA.
- `src/lib/pwa.ts` (new): SSR-safe `isStandalone()`, `isIOS()`, `shouldShowIOSInstallHint()`.
- `src/lib/notifications.ts`: same exported surface; routes SW-first (post `heula/schedule-reminder`) with in-page `setTimeout + new Notification()` fallback, never both (no double-fire). `clearScheduled()` posts `heula/cancel-reminder` for both kinds AND clears in-page timers. All access SSR-guarded.
- `src/lib/copy.ts`: reworded `reminderSubtitle` (SW best-effort, honest about limits) + new status/iOS-install strings, no emoji.
- `src/types/index.ts` + `src/components/ui/Icon.tsx`: added IconKeys install/share/status_* mapped to io5 icons; `satisfies` assertion kept.
- `src/features/settings/ReminderSettings.tsx`: permission status row (granted/denied/default/unsupported) with io5 icons + Gojek copy and an "Izinkan notifikasi" action for the default state; dismissible iOS install card gated by `shouldShowIOSInstallHint()` after mount (SSR-safe, no hydration mismatch).
- `README.md`: "Pengingat" section reworded to the SW-based best-effort behavior.
- `src/lib/__tests__/pwa.test.ts` (new): minimal SSR-safe-default checks for the detection helpers.

## Cleanup
- No dev server was started; nothing left running.
