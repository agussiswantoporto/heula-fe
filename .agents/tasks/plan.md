# Heula — Implementation Plan

Authoritative spec: `.agents/tasks/requirements.md`, `.agents/tasks/design.md`, `.agents/tasks/design-review.md`. The design is APPROVED; build to it faithfully. This plan sequences the build by dependency. Greenfield Next.js 15 PWA, built directly in `/private/var/www/html/heula` (no worktree).

Hard gates enforced throughout: ZERO EMOJI anywhere (UI, copy, labels, toasts, notifications, seed data, logo); icons ONLY from `react-icons/io5` (no lucide, no other react-icons subset); Indonesian casual Gojek voice; TypeScript strict.

The two open design-review findings are resolved in code and called out at items 3 and 4 below.

## Dependency versions to install (pinned exactly, no `^`)

dependencies: `next@15.5.4`, `react@19.1.0`, `react-dom@19.1.0`, `serwist@9.5.1`, `@serwist/next@9.5.1`, `zustand@5.0.3`, `dexie@4.4.6`, `dexie-react-hooks@4.4.0`, `motion@12.23.0`, `date-fns@4.1.0`, `react-icons@5.4.0`.

devDependencies: `typescript@5.9.2`, `@types/react@19.1.0`, `@types/react-dom@19.1.0`, `@types/node@22.10.0`, `tailwindcss@4.1.14`, `@tailwindcss/postcss@4.1.14`, `postcss@8.5.6`, `eslint@9` (latest 9.x), `eslint-config-next@15.5.4`, `vitest` (latest 3.x).

`dexie` and `dexie-react-hooks` move together (hooks 4.4.0 peer is `dexie >=4.2.0-alpha.1 <5`). Framer Motion ships as the `motion` package; import from `motion/react`. If `npm install` reports a peer conflict on an exact patch, bump only the patch within the same minor and record it; majors/minors are frozen.

## Build order

- [ ] 1. Scaffold the project: `package.json` (scripts `dev/build/start/lint:"eslint ."/test:"vitest run"/test:watch` per design 21), `tsconfig.json` (strict, `"lib": ["dom","dom.iterable","esnext","webworker"]`, `@/*` path alias to `src/*`), `next.config.ts` wrapped with `@serwist/next` (`swSrc: "src/app/sw.ts"`, `swDest: "public/sw.js"`, `disable` in dev), `postcss.config.mjs` (`@tailwindcss/postcss`), `eslint.config.mjs` (flat config extending `eslint-config-next`, with `no-restricted-imports` banning `lucide-react`, any `react-icons/*` except `react-icons/io5`, and importing `src/db`/`dexie`/`dexie-react-hooks` from non-`"use client"` files per design 9/16), `.gitignore`, `vitest.config.ts`. Install the dependency list above.
      Files: package.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs, .gitignore, vitest.config.ts
      Verify: `npm install` succeeds; `npx tsc --noEmit` passes with no config errors (app source not yet present is fine — this item only needs the toolchain to resolve).

- [ ] 2. Domain types and method catalog. Create `src/types/index.ts` exactly per design Section 4 (`Goal`, `Intensity`, `IconKey`, `MethodId`, `MethodMeta`, `ProfilingAnswers`, `Recommendation`, `FastingSessionRecord`). Create `src/lib/methods.ts` per Section 5: `METHODS: Record<MethodId, MethodMeta>` and `METHOD_ORDER = ["14:10","16:8","18:6","20:4","omad","custom"]`; fasting hours 14/16/18/20/23 and custom default 16 (clamp 8..23 at input layer); `advanced` true for 20:4 and omad; 5:2 NOT in catalog. Create `src/lib/cn.ts` className helper.
      Files: src/types/index.ts, src/lib/methods.ts, src/lib/cn.ts
      Verify: `npx tsc --noEmit` passes.

- [ ] 3. Recommendation engine with FINDING 1 encoded. Create `src/lib/recommendation.ts` per Section 6: pure `recommendMethod(answers)`, early heavy guard (R1 -> 14:10 + warning), `switch(goal)` closed by `const _exhaustive: never = answers.goal` default; the total `exerciseState(answers)` classifier mapping `exercises===false` and `exercises===true && intensity===null` both to `"none"`, `"light"`/`"moderate"` through. Implement the full decision table R1-R16 (methods + exact `alternatives` arrays per Section 6.2). FINDING 1 (MEDIUM): encode the aggressive-method invariant exactly as `const canOfferAggressive = answers.goal === "weight_loss" && (exerciseState(answers) === "none" || exerciseState(answers) === "light");` — 20:4/omad appear in `alternatives` ONLY under this predicate (R2/R3), never as `method`, and heavy -> 14:10 + warning. Do NOT transcribe the malformed boolean prose from design 6.3. Rationale/warning strings reference `src/lib/copy.ts`.
      Files: src/lib/recommendation.ts, src/lib/copy.ts (recommendation strings + GOAL_LABELS)
      Verify: `npx tsc --noEmit` passes; recommendation unit tests (item 11) will assert the 16 rows + 25-input invariants.

