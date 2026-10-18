# Heula — Technical Design

## 1. Overview

Heula is a single-page-feel, multi-route Next.js 15 App Router PWA that runs entirely on the client. There is no backend: durable fasting history lives in IndexedDB via Dexie, and lightweight UI/profile/settings state lives in `localStorage` via a persisted Zustand store. The app is organized as a phone-width column centered on larger viewports, with a fixed iOS-style bottom tab bar (Home, History, Stats, Profile). Every screen is a client experience; the App Router is used for routing and layout composition, while all stateful logic is in client components to keep hydration correct for the ticking timer and storage access.

The core domain logic — IF method definitions, the pure recommendation function, and the timer/stage math — lives in `src/lib` as framework-free, strongly-typed, unit-testable modules. UI consumes them through Zustand selectors and Dexie live queries. Framer Motion (imported as `motion/react`) provides spring animations for the timer ring, stepped onboarding cards, and tab transitions. Serwist generates the service worker and wires offline caching.

Two hard constraints are enforced throughout and must be treated as acceptance gates: **zero emoji** in any string (UI, copy, toasts, notifications, seed data) and **react-icons only** (`react-icons/io5`, Ionicons) for all iconography. No other icon library is installed or imported.

## 2. Technology stack (locked)

The stack is fixed once this design is approved. Exact pinned versions (verified available on npm at authoring time):

| Package | Version | Purpose |
|---|---|---|
| next | 15.5.4 | App Router framework |
| react | 19.1.0 | UI runtime |
| react-dom | 19.1.0 | DOM renderer |
| typescript | 5.9.2 | Types (strict) |
| @types/react | 19.1.0 | React types |
| @types/react-dom | 19.1.0 | React DOM types |
| @types/node | 22.10.0 | Node types |
| tailwindcss | 4.1.14 | Styling (v4) |
| @tailwindcss/postcss | 4.1.14 | Tailwind v4 PostCSS plugin |
| postcss | 8.5.6 | PostCSS |
| @serwist/next | 9.5.1 | Next PWA integration |
| serwist | 9.5.1 | Service worker runtime |
| zustand | 5.0.3 | Client state + persist |
| dexie | 4.4.6 | IndexedDB wrapper |
| dexie-react-hooks | 4.4.0 | `useLiveQuery` |
| motion | 12.23.0 | Framer Motion (`motion/react`) |
| date-fns | 4.1.0 | Time math |
| react-icons | 5.4.0 | Icons (io5 subset only) |
| eslint | 9.x | Lint |
| eslint-config-next | 15.5.4 | Next lint rules |

Notes: versions are pinned exactly (no `^`) per NFR7. `dexie-react-hooks` is pinned to the current `4.4.0` line, which is the one built for Dexie 4; its declared peer is `dexie >=4.2.0-alpha.1 <5.0.0`, satisfied by the pinned `dexie 4.4.6` (the two must be bumped together — do not pin `dexie` below 4.2.0 against hooks 4.x, and do not pair the legacy `dexie-react-hooks` 1.x line with Dexie 4). Framer Motion ships under the `motion` package; import spring/animation primitives from `motion/react`. If `npm install` surfaces a peer-dependency conflict on an exact patch, the implementer bumps only the patch within the same minor and records it — majors/minors are frozen.

## 3. Folder & file inventory (`src/`)

```
src/
  app/
    layout.tsx                 Root layout: html/body, theme + viewport-fit, fonts, providers, bottom tab shell
    globals.css                Tailwind v4 import, CSS vars (light/dark), safe-area utilities, base styles
    manifest.ts                Next metadata route exporting the web app manifest (MetadataRoute.Manifest)
    ~offline/page.tsx          Offline fallback page (served by Serwist precache)   [folder: offline]
    page.tsx                   Home (live timer). Redirects to /onboarding if not onboarded
    onboarding/page.tsx        Onboarding flow host (stepped, client)
    history/page.tsx           History list
    stats/page.tsx             Stats + weekly chart
    profile/page.tsx           Settings/Profile
    sw.ts                      Serwist service worker source (compiled to /sw.js)
  components/
    ui/
      Card.tsx                 Rounded card with soft shadow
      Button.tsx               Primary/secondary/ghost/destructive variants, large touch targets
      Sheet.tsx                Bottom sheet (motion) for pickers/confirms
      Segmented.tsx            iOS segmented control
      Stepper.tsx              Onboarding progress dots
      ConfirmDialog.tsx        Confirmation modal (reset, delete)
      Toast.tsx + ToastProvider.tsx  Lightweight toast (friendly copy, no emoji)
      Icon.tsx                 Thin wrapper re-exporting the approved io5 icon set (single import choke point)
      EmptyState.tsx           Friendly empty-state block
      Spinner.tsx              Loading indicator
    layout/
      BottomTabBar.tsx         iOS bottom tab nav (Home/History/Stats/Profile), active states
      AppShell.tsx             Centered phone-width column + safe-area padding
      ThemeProvider.tsx        Applies dark class from store/system, hydration-safe
  features/
    onboarding/
      OnboardingFlow.tsx       Orchestrates steps + transitions
      WelcomeStep.tsx
      GoalStep.tsx
      ExerciseStep.tsx         Exercise yes/no + conditional intensity
      RecommendationStep.tsx   Shows recommendation + full selectable method list
    timer/
      FastingTimer.tsx         Home centerpiece; wires store + useTimer tick
      ProgressRing.tsx         Animated circular SVG ring
      StageIndicator.tsx       Current stage card with io5 icon + description
      TimerControls.tsx        Start / Stop / edit start time
      StartTimeSheet.tsx       Edit-start-time bottom sheet
    history/
      HistoryList.tsx          Grouped-by-day list (useLiveQuery)
      SessionRow.tsx           Row with duration/plan/completed badge + delete
    stats/
      StatsOverview.tsx        Streaks/totals/averages cards
      WeeklyBarChart.tsx       Custom SVG/div bar chart (last 7 days)
    settings/
      PlanPicker.tsx           Switch active plan (incl. custom hours)
      DailyGoalPicker.tsx
      ReminderSettings.tsx     Permission + schedule toggles
      AboutCard.tsx            Version/about copy
  lib/
    methods.ts                 IF method catalog (enum + metadata) — single source of truth
    recommendation.ts          Pure recommendation function + decision table
    timer.ts                   Elapsed/remaining/target + stage selection (pure)
    stages.ts                  Stage catalog (bounds, label, description, icon key)
    stats.ts                   Pure stats derivations from session[]
    time.ts                    date-fns-based formatting helpers (hh:mm:ss, grouping keys)
    notifications.ts           Notifications API wrapper + best-effort scheduler
    copy.ts                    Centralized Indonesian strings (Gojek voice, no emoji)
    cn.ts                      className merge helper
  store/
    useAppStore.ts             Zustand store (profiling + fasting + settings) with persist
    types.ts                   Store-facing types
  db/
    db.ts                      Dexie subclass + schema + typed table
    sessions.ts                CRUD + query helpers over Dexie
  types/
    index.ts                   Shared domain enums/interfaces (Goal, Intensity, MethodId, etc.)
public/
  icons/
    icon-192.png icon-512.png maskable-512.png apple-touch-icon.png
  (favicon via app metadata)
```

