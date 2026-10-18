# Implementation Plan - iOS Visual Polish (Heula)

Presentation-only refinement of the EXISTING, building Heula PWA to feel genuinely iOS, plus a floating iOS "pill" bottom tab bar. No version, routing, data-flow, store, Dexie, or copy-string changes. Centralize the look in design tokens (`src/app/globals.css`) and shared UI primitives so the refresh propagates, then sweep screens for consistency.

## Design decisions (made during exploration, grounded in code)

- Keep Tailwind v4 CSS-first conventions already in use: `@theme` tokens mapped to CSS variables, `@custom-variant dark (&:where(.dark, .dark *))`, `@utility safe-*`. Reason: `globals.css` already does this and the whole app references semantic utilities (`bg-surface`, `text-content`, `rounded-card`, `rounded-pill`, `shadow-card`, `shadow-sheet`). Adjusting the variable values + a few token values propagates everywhere without touching every file.
- Do NOT change theming mechanics. `ThemeProvider` toggles `.dark` on `<html>` and `layout.tsx` has an anti-flash script; both stay as-is. Only CSS variable values under `:root`/`.dark` and `@theme` tokens change.
- Floating pill => the shell can no longer reserve a flat `64px` strip. AppShell must reserve pill height + bottom gap + safe-area so bottom content (incl. Home's `mt-auto pb-4` Start/Stop controls) is never covered. ToastProvider's hard-coded `bottom-20` must also clear the floating pill. Both files are NOT off-limits.
- No emoji anywhere, including CSS comments: the vitest `no-emoji` scan covers `.ts/.tsx/.css/.mjs/.js` across all of `src`. Every edited/new file must stay emoji-free.
- Icons only via `src/components/ui/Icon.tsx` (off-limits). Style with ONLY already-mapped IconKeys. No new IconKeys.
- Verification uses the project's real commands: `npm test` (vitest, includes no-emoji scan) and `npm run build` (Next build + Serwist SW generation). Baseline confirmed green: 155 tests pass; build succeeds (one pre-existing unrelated ESLint warning in `src/lib/recommendation.ts`).

## Files to CHANGE (confirmed NONE are off-limits)

- `src/app/globals.css` (tokens)
- `src/components/ui/Button.tsx`, `Card.tsx`, `Segmented.tsx`, `Sheet.tsx`, `Toast.tsx`, `ConfirmDialog.tsx`, `EmptyState.tsx`, `Stepper.tsx`, `Spinner.tsx` (primitives)
- `src/components/layout/BottomTabBar.tsx`, `AppShell.tsx` (pill + spacing)
- `src/components/ui/ToastProvider.tsx` (toast offset above floating pill)
- `src/app/page.tsx`, `src/app/history/page.tsx`, `src/app/stats/page.tsx`, `src/app/profile/page.tsx`, `src/app/offline/page.tsx` (screen headers/spacing)
- `src/features/timer/ProgressRing.tsx`, `StageIndicator.tsx`, `TimerControls.tsx`, `StartTimeSheet.tsx`, `FastingTimer.tsx`
- `src/features/history/HistoryList.tsx`, `SessionRow.tsx`
- `src/features/stats/StatsOverview.tsx`, `WeeklyBarChart.tsx`
- `src/features/settings/PlanPicker.tsx`, `DailyGoalPicker.tsx`, `AboutCard.tsx`
- `src/features/onboarding/OnboardingFlow.tsx`, `WelcomeStep.tsx`, `GoalStep.tsx`, `ExerciseStep.tsx`, `RecommendationStep.tsx`

## Files that MUST NOT be touched (off-limits - concurrent workflow)

`src/features/settings/ReminderSettings.tsx`, `src/lib/copy.ts`, `src/lib/notifications.ts`, `src/lib/pwa.ts`, `src/components/ui/Icon.tsx`, `src/types/**` (incl. IconKey union), `src/app/sw.ts`, `src/store/**`. ReminderSettings inherits the new look automatically via shared primitives/tokens.

## Skipped-for-icon notes

- The task mentions a `DailyGoal` component separate from `DailyGoalPicker`; no such file exists in the repo. Only `DailyGoalPicker.tsx` is present and is covered.
- iOS "switch"/toggle visuals: the only toggle-like control is the theme `Segmented`; there are no plain checkboxes to convert (reminder toggles live in off-limits `ReminderSettings`). So no new icon is needed; nothing skipped on this front.
- No desired visual requires a new IconKey. If the implementer finds one, SKIP it and record it here rather than editing `Icon.tsx`/`src/types`.

---

## Ordered items

- [ ] 1. Refresh iOS design tokens in `src/app/globals.css`.
      Tune `@theme` + `:root`/`.dark` CSS variables for an iOS feel: larger corner radii (`--radius-card` ~1.5rem), softer/more-diffuse shadows (`--shadow-card`, `--shadow-sheet`), a slightly cooler/greyer light `--bg`, and true near-black grouped dark surfaces (`--bg`, `--surface`, `--surface-2`, `--border`). Keep the emerald brand tokens. Add any new tokens needed by later items (e.g. a hairline border color, a frosted-surface alpha, a `--radius-control`) as CSS variables so primitives can reference them. Keep the Apple system font stack already in `body`. No emoji in comments.
      Files: src/app/globals.css
      Verify: `npm test` passes (no-emoji scan still green over css); `npm run build` succeeds.

- [ ] 2. Elevate shared UI primitives to iOS feel using the refreshed tokens.
      Button: iOS pill with subtle `whileTap` press-scale (~0.97) via motion/react (convert to a motion button, keep variants/props/typing identical). Card: larger radius + softer shadow via tokens (grouped-inset option acceptable). Segmented: rounded track + sliding selected pill with spring (already present; refine spring + colors). Sheet: keep slide-up + grabber, apply spring easing and larger top radius from tokens. Toast/ConfirmDialog/EmptyState/Stepper/Spinner: align radii, colors, spacing to tokens. No prop/signature/logic/copy changes; SSR-safe (animations are client components already marked "use client"); no new icons.
      Files: src/components/ui/Button.tsx, src/components/ui/Card.tsx, src/components/ui/Segmented.tsx, src/components/ui/Sheet.tsx, src/components/ui/Toast.tsx, src/components/ui/ConfirmDialog.tsx, src/components/ui/EmptyState.tsx, src/components/ui/Stepper.tsx, src/components/ui/Spinner.tsx
      Verify: `npm test` passes; `npm run build` succeeds.

- [ ] 3. Redesign `BottomTabBar.tsx` into a floating iOS pill and fix shell/toast spacing.
      BottomTabBar: detach from edges (margin left/right/bottom, centered in the max-w-[480px] column, hovering above the home indicator via safe-area), fully rounded, frosted translucent `bg-surface/XX` + `backdrop-blur`, soft diffuse shadow, hairline border. Four tabs with the SAME existing IconKeys (`tab_home`/`tab_history`/`tab_stats`/`tab_profile`). Active: emerald icon+label with a `motion` `layoutId` pill/blob highlight that springs between tabs; inactive muted. Accessibility: keep `nav aria-label`, set `aria-current="page"` on the active link, hit targets >=44px, visible focus ring. AppShell: replace `pb-[calc(64px+env(safe-area-inset-bottom))]` with reserved space = pill height + bottom gap + `env(safe-area-inset-bottom)` so bottom content and Home's `mt-auto pb-4` Start/Stop controls clear the floating pill. ToastProvider: raise the toast stack offset so it sits above the floating pill (adjust the `bottom-20` value to match the new reserved space). Do NOT touch `Chrome.tsx` route logic.
      Files: src/components/layout/BottomTabBar.tsx, src/components/layout/AppShell.tsx, src/components/ui/ToastProvider.tsx
      Verify: `npm run build` succeeds; `npm test` passes. Manual (noted for reviewer): on `/`, `/history`, `/stats`, `/profile` the pill floats and no bottom content is hidden behind it; `/onboarding` and `/offline` show no bar.

- [ ] 4. Sweep timer feature components for the refreshed iOS feel.
      Apply iOS type scale/weights and tighter spacing to the Home header + readouts; ensure ProgressRing, StageIndicator, TimerControls, StartTimeSheet, and the complete-prompt card read with the new tokens (radii/shadows/colors). TimerControls buttons inherit the new Button press-scale automatically. Presentation only; no logic, data, copy, or icon changes; keep hydration guards (`nowMs === null` placeholder) intact.
      Files: src/features/timer/FastingTimer.tsx, src/features/timer/ProgressRing.tsx, src/features/timer/StageIndicator.tsx, src/features/timer/TimerControls.tsx, src/features/timer/StartTimeSheet.tsx
      Verify: `npm run build` succeeds; `npm test` passes.

- [ ] 5. Sweep History + Stats + screen page headers for consistency.
      History: grouped day lists with iOS section-header styling, rows via refreshed Card. Stats: overview StatCards + custom WeeklyBarChart share refreshed tokens (radii, bar styling, label type). Page headers (`/history`, `/stats`, `/profile`, `/`, `/offline`): lean into large bold iOS titles + consistent top spacing/safe-area. Presentation only; no copy/logic/icon changes.
      Files: src/features/history/HistoryList.tsx, src/features/history/SessionRow.tsx, src/features/stats/StatsOverview.tsx, src/features/stats/WeeklyBarChart.tsx, src/app/history/page.tsx, src/app/stats/page.tsx, src/app/profile/page.tsx, src/app/page.tsx, src/app/offline/page.tsx
      Verify: `npm run build` succeeds; `npm test` passes.

- [ ] 6. Sweep settings pickers + onboarding for consistency.
      Settings: PlanPicker, DailyGoalPicker, AboutCard rows adopt the iOS grouped-inset list aesthetic / refreshed tokens (DO NOT open ReminderSettings; it inherits via primitives). Profile theme Segmented keeps its logic. Onboarding: WelcomeStep, GoalStep, ExerciseStep, RecommendationStep, OnboardingFlow share refreshed tokens; keep the existing motion slide/height animations and step gating. Presentation only; no copy/logic/icon changes.
      Files: src/features/settings/PlanPicker.tsx, src/features/settings/DailyGoalPicker.tsx, src/features/settings/AboutCard.tsx, src/features/onboarding/OnboardingFlow.tsx, src/features/onboarding/WelcomeStep.tsx, src/features/onboarding/GoalStep.tsx, src/features/onboarding/ExerciseStep.tsx, src/features/onboarding/RecommendationStep.tsx
      Verify: `npm run build` succeeds; `npm test` passes.

- [ ] 7. Final integration verification.
      Run the full suite and production build; confirm both green and no new emoji introduced. Confirm no off-limits file was modified (git diff --name-only must not list any off-limits path).
      Files: none (verification only)
      Verify: `npm test` passes (incl. no-emoji scan); `npm run build` succeeds; `git diff --name-only` lists only the files above and NO off-limits paths.