- [ ] 4. Timer, stages, stats, time, notifications pure libs. Create `src/lib/timer.ts` (`computeTimer` pure with injected `nowMs`, `formatHMS` uncapped hours), `src/lib/stages.ts` (`StageKey`, `Stage`, `stageForElapsed`; half-open bounds 0-4 Pencernaan / 4-12 bakar lemak / 12-16 Ketosis / 16-24 Autophagy / >=24 Deep fast, importing `IconKey` from `@/types`), `src/lib/stats.ts` (`totals`, `streaks`, `weekly` over `FastingSessionRecord[]` with injected `now`, using date-fns), `src/lib/time.ts` (date-fns formatting/grouping helpers), `src/lib/notifications.ts` (best-effort client-only: `isSupported`, `getPermission`, `requestPermission`, `scheduleEndReminder`, `scheduleStartReminder`, `clearScheduled`; typed status, never throws to UI). Expand `copy.ts` with all stage/toast/notification strings.
      Files: src/lib/timer.ts, src/lib/stages.ts, src/lib/stats.ts, src/lib/time.ts, src/lib/notifications.ts, src/lib/copy.ts
      Verify: `npx tsc --noEmit` passes.

- [ ] 5. Store and Dexie. Create `src/store/types.ts` + `src/store/useAppStore.ts` per Section 8: Zustand persist (key `heula-store`, `version`+`migrate` stub). FINDING 2 (MEDIUM) + NITs 3/4: `customFastingHours` default `16`; persist `partialize` whitelist is EXACTLY `onboarded, profiling, chosenMethod, customFastingHours, dailyGoalHours, theme, reminders, activeFast` — the `hydrated` flag is NOT in the whitelist. Actions per Section 8 including `startFast` resolving custom target hours/label from the store (never catalog 16), `stopFast` writing to Dexie, `resetAll` clearing both, re-arm end reminder in `onRehydrateStorage`. Create `src/db/db.ts` (top-level singleton `export const db = new HeulaDB()`, schema `sessions: "++id, startMs, createdAt, completed, planId"`) and `src/db/sessions.ts` (`add/remove/all/clear/last7Days`, try/catch friendly failures). `src/db/*` imported only from `"use client"` modules.
      Files: src/store/types.ts, src/store/useAppStore.ts, src/db/db.ts, src/db/sessions.ts
      Verify: `npx tsc --noEmit` passes.

- [ ] 6. PWA infra: `src/app/sw.ts` verbatim per Section 12.2 (`defaultCache` from `@serwist/next/worker`, `Serwist` + `PrecacheEntry`/`SerwistGlobalConfig` from `serwist`, `/offline` document fallback, single `serwist.addEventListeners()` — no optional chaining, no hand-wired listeners). `src/app/manifest.ts` (`MetadataRoute.Manifest`: name/short_name "Heula", Indonesian description no emoji, `start_url "/"`, `display standalone`, theme/background from brand token, four icons with `any`+`maskable`). Generate four valid PNG icons in `public/icons` (icon-192, icon-512, maskable-512 with safe padding, apple-touch-icon 180): plain brand-colored rounded square with white "H", no emoji — via a small node/sharp or canvas script, or committed valid placeholders.
      Files: src/app/sw.ts, src/app/manifest.ts, public/icons/icon-192.png, public/icons/icon-512.png, public/icons/maskable-512.png, public/icons/apple-touch-icon.png, scripts/gen-icons.* (if used)
      Verify: `npm run build` compiles sw.ts and emits `public/sw.js`; manifest route builds; PNGs are valid (`file public/icons/*.png`).

