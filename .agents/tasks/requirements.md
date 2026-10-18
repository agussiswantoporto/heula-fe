# Heula — Requirements

## Summary

Heula is a mobile-first, installable PWA (Next.js 15 App Router + React 19 + TypeScript) that helps users plan and track intermittent fasting (IF). It runs fully offline with all data on-device (no backend, no auth, no network calls for data). The experience must feel like a native iOS app: clean rounded cards, soft shadows, large touch targets, SF-style typography, smooth spring animations, safe-area awareness, and a bottom tab bar. On first launch the user goes through a short conversational profiling flow (fasting goal, whether they exercise, exercise intensity) and receives a recommended IF method with a friendly rationale — the recommendation is a highlighted default, but the user can freely pick any method. All copy is Indonesian in a casual, friendly Gojek-style voice.

Two constraints are absolute and non-negotiable, called out explicitly because the user was emphatic:

- **NO EMOJI anywhere.** Not in UI, copy, button labels, toasts, notifications, placeholders, or sample/seed data. Zero emoji.
- **react-icons only.** All iconography uses the `react-icons` package. No `lucide-react` or any other icon set. One cohesive subset is used consistently.

## Functional Requirements

### FR1 — Onboarding profiling + recommendation (first launch only)
- FR1.1 On first launch (no `onboarded` flag stored), show onboarding before any other screen.
- FR1.2 Step 1: brief, friendly welcome/intro presented as iOS-style stepped cards.
- FR1.3 Step 2: profiling questions in the Gojek voice, no emoji:
  - (a) Tujuan ber-IF (required, single choice): Turun berat badan / Kesehatan metabolik - gula darah / Fokus & produktivitas / Maintain berat badan / Coba-coba - umum.
  - (b) Apakah kamu olahraga? (required): ya / tidak.
  - (c) Jika "ya": intensitas (required): Ringan (jalan/yoga santai) / Sedang (3-4x/minggu, kardio/angkat ringan) / Berat (atlet/latihan intens hampir tiap hari). If "tidak", intensity is skipped.
  - Optional light fields (jam makan terakhir / jam bangun) may be included only if they fit naturally without bloating the flow. Goal + exercise + intensity are the required inputs.
- FR1.4 Step 3: compute and SHOW a recommended IF method with a short friendly rationale explaining why it fits. The recommended method is visually highlighted ("Rekomendasi buat kamu").
- FR1.5 On the same recommendation screen, the full method list is selectable; the user may pick any other method. Recommendation is advisory only.
- FR1.6 After the user confirms their chosen method, land on the Home timer screen and persist `onboarded = true`.
- FR1.7 Profiling answers + chosen method persist locally. Re-profiling ("Perbarui rekomendasi") is available from Profile and re-runs the recommendation.

### FR2 — Fasting plans / presets
- FR2.1 Provide presets: 14:10, 16:8, 18:6, 20:4, OMAD (23:1), 5:2 (info only), Custom (user sets fasting hours).
- FR2.2 Exactly one active plan at a time; the active plan is switchable from Profile/Settings and from onboarding.
- FR2.3 Custom plan lets the user set the fasting-hours target (eating window derived as 24 - fasting hours).
- FR2.4 5:2 is informational (it is a weekly calorie pattern, not an hour-window timer) — it is shown with explanatory copy and is not selectable as a live hour-based timer target; see Out of Scope.

### FR3 — Live fasting timer (Home centerpiece)
- FR3.1 Big animated circular progress ring showing elapsed vs target.
- FR3.2 Live-ticking elapsed time as hh:mm:ss; show target end time and remaining time.
- FR3.3 Controls: Start, Stop (end early), and edit start time (e.g. "mulai jam 20:00 kemarin"); start time may be set in the past but not the future.
- FR3.4 Data-driven stage indicator by elapsed hours, each with a short friendly description and a react-icon (no emoji):
  - 0–4h Pencernaan
  - 4–12h Mulai bakar lemak
  - 12–16h Ketosis mulai
  - 16–24h Autophagy
  - >24h Deep fast
- FR3.5 On complete or stop, save the session to durable storage (start, end, target, duration, plan, completed flag).

### FR4 — History
- FR4.1 List past sessions grouped by day.
- FR4.2 Each entry shows duration, plan, and a completed badge.
- FR4.3 Delete a session (with confirmation).

### FR5 — Stats
- FR5.1 Show current streak, longest streak, total fasts, total hours, and average length.
- FR5.2 Lightweight custom SVG/div weekly bar chart (last 7 days) computed from stored sessions — no heavy charting library.
- FR5.3 Surface the profiling goal.