Config files at repo root: `package.json`, `tsconfig.json` (strict), `next.config.ts` (Serwist wrap), `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `README.md`, and a test setup (`vitest.config.ts` + `src/lib/__tests__/`).

## 4. Domain types (`src/types/index.ts`)

```ts
export type Goal =
  | "weight_loss"        // Turun berat badan
  | "metabolic"          // Kesehatan metabolik - gula darah
  | "focus"              // Fokus & produktivitas
  | "maintain"           // Maintain berat badan
  | "general";           // Coba-coba - umum

export type Intensity = "light" | "moderate" | "heavy"; // Ringan / Sedang / Berat

// Stable icon identifiers owned by the type layer so framework-free lib modules
// (e.g. stages.ts) can reference icons without importing from components/.
// src/components/ui/Icon.tsx MUST provide an ICONS map whose keys are exactly IconKey
// (enforced by `ICONS satisfies Record<IconKey, IconType>` there — Section 16).
export type IconKey =
  | "tab_home" | "tab_history" | "tab_stats" | "tab_profile"
  | "play" | "stop" | "edit"
  | "stage_pencernaan" | "stage_bakar_lemak" | "stage_ketosis"
  | "stage_autophagy" | "stage_deep_fast"
  | "notifications" | "theme_dark" | "theme_light" | "plans" | "goal"
  | "trash" | "about" | "refresh" | "chevron" | "check" | "arrow_forward"
  | "exercise";

// Timer-capable methods only. 5:2 is informational and NOT a MethodId.
export type MethodId = "14:10" | "16:8" | "18:6" | "20:4" | "omad" | "custom";

export interface MethodMeta {
  id: MethodId;
  label: string;            // e.g. "16:8"
  fastingHours: number;     // custom resolved at runtime; catalog default for custom = 16
  eatingHours: number;      // 24 - fastingHours
  tagline: string;          // short Gojek-voice description, no emoji
  advanced: boolean;        // 20:4 and omad are advanced
}

export interface ProfilingAnswers {
  goal: Goal;
  exercises: boolean;
  intensity: Intensity | null; // null when exercises === false
  lastMealHour?: number | null; // optional, 0-23, unused by recommendation
  wakeHour?: number | null;     // optional, 0-23, unused by recommendation
}

export interface Recommendation {
  method: MethodId;         // never "custom"; never 5:2
  rationale: string;        // non-empty, Indonesian, no emoji
  warning: string | null;   // present for heavy exercise + advanced framing
  alternatives: MethodId[]; // ordered gentle->aggressive, for display ordering
}

export interface FastingSessionRecord {
  id?: number;              // Dexie auto-increment PK
  planId: MethodId;
  planLabel: string;        // snapshot label (e.g. "16:8", "Custom 17j")
  targetHours: number;      // target fasting hours at time of session
  startMs: number;          // epoch ms
  endMs: number;            // epoch ms (actual stop/complete)
  durationMs: number;       // endMs - startMs
  completed: boolean;       // true if durationMs >= target
  createdAt: number;        // epoch ms, for ordering
}
```

## 5. IF method catalog (`src/lib/methods.ts`)

Single source of truth. `METHODS: Record<MethodId, MethodMeta>` plus a display order array. `custom` carries a default `fastingHours` of 16 that is overridden by the user's chosen hours (settings store). 5:2 is **not** in this catalog; it is rendered as a static info card in `PlanPicker` with explanatory copy and is not a selectable timer target (requirements A1 / Out of Scope).

```ts
export const METHOD_ORDER: MethodId[] = ["14:10","16:8","18:6","20:4","omad","custom"];
```

Fasting hours: 14:10 -> 14, 16:8 -> 16, 18:6 -> 18, 20:4 -> 20, omad -> 23, custom -> user-set (clamped 8..23). `advanced` is true for `20:4` and `omad`.

## 6. Recommendation function (`src/lib/recommendation.ts`)

### 6.1 Signature

```ts
export function recommendMethod(answers: ProfilingAnswers): Recommendation;
```

Pure, deterministic, no I/O, no `Date.now()`. Fully documented with JSDoc. Returns `Recommendation` where `method` is always a timer-capable `MethodId` other than `custom`, `rationale` is a non-empty Indonesian string, `warning` is a string for heavy-exercise cases (and null otherwise), and `alternatives` is the display-ordering of the remaining suggested methods.

**Control-flow / exhaustiveness pattern (single technique, not two):** heavy exercise is handled by an early guard (`if (answers.exercises && answers.intensity === "heavy") return <R1>;`), then the remaining rows are resolved with `switch (answers.goal)` where **every** `case` returns a `Recommendation`, closed by a final `default` that is a compile-time exhaustiveness guard:

```ts
export function recommendMethod(answers: ProfilingAnswers): Recommendation {
  // R1: heavy exercise, any goal -> gentle 14:10 + mandatory warning
  if (answers.exercises && answers.intensity === "heavy") return buildHeavy();

  const ex = exerciseState(answers); // "none" | "light" | "moderate" (heavy already returned)
  switch (answers.goal) {
    // (exerciseState is defined just below; see "Exercise-state mapping")
    case "weight_loss": return buildWeightLoss(ex);
    case "metabolic":   return buildMetabolic(ex);
    case "focus":       return buildFocus(ex);
    case "maintain":    return buildMaintain(ex);
    case "general":     return buildGeneral(ex);
    default: {
      // Compile-time exhaustiveness: if a Goal is ever added, this fails to type-check.
      const _exhaustive: never = answers.goal;
      return GENTLE_16_8; // unreachable at runtime; compile-time guard only
    }
  }
}
```

We use **only** the `const _exhaustive: never = answers.goal` assignment pattern (not a separate `satisfies` check). The `default` branch is unreachable at runtime because `Goal` is a closed union and every member has a `case`; it exists solely so adding a `Goal` member becomes a type error. See Section 6.3 for how this branch is treated by coverage.

**Exercise-state mapping (`exerciseState`) — specified verbatim.** The entire non-heavy table (R2–R16) is indexed by the `"none" | "light" | "moderate"` value this helper returns, so its mapping is part of the design contract, not an implementation choice. `ProfilingAnswers` (Section 4) is `{ exercises: boolean; intensity: Intensity | null }` with **no type-level coupling** between the two fields, which means the state `exercises === true && intensity === null` is representable and reachable (a UI defect, a rehydrated profile from an older version, or a future caller could produce it). The helper resolves that state deterministically to the gentlest safe bucket, `"none"`:

```ts
/**
 * Classify the exercise load into the three non-heavy buckets used by the
 * decision table. The heavy case (exercises === true && intensity === "heavy")
 * is handled by the R1 early guard in recommendMethod and never reaches here.
 *
 * Mapping (total over all reachable inputs):
 *   exercises === false                         -> "none"  (intensity is null by FR1.3)
 *   exercises === true  && intensity === null    -> "none"  (unspecified load -> gentlest safe default)
 *   exercises === true  && intensity === "light" -> "light"
 *   exercises === true  && intensity === "moderate" -> "moderate"
 *   exercises === true  && intensity === "heavy" -> (unreachable: returned by R1 guard)
 */
