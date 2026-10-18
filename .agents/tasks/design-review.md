# Heula — Design Review (fresh, third pass)

Reviewer: design-review subagent, reading `design.md` + `requirements.md` cold, with no access to the context that produced them. Verdict is mechanical: any HIGH or MEDIUM finding blocks.

This is a greenfield build, so there is no existing source to re-verify. Where the design makes verifiable external claims (npm package availability, peer-dependency ranges, library export surfaces, icon names), I verified them directly against the registry and the published package. Those checks are recorded below.

## Scope checked

1. Buildability of the Next.js 15 + React 19 + TS-strict + Tailwind v4 + Serwist + Zustand + Dexie stack, with no hand-waving on config/manifest/SW/icons.
2. Completeness and lack of ambiguity in the pure recommendation function (typed signature + full decision table).
3. Precision of the timer/stage math contract.
4. The hard constraints (NO EMOJI, react-icons only, Indonesian Gojek voice, offline on-device) carried as explicit, enforced constraints.
5. Dependency versions pinned to sane current releases, no typosquats.

Overall this is a mature document that has already absorbed two prior review passes; most of the usual gaps (exhaustiveness mechanism, theme anti-flash shape, Dexie client-only contract, Serwist event wiring, the degenerate `exercises:true/intensity:null` state) are specified in concrete, buildable detail. The findings below are the residue.

---

## Findings

### Finding 1 — MEDIUM — The written aggressive-method invariant (Section 6.3) is a malformed boolean that does not match the decision table

Section 6.3 states the AC6/FR11.3 invariant as:

> `20:4` and `omad` never appear in `method` for any input, and never appear in `alternatives` unless `goal === "weight_loss" && (intensity === null || intensity === "light")` while `exercises` is `false` OR `intensity` is `null`/`"light"` — i.e. only the `"none"`/`"light"` buckets of a weight_loss goal (R2/R3).