### FR6 — Settings / Profile
- FR6.1 Switch active plan.
- FR6.2 Set daily goal (target fasting hours).
- FR6.3 Toggle dark mode (system default + manual override).
- FR6.4 Manage reminders.
- FR6.5 Re-run profiling / recommendation ("Perbarui rekomendasi").
- FR6.6 Reset all data (with confirmation).
- FR6.7 About / version with friendly copy.

### FR7 — Reminders / notifications
- FR7.1 Use the Notifications API with a simple best-effort client-side scheduler.
- FR7.2 Fire "waktunya buka puasa" at the target end time; optional start reminder.
- FR7.3 Gracefully handle denied/unsupported permission states with friendly copy; never block the app.

### FR8 — Navigation
- FR8.1 iOS-style bottom tab bar: Home, History, Stats, Profile.
- FR8.2 react-icons tabs with smooth active states.

### FR9 — Empty / loading states
- FR9.1 All empty and loading states use the friendly Gojek voice, no emoji.

### FR10 — PWA / installability / offline
- FR10.1 Installable PWA with a web app manifest and service worker via Serwist.
- FR10.2 Offline app shell; the app works with no network for all data operations.
- FR10.3 App icons: 192 and 512 PNG, maskable, and apple-touch-icon — a plain colored rounded-square "H" logo, no emoji.

### FR11 — IF recommendation logic
- FR11.1 A pure, well-typed, documented function in `src/lib` (unit-testable, no side effects).
- FR11.2 Inputs: goal enum, exercises boolean, intensity enum|null. Output: recommended method + rationale + optional warning.
- FR11.3 Decision rules (full table lives in the design):
  - No exercise + weight-loss -> 16:8 (gentle), with an escalation hint toward 18:6 later.
  - Heavy exercise (any goal) -> gentler/shorter fast (16:8 or 14:10-style); explicitly warn against aggressive OMAD/20:4 for heavy trainers.
  - Moderate exercise + weight-loss -> 16:8.
  - Light/no exercise + metabolic health -> 16:8 or 18:6.
  - Maintain + any -> 14:10 or 16:8 (lenient).
  - Focus/productivity -> 16:8.
  - Coba-coba/umum / beginners -> always start gentle 16:8.
  - Aggressive methods (20:4, OMAD/23:1) only when goal is strong weight-loss AND exercise none/light, framed as "advanced"; never OMAD/20:4 for heavy exercisers.

## Non-Functional Requirements

- NFR1 — Build cleanly: `npm install` then `npm run build` with no TypeScript errors and no build-breaking lint under TypeScript strict mode.
- NFR2 — Mobile-first; a phone-width column centered on larger screens.
- NFR3 — Accessible: labels/aria, sufficient contrast, visible focus states, large touch targets.
- NFR4 — Correct SSR/hydration: ticking timer and client-only storage via client components and guards; no hydration mismatches.
- NFR5 — Dark mode: system default with manual toggle persisted.
- NFR6 — Safe-area aware (iOS notch/home indicator) via env(safe-area-inset-*).
- NFR7 — Pin dependencies to reasonable current releases; prefer well-known packages; avoid obscure/typosquat packages.
- NFR8 — Clean code: strong typing, small composable components, clear folders (src/app, src/components, src/features, src/lib, src/store, src/db), no dead code.
- NFR9 — README.md (Indonesian ok) with run instructions and feature list.
- NFR10 — Tech stack is fixed: Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS v4, Serwist (@serwist/next), Zustand (persist), Dexie (IndexedDB) + dexie-react-hooks, Framer Motion via `motion/react`, date-fns, react-icons.

## Acceptance Criteria

