# Implementation Plan — Mandatory BMI Profiling + BMI-aware Recommendations

Feature addition to the existing, building Heula PWA. Extend in place; do NOT rebuild.
Stack is fixed: Next.js 15.5.4, React 19, TS strict, Tailwind v4, motion/react, Zustand 5, Dexie, react-icons/io5 only, date-fns.

Baseline verified before planning: `npx vitest run` -> 155 tests pass (7 files). Build command: `npm run build`. Test command: `npx vitest run`. No-emoji scan lives at `src/lib/__tests__/no-emoji.test.ts` and scans all of `src` + README — every new string must be emoji-free.

## Chosen BMI-threading approach (with rationale)

Thread BMI as a PURE post-processing layer: a new `applyBmiAdjustment(base, category, answers): Recommendation` in `src/lib/recommendation.ts`, applied at the end of `recommendMethod` AFTER the R1 heavy guard and the `switch(goal)` have produced the base recommendation.

Rationale:
- The R1 heavy guard returns BEFORE BMI is consulted, so a heavy exerciser can NEVER be pushed to aggressive by BMI — the invariant is preserved structurally, not by discipline.
- `canOfferAggressive` stays the single gatekeeper; the adjustment layer only reorders/de-emphasizes within the already-allowed alternative set and appends caring copy. It never adds 20:4/omad and never changes a non-weight-loss or moderate/heavy result's aggressive eligibility.
- Keeping it a separate pure function makes it independently unit-testable and keeps the existing R1-R16 table untouched, so existing assertions stay valid once the required BMI fields are added to the test fixtures.
- `recommendMethod` signature is unchanged (still `(answers: ProfilingAnswers)`), because BMI now lives on `ProfilingAnswers`; category is derived internally via `bmiCategory(computeBmi(answers.heightCm, answers.weightKg))`.

Adjustment rules (sharpen, never override safety), applied only when NOT the heavy branch:
- UNDERWEIGHT: force primary to `14:10` if the base primary is stricter than 14:10; strip `18:6`, `20:4`, `omad` from alternatives (gentlest-safe only, keep `16:8`); ALWAYS append the caring underweight note to `warning` (non-null) and prepend/append it in rationale. Surfaces even when goal would suggest stricter.
- NORMAL: return base unchanged.
- OVERWEIGHT / OBESE: only when `goal === "weight_loss"` AND `canOfferAggressive` is already true may it surface `18:6` more prominently (move `18:6` ahead in alternatives ordering) and add a firmer-but-safe note to rationale. Primary stays the gentle default (never auto-jump to 20:4/omad). For all other goals, return base unchanged.

## Files to create

- `src/lib/bmi.ts` — pure BMI domain logic (no React imports).
- `src/lib/__tests__/bmi.test.ts` — pure unit tests.
- `src/features/onboarding/BmiStep.tsx` — the new mandatory onboarding step + live visualization.

## Files to edit

- `src/types/index.ts` — add `heightCm`/`weightKg` to `ProfilingAnswers`; add any new `IconKey`s used by BmiStep.
- `src/lib/recommendation.ts` — add `applyBmiAdjustment`, derive category, apply post-process.
- `src/lib/__tests__/recommendation.test.ts` — add required fields to fixtures; add BMI cases.
- `src/lib/copy.ts` — add `copy.bmi.*`, extend `copy.onboarding.*`, extend `copy.stats.*`.
- `src/components/ui/Icon.tsx` — add mapping for any new IconKey (verified io5 names).
- `src/features/onboarding/OnboardingFlow.tsx` — insert BMI step, TOTAL_STEPS=5, draft height/weight, gating, rerun prefill.
- `src/features/stats/StatsOverview.tsx` — add guarded BMI card.

## Ordered items

- [ ] 1. Extend the data model and add the pure BMI library.
      Add MANDATORY `heightCm: number` and `weightKg: number` to `ProfilingAnswers` in `src/types/index.ts` (keep existing optional `lastMealHour`/`wakeHour`). Create `src/lib/bmi.ts` (framework-free): `computeBmi(heightCm, weightKg): number` (kg / m^2; return `NaN` on invalid/zero height); `BmiCategory = "underweight" | "normal" | "overweight" | "obese"`; `bmiCategory(bmi): BmiCategory` using Asia-Pacific thresholds (underweight < 18.5; normal 18.5-22.9; overweight 23-24.9; obese >= 25); bounds constants `HEIGHT_MIN_CM=100`, `HEIGHT_MAX_CM=250`, `WEIGHT_MIN_KG=30`, `WEIGHT_MAX_KG=300`; a `isValidHeight`/`isValidWeight` (or combined `validateBmiInput`) guard the UI reuses. Decide `bmiCategory(NaN)` returns a safe default (document in comment). Do NOT yet touch every ProfilingAnswers construction site — that is item 2 so the type stays satisfied in one pass.
      Files: src/types/index.ts, src/lib/bmi.ts
      Verify: `npx vitest run src/lib/__tests__/bmi.test.ts` after item 3 (test file created there); for THIS item, `npx tsc --noEmit` will report the now-missing fields at every ProfilingAnswers literal — expected and fixed in item 2.