- [ ] 7. App shell, theme, layout, globals, UI primitives. `src/app/globals.css` (Tailwind v4 `@import "tailwindcss"`, `@theme` brand tokens, `@custom-variant dark (&:where(.dark, .dark *))`, light/dark CSS vars, safe-area utilities). `src/app/layout.tsx` (html/body, viewport-fit=cover + themeColor metadata, `appleWebApp`/icons metadata, EXACT anti-flash inline script from Section 13 reading `heula-store` -> `state.theme`, providers, AppShell + BottomTabBar shell). `src/components/layout/{AppShell,ThemeProvider,BottomTabBar}.tsx`. `src/components/ui/Icon.tsx` (single io5 import choke point; `ICONS = {...} satisfies Record<IconKey, IconType>`). UI primitives: `Card, Button, Sheet, Segmented, Stepper, ConfirmDialog, Toast, ToastProvider, EmptyState, Spinner`.
      Files: src/app/globals.css, src/app/layout.tsx, src/components/layout/AppShell.tsx, src/components/layout/ThemeProvider.tsx, src/components/layout/BottomTabBar.tsx, src/components/ui/*.tsx
      Verify: `npm run build` passes; dark mode class toggles via inline script (manual smoke).

- [ ] 8. Onboarding feature + routing guard. `src/features/onboarding/{OnboardingFlow,WelcomeStep,GoalStep,ExerciseStep,RecommendationStep}.tsx` per Section 14. FINDING 2: `RecommendationStep` renders the onboarding method list as `METHOD_ORDER.filter(id => id !== "custom")` (custom NOT selectable in onboarding; reachable only from PlanPicker). Recommended method highlighted ("Rekomendasi buat kamu") with rationale + warning banner; any listed method selectable; "Mulai sekarang" confirms -> `completeOnboarding(answers, method)` -> `router.replace("/")`. `src/app/onboarding/page.tsx`; `src/app/page.tsx` guards `onboarded` after hydration and redirects. Rerun mode via `?rerun=1`.
      Files: src/app/page.tsx, src/app/onboarding/page.tsx, src/features/onboarding/*.tsx
      Verify: `npm run build` passes; first-visit shows onboarding, confirm routes Home and sets onboarded (manual smoke).

- [ ] 9. Home timer screen. `src/features/timer/{FastingTimer,ProgressRing,StageIndicator,TimerControls,StartTimeSheet}.tsx` per Section 15: `useTimer` 1s tick feeding `computeTimer`, animated SVG ring, `formatHMS` elapsed, target end + remaining, data-driven `StageIndicator`, Start/Stop(confirm)/edit-start-time (validate `<= now`), auto-complete prompt, stop writes session to Dexie and clears `activeFast`. Wire into `src/app/page.tsx`.
      Files: src/app/page.tsx (wire), src/features/timer/*.tsx
      Verify: `npm run build` passes; start timer ticks, stop writes a Dexie record (manual smoke).

- [ ] 10. History, Stats, Profile screens. `src/app/history/page.tsx` + `src/features/history/{HistoryList,SessionRow}.tsx` (useLiveQuery grouped by day, delete with confirm). `src/app/stats/page.tsx` + `src/features/stats/{StatsOverview,WeeklyBarChart}.tsx` (streaks/totals/averages, custom SVG/div 7-day chart, profiling goal via `GOAL_LABELS`). `src/app/profile/page.tsx` + `src/features/settings/{PlanPicker,DailyGoalPicker,ReminderSettings,AboutCard}.tsx` (PlanPicker owns custom-hours input clamped 8..23; daily goal; dark-mode toggle; reminders; re-run profiling; reset-all with confirm; about/version). Empty + loading states in Gojek voice.
      Files: src/app/history/page.tsx, src/app/stats/page.tsx, src/app/profile/page.tsx, src/features/history/*.tsx, src/features/stats/*.tsx, src/features/settings/*.tsx
      Verify: `npm run build` passes; history delete, stats render, plan switch + reset work (manual smoke).

- [ ] 11. Unit tests + self-checks and offline fallback page. `src/app/offline/page.tsx` (folder `offline`, Section 3 fallback). Vitest suites in `src/lib/__tests__/`: `recommendation.test.ts` (16 rows asserting method + exact `alternatives`; the 25 raw inputs = 5 goals x 5 `(exercises,intensity)` pairs invariants; degenerate `exercises:true/intensity:null` deep-equal to `none` per goal; aggressive-only-under-canOfferAggressive; never-custom/never-5:2; warning iff heavy; alternatives exclude method & no dupes), `timer.test.ts` (compute + formatHMS + overfast), `stages.test.ts` (boundaries 3.99/4/11.99/12/15.99/16/23.99/24h -> Deep fast at 24), `stats.test.ts` (streaks/totals/weekly fixed now), `methods.test.ts` (hour math), `no-emoji.test.ts` (scan src against emoji Unicode-range regex, fail on match). Mark the `never` default with `/* v8 ignore next 2 */` if a coverage gate exists.
      Files: src/app/offline/page.tsx, src/lib/__tests__/*.test.ts
      Verify: `npm run test` passes all suites; the no-emoji scan passes.

- [ ] 12. README + final verification sweep. `README.md` (Indonesian): what Heula is, run instructions (install/dev/build/start/test), feature list, no-emoji + react-icons constraints, on-device/offline note, best-effort reminders note.
      Files: README.md
      Verify sequence (all must pass): `npm install`; `npm run build` (zero TypeScript errors, no build-breaking lint); `npm run test` (self-checks pass); `grep -rIlP "[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2190}-\x{21FF}\x{2B00}-\x{2BFF}\x{FE0F}\x{2764}]" src README.md` returns nothing (zero emoji); `grep -rn "lucide" src` returns nothing; `grep -rn "react-icons/" src` shows only `react-icons/io5`.

## Notes / assumptions
- Icon PNGs are generated programmatically (plain brand square + white "H"); if `sharp`/canvas is unavailable, commit minimal valid PNGs produced by a tiny node script using the built-in `zlib`/PNG encoding or a one-off generator. They must be valid so install/manifest works.
- Serwist is disabled in dev and enabled on build, so offline/installable criteria are verified from `npm run build` output, not `npm run dev`.
- Manual DOM/IndexedDB smoke checks (onboarding gating, timer->Dexie, live history delete, theme persistence, offline shell) are documented in the README checklist; automated coverage is the pure-lib Vitest suites + build gate.
