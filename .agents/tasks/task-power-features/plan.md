# Implementation Plan — Heula Power Features (7-feature addition)

Target repo: `/private/var/www/html/heula`. Edit in place on branch `main`, NO worktree.
Stack is fixed (Next 15.5.4 / React 19 / TS strict / Tailwind v4 / motion / Zustand 5 / Dexie 4 /
react-icons io5 / date-fns). Baseline before this work: **185 tests, 8 files, all green**;
`git status` clean at HEAD `e2c5b65`.

This plan adds SEVEN features. It is ordered by dependency: the shared foundation (Dexie
migration, new domain types, copy strings, new IconKeys) lands first, then the pure-logic
libraries, then the UI that consumes them, then the cross-cutting share/install pieces.

## Hard rules that gate every item (do not relax)

- ZERO EMOJI anywhere in `src` + `README` (vitest `no-emoji.test.ts` scans all of `src`, grows
  per new file, and FAILS on any emoji — including share-card drawn text and sample copy).
- Icons ONLY through `src/components/ui/Icon.tsx` (imports only `react-icons/io5`). To add one:
  (a) add the key to the `IconKey` union in `src/types/index.ts`, (b) add the mapping in `Icon.tsx`
  with a VERIFIED io5 name. The map is `satisfies Record<IconKey, IconType>` so key and map stay
  in lockstep. Never import `react-icons` elsewhere; never use lucide. (All io5 names referenced
  below were verified present in `react-icons/io5` during exploration.)
- All user-facing copy lives in the typed `copy` object (+ `GOAL_LABELS`) in `src/lib/copy.ts`,
  Indonesian casual Gojek voice, emoji-free.
- Pure/derivable logic in framework-free `src/lib` (NO React imports); UI in `src/features` /
  `src/components`; DB access in `src/db`. No `any`. SSR-safe (guard `window`/`navigator`/
  `Notification`/`serviceWorker`/`canvas`; client-only), no hydration mismatch.
- Dexie migrations ADDITIVE only: bump `version`, add stores/fields, NEVER drop existing data.
- DO NOT TOUCH (empty diff vs HEAD required): `src/components/layout/Chrome.tsx`,
  `src/app/layout.tsx`, `src/components/layout/AppShell.tsx`, `src/components/layout/BottomTabBar.tsx`.
  All new screens live UNDER the four tab routes (`/`, `/history`, `/stats`, `/profile`).
- Do NOT weaken the no-emoji scan or recommendation safety invariants (R1 heavy guard,
  `canOfferAggressive` as the sole 20:4/omad gate, never auto-recommend OMAD/20:4 as primary).
- ESLint guard: `dexie`, `dexie-react-hooks`, and `@/db/*` may be imported ONLY from "use client"
  modules (never from `src/lib/*` or server components). Keep pure libs DB-free: pass arrays in.

## Verification commands (discovered during exploration)

- Type check: `npx tsc --noEmit`
- Unit + no-emoji scan: `npx vitest run` (optionally scope e.g. `npx vitest run src/lib/__tests__/weight.test.ts`)
- Lint: `npm run lint`
- Production build (also generates the Serwist SW): `npm run build`
  (SW/offline/install only observable via `npm run build` + `npm start`, not `next dev`.)
Each item below is buildable on its own; run `npx tsc --noEmit && npx vitest run` after each.

## Design decisions recorded (resolving ambiguity)

- **One Dexie bump, not many.** All schema changes (new `weights` store + the `mood`/`note`
  columns on `sessions`) ship in a SINGLE additive `version(2).stores(...)` upgrade (item 1), even
  though they serve two different features (F1 and F6). Rationale: a single monotonic bump avoids
  two features racing to edit `db.ts` and avoids an awkward v2-then-v3 ordering. `mood`/`note` are
  NOT indexed (no `.where` on them), so the `sessions` index string is unchanged and only the new
  `weights` store line is added. Dexie keeps all existing `sessions` rows (upgrade only adds a
  table + leaves unindexed fields `undefined` on old rows).
