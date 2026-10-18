/**
 * Persisted Zustand app store (design Section 8).
 *
 * One store, persisted to `localStorage` under key `heula-store` via the
 * `persist` middleware with a `version` and a `migrate` stub. Dexie-backed
 * history is NOT in this store (durable + queryable separately); the store
 * holds only the live/active fasting pointer plus profiling and settings.
 *
 * Resolved design-review findings:
 * - Finding 2 (MEDIUM): `customFastingHours` has a defined default of 16, so
 *   onboarding can never land on an undefined custom target.
 * - NIT 3 & 4: `partialize` persists EXACTLY the eight whitelisted keys and
 *   never the transient `hydrated` flag; `hydrated` is set from the
 *   `onRehydrateStorage` completion callback.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { METHODS } from "@/lib/methods";
import { scheduleEndReminder } from "@/lib/notifications";
import type { AppState, PersistedState } from "@/store/types";
import type { FastingSessionRecord, MethodId, ProfilingAnswers } from "@/types";
import * as sessions from "@/db/sessions";

const MS_PER_HOUR = 3_600_000;

/** Non-action initial state (used for the store defaults and resetAll). */
const INITIAL_STATE = {
  onboarded: false,
  profiling: null as ProfilingAnswers | null,
  chosenMethod: "16:8" as MethodId,
  customFastingHours: 16, // Finding 2: defined default so custom is never undefined
  dailyGoalHours: METHODS["16:8"].fastingHours,
  theme: "system" as AppState["theme"],
  reminders: { endEnabled: true, startEnabled: false },
  activeFast: null as AppState["activeFast"],
  hydrated: false,
};

/** Resolve the active plan's target hours from the store (never catalog 16). */
function resolveTargetHours(
  chosenMethod: MethodId,
  customFastingHours: number,
): number {
  return chosenMethod === "custom"
    ? customFastingHours
    : METHODS[chosenMethod].fastingHours;
}

/** Resolve the active plan's snapshot label from the store. */
function resolvePlanLabel(
  chosenMethod: MethodId,
  customFastingHours: number,
): string {
  return chosenMethod === "custom"
    ? `Custom ${customFastingHours}j`
    : METHODS[chosenMethod].label;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      completeOnboarding(answers, method) {
        const { customFastingHours } = get();
        const targetHours = resolveTargetHours(method, customFastingHours);
        set({
          onboarded: true,
          profiling: answers,
          chosenMethod: method,
          dailyGoalHours: targetHours,
        });
      },

      setChosenMethod(id) {
        const { customFastingHours } = get();
        set({
          chosenMethod: id,
          dailyGoalHours: resolveTargetHours(id, customFastingHours),
        });
      },

      setCustomFastingHours(h) {
        // Store trusts the input-layer clamp (8..23, Section 18).
        const { chosenMethod } = get();
        set({
          customFastingHours: h,
          // Keep the daily goal consistent with the active custom plan.
          ...(chosenMethod === "custom" ? { dailyGoalHours: h } : {}),
        });
      },

      setDailyGoalHours(h) {
        set({ dailyGoalHours: h });
      },

      setTheme(t) {
        set({ theme: t });
      },

      setReminders(r) {
        set({ reminders: { ...get().reminders, ...r } });
      },

      startFast(now = Date.now()) {
        const { chosenMethod, customFastingHours } = get();
        const targetHours = resolveTargetHours(chosenMethod, customFastingHours);
        const planLabel = resolvePlanLabel(chosenMethod, customFastingHours);
        set({
          activeFast: {
            startMs: now,
            targetHours,
            planId: chosenMethod,
            planLabel,
          },
        });
      },

      editStartTime(startMs) {
        const { activeFast } = get();
        if (!activeFast) return;
        if (startMs > Date.now()) return; // start can never be in the future
        set({ activeFast: { ...activeFast, startMs } });
      },

      async stopFast(now = Date.now()) {
        const { activeFast } = get();
        if (!activeFast) return;

        const targetMs = activeFast.targetHours * MS_PER_HOUR;
        const durationMs = Math.max(0, now - activeFast.startMs);
        const completed = durationMs >= targetMs;

        const record: FastingSessionRecord = {
          planId: activeFast.planId,
          planLabel: activeFast.planLabel,
          targetHours: activeFast.targetHours,
          startMs: activeFast.startMs,
          endMs: now,
          durationMs,
          completed,
          createdAt: now,
        };

        await sessions.add(record);
        set({ activeFast: null });
      },

      rerunProfiling(answers, method) {
        const { customFastingHours } = get();
        set({
          profiling: answers,
          chosenMethod: method,
          dailyGoalHours: resolveTargetHours(method, customFastingHours),
        });
      },

      async resetAll() {
        await sessions.clear();
        set({ ...INITIAL_STATE, hydrated: true });
      },
    }),
    {
      name: "heula-store",
      version: 1,
      migrate: (persistedState) => {
        // No prior versions yet; pass the state through unchanged.
        return persistedState as PersistedState;
      },
      // NIT 3 & 4: persist EXACTLY these eight keys; never `hydrated`.
      partialize: (state): PersistedState => ({
        onboarded: state.onboarded,
        profiling: state.profiling,
        chosenMethod: state.chosenMethod,
        customFastingHours: state.customFastingHours,
        dailyGoalHours: state.dailyGoalHours,
        theme: state.theme,
        reminders: state.reminders,
        activeFast: state.activeFast,
      }),
      onRehydrateStorage: () => (state) => {
        // Completion callback runs client-side after state is restored.
        if (!state) return;
        state.hydrated = true;

        // Re-arm the best-effort end reminder for the remaining time, since
        // the setTimeout-based schedule is dropped on reload (Section 8/11).
        const { activeFast, reminders } = state;
        if (activeFast && reminders.endEnabled) {
          const targetEndMs =
            activeFast.startMs + activeFast.targetHours * MS_PER_HOUR;
          if (targetEndMs > Date.now()) {
            scheduleEndReminder(targetEndMs, activeFast.planLabel);
          }
        }
      },
    },
  ),
);