function exerciseState(a: ProfilingAnswers): "none" | "light" | "moderate" {
  if (!a.exercises || a.intensity === null) return "none";
  // intensity is "light" | "moderate" here; "heavy" already returned by the R1 guard.
  return a.intensity;
}
```

The rule is explicit: **`exercises === true && intensity === null` collapses to `"none"`** — the gentlest, safe default — so the function is total over the raw input space and no representable `ProfilingAnswers` is left unclassified. This makes the invariant test space in Section 6.3 well defined (it must enumerate the raw `(exercises, intensity)` product, not the post-`exerciseState` buckets) and preserves the "default to gentler" selection principle below even for the degenerate `exercises:true/intensity:null` input.

### 6.2 Decision table (exhaustive)

Evaluated top-down; first matching row wins. `goal` x `exercises`/`intensity`. "none" = `exercises === false` (intensity null).

| # | goal | exercise state | -> method | warning? | rationale theme |
|---|---|---|---|---|---|
| R1 | any | heavy | 14:10 | YES | protect training/recovery; shorter fast; avoid OMAD/20:4 |
| R2 | weight_loss | none | 16:8 | no | gentle start, hint to escalate to 18:6 later |
| R3 | weight_loss | light | 16:8 | no | gentle, room to grow; advanced 18:6/20:4 later if comfy |
| R4 | weight_loss | moderate | 16:8 | no | balanced with training load |
| R5 | metabolic | none | 18:6 | no | longer window helps glucose control, still doable |
| R6 | metabolic | light | 16:8 | no | solid metabolic benefit, sustainable |
| R7 | metabolic | moderate | 16:8 | no | supports glucose control without hurting training |
| R8 | focus | none | 16:8 | no | clean fasted-focus window |
| R9 | focus | light | 16:8 | no | focus window that fits activity |
| R10 | focus | moderate | 16:8 | no | focus plus training balance |
| R11 | maintain | none | 14:10 | no | lenient, easy to keep up |
| R12 | maintain | light | 14:10 | no | lenient, maintenance-friendly |
| R13 | maintain | moderate | 16:8 | no | mild structure, maintenance |
| R14 | general | none | 16:8 | no | friendly beginner start |
| R15 | general | light | 16:8 | no | friendly beginner start |
| R16 | general | moderate | 16:8 | no | beginner-friendly with activity |

**Selection principle for requirement OR-choices (governs R5/R6, R11/R12/R13, and all rows where FR11.3 offers latitude):** within any either/or the requirements allow, we default to the *gentler* option and only step up to a longer window when that longer window *materially serves the goal and there is no training load to protect*. Concretely: `metabolic` + no exercise -> `18:6` (the longer window gives more glucose/insulin benefit and there is no training to protect), while `metabolic` + light/moderate exercise -> `16:8` (step back down to protect the (light) training and keep it sustainable); `maintain` defaults to the lenient `14:10` for none/light, stepping up to `16:8` only at moderate training where the mild structure of a 16:8 is more useful than the very loose 14:10. Every OR-resolved row below is traceable to this one rule, so the choices are not arbitrary and test authors can validate edge rows against the principle rather than copying the table blind.

**Goal-strength / "strong weight-loss" resolution (FR11.3, AC6) — Option A, no new input:** the requirements gate aggressive methods (`20:4`, `omad`) behind "strong weight-loss". The data model has a single flat `goal === "weight_loss"` with no separate strength signal, and the profiling flow intentionally does **not** add an aggressiveness toggle (keeping the flow short per FR1.3). We therefore define: **`goal === "weight_loss"` is itself treated as the "strong weight-loss" condition** from FR11.3. Consequently the `20:4`/`omad` alternatives are offered to *all* `weight_loss` + none/light-exercise users (rows R2, R3), framed as advanced/opt-in. This is a deliberate scope decision, not an oversight: there is no hidden goal-strength input to capture, and no row other than R2/R3 ever surfaces an aggressive method. If a future revision wants to honor the literal "strong" qualifier, it would add an `aggressive: boolean` to `ProfilingAnswers` and gate R2/R3's advanced alternatives behind it — explicitly out of scope here.

Notes on the rules from requirements:
- **Heavy always first (R1)** so no heavy-exercise user can fall through to an aggressive method. Heavy -> 14:10 with a mandatory warning string against OMAD/20:4. This satisfies "never OMAD/20:4 for heavy exercisers" and "gentler/shorter fast to protect training/recovery."
- **Aggressive methods (20:4 / omad)** are never produced as the primary recommendation by the table above. Per the requirement they appear only for strong weight-loss + none/light exercise framed as "advanced." We honor this by surfacing them as highlighted **alternatives** (advanced, opt-in), not as the default pick: for R2 and R3 the `alternatives` list is exactly `["18:6","20:4","omad"]` (ordered gentle -> aggressive) with advanced framing in copy on `20:4` and `omad`, while the recommended default stays gentle 16:8. This keeps the default safe while still giving advanced weight-loss users the aggressive options the requirement calls for, selectable on the same screen.
- **Escalation hint:** R2's rationale explicitly mentions escalating toward 18:6 later.

`alternatives` ordering per branch (ordered gentle -> aggressive, always excluding the recommended `method` itself; the UI still renders the full `METHOD_ORDER` as selectable — `alternatives` only controls which methods get highlighted framing and in what order):
- R1 (heavy, -> 14:10): `["16:8"]` only — never advanced, enforcing "never OMAD/20:4 for heavy exercisers."
- R2 (weight_loss none, -> 16:8): `["18:6","20:4","omad"]`, with advanced framing on 20:4 and omad.
- R3 (weight_loss light, -> 16:8): `["18:6","20:4","omad"]`, advanced framing on 20:4 and omad.
- R4 (weight_loss moderate, -> 16:8): `["18:6"]` (no aggressive methods for moderate exercisers).
- R5 (metabolic none, -> 18:6): `["16:8"]` (no aggressive methods — FR11.3 restricts 20:4/omad to weight_loss + none/light only).
- R6 (metabolic light, -> 16:8): `["18:6"]`.
- R7 (metabolic moderate, -> 16:8): `["18:6"]`.
- R8 (focus none, -> 16:8): `["18:6","14:10"]`.
- R9 (focus light, -> 16:8): `["18:6","14:10"]`.
- R10 (focus moderate, -> 16:8): `["18:6","14:10"]`.
- R11 (maintain none, -> 14:10): `["16:8"]`.
- R12 (maintain light, -> 14:10): `["16:8"]`.
- R13 (maintain moderate, -> 16:8): `["14:10","18:6"]`.
- R14 (general none, -> 16:8): `["14:10","18:6"]`.
- R15 (general light, -> 16:8): `["14:10","18:6"]`.
- R16 (general moderate, -> 16:8): `["14:10","18:6"]`.

Invariant: `20:4` and `omad` appear in `alternatives` ONLY for weight_loss with none/light exercise (R2, R3), and NEVER for any other goal or for any moderate/heavy-exercise input. This is the mechanism that satisfies AC6 and FR11.3 at the data level, independent of UI, and is asserted directly in the unit tests (Section 6.3).

All rationale and warning strings are centralized references into `copy.ts` so wording stays consistent and emoji-free. Example strings (Indonesian, Gojek voice, no emoji):
- R1 warning: "Kamu latihan intens, jadi kita pilih yang lebih santai dulu. Hindari OMAD atau 20:4 ya, biar recovery kamu tetap oke."
- R2 rationale: "Buat turun berat badan tanpa olahraga, mulai dari 16:8 dulu biar nyaman. Kalau udah kebiasa, naik ke 18:6 pelan-pelan."

### 6.3 Testability
Pure function -> exhaustive unit tests: one case per decision row (16 rows, asserting both the returned `method` and the exact `alternatives` array) plus cross-cutting invariant assertions.

**Invariant space is the RAW input product, not the post-`exerciseState` buckets.** The invariant tests must iterate the full reachable `ProfilingAnswers` space, which is `5 goals x (exercises, intensity)` where the `(exercises, intensity)` pairs are exactly the five reachable combinations (the type permits `intensity` to be set independently of `exercises`, so the degenerate `exercises:true/intensity:null` pair is included deliberately):

```ts
const EXERCISE_INPUTS: Array<Pick<ProfilingAnswers, "exercises" | "intensity">> = [
  { exercises: false, intensity: null },        // -> exerciseState "none"
  { exercises: true,  intensity: null },         // -> exerciseState "none"  (degenerate, Finding 1)
  { exercises: true,  intensity: "light" },      // -> "light"
  { exercises: true,  intensity: "moderate" },   // -> "moderate"
  { exercises: true,  intensity: "heavy" },      // -> R1 guard (14:10 + warning)
];
// 5 goals x 5 exercise inputs = 25 raw inputs covering every reachable ProfilingAnswers.
```

The invariants are asserted across all 25 raw inputs:
- `method` is never `"custom"` and never `5:2` for any input.
- Every heavy-exercise input (`exercises:true, intensity:"heavy"`) returns `method === "14:10"` and `warning !== null`.
- Every non-heavy input returns `warning === null`.
- `20:4` and `omad` never appear in `method` for any input, and never appear in `alternatives` unless `goal === "weight_loss" && (intensity === null || intensity === "light")` while `exercises` is `false` OR `intensity` is `null`/`"light"` — i.e. only the `"none"`/`"light"` buckets of a weight_loss goal (R2/R3).
- `rationale` is a non-empty string for every input.
- `alternatives` never contains the recommended `method` itself and contains no duplicates.

**Degenerate-input equivalence (Finding 2).** One explicit test asserts that for every goal, `recommendMethod({ goal, exercises: true, intensity: null })` returns a result deep-equal to `recommendMethod({ goal, exercises: false, intensity: null })` — proving the `exercises:true/intensity:null` state collapses to the `"none"` bucket (Finding 1 mapping) and that the AC5/AC6 invariants hold over the raw input product, not just the four `exerciseState` output labels.

**Coverage note on the `never` default branch:** the `default` arm of the `switch (goal)` is a compile-time exhaustiveness guard (`const _exhaustive: never = answers.goal`) and is unreachable at runtime, so it cannot and should not be exercised by a unit test. The 25 enumerated raw inputs (5 goals x 5 `(exercises, intensity)` pairs) cover every reachable branch; the `never` branch is explicitly excluded from runtime branch-coverage expectations and must not be counted as an untested branch. If a coverage gate is configured, add an `/* v8 ignore next 2 */` (Vitest/V8) marker on the `default` body so the uncoverable line does not fail the gate. "Full-branch coverage" in this design means every *reachable* branch of the decision table, which the 16 row-cases plus 25 invariant inputs achieve.

Vitest, no DOM needed.

## 7. Timer & stage math (`src/lib/timer.ts`, `src/lib/stages.ts`)

### 7.1 Contract

```ts
export interface TimerState {
  startMs: number;
  targetHours: number;
  nowMs: number;      // injected (from tick), never read internally -> pure/testable
}
export interface TimerComputed {
  elapsedMs: number;        // max(0, nowMs - startMs)
  targetMs: number;         // targetHours * 3_600_000
  remainingMs: number;      // max(0, targetMs - elapsedMs)
  targetEndMs: number;      // startMs + targetMs
  progress: number;         // clamp(elapsedMs / targetMs, 0, 1)
  isComplete: boolean;      // elapsedMs >= targetMs
}
export function computeTimer(s: TimerState): TimerComputed;
export function formatHMS(ms: number): string; // "HH:MM:SS", hours uncapped (e.g. 26:03:11)
```

`computeTimer` is pure (now is injected). The UI tick (`useTimer` hook) calls `Date.now()` on an interval and feeds `nowMs`. Elapsed may exceed target (overfast) — `progress` clamps at 1 but `elapsedMs`/`formatHMS` keep counting past target so the ">24h Deep fast" stage is reachable. Start time can be edited into the past; a future start time is rejected at the input layer (StartTimeSheet validates `startMs <= Date.now()`).

### 7.2 Stage selection

```ts
export type StageKey = "pencernaan" | "bakar_lemak" | "ketosis" | "autophagy" | "deep_fast";
// IconKey is defined in src/types/index.ts (Section 4), NOT in components/, so this
// pure lib module imports it from "@/types" and stays framework-free.
export interface Stage { key: StageKey; label: string; description: string; iconKey: IconKey; minHours: number; maxHours: number | null; }
export function stageForElapsed(elapsedMs: number): Stage;
```

Boundaries by elapsed hours (half-open `[min, max)`):
- 0–4h -> Pencernaan
- 4–12h -> Mulai bakar lemak
- 12–16h -> Ketosis mulai
- 16–24h -> Autophagy
- >=24h -> Deep fast (maxHours null)

Note on the 24h boundary: requirements FR3.4/AC10 write ">24h Deep fast", which leaves exactly `t == 24.0h` unassigned. We intentionally resolve it with half-open intervals so Autophagy is `[16, 24)` and Deep fast is `>= 24` — i.e. `24:00:00` maps to Deep fast, slightly tighter than the literal ">24" but unambiguous. This is a deliberate design decision, not a drift from the requirement.

Each stage has emoji-free Indonesian copy and an io5 `iconKey`. Pure and unit-tested at each boundary (3.99h, 4h, 11.99h, 12h, 15.99h, 16h, 23.99h, 24h — the 24h case asserting Deep fast per the mapping above).

## 8. State: Zustand store (`src/store/useAppStore.ts`)

One store, persisted to `localStorage` under key `heula-store` via `persist` middleware with a `version` and `migrate` stub. Dexie-backed history is **not** in this store (durable + queryable separately); the store holds only the live/active fasting pointer plus profiling and settings.

```ts
interface AppState {
  // profiling
  onboarded: boolean;
  profiling: ProfilingAnswers | null;
  chosenMethod: MethodId;          // active plan id
  customFastingHours: number;      // used when chosenMethod === "custom", clamp 8..23