The clause after "while" is broken. Parsed literally with normal precedence (`A && B OR C` = `(A && B) || C`), the condition is true whenever `intensity` is `null` or `"light"` **regardless of goal** (the trailing `OR intensity is null/"light"` short-circuits the `goal === "weight_loss"` guard away). That would permit `20:4`/`omad` alternatives for, e.g., `metabolic` + no exercise — directly contradicting the table (R5's alternatives are `["16:8"]`) and contradicting AC6. The prose "i.e. only the `"none"`/`"light"` buckets of a weight_loss goal (R2/R3)" states the correct intent, so this is a specification defect in the asserted invariant, not in the table — but the invariant is exactly what the design tells test authors to encode, so a coder transcribing it builds the wrong assertion and the AC6 guard silently passes garbage.

Concrete fix — replace the clause with an unambiguous predicate keyed on the raw inputs, matching the table exactly:

```ts
// 20:4 / omad may appear in `alternatives` only for R2/R3:
//   goal === "weight_loss"
//   AND the exercise bucket is "none" or "light"
// where the bucket is exactly exerciseState(answers) (heavy already returned by R1).
const canOfferAggressive =
  answers.goal === "weight_loss" &&
  (exerciseState(answers) === "none" || exerciseState(answers) === "light");
```

Express the invariant in terms of `exerciseState(answers)` (the already-specified total classifier), not a hand-rolled re-derivation over `exercises`/`intensity`. That both removes the broken `&&/OR` and keeps the degenerate `exercises:true/intensity:null` case correct (it maps to `"none"`, so weight_loss + degenerate DOES surface the aggressive alternatives — which is the intended R2 behavior and must be asserted that way).

### Finding 2 — MEDIUM — `METHOD_ORDER` includes `custom`, but the recommendation screen renders `METHOD_ORDER` as "all selectable" with a default selection — custom's fasting-hours are undefined at that point

Section 5 fixes `METHOD_ORDER = ["14:10","16:8","18:6","20:4","omad","custom"]`. Section 14 step 4 says `RecommendationStep` "renders ... the full `METHOD_ORDER` list (plus the 5:2 info card) all selectable. Default selection = recommended method; user can tap any other. A 'Mulai sekarang' button confirms" and then `completeOnboarding(answers, selectedMethod)`. The design never specifies what happens when the user selects `custom` during onboarding: `custom` has no hours yet (`customFastingHours` default is unspecified — Section 8 lists the field but no initial value), and onboarding has no hours input. Section 8's `startFast` rule trusts `customFastingHours` as "already clamped at the input layer," but onboarding is not that input layer. This is a reachable flow (tap "Custom", tap "Mulai sekarang") that lands on Home with a custom plan whose target hours were never set.

This is both a missing-detail gap and a feasibility gap: either custom must be excluded from the onboarding selectable list, or onboarding must capture custom hours, or `customFastingHours` must have a defined non-undefined default that `startFast` can safely use.

Concrete fix — pick one and state it:
- Simplest: exclude `custom` from the onboarding recommendation list (render `METHOD_ORDER.filter(id => id !== "custom")` there) and make custom reachable only from `PlanPicker`, which already owns the hours input. Add one sentence to Section 14 step 4.
- Or: give `customFastingHours` an explicit store default (e.g. `16`) in Section 8 and state that selecting custom in onboarding uses that default until changed, so the resulting fast is always valid.

### Finding 3 — NIT — `partialize` is described as "excludes nothing problematic" but the `hydrated` flag must not be persisted, and the design never lists what is persisted

Section 8 adds a `useHasHydrated` guard / `hydrated` flag and says persist "`partialize` excludes nothing problematic." If `hydrated` lives in the store state (the natural place given `onRehydrateStorage` sets it), persisting it would rehydrate `hydrated: true` from a prior session before the current rehydrate completes, defeating the guard on a cold load from populated storage. The design does not enumerate the persisted key set, so this is left to chance.

Concrete fix — in Section 8 state the exact `partialize` whitelist (persist `onboarded, profiling, chosenMethod, customFastingHours, dailyGoalHours, theme, reminders, activeFast`; do NOT persist `hydrated` or any transient action state), and keep `hydrated` out of the persisted envelope.

### Finding 4 — NIT — Onboarding `dailyGoalHours` default for a custom pick is unspecified

Section 14's confirm path: "`completeOnboarding(answers, selectedMethod)` ... (+ `dailyGoalHours` default to method fasting hours)". For every catalog method that resolves via `METHODS[id].fastingHours`, but for `custom` the "method fasting hours" is the catalog placeholder `16` (Section 5), which Section 8 explicitly warns must never be used as a real target. This is the same custom-hours ambiguity as Finding 2 bleeding into `dailyGoalHours`. If Finding 2 is fixed by excluding custom from onboarding, this resolves automatically; otherwise state the custom default explicitly.

Concrete fix — fold into Finding 2's resolution: once custom cannot be chosen in onboarding (or has a defined default), `dailyGoalHours` on confirm is well-defined.

---

## Verified Assumptions

These are claims in the design I checked against external reality and found correct:

- **All 19 pinned dependency versions exist on npm exactly as pinned** (`next@15.5.4`, `react@19.1.0`, `react-dom@19.1.0`, `typescript@5.9.2`, `@types/react@19.1.0`, `@types/react-dom@19.1.0`, `@types/node@22.10.0`, `tailwindcss@4.1.14`, `@tailwindcss/postcss@4.1.14`, `postcss@8.5.6`, `@serwist/next@9.5.1`, `serwist@9.5.1`, `zustand@5.0.3`, `dexie@4.4.6`, `dexie-react-hooks@4.4.0`, `motion@12.23.0`, `date-fns@4.1.0`, `react-icons@5.4.0`, `eslint-config-next@15.5.4`). No typosquats; all are well-known, canonical packages.
- **`dexie-react-hooks@4.4.0` peer dependency is `dexie >=4.2.0-alpha.1 <5.0.0` and `react >=16`.** The design's claim that pinned `dexie@4.4.6` satisfies it is correct, and the "bump together" warning is accurate.
- **`@serwist/next@9.5.1` really exports the `./worker` subpath** (confirmed in the package `exports` map), so the `import { defaultCache } from "@serwist/next/worker"` in Section 12.2 is a valid import path. `serwist@9.5.1` is published.
- **Every locked io5 icon name exists in `react-icons@5.4.0`** — verified `IoHomeOutline/IoHome`, `IoTimeOutline/IoTime`, `IoStatsChartOutline/IoStatsChart`, `IoPersonOutline/IoPerson`, `IoPlay`, `IoStop`, `IoCreateOutline`, `IoRestaurantOutline`, `IoFlameOutline`, `IoFlashOutline`, `IoLeafOutline`, `IoMoonOutline`, `IoNotificationsOutline`, `IoSunnyOutline`, `IoListOutline`, `IoFlagOutline`, `IoTrashOutline`, `IoInformationCircleOutline`, `IoRefreshOutline`, `IoChevronForward`, `IoCheckmarkCircle`, `IoArrowForward`, `IoBarbellOutline` all resolve in the published `io5` index. No referenced icon is missing.

## Unverified / Wrong Assumptions

- **Wrong (Finding 1):** the written aggressive-method invariant in Section 6.3 (`... && (...) while exercises is false OR intensity is null/"light"`) is a malformed boolean that, read literally, admits aggressive alternatives for non-weight-loss goals and contradicts both the table and AC6. The table itself is correct; the asserted invariant is not.
- **Unverified (not blocking, noted):** the design states `serwist.addEventListeners()` is "the single documented Serwist 9.x call" wiring install/activate/fetch/message. The `./worker` export and package presence are confirmed, but I did not introspect the runtime method surface of the `Serwist` class to confirm `addEventListeners` exists on 9.5.1; this is a runtime claim the implementer should confirm on first build. It does not change the verdict.
- **Unverified (not blocking):** the claim that Dexie 4 tolerates `new Dexie(...)` at module top-level without `indexedDB` present (no touch until a query runs) is plausible and consistent with Dexie's lazy-open behavior, but was not exercised here. The design's belt-and-suspenders rule (forbid server imports of `src/db` via ESLint) makes this safe regardless, so it is not a gap.
- **Unverified (not blocking):** Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *))` CSS-first dark-mode syntax is quoted as fact; valid for Tailwind v4 to my knowledge but not compiled here.

---

## Verdict

HIGH findings: 0
MEDIUM findings: 2 (Finding 1, Finding 2)
NIT findings: 2 (Finding 3, Finding 4)

Two MEDIUM findings -> **CHANGES_REQUESTED**. Both are tightly scoped: Finding 1 is a one-line boolean correction in the stated invariant, and Finding 2 is a one-sentence decision about custom-plan selectability during onboarding. A quick loop-back resolves both.