- [ ] 2. Make every ProfilingAnswers construction site satisfy the new required fields.
      Update each place a `ProfilingAnswers` is built: `src/features/onboarding/OnboardingFlow.tsx` (both the `handleConfirm` literal and the inline `answers` passed to `RecommendationStep`), `src/lib/__tests__/recommendation.test.ts` (the `answers()` helper and any inline literals), and any other literal found via grep `goal:.*exercises:`. For OnboardingFlow this means threading draft `heightCm`/`weightKg` state (added in item 4); until then use the draft values. In the test helper, extend the signature to accept height/weight with sensible defaults (e.g. 170/65 -> normal) so existing rows stay "normal" and unchanged in outcome.
      Files: src/features/onboarding/OnboardingFlow.tsx, src/lib/__tests__/recommendation.test.ts
      Verify: `npx tsc --noEmit` passes (no missing-property errors on ProfilingAnswers).

- [ ] 3. Add BMI unit tests.
      Create `src/lib/__tests__/bmi.test.ts` matching existing lib test style (vitest, `@/` alias): `computeBmi` correctness (e.g. 170cm/65kg ~= 22.49), divide-by-zero/invalid -> `NaN`; each Asia-Pacific boundary edge: 18.49 underweight, 18.5 normal, 22.9 normal, 23.0 overweight, 24.9 overweight, 25.0 obese; validator bounds (100/250 cm, 30/300 kg inclusive/exclusive as implemented).
      Files: src/lib/__tests__/bmi.test.ts
      Verify: `npx vitest run src/lib/__tests__/bmi.test.ts` — all new tests pass.

- [ ] 4. Fold BMI into the recommendation engine as a pure post-process.
      In `src/lib/recommendation.ts` add `applyBmiAdjustment(base, category, answers): Recommendation` with a code comment documenting the chosen post-process approach and the safety invariants. In `recommendMethod`, after the R1 heavy early-return and the `switch(goal)` base result, compute `const cat = bmiCategory(computeBmi(answers.heightCm, answers.weightKg))` and return `applyBmiAdjustment(base, cat, answers)` — EXCEPT the heavy branch returns before this (heavy is never BMI-adjusted). Add new caring/firmer strings to `copy.recommendation.*` (underweight caring note, overweight/obese firmer note), all non-empty, Indonesian, emoji-free. Preserve `canOfferAggressive` as the sole aggressive gatekeeper (BMI must not widen it).
      Files: src/lib/recommendation.ts, src/lib/copy.ts
      Verify: `npx vitest run src/lib/__tests__/recommendation.test.ts` (updated in item 5) and `npx tsc --noEmit`.

- [ ] 5. Update and extend recommendation tests for BMI.
      In `src/lib/__tests__/recommendation.test.ts`: ensure the shared `answers()` helper supplies normal-BMI height/weight so all existing R1-R16 rows and invariant assertions still pass unchanged. ADD cases: underweight input never gets `18:6`/`20:4`/`omad` as primary and gets a non-null caring warning (even for a goal that would suggest stricter); heavy + underweight/obese still yields `14:10` + warning (BMI never overrides heavy); `canOfferAggressive` still false for non-weight-loss and for moderate/heavy regardless of BMI; overweight/obese + weight_loss primary is never auto-OMAD/20:4.
      Files: src/lib/__tests__/recommendation.test.ts
      Verify: `npx vitest run src/lib/__tests__/recommendation.test.ts` — all pass; total suite count increases from 155.

