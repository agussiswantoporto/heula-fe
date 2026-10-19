/**
 * Shared domain types for Heula.
 *
 * This is the type layer. It owns the stable identifiers (goals, intensities,
 * method ids, icon keys) that the framework-free `src/lib` modules depend on,
 * so those modules never have to import from `components/` and stay decoupled.
 */

export type Goal =
  | "weight_loss" // Turun berat badan
  | "metabolic" // Kesehatan metabolik - gula darah
  | "focus" // Fokus & produktivitas
  | "maintain" // Maintain berat badan
  | "general"; // Coba-coba - umum

export type Intensity = "light" | "moderate" | "heavy"; // Ringan / Sedang / Berat

/**
 * Stable icon identifiers owned by the type layer so framework-free lib modules
 * (e.g. stages.ts) can reference icons without importing from components/.
 * src/components/ui/Icon.tsx MUST provide an ICONS map whose keys are exactly
 * IconKey (enforced by `ICONS satisfies Record<IconKey, IconType>` there).
 */
export type IconKey =
  | "tab_home"
  | "tab_history"
  | "tab_stats"
  | "tab_profile"
  | "play"
  | "stop"
  | "edit"
  | "stage_pencernaan"
  | "stage_bakar_lemak"
  | "stage_ketosis"
  | "stage_autophagy"
  | "stage_deep_fast"
  | "notifications"
  | "theme_dark"
  | "theme_light"
  | "plans"
  | "goal"
  | "trash"
  | "about"
  | "refresh"
  | "chevron"
  | "check"
  | "arrow_forward"
  | "exercise"
  | "install"
  | "share"
  | "status_granted"
  | "status_denied"
  | "status_default"
  | "status_unsupported"
  | "bmi"
  | "weight"
  | "trend_up"
  | "trend_down"
  | "plus";

/** Timer-capable methods only. 5:2 is informational and NOT a MethodId. */
export type MethodId = "14:10" | "16:8" | "18:6" | "20:4" | "omad" | "custom";

export interface MethodMeta {
  id: MethodId;
  label: string; // e.g. "16:8"
  fastingHours: number; // custom resolved at runtime; catalog default for custom = 16
  eatingHours: number; // 24 - fastingHours
  tagline: string; // short Gojek-voice description, no emoji
  advanced: boolean; // 20:4 and omad are advanced
}

export interface ProfilingAnswers {
  goal: Goal;
  exercises: boolean;
  intensity: Intensity | null; // null when exercises === false
  heightCm: number; // mandatory, drives Asia-Pacific BMI (see src/lib/bmi.ts)
  weightKg: number; // mandatory, drives Asia-Pacific BMI (see src/lib/bmi.ts)
  lastMealHour?: number | null; // optional, 0-23, unused by recommendation
  wakeHour?: number | null; // optional, 0-23, unused by recommendation
}

export interface Recommendation {
  method: MethodId; // never "custom"; never 5:2
  rationale: string; // non-empty, Indonesian, no emoji
  warning: string | null; // present for heavy exercise + advanced framing
  alternatives: MethodId[]; // ordered gentle->aggressive, for display ordering
}

export interface FastingSessionRecord {
  id?: number; // Dexie auto-increment PK
  planId: MethodId;
  planLabel: string; // snapshot label (e.g. "16:8", "Custom 17j")
  targetHours: number; // target fasting hours at time of session
  startMs: number; // epoch ms
  endMs: number; // epoch ms (actual stop/complete)
  durationMs: number; // endMs - startMs
  completed: boolean; // true if durationMs >= target
  createdAt: number; // epoch ms, for ordering
  mood?: Mood; // optional post-session rating (older rows stay undefined)
  note?: string; // optional post-session note (older rows stay undefined)
}

/** How a fasting session felt, captured on stop (optional, unindexed). */
export type Mood = "energik" | "biasa" | "lemes" | "lapar";

/**
 * A single weight log entry. `id` is the Dexie auto-increment PK and
 * `recordedAt` is an epoch-ms timestamp used for trend ordering/charting.
 */
export interface WeightRecord {
  id?: number; // Dexie auto-increment PK
  weightKg: number;
  recordedAt: number; // epoch ms
  note?: string;
}