- **New tab-route surfaces reuse the finalized shell.** No new top-level routes are added; every
  new screen is a section on Home / Stats / Profile, or a nested route under one of them
  (e.g. `/stats/berat`, `/stats/pencapaian`) which still matches `isTabRoute` (`startsWith`) so the
  tab bar shows unchanged. Decision: use nested routes under `/stats` for the two heaviest new
  surfaces (weight tracker, achievements) to keep the Stats page scannable, and inline cards for
  the lighter ones (adaptive card, timeline, install prompt, share entry).
- **Adaptive engine is pure + injected clock.** `adaptive.ts` takes `now` and the history array as
  args (never calls `Date.now()`), mirroring `stats.ts`/`recommendation.ts`, so it is deterministic
  and unit-testable. It returns a nullable suggestion and NEVER mutates the store.
- **Method ladder for step-ups** is the safe timer ladder `14:10 -> 16:8 -> 18:6` only. Stepping
  up never crosses into `20:4`/`omad` unless `canOfferAggressive(profiling)` is true, and even then
  only as an *alternative* framing, never as an auto-applied method. Step-up is capped at `18:6`
  for everyone who is not aggressive-eligible. This keeps R1/`canOfferAggressive` invariants intact.
- **Achievements are derived, never persisted.** No badge state in Dexie or the store; unlock is a
  pure function of history + stats computed on the fly (per the task's explicit "DO NOT persist").
- **Mood capture is optional + non-blocking.** The capture sheet appears after a fast is saved and
  can be skipped; it edits the just-saved row by id. History/stats reads guard `mood`/`note` being
  `undefined` on older rows.
- **Share card uses the Canvas 2D API + Web Share Level 2**, no new dependency. Portrait 1080x1920
  offscreen canvas, brand emerald, system font, emoji-free drawn text. Falls back to a PNG download
  link when `navigator.canShare({ files })` is unavailable, and degrades to friendly copy when
  neither share nor download is possible.
- **Install prompt (A2HS) and the existing iOS hint must not both nag.** The new
  `beforeinstallprompt` button only renders when the event has fired (Android/desktop Chromium);
  iOS Safari never fires that event, so the existing iOS hint in `ReminderSettings` is the only one
  shown there. Decision: surface the Android/desktop button on Profile, not on the timer, to avoid
  competing with the iOS hint on the same screen (they target disjoint platforms anyway).

## Shared-file seam map (for the integration step)

These files are touched by multiple items; integration must reconcile all edits:
- `src/types/index.ts` — new `IconKey` members (items 1,4,6,7,8,9), `WeightRecord` + `Mood` +
  `FastingSessionRecord.mood?/note?` (item 1).
- `src/components/ui/Icon.tsx` — new icon mappings paired with each new IconKey (items 1,4,6,7,8,9).
- `src/lib/copy.ts` — new copy namespaces per feature (items 1,3,4,5,6,7,8,9).
- `src/db/db.ts` — single v2 bump (item 1 only; no other item edits it).
- `src/features/stats/StatsOverview.tsx` — adaptive card + achievements link + share entry + weight
  summary (items 5,6,8,9) — the busiest UI seam.
- `src/features/timer/FastingTimer.tsx` — timeline + adaptive card + mood capture (items 4,5,6).

---

# Implementation items

- [ ] 1. Shared data foundation: types + single additive Dexie v2 migration + DB helpers.
      Add to `src/types/index.ts`: `export interface WeightRecord { id?: number; weightKg: number;
      recordedAt: number; note?: string }`; `export type Mood = "energik" | "biasa" | "lemes" |
      "lapar"`; add OPTIONAL `mood?: Mood` and `note?: string` to `FastingSessionRecord`. In
      `src/db/db.ts` add `weights!: Table<WeightRecord, number>` and a SINGLE additive upgrade
      `this.version(2).stores({ sessions: "++id, startMs, createdAt, completed, planId", weights:
      "++id, recordedAt" })` (keep the existing v1 block above it; `mood`/`note` are unindexed so the
      `sessions` string is unchanged). Create `src/db/weights.ts` mirroring `src/db/sessions.ts`
      (try/catch + dev `console.error`, "use client"-only): `add(record)`, `remove(id)`, `all()`
      (ordered by `recordedAt` ascending for charting), `clear()`. Add a `mood`/`note` updater to
      `src/db/sessions.ts`: `setMoodNote(id, patch: { mood?: Mood; note?: string }): Promise<boolean>`
      using `db.sessions.update(id, patch)`. Also extend `resetAll` in `src/store/useAppStore.ts` to
      clear weights: call `weights.clear()` alongside `sessions.clear()` (import `* as weights`).
      Files: src/types/index.ts, src/db/db.ts, src/db/weights.ts, src/db/sessions.ts,
      src/store/useAppStore.ts
      Verify: `npx tsc --noEmit` clean; `npx vitest run` still 185+ green (no logic regressions);
      `npm run lint` clean (DB imports only from client modules).

- [ ] 2. Pure weight-trend library + tests (Feature 1 logic).
      Create framework-free `src/lib/weight.ts` (NO React, NO `@/db` import; takes `WeightRecord[]`
      and optional `heightCm`): `sortByTime(list)`; `latest(list): WeightRecord | null`;
      `deltas(list): { fromPrevious: number | null; fromFirst: number | null }`; `extremes(list):
      { min: number; max: number } | null`; `changeOverPeriod(list, now, days): number | null`;
      `bmiSeries(list, heightCm?): { recordedAt: number; bmi: number }[]` (uses `computeBmi` from
      `@/lib/bmi`; returns `[]` when `heightCm` is missing/invalid — guard with `isValidHeight`);
      `trendPoints(list): { recordedAt: number; weightKg: number }[]` for the chart. All pure,
      deterministic (inject `now`). Create `src/lib/__tests__/weight.test.ts` covering: empty list,
      single entry (deltas null), multi-entry deltas/latest/extremes, `changeOverPeriod` window
      boundary, `bmiSeries` with valid height and with missing height (empty), recompute correctness
      against a known 170cm case.
      Files: src/lib/weight.ts, src/lib/__tests__/weight.test.ts
      Verify: `npx vitest run src/lib/__tests__/weight.test.ts` passes; `npx tsc --noEmit` clean.

- [ ] 3. Copy + icons for the weight tracker.
      Add `copy.weight` namespace to `src/lib/copy.ts` (title, "Catat berat", kg input label/
      placeholder, invalid-range message, empty state, delete confirm, latest/change/BMI-change
      readout labels, "berat belum ada tinggi" note when height missing) — Gojek voice, no emoji.
      Add IconKeys + Icon.tsx mappings: `weight -> IoScaleOutline`, `trend_up -> IoTrendingUp`,
      `trend_down -> IoTrendingDown`. Reuse existing `add`? there is no generic add icon; add
      `plus -> IoAddOutline` for the "catat" affordance.
      Files: src/lib/copy.ts, src/types/index.ts, src/components/ui/Icon.tsx
      Verify: `npx tsc --noEmit` clean (Icon map still `satisfies`); `npx vitest run
      src/lib/__tests__/no-emoji.test.ts` green.

- [ ] 4. Weight tracker UI under a nested Stats route + Stats summary entry (Feature 1).
      Create `src/app/stats/berat/page.tsx` (thin client host) rendering a new
      `src/features/weight/WeightTracker.tsx` ("use client", `useLiveQuery(() =>
      db.weights.orderBy("recordedAt").toArray())`): numeric kg input with validation via
      `isValidWeight` (reuse `src/lib/bmi.ts` bounds) + Gojek voice, "catat berat" button writing via
      `weights.add`, an entry list with per-row delete (ConfirmDialog like SessionRow), and
      `src/features/weight/WeightTrendChart.tsx` — a div/SVG + motion chart (follow
      `WeeklyBarChart.tsx` scaling pattern; NO charting lib). Show latest weight, change-over-period,
      and BMI-change readout from `src/lib/weight.ts` tied to `profiling.heightCm`; when height is
      missing, hide the BMI-over-time readout but still allow logging (show the height note from
      copy). Add a compact "Berat badan" summary Card on `StatsOverview.tsx` (latest + delta) that
      links to `/stats/berat`.
      Files: src/app/stats/berat/page.tsx, src/features/weight/WeightTracker.tsx,
      src/features/weight/WeightTrendChart.tsx, src/features/stats/StatsOverview.tsx
      Verify: `npm run build` succeeds (route compiles, SSR-safe); `npx vitest run` green (no-emoji
      scan covers new files); manual smoke: log a weight, see it in the list + chart, delete it.

- [ ] 5. Adaptive recommendation engine (pure) + card UI (Feature 2).
      Create `src/lib/adaptive.ts` (framework-free; imports `canOfferAggressive` and the method
      ladder from `@/lib/recommendation`/`@/lib/methods`, types from `@/types`, stats from
      `@/lib/stats`): `export interface AdaptiveSuggestion { kind: "level_up" | "ease_down" |
      "streak"; fromMethod?: MethodId; toMethod?: MethodId; message: string }`;
      `suggestAdaptive(input: { history: FastingSessionRecord[]; chosenMethod: MethodId; profiling:
      ProfilingAnswers | null; now: number }): AdaptiveSuggestion | null`. Rules (deterministic,
      message from `copy.adaptive`): consistent completion over a recent window -> suggest the NEXT
      safe ladder step (`14:10->16:8->18:6`), capped at `18:6` unless `canOfferAggressive(profiling)`
      (never emit `20:4`/`omad` as `toMethod` otherwise; never when profiling is null); frequent
      early stops -> ease DOWN one ladder step; healthy streak -> encouragement (no method change);
      empty/short history -> `null`. CRITICAL: assert in tests that no suggestion ever violates
      `canOfferAggressive` and that a heavy exerciser is never leveled into aggression. Add
      `copy.adaptive` strings. Create `src/features/stats/AdaptiveCard.tsx` (or shared
      `src/features/adaptive/AdaptiveCard.tsx`) — a dismissible "Saran buat kamu" Card that reads the
      live history + store, calls `suggestAdaptive`, renders the message, and (for level/ease) a
      button navigating to `/profile` (Plan Picker) WITHOUT auto-changing the method; local dismiss
      state only. Render it on Home (below StageIndicator) and/or Stats — it must NOT replace the
      profiling+BMI recommendation and must NOT auto-change method. Add IconKey `suggestion ->
      IoSparklesOutline`. Create `src/lib/__tests__/adaptive.test.ts`: step-up, step-up cap at 18:6,
      step-up allowed to 20:4 only when canOfferAggressive, step-down, streak, empty/short history
      (null), null profiling, heavy-exerciser safety cap.
      Files: src/lib/adaptive.ts, src/lib/__tests__/adaptive.test.ts, src/lib/copy.ts,
      src/types/index.ts, src/components/ui/Icon.tsx,
      src/features/adaptive/AdaptiveCard.tsx, src/features/timer/FastingTimer.tsx,
      src/features/stats/StatsOverview.tsx
      Verify: `npx vitest run src/lib/__tests__/adaptive.test.ts` passes incl. safety assertions;
      `npx tsc --noEmit` clean; `npm run build` succeeds.

- [ ] 6. Mood + note per session: capture, edit, surface (Feature 6).
      Add `MOOD_LABELS: Record<Mood, string>` and `copy.mood` (sheet title, skip, save, note
      placeholder, History indicator aria) to `src/lib/copy.ts`. Add IconKeys for the mood chips
      with verified io5 names: `mood_energik -> IoBatteryChargingOutline`,
      `mood_biasa -> IoRemoveCircleOutline`, `mood_lemes -> IoBatteryDeadOutline`,
      `mood_lapar -> IoFastFoodOutline`. Create `src/features/history/MoodNoteSheet.tsx` (reuse
      `Sheet.tsx`): mood chips (Segmented-like or chip buttons) + optional short note textarea +
      Simpan/Lewati; calls `sessions.setMoodNote(id, patch)`. Wire capture after a fast is saved:
      in `src/features/timer/FastingTimer.tsx` `handleStop` and `src/features/timer/TimerControls.tsx`
      `handleStopConfirm`, capture the returned/just-saved session id (extend `stopFast` in
      `useAppStore.ts` to RETURN the new id from `sessions.add`) and open the sheet (skippable, never
      blocks). Allow editing from `src/features/history/SessionRow.tsx` (tap row opens the same sheet
      prefilled). Surface a small mood indicator in `SessionRow` (guard `session.mood === undefined`).
      Add pure aggregation `moodBreakdown(sessions): Record<Mood, number>` to a lib module
      (`src/lib/mood.ts`) with `src/lib/__tests__/mood.test.ts` (empty, undefined-mood rows ignored,
      counts). Optionally show the breakdown on Stats.
      Files: src/lib/copy.ts, src/types/index.ts, src/components/ui/Icon.tsx,
      src/lib/mood.ts, src/lib/__tests__/mood.test.ts, src/store/useAppStore.ts, src/store/types.ts,
      src/features/history/MoodNoteSheet.tsx, src/features/history/SessionRow.tsx,
      src/features/timer/FastingTimer.tsx, src/features/timer/TimerControls.tsx
      Verify: `npx vitest run src/lib/__tests__/mood.test.ts` passes; `npx tsc --noEmit` clean
      (store `stopFast` signature update propagates); `npm run build` succeeds; manual smoke: finish
      a fast, pick a mood + note, see indicator in History, edit it from the row.

- [ ] 7. Educational fasting-stage timeline (Feature 4).
      Extend `src/lib/stages.ts` with per-stage educational copy + a tip WITHOUT breaking
      `stageForElapsed`/`STAGE_LIST`: add `whatHappens` and `tip` fields to the `Stage` interface,
      sourced from new `copy.stages.*What`/`*Tip` strings in `src/lib/copy.ts`, and a pure helper
      `timelineForElapsed(elapsedMs): { stage: Stage; state: "passed" | "current" | "upcoming" }[]`
      marking each stage relative to the live elapsed time. Create
      `src/features/timer/StageTimeline.tsx` — an interactive/expandable timeline track (motion),
      iOS light+dark, reuses stage `iconKey`s via the Icon choke point, marks current/passed/
      upcoming; render it on Home near `StageIndicator` (expandable section). Add tests to
      `src/lib/__tests__/stages.test.ts` for `timelineForElapsed` boundaries (0h, 4h, 12h, 16h, 24h)
      and that existing `stageForElapsed` expectations are unchanged.
      Files: src/lib/stages.ts, src/lib/copy.ts, src/lib/__tests__/stages.test.ts,
      src/features/timer/StageTimeline.tsx, src/features/timer/FastingTimer.tsx
      Verify: `npx vitest run src/lib/__tests__/stages.test.ts` passes (old + new); `npx tsc
      --noEmit` clean; `npm run build` succeeds.

- [ ] 8. Achievements / milestones (derived, not persisted) (Feature 5).
      Create pure `src/lib/achievements.ts` (framework-free; takes `FastingSessionRecord[]` + the
      `Totals`/`Streaks` from `@/lib/stats`, injected `now`): a typed `Achievement { id; title;
      description; icon: IconKey; isUnlocked(ctx): boolean; progress?(ctx): number }` list covering
      first fast, first 18h fast, 7-day streak, 30-day streak, total 100 hours, 10/50/100 fasts, and
      a longest-fast milestone; plus `evaluateAchievements(ctx): { achievement; unlocked; progress
      }[]`. Copy from new `copy.achievements`. Add IconKeys with verified io5 names:
      `achievement -> IoTrophyOutline`, `achievement_locked -> IoLockClosedOutline`,
      `milestone -> IoMedalOutline`, `ribbon -> IoRibbonOutline`. Create
      `src/app/stats/pencapaian/page.tsx` + `src/features/achievements/AchievementsGrid.tsx`
      ("use client", live query) showing unlocked vs locked cards with progress bars (div/SVG +
      motion, iOS cards), icons via choke point; add a summary entry Card on `StatsOverview.tsx`
      linking to `/stats/pencapaian`. Optional: a subtle unlock toast when a newly completed fast
      crosses a boundary (derive via comparison, do NOT persist badge state). Create
      `src/lib/__tests__/achievements.test.ts`: each milestone's exact unlock boundary, progress
      calc, empty history (none unlocked).
      Files: src/lib/achievements.ts, src/lib/__tests__/achievements.test.ts, src/lib/copy.ts,
      src/types/index.ts, src/components/ui/Icon.tsx, src/app/stats/pencapaian/page.tsx,
      src/features/achievements/AchievementsGrid.tsx, src/features/stats/StatsOverview.tsx
      Verify: `npx vitest run src/lib/__tests__/achievements.test.ts` passes; `npx tsc --noEmit`
      clean; `npm run build` succeeds.

- [ ] 9. Share card (canvas PNG + Web Share) and Android/desktop install prompt (Features 7 & 3).
      SHARE: create pure `src/lib/share.ts` — `formatShareStats(input): string[]` building the
      emoji-free stat lines (streak, total hours, total fasts, current method) from stats; unit-test
      it. Create `src/features/share/ShareCard.tsx` ("use client", SSR-guarded): draws a portrait
      1080x1920 offscreen `<canvas>` (brand emerald `#0e9f6e`, system font, emoji-free text, simple
      shapes), exports PNG via `canvas.toBlob`, shares with `navigator.canShare({ files }) +
      navigator.share({ files:[pngFile], title, text })`; FALLBACK: an "Unduh gambar" download link
      from an object URL when file-share is unsupported, and friendly copy when neither works. Add a
      "Bagikan progres" action on `StatsOverview.tsx` (and/or Profile). Add IconKeys
      `share_social -> IoShareSocialOutline` (reuse existing `share`/`install`/`download` where they
      exist). INSTALL (A2HS): extend `src/lib/pwa.ts` with SSR-safe `beforeinstallprompt` support —
      a tiny client controller (e.g. `src/features/pwa/InstallPrompt.tsx`) that listens for
      `beforeinstallprompt` (preventDefault + stash the event), renders a dismissible "Pasang Heula"
      button calling `prompt()` + handling `userChoice`, hides when `isStandalone()` or after
      dismiss/accept. Mount it on `src/app/profile/page.tsx` ONLY (iOS hint stays in
      `ReminderSettings`; the two target disjoint platforms and never both nag). Do NOT modify
      `sw.ts`/`notifications.ts`; keep the existing iOS hint logic intact. Add copy
      `copy.share`/`copy.install`. Create `src/lib/__tests__/share.test.ts` for `formatShareStats`
      (canvas drawing is client-only, not unit-tested but must be SSR-guarded) and extend
      `src/lib/__tests__/pwa.test.ts` if new pure pwa helpers are added.
      Files: src/lib/share.ts, src/lib/__tests__/share.test.ts, src/lib/pwa.ts,
      src/lib/__tests__/pwa.test.ts, src/lib/copy.ts, src/types/index.ts, src/components/ui/Icon.tsx,
      src/features/share/ShareCard.tsx, src/features/pwa/InstallPrompt.tsx,
      src/features/stats/StatsOverview.tsx, src/app/profile/page.tsx
      Verify: `npx vitest run src/lib/__tests__/share.test.ts src/lib/__tests__/pwa.test.ts` passes;
      `npx tsc --noEmit` clean; `npm run build` succeeds (SSR-safe canvas/`beforeinstallprompt`).

- [ ] 10. Cross-feature integration + full green.
      Reconcile the shared seams (`StatsOverview.tsx`, `FastingTimer.tsx`, `copy.ts`,
      `types/index.ts`, `Icon.tsx`), confirm the four layout files are UNCHANGED vs HEAD
      (`git diff --stat HEAD -- src/components/layout src/app/layout.tsx` empty), confirm the Dexie
      upgrade is additive (v1 block intact, single v2 bump), and run the full gate.
      Files: (integration only — the seam files above)
      Verify: `git diff --stat HEAD -- src/components/layout/Chrome.tsx src/app/layout.tsx
      src/components/layout/AppShell.tsx src/components/layout/BottomTabBar.tsx` is EMPTY;
      `npx tsc --noEmit` clean; `npm run lint` clean; `npx vitest run` all green (185 baseline + new
      tests, no-emoji scan green); `npm run build` succeeds.

## Notes / assumptions

- The two nested routes (`/stats/berat`, `/stats/pencapaian`) match `Chrome.isTabRoute`'s
  `startsWith("/stats")` check, so the floating tab bar renders on them with NO change to the shell.
  This is the chosen way to add surfaces without touching the DO-NOT-TOUCH layout files.
- `stopFast` currently returns `void`; item 6 changes it to return the new session id (or null) so
  the mood sheet can target the just-saved row. This is a store-signature change — the integration
  step must ensure every caller still compiles.
- `resetAll` must also clear the new `weights` table (item 1) so "reset semua data" stays complete.
- If `navigator.share`/`canShare` and canvas download are all unavailable, the share action shows a
  friendly emoji-free fallback message rather than failing.