  // settings
  dailyGoalHours: number;          // default = active plan fasting hours
  theme: "system" | "light" | "dark";
  reminders: { endEnabled: boolean; startEnabled: boolean };

  // live fasting session (null when not fasting)
  activeFast: { startMs: number; targetHours: number; planId: MethodId; planLabel: string } | null;

  // actions
  completeOnboarding(answers: ProfilingAnswers, method: MethodId): void;
  setChosenMethod(id: MethodId): void;
  setCustomFastingHours(h: number): void;
  setDailyGoalHours(h: number): void;
  setTheme(t: AppState["theme"]): void;
  setReminders(r: Partial<AppState["reminders"]>): void;
  startFast(now?: number): void;        // builds activeFast from chosenMethod
  editStartTime(startMs: number): void; // validates <= now
  stopFast(now?: number): Promise<void>;// finalizes -> writes to Dexie, clears activeFast
  rerunProfiling(answers: ProfilingAnswers, method: MethodId): void;
  resetAll(): Promise<void>;            // clears Dexie + resets store to defaults
}
```

**Custom-plan target-hours & label snapshot (hard rule).** `startFast` must resolve the target hours from the *store*, not the catalog default, so a custom fast never silently uses `METHODS["custom"].fastingHours` (which is just the catalog placeholder `16`, Section 5). The resolution is pinned:

```ts
const targetHours =
  chosenMethod === "custom" ? customFastingHours : METHODS[chosenMethod].fastingHours;
