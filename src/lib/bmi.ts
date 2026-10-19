/**
 * Pure BMI library (framework-free, no React imports).
 *
 * Computes Body Mass Index and classifies it using the ASIA-PACIFIC thresholds
 * (lower cut-offs than the WHO global scale, appropriate for the target users).
 * Pure and deterministic: no I/O, no Date.now(). Mirrors the import/style
 * conventions of src/lib/recommendation.ts.
 */

/** Inclusive bounds the UI validates against before accepting input. */
export const HEIGHT_MIN_CM = 100;
export const HEIGHT_MAX_CM = 250;
export const WEIGHT_MIN_KG = 30;
export const WEIGHT_MAX_KG = 300;

/** Asia-Pacific BMI buckets. */
export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

/**
 * Compute BMI = weightKg / (m*m), m = heightCm / 100.
 *
 * Returns NaN when either input is not finite or heightCm <= 0 (guards the
 * divide-by-zero / nonsensical-input cases). Callers treat NaN as "no value".
 */
export function computeBmi(heightCm: number, weightKg: number): number {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg)) return NaN;
  if (heightCm <= 0) return NaN;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/**
 * Classify a BMI using ASIA-PACIFIC thresholds:
 *   underweight  < 18.5
 *   normal       18.5 - 22.9
 *   overweight   23 - 24.9
 *   obese        >= 25
 *
 * A NaN input returns "normal" as the safe no-op default, so a transient
 * invalid value never pushes an aggressive/strict adjustment downstream.
 */
export function bmiCategory(bmi: number): BmiCategory {
  if (!Number.isFinite(bmi)) return "normal";
  if (bmi < 18.5) return "underweight";
  if (bmi < 23) return "normal";
  if (bmi < 25) return "overweight";
  return "obese";
}

/** True when cm is finite and within the inclusive height bounds. */
export function isValidHeight(cm: number): boolean {
  return Number.isFinite(cm) && cm >= HEIGHT_MIN_CM && cm <= HEIGHT_MAX_CM;
}

/** True when kg is finite and within the inclusive weight bounds. */
export function isValidWeight(kg: number): boolean {
  return Number.isFinite(kg) && kg >= WEIGHT_MIN_KG && kg <= WEIGHT_MAX_KG;
}

/** True when both height and weight pass their individual bound checks. */
export function isValidBmiInput(heightCm: number, weightKg: number): boolean {
  return isValidHeight(heightCm) && isValidWeight(weightKg);
}
