/**
 * Store-facing types for the persisted Zustand app store (design Section 8).
 *
 * `AppState` is the full store shape: profiling + settings + the live fasting
 * pointer, plus the action signatures. The `hydrated` flag is transient (set by
 * `persist.onRehydrateStorage`) and is NOT part of the persisted envelope — the
 * `partialize` whitelist in `useAppStore.ts` excludes it (design-review NIT 3).
 */
import type { MethodId, ProfilingAnswers } from "@/types";

/** Live/active fasting session snapshot (null when not fasting). */
export interface ActiveFast {
  startMs: number;
  targetHours: number;
  planId: MethodId;
  planLabel: string;
}

export type Theme = "system" | "light" | "dark";

export interface Reminders {
  endEnabled: boolean;
  startEnabled: boolean;
}

export interface AppState {
  // profiling
  onboarded: boolean;
  profiling: ProfilingAnswers | null;
  chosenMethod: MethodId; // active plan id
  customFastingHours: number; // used when chosenMethod === "custom", clamp 8..23

  // settings
  dailyGoalHours: number; // default = active plan fasting hours
  theme: Theme;
  reminders: Reminders;

  // live fasting session (null when not fasting)
  activeFast: ActiveFast | null;

  // transient (NOT persisted — excluded from the partialize whitelist)
  hydrated: boolean;

  // actions
  completeOnboarding(answers: ProfilingAnswers, method: MethodId): void;
  setChosenMethod(id: MethodId): void;
  setCustomFastingHours(h: number): void;
  setDailyGoalHours(h: number): void;
  setTheme(t: Theme): void;
  setReminders(r: Partial<Reminders>): void;
  startFast(now?: number): void; // builds activeFast from chosenMethod
  editStartTime(startMs: number): void; // validates <= now
  stopFast(now?: number): Promise<void>; // finalizes -> writes to Dexie, clears activeFast
  rerunProfiling(answers: ProfilingAnswers, method: MethodId): void;
  resetAll(): Promise<void>; // clears Dexie + resets store to defaults
}

/** The exact set of keys persisted by `partialize` (hydrated excluded). */
export type PersistedState = Pick<
  AppState,
  | "onboarded"
  | "profiling"
  | "chosenMethod"
  | "customFastingHours"
  | "dailyGoalHours"
  | "theme"
  | "reminders"
  | "activeFast"
>;