const planLabel =
  chosenMethod === "custom" ? `Custom ${customFastingHours}j` : METHODS[chosenMethod].label;
```

`customFastingHours` is already clamped to the integer range `8..23` at the input layer (`DailyGoalPicker`/`PlanPicker`, Section 18), so `startFast` trusts it and does not re-clamp. The resulting `targetHours` and `planLabel` are snapshotted into `activeFast` at start and copied verbatim into the `FastingSessionRecord` at stop, so a later change to `customFastingHours` never retroactively rewrites a stored session. `dailyGoalHours` defaults to this same resolved `targetHours` when the plan is chosen (onboarding/`setChosenMethod`), keeping the daily goal and the active custom plan consistent.

`startFast`/`stopFast` are the only place the store touches Dexie: on stop (or auto-complete confirm) it constructs a `FastingSessionRecord` (reusing the snapshotted `activeFast.targetHours`/`activeFast.planLabel`) and calls `sessions.add`. Persist `partialize` excludes nothing problematic; `activeFast` is persisted so an in-progress fast survives reload (the whole point of a tracker). Hydration: `persist` with `skipHydration` is not used; instead a `useHasHydrated` guard (via `persist.onRehydrateStorage` / a `hydrated` flag) prevents rendering storage-dependent UI until rehydrated to avoid SSR mismatch (NFR4).

**Re-arming reminders on rehydrate.** Reminder scheduling is in-memory `setTimeout` (Section 11), so a page reload drops any pending timer even though `activeFast` is persisted. To keep best-effort delivery working across reloads, the rehydrate path (inside `persist.onRehydrateStorage`'s completion callback, which runs client-side after state is restored) checks: if `activeFast` exists and `reminders.endEnabled`, it re-arms `scheduleEndReminder(activeFast.startMs + activeFast.targetHours * 3_600_000, activeFast.planLabel)` for the *remaining* time; if `reminders.startEnabled` is moot for an already-started fast (start reminders only arm at `startFast`). This re-arm is still best-effort (it only fires while the tab stays open afterward) and is a no-op when notifications are unsupported/denied. If the computed target end is already in the past at rehydrate, no reminder is scheduled.

## 9. Persistence: Dexie (`src/db/db.ts`, `src/db/sessions.ts`)

```ts
export class HeulaDB extends Dexie {
  sessions!: Table<FastingSessionRecord, number>;
  constructor() {
    super("heula");
    this.version(1).stores({
      // ++id auto PK; index startMs & createdAt for ordering/grouping; completed for stats
      sessions: "++id, startMs, createdAt, completed, planId",
    });
  }
}
export const db = new HeulaDB();
```

`sessions.ts` exposes: `add(record)`, `remove(id)`, `all()` (ordered by `startMs` desc), `clear()` (for reset), and `last7Days(now)` returning records within the trailing 7 calendar days. History UI uses `useLiveQuery(() => db.sessions.orderBy("startMs").reverse().toArray())` so deletes/adds reflect live without manual refetch.

**Client-only instantiation (hard invariant, no hedge).** The design commits to the top-level singleton `export const db = new HeulaDB();` in `db.ts` with **no** `typeof window` guard and **no** factory. Correctness depends on a single enforced rule: **`src/db/*` is imported ONLY from `"use client"` modules.** This holds because every stateful consumer — the Zustand store's `stopFast`/`resetAll` and the history/stats features — is client-side. Server Components and server-rendered code must never import from `src/db`; if a server-side module needs a session type, it imports the interface from `src/types` only (types are erased and construct nothing). Dexie 4 tolerates `new Dexie(...)` without `indexedDB` present (it does not touch IndexedDB until a query runs), but we still forbid server imports so no server render ever constructs or queries the DB — satisfying NFR4 (clean SSR/hydration) and AC16 (no network, offline). Enforcement: this is documented as an explicit architectural invariant, and an ESLint `no-restricted-imports` note bans importing `src/db` (and `dexie`/`dexie-react-hooks`) from any non-`"use client"` file (the restriction is layered with the icon-import rule in Section 16's ESLint config).

## 10. Stats derivations (`src/lib/stats.ts`)

Pure functions over `FastingSessionRecord[]`:
- `totals(sessions)` -> `{ totalFasts, totalHours, averageHours }` (average over completed+stopped durations).
- `streaks(sessions, now)` -> `{ current, longest }`. A day counts toward a streak if it has at least one session (completed flag can tighten this; default: any session that day counts). Current streak counts consecutive days ending today or yesterday (grace of 1 day so an in-progress day doesn't break it).
- `weekly(sessions, now)` -> array of 7 `{ dayKey, label, totalHours }` for the last 7 days for the bar chart.

All date bucketing uses `date-fns` (`startOfDay`, `differenceInCalendarDays`, `format`). Unit-tested with fixed `now` inputs.

**Surfacing the profiling goal (FR5.3 / AC13).** The stats *derivations* above are pure functions over `FastingSessionRecord[]` and intentionally do not touch profiling. Surfacing the goal is a UI concern owned by `StatsOverview.tsx` (Section 3): it reads `profiling?.goal` directly from the Zustand store and renders it as a labelled card ("Tujuan kamu: ..."). The `Goal` enum (`"weight_loss"` etc.) is never shown raw; it is mapped to Indonesian display copy through a centralized `GOAL_LABELS: Record<Goal, string>` defined in `copy.ts` (keeping it under the single-file no-emoji/centralized-copy rule, Section 17):

```ts
// src/lib/copy.ts
export const GOAL_LABELS: Record<Goal, string> = {
  weight_loss: "Turun berat badan",
  metabolic:   "Kesehatan metabolik - gula darah",
  focus:       "Fokus & produktivitas",
  maintain:    "Maintain berat badan",
  general:     "Coba-coba - umum",
};
```

The `Record<Goal, string>` annotation makes a missing or stray goal a compile error, keeping the map exhaustive as `Goal` evolves. When `profiling` is null (should not happen post-onboarding, but is representable before first run), `StatsOverview` renders a neutral "Belum ada tujuan" placeholder rather than throwing. This closes AC13 unambiguously.

## 11. Notifications (`src/lib/notifications.ts`)

Best-effort, client-only. Functions: `isSupported()`, `getPermission()`, `requestPermission()`, `scheduleEndReminder(targetEndMs, planLabel)`, `scheduleStartReminder(...)`, `clearScheduled()`. Scheduling uses `setTimeout` for near-term fires while the tab is alive; it is explicitly best-effort (documented) and does not guarantee delivery when the tab is closed (no push backend — Out of Scope). Denied/unsupported paths return a typed status that `ReminderSettings` renders as friendly, emoji-free copy and disables the toggles gracefully. Notification body copy comes from `copy.ts` (e.g. "Waktunya buka puasa, kamu berhasil!" — no emoji).

Error handling for each notification operation:
- `requestPermission` rejects/returns "denied": recoverable; caller shows "Notifikasi lagi dimatiin. Kamu masih bisa pakai timer kok." and leaves toggles off. Not logged beyond a dev-only console.warn.
- `isSupported() === false` (SSR or old browser): recoverable; UI hides scheduling, shows a one-line note. No throw.
- `new Notification(...)` throws (some browsers require SW notifications): caught; fall back to a toast at fire time. Dev-only console.warn.

## 12. Serwist / Next config / manifest / icons

### 12.1 next.config.ts
Wrap with `@serwist/next`:
```ts
import withSerwistInit from "@serwist/next";
const withSerwist = withSerwistInit({ swSrc: "src/app/sw.ts", swDest: "public/sw.js", disable: process.env.NODE_ENV === "development" });
export default withSerwist({ /* reactStrictMode: true */ });
```
Service worker disabled in dev to avoid caching friction; enabled for `next build`/`start` so `npm run build` produces a working offline shell.

### 12.2 src/app/sw.ts
Imports `defaultCache` from `@serwist/next/worker` (confirmed exported in 9.5.x) and `Serwist` + the `PrecacheEntry`/`SerwistGlobalConfig` types from `serwist`. Declares the SW global so TS strict is happy:
```ts
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
```
**Event wiring is pinned to the single documented Serwist 9.x call** `serwist.addEventListeners()`, which wires `install`/`activate`/`fetch`/`message` in one call for `serwist@9.5.1`. Do **not** hand-wire `addEventListener("install"/"activate", ...)` and do **not** use an optional-chained `registerCapture?.()` — an optional chain against a non-existent method silently registers no handlers, producing a service worker that never serves the offline shell (AC16 fails). There is exactly one correct form here; use it verbatim. The `/offline` route (Section 3) is precached so the document fallback resolves offline. `tsconfig.json` includes `"webworker"` in `lib` so the SW types resolve under strict mode.

### 12.3 manifest (src/app/manifest.ts)
`MetadataRoute.Manifest`: `name: "Heula"`, `short_name: "Heula"`, `description` (Indonesian, no emoji), `start_url: "/"`, `display: "standalone"`, `background_color` and `theme_color` from the brand token, `icons` referencing the four PNGs with correct `sizes`/`type`/`purpose` (`any` and `maskable`). `apple-touch-icon` wired via `app/layout.tsx` metadata `appleWebApp`/`icons`.

### 12.4 Icons
Four placeholder PNGs in `public/icons`: `icon-192.png`, `icon-512.png`, `maskable-512.png` (safe padding), `apple-touch-icon.png` (180). A plain brand-colored rounded square with a white "H" — no emoji, no decorative art. Generated at build-prep time (implementer may script a tiny canvas/sharp generator or commit static placeholders); they must be valid PNGs so the manifest/install prompt works.

## 13. App shell, layout, theme, safe-area

- `AppShell` constrains content to `max-w-[480px] mx-auto min-h-dvh` and adds safe-area padding via Tailwind utilities mapped to `env(safe-area-inset-*)`. `viewport` metadata sets `viewport-fit=cover` and `themeColor` (light/dark variants).
- `BottomTabBar` is `fixed bottom-0`, full-width within the column, with `pb-[env(safe-area-inset-bottom)]`; four tabs with io5 icons; active tab uses a motion layout highlight and the brand accent color. Routes highlight by `usePathname()`.
- `ThemeProvider` reads `theme` from the store; for `"system"` it subscribes to `prefers-color-scheme`. It toggles a `dark` class on `<html>`. To avoid a flash and hydration mismatch, a tiny inline script in `layout.tsx` sets the initial `dark` class before React hydrates; the provider then takes over post-hydration. Tailwind v4 dark mode via the `dark` variant (configured in `globals.css` with `@custom-variant dark (&:where(.dark, .dark *))`).
- **Exact anti-flash inline script (contract).** The Zustand store persists under `localStorage` key `heula-store` as a JSON envelope `{ "state": { "theme": "system" | "light" | "dark", ... }, "version": n }` (Section 8), **not** a bare `theme` key. The inline script must parse that envelope, read `state.theme`, and resolve `"system"` against `prefers-color-scheme`. It is embedded via `<script dangerouslySetInnerHTML>` in `<head>` and is the exact string below (keep it in sync with the persist key / `state.theme` path; if the persist key ever changes in Section 8, this script changes with it):

  ```js
  // inline in layout.tsx <head>, runs before hydration
  try {
    var raw = localStorage.getItem('heula-store');
    var theme = raw ? (JSON.parse(raw).state || {}).theme : 'system';
    var dark = theme === 'dark' ||
      (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
  ```

  Error handling: the whole body is wrapped in `try/catch` so a malformed/absent `heula-store`, a `JSON.parse` throw, or a missing `matchMedia` never breaks first paint — on any failure the catch is empty and the document stays in its default (light) class, which the post-hydration `ThemeProvider` then corrects. The dependency is explicit: this script is coupled to the persist key `heula-store` and the `state.theme` path from Section 8; the two must move together. This satisfies NFR4/NFR5/AC18 (correct theme on first paint, no flash, persisted override honored across reloads).
- Tailwind v4 is configured CSS-first in `globals.css` (`@import "tailwindcss"; @theme { ... }`) with brand tokens (accent, surfaces, radii, shadows) and light/dark CSS variables. `postcss.config.mjs` uses `@tailwindcss/postcss`.

## 14. Onboarding flow & state transitions

Route `/onboarding` hosts `OnboardingFlow`, a client component with a local step index (`useState`) animated by motion (horizontal spring slide between stepped cards). Steps:

1. **Welcome** -> next.
2. **Goal** (`GoalStep`): five options (Segmented or stacked cards). Required; selecting enables next.
3. **Exercise** (`ExerciseStep`): "Apakah kamu olahraga?" ya/tidak. If "ya", reveal intensity (Ringan/Sedang/Berat) in the same step via motion height animation; next requires intensity when "ya". If "tidak", intensity set to null, next enabled.
4. **Recommendation** (`RecommendationStep`): calls `recommendMethod(answers)`; renders the recommended method highlighted ("Rekomendasi buat kamu") with rationale + any warning banner, followed by the full `METHOD_ORDER` list (plus the 5:2 info card) all selectable. Default selection = recommended method; user can tap any other. A "Mulai sekarang" button confirms.

On confirm: `completeOnboarding(answers, selectedMethod)` sets `onboarded = true`, stores `profiling` + `chosenMethod` (+ `dailyGoalHours` default to method fasting hours), then `router.replace("/")`. Guard: `app/page.tsx` (and other main routes) check `onboarded` after hydration; if false, `router.replace("/onboarding")`. Re-profiling from Profile pushes `/onboarding?rerun=1`; in rerun mode the flow calls `rerunProfiling` (keeps history, updates profiling/method) and returns to Profile.

Validation / edge cases: goal and exercise are required (next disabled until chosen); intensity required only when exercises true; direct navigation to a main route while not onboarded redirects to onboarding; direct navigation to `/onboarding` when already onboarded is allowed only in `?rerun=1` mode, otherwise redirect to Home.

## 15. Home timer screen behavior

`FastingTimer` reads `activeFast` from the store and the `useTimer` tick (1s interval, cleared on unmount; interval only runs when `activeFast !== null`). Renders `ProgressRing` (SVG circle with `strokeDasharray`/`strokeDashoffset` animated by motion from `progress`), big `formatHMS(elapsedMs)`, `targetEndMs` (formatted), `remainingMs`, and `StageIndicator(stageForElapsed(elapsedMs))`.

- **Start**: `startFast()` snapshots `chosenMethod` -> `activeFast`, resolving `targetHours`/`planLabel` per the custom-plan rule in Section 8 (`chosenMethod === "custom" ? customFastingHours : METHODS[chosenMethod].fastingHours`, and `` `Custom ${customFastingHours}j` `` for the label), then schedules reminders if enabled.
- **Stop (end early)**: `ConfirmDialog` -> `stopFast()` writes session (`completed = elapsed >= target`), clears `activeFast`, clears scheduled reminders, toast in friendly voice. At stop `endMs = now`, so `durationMs = endMs - startMs` equals the live `elapsedMs = now - startMs` at that instant; `completed` is computed once from that single value and stored. This is why the three restatements of `completed` (Section 4 `durationMs >= target`, here `elapsed >= target`, Section 18 "duration >= target computed once at write time") all agree — `durationMs === elapsedMs` at write time by construction.
- **Auto-complete**: when `isComplete` flips true, show a celebratory (no-emoji) prompt "Mantap, target kamu kelar! Mau lanjut atau sudahi?"; "Sudahi" calls `stopFast()`, "Lanjut" keeps counting (overfast toward Deep fast).
- **Edit start time**: `StartTimeSheet` lets the user pick an earlier time (date+time inputs); validates `<= now`; on save `editStartTime(startMs)` recomputes everything. Future time is blocked with inline copy.

Edge cases: elapsed > target keeps ticking; day-boundary crossings handled purely by ms math; reload restores `activeFast` from persisted store and recomputes from `startMs` (no drift). No `Date.now()` in SSR render — the first client render reads now inside `useEffect`/tick to avoid hydration mismatch; before hydration a stable placeholder renders.

## 16. React-icons subset (locked, io5 / Ionicons)

All icons import from `react-icons/io5`, routed through `src/components/ui/Icon.tsx` so there is exactly one import site to audit. **`IconKey` is defined in `src/types/index.ts` (Section 4), not here** — this keeps framework-free `lib` modules (`stages.ts`) decoupled from `components/`, which may not import a React icon component. `Icon.tsx` imports `IconKey` from `@/types` and exports a const `ICONS: Record<IconKey, IconType>` map (`IconKey` -> io5 component), asserted with `const ICONS = { ... } satisfies Record<IconKey, IconType>` so that every `IconKey` must have a mapping and no stray keys are allowed — a missing or extra icon is a compile error. `IconType` comes from `react-icons`. The map is the single runtime source of truth for which io5 component each key renders; the key set itself lives in `src/types`. Approved set (keyed by `IconKey`):

- Tabs: `IoHomeOutline`/`IoHome`, `IoTimeOutline`/`IoTime` (History), `IoStatsChartOutline`/`IoStatsChart` (Stats), `IoPersonOutline`/`IoPerson` (Profile).
- Timer controls: `IoPlay`, `IoStop`, `IoCreateOutline` (edit start time).
- Stages: Pencernaan `IoRestaurantOutline`, Mulai bakar lemak `IoFlameOutline`, Ketosis mulai `IoFlashOutline`, Autophagy `IoLeafOutline`, Deep fast `IoMoonOutline`.
- Settings/profile: `IoNotificationsOutline`, `IoMoonOutline`/`IoSunnyOutline` (theme), `IoListOutline` (plans), `IoFlagOutline` (goal), `IoTrashOutline` (reset/delete), `IoInformationCircleOutline` (about), `IoRefreshOutline` (re-profiling), `IoChevronForward` (nav rows), `IoCheckmarkCircle` (completed badge / selected).
- Onboarding: `IoArrowForward`, `IoCheckmarkCircle`, `IoBarbellOutline` (exercise), `IoSparklesOutline` is **excluded** to avoid decorative drift; use `IoFlagOutline` for recommendation highlight.

`react-icons/io5` is the only icon import path allowed. An ESLint `no-restricted-imports` rule bans `lucide-react` and any `react-icons/*` path other than `react-icons/io5` to enforce the single-subset rule mechanically (AC20).

## 17. Copy / voice / no-emoji enforcement (`src/lib/copy.ts`)

All user-facing strings live in `copy.ts` as a typed object, Indonesian, Gojek-casual, zero emoji (e.g. `start: "Yuk mulai puasa!"`, `onFire: "Mantap, kamu lagi on fire"`, `twelveHours: "Udah 12 jam nih, keren!"`). Centralizing copy makes the no-emoji audit a single-file concern plus a repo-wide guard. Enforcement:
- A Vitest test scans `copy.ts` (and optionally `src/**/*.tsx`) against an emoji Unicode-range regex and fails on any match (AC19).
- Code review + the same regex as a lint check keep component-inline strings clean.

## 18. Error handling & validation summary

- **Dexie add/remove/clear**: wrapped in try/catch in `sessions.ts`; failures (quota, blocked) are recoverable — caller shows a friendly toast ("Gagal nyimpen data, coba lagi ya") and the operation is a no-op on state. Dev-only `console.error`. A failed `stopFast` write does not clear `activeFast` so the fast isn't silently lost.
- **Zustand rehydrate failure**: `onRehydrateStorage` error -> fall back to defaults, set `hydrated = true`, show nothing blocking.
- **Custom hours input**: validated/clamped to 8..23 integer; invalid input disables confirm with inline copy.
- **Start time input**: must be a valid past timestamp; future or unparsable blocked with inline copy; recoverable.
- **Notifications**: see Section 11; all paths recoverable, never throw to UI.
- **Recommendation input**: types guarantee valid enums; the function is total over the type space via the `switch (goal)` whose `default` arm is a compile-time `const _exhaustive: never = answers.goal` guard (Section 6.1). No runtime input validation is needed — the invariant is owned entirely by the type layer. The `default` arm returns `GENTLE_16_8` only to satisfy the return type; it is unreachable at runtime (closed `Goal` union, every member cased) and is excluded from coverage (Section 6.3). There is no separate `satisfies` check and no runtime fallback branch beyond this single guard.
- **Invariant ownership**: "exactly one active plan" owned by the store (`chosenMethod` is a single field). "one in-progress fast" owned by the store (`activeFast` nullable singleton). "completed = duration >= target" computed once at write time in `stopFast` and stored, so History/Stats never recompute inconsistently. "no emoji / icons-only" owned by lint + tests (Sections 16–17).

## 19. Testing strategy

- **Unit (Vitest)**: `recommendation.ts` (all 16 rows + heavy/aggressive invariants), `timer.ts` (compute + formatHMS + boundaries), `stages.ts` (boundary selection), `stats.ts` (streaks/totals/weekly with fixed now), `methods.ts` (fasting/eating hour math), emoji-scan guard, icon-import guard (lint).
- **Integration (manual/dev)**: onboarding gating + redirect, timer start/stop writing to Dexie, history live update on delete, dark mode toggle persistence, offline shell after build. These are DOM/IndexedDB-dependent and documented in README as a manual smoke checklist; pure logic carries the automated coverage.
- The build gate (`npm run build`) under TS strict is the primary CI-style check (NFR1).

## 20. README

`README.md` (Indonesian) with: what Heula is, run instructions (`npm install`, `npm run dev`, `npm run build`, `npm start`, `npm test`), the full feature list, the no-emoji + react-icons constraints, the fact that data is on-device/offline, and a note that reminders are best-effort client-side.

## 21. Build/dev scripts (package.json)

`dev: next dev`, `build: next build`, `start: next start`, `lint: eslint .`, `test: vitest run`, `test:watch: vitest`. The lint script uses the ESLint CLI (`eslint .`) against `eslint.config.mjs` (flat config extending `eslint-config-next`, already a dependency) rather than `next lint`, because `next lint` is deprecated in the pinned Next 15.5.4 and prints "`next lint` is deprecated and will be removed in Next.js 16"; `eslint .` is future-proof and the warning is avoided entirely. Serwist disabled in dev, enabled on build so the installable/offline criteria are verifiable from `npm run build`.

## 22. Responses to design review findings

### 22.1 Second review pass (current — `design-review.json`, verdict CHANGES_REQUESTED: 0 HIGH, 2 MEDIUM, 2 NIT)

Both MEDIUMs share one root cause — the representable `exercises:true/intensity:null` state and the previously-unspecified `exerciseState` mapping — and are resolved by pinning that mapping and widening the invariant test space to the raw input product. Every finding is **addressed**.

- **Finding 1 (MEDIUM) — `exerciseState` body/mapping unspecified.** Addressed. Section 6.1 now specifies `exerciseState` verbatim with full JSDoc and an explicit total mapping, and states that `exercises === true && intensity === null` collapses to `"none"` (gentlest safe default). The function is now total over the raw input space, so every reachable `ProfilingAnswers` has a defined classification.

- **Finding 2 (MEDIUM) — invariant test space doesn't match reachable raw inputs.** Addressed. Section 6.3 now defines the invariant space as the **raw** `5 goals x 5 (exercises, intensity) pairs = 25 inputs` (including the degenerate `exercises:true/intensity:null`), lists the `EXERCISE_INPUTS` generator, restates the AC5/AC6 invariants over all 25, and adds an explicit degenerate-equivalence test asserting `{exercises:true,intensity:null}` is deep-equal to the `"none"` case for every goal. The coverage note was updated from "20 inputs (4 exercise states)" to "25 raw inputs".

- **Finding 3 (NIT) — "surface the profiling goal" missing from stats contract / no `Goal->label` map.** Addressed. Section 10 adds a "Surfacing the profiling goal" subsection: `StatsOverview` reads `profiling?.goal` from the store and renders it via a centralized `GOAL_LABELS: Record<Goal, string>` in `copy.ts` (shown verbatim), with a null-goal placeholder. Closes AC13/FR5.3.

- **Finding 4 (NIT) — custom-plan target-hours / `planLabel` snapshot unstated.** Addressed. Section 8 adds a "Custom-plan target-hours & label snapshot" rule pinning `startFast` to resolve `targetHours` as `chosenMethod === "custom" ? customFastingHours : METHODS[chosenMethod].fastingHours` and `planLabel` as `` `Custom ${customFastingHours}j` ``, snapshotted into `activeFast` and copied into the stored record. Section 15's Start bullet references the same rule. Removes the catalog-default (16) ambiguity.

### 22.2 First review pass (prior — resolved; retained for traceability)

Verdict then: CHANGES_REQUESTED — 2 HIGH, 4 MEDIUM, 5 NIT. All addressed in this document.

- **Finding 1 (HIGH) — "strong weight-loss" gate.** Addressed. Took **Option A** (no new input): Section 6.2 states that `goal === "weight_loss"` *is* the "strong weight-loss" condition (FR11.3), so 20:4/omad alternatives are offered to all weight_loss + none/light users as opt-in advanced picks. Requirements assumption **A5** keeps the docs aligned.
- **Finding 2 (HIGH) — theme anti-flash script vs persisted shape.** Addressed. Section 13 gives the exact inline script that parses `localStorage['heula-store']`, reads `state.theme`, resolves `"system"` via `matchMedia`, all in `try/catch`.
- **Finding 3 (MEDIUM) — Dexie client-only contract.** Addressed. Section 9 commits to a top-level singleton with the "`src/db/*` imported only from `use client`" invariant plus ESLint enforcement.
- **Finding 4 (MEDIUM) — Serwist event wiring.** Addressed. Section 12.2 pins the single `serwist.addEventListeners()` call and drops the optional-chained alternative.
- **Finding 5 (MEDIUM) — exhaustiveness mechanism.** Addressed. Section 6.1 uses one technique: `switch (goal)` closed by a `const _exhaustive: never` default; Section 6.3 excludes it from coverage.
- **Finding 6 (MEDIUM) — OR-choice selection rule.** Addressed. Section 6.2 opens with the "default to gentler, step up only when it materially serves the goal with no training to protect" principle; every OR-resolved row traces to it.
- **Finding 7 (NIT) — `next lint` deprecated.** Addressed. Section 21 uses `eslint .` on the flat config.
- **Finding 8 (NIT) — 24h stage boundary.** Addressed. Section 7.2 pins `>=24h -> Deep fast`.
- **Finding 9 (NIT) — `completed` restated three ways.** Addressed. Section 15 notes `durationMs === elapsedMs` at write time.
- **Finding 10 (NIT) — `IconKey` lib->components coupling.** Addressed. `IconKey` lives in `src/types`; `Icon.tsx` asserts `ICONS satisfies Record<IconKey, IconType>`.
- **Finding 11 (NIT) — reminders across reload/rehydrate.** Addressed. Section 8 re-arms `scheduleEndReminder` in `onRehydrateStorage`.