1. Fresh `npm install` followed by `npm run build` completes with zero TypeScript errors and no build-breaking lint.
2. On a first visit with empty storage, the onboarding flow appears before any main screen; it cannot be skipped past the required questions.
3. The profiling flow collects goal (one of five), exercises (yes/no), and intensity (only when exercises = yes, one of three); choosing "tidak" skips the intensity question.
4. The recommendation step displays exactly one highlighted "Rekomendasi buat kamu" method plus a rationale, while every other method in the list remains selectable.
5. The pure recommendation function returns the method, a non-empty rationale string, and a warning string that is present (non-null) for every heavy-exercise input and absent for gentle recommendations — verified by unit tests that enumerate the full raw input product (5 goals x the reachable (exercises, intensity) pairs, including the degenerate exercises=true/intensity=null state) and the 16 decision-table rows, not merely the post-classification exercise buckets.
6. Heavy exercise never yields OMAD (23:1) or 20:4; those two appear only for weight-loss + none/light exercise and carry an "advanced" framing.
7. After confirming a chosen method, the app persists `onboarded = true` and routes to Home; a reload no longer shows onboarding.
8. The Home timer, once started, shows a ticking hh:mm:ss elapsed value, a target end time, a remaining time, and a circular ring whose fill matches elapsed/target.
9. Editing the start time to a past time recalculates elapsed/remaining/target immediately; a future start time is rejected.
10. The stage indicator shows the correct stage for the current elapsed hours per the 0–4 / 4–12 / 12–16 / 16–24 / >24 boundaries, each with a react-icon and a description, no emoji.
11. Stopping or completing a fast writes a session record (start, end, target, duration, plan, completed) to IndexedDB via Dexie.
12. History lists stored sessions grouped by day with duration, plan, and completed badge; deleting a session (after confirm) removes it from IndexedDB and the list.
13. Stats shows current streak, longest streak, total fasts, total hours, and average length, plus a last-7-days bar chart rendered without any charting library, all derived from stored sessions; it also shows the profiling goal.
14. Profile can switch the active plan, set a daily goal, toggle dark mode, manage reminders, re-run profiling, and reset all data (reset requires explicit confirmation and clears both IndexedDB and persisted Zustand state).
15. Requesting notification permission and scheduling a reminder works when granted; when denied or unsupported, the app shows friendly copy and continues to function.
16. The app is installable (valid manifest + service worker) and the shell loads offline after first visit; no data feature performs a network request.
17. The bottom tab bar exposes Home, History, Stats, Profile with react-icons and an animated active state; it respects the bottom safe-area inset.
18. Dark mode follows the system by default and persists a manual override across reloads.
19. A full-text search of the source tree (including copy, labels, toasts, notifications, and seed/sample data) finds zero emoji characters.
20. A search of the source tree finds no import from `lucide-react` or any icon library other than `react-icons`.

## Out of Scope

- Any backend, server-side persistence, user accounts, authentication, or cloud sync.
- Any network call for application data (data is 100% on-device).
- 5:2 as a live hour-based countdown timer — 5:2 is a weekly calorie pattern and is presented as informational content only, not as a selectable timer target. (Assumption documented for design review.)
- Nutrition/calorie logging, meal tracking, weight logging, or health-platform integrations (Apple Health, Google Fit).
- Server-push notifications; reminders are best-effort client-side only and depend on the app/tab lifecycle.
- Multi-language support beyond Indonesian; the app ships Indonesian copy only.
- Native app store packaging; distribution is as an installable web PWA.

## Documented Assumptions

- A1 — "5:2 (info)" is informational only (see Out of Scope); it is not a countdown target. The recommendation function therefore never returns 5:2 as a timer method.
- A2 — "React icons subset" is standardized on `react-icons/io5` (Ionicons) for an iOS feel; the design locks the exact icon list.
- A3 — Optional profiling fields (jam makan terakhir / jam bangun) are treated as optional and omitted from the core flow unless they clearly add value without bloat; the recommendation does not depend on them.
- A4 — "Pin deps to reasonable current releases" is satisfied with Next 15.5.x, React 19.x, TS 5.9.x, Tailwind 4.x, Serwist 9.5.x; exact versions are fixed in the design.
- A5 — "Strong weight-loss" in FR11.3/AC6 is interpreted as `goal === "weight_loss"` itself; there is no separate goal-strength / aggressiveness input in the profiling flow (keeping the flow short per FR1.3). Accordingly the advanced methods 20:4 and OMAD/23:1 are offered as opt-in alternatives to all weight-loss users whose exercise is none/light, framed as "advanced" — never as the default pick, and never for any other goal or for moderate/heavy exercise. This resolves the review's goal-strength ambiguity with zero scope change; honoring a literal separate "strong" toggle is explicitly out of scope.
- A6 — `exercises` and `intensity` are stored as independent fields (`exercises: boolean`, `intensity: Intensity | null`), so the state `exercises === true && intensity === null` is representable even though the UI never produces it (FR1.3 only reveals intensity when exercises = yes). The recommendation function treats this degenerate state as "no exercise" (the gentlest safe classification), identical to `exercises === false`. The recommendation unit tests enumerate this state explicitly (see AC5) so the behavior is pinned, not incidental.