- [ ] 6. Add BMI copy, icons, and the BmiStep component.
      Add `copy.bmi.*` (step title, tinggi/berat labels, units, placeholders, friendly Indonesian validation messages, category labels + one-liners for each of the four categories, the rough-indicator + not-medical-advice disclaimer) and any `copy.onboarding.*` additions, all emoji-free. If BmiStep needs a new icon, add the key to the `IconKey` union in `src/types/index.ts` AND the mapping in `src/components/ui/Icon.tsx` using a verified io5 name (prefer reusing existing keys; a body/scale icon may use an existing key or a verified `IoBodyOutline`). Create `src/features/onboarding/BmiStep.tsx` (client): labelled numeric inputs (`inputMode="numeric"`/`"decimal"`, min/max from bmi.ts bounds, >=44px targets, aria), LIVE BMI value + category label + friendly one-liner, and an attractive segmented gauge (underweight/normal/overweight/obese colored segments with a moving marker animated via motion/react spring) built with divs/SVG + brand tokens, iOS-clean in light and dark, zero emoji; "Lanjut" disabled until height+weight valid; the honest disclaimer line. Icons only via `Icon`.
      Files: src/lib/copy.ts, src/types/index.ts, src/components/ui/Icon.tsx, src/features/onboarding/BmiStep.tsx
      Verify: `npx vitest run src/lib/__tests__/no-emoji.test.ts` passes (new files/strings emoji-free) and `npx tsc --noEmit` passes.

- [ ] 7. Wire BmiStep into OnboardingFlow as a mandatory step between Exercise and Recommendation.
      In `src/features/onboarding/OnboardingFlow.tsx`: set `TOTAL_STEPS = 5`; add `heightCm`/`weightKg` draft state (number | null); insert `<BmiStep>` at index 3 (Welcome 0, Goal 1, Exercise 2, BMI 3, Recommendation 4); pass draft values + onChange + gating so the user cannot advance past BMI without valid height+weight (reuse `validateBmiInput` from bmi.ts); include heightCm/weightKg in BOTH ProfilingAnswers literals (handleConfirm + RecommendationStep answers); in rerun mode (`?rerun=1`) prefill height/weight from stored `profiling` if present. Keep the existing motion horizontal spring slide and Stepper (`total={TOTAL_STEPS}`). Do NOT reintroduce `custom` into the onboarding selectable list.
      Files: src/features/onboarding/OnboardingFlow.tsx
      Verify: `npm run build` succeeds; manual smoke per README (onboarding gating) — RecommendationStep reflects BMI automatically and underweight caring note shows.

- [ ] 8. Add a guarded BMI card to Stats.
      In `src/features/stats/StatsOverview.tsx`, near the existing goal card, render latest BMI value + category label read from stored `profiling`, compact iOS styling + friendly emoji-free copy from `copy.stats.*`. GUARD: older persisted profiling may lack `heightCm`/`weightKg` (partialize already persisted profiling pre-change) — if either is missing/invalid, HIDE the BMI card rather than crash. Apply the same undefined-guard anywhere `profiling.heightCm`/`weightKg` is read.
      Files: src/features/stats/StatsOverview.tsx, src/lib/copy.ts
      Verify: `npm run build` succeeds; `npx vitest run` full suite passes; no-emoji scan passes.

- [ ] 9. Final cross-cutting verification.
      Run the full build and test suite; confirm no regressions to the layout/shell (Chrome.tsx, layout.tsx, AppShell.tsx, BottomTabBar.tsx untouched), SW/notifications, theme, Dexie schema.
      Files: (none — verification only)
      Verify: `npm run build` succeeds AND `npx vitest run` passes (count > 155, all green including no-emoji scan).

## Non-regression guardrails (do NOT disturb)

- Chrome.tsx / layout.tsx / AppShell.tsx / BottomTabBar.tsx stay exactly as-is (onboarding route is full-screen, no tab bar).
- Do NOT change the SW/notifications subsystem, the theme system, or the Dexie history schema.
- No `any`; strong typing; SSR-safe (BmiStep is client-side; guard any window usage); no hydration mismatches.
- `persist` version/migrate unchanged; the undefined-guard in Stats is the migration strategy for pre-change persisted profiling.

## Known gaps / assumptions

- Asia-Pacific thresholds are used per the task (not WHO global). Documented in bmi.ts.
- Underweight caring note is surfaced via the `warning` field (reusing the existing RecommendationStep warning banner), so no RecommendationStep markup change is required — it renders automatically.
- The segmented gauge uses hardcoded category color tokens derived from brand/semantic tokens (brand for normal/safe, danger for obese, muted for underweight/overweight) to avoid adding a chart library; exact shades are an implementation detail left to the coder within existing tokens.
