import { describe, expect, it } from "vitest";
import {
  bmiCategory,
  computeBmi,
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
  isValidBmiInput,
  isValidHeight,
  isValidWeight,
  WEIGHT_MAX_KG,
  WEIGHT_MIN_KG,
} from "@/lib/bmi";

describe("computeBmi", () => {
  it("computes a correct BMI for 170cm/65kg (~22.49)", () => {
    expect(computeBmi(170, 65)).toBeCloseTo(22.49, 2);
  });

  it("computes a correct BMI for 180cm/81kg (25)", () => {
    expect(computeBmi(180, 81)).toBeCloseTo(25, 5);
  });

  it("returns NaN for zero height (divide-by-zero guard)", () => {
    expect(computeBmi(0, 65)).toBeNaN();
  });

  it("returns NaN for negative height", () => {
    expect(computeBmi(-170, 65)).toBeNaN();
  });

  it("returns NaN for non-finite inputs", () => {
    expect(computeBmi(NaN, 65)).toBeNaN();
    expect(computeBmi(170, NaN)).toBeNaN();
    expect(computeBmi(Infinity, 65)).toBeNaN();
    expect(computeBmi(170, Infinity)).toBeNaN();
  });
});

describe("bmiCategory — Asia-Pacific boundaries", () => {
  it("18.49 -> underweight", () => {
    expect(bmiCategory(18.49)).toBe("underweight");
  });

  it("18.5 -> normal", () => {
    expect(bmiCategory(18.5)).toBe("normal");
  });

  it("22.9 -> normal", () => {
    expect(bmiCategory(22.9)).toBe("normal");
  });

  it("23.0 -> overweight", () => {
    expect(bmiCategory(23.0)).toBe("overweight");
  });

  it("24.9 -> overweight", () => {
    expect(bmiCategory(24.9)).toBe("overweight");
  });

  it("25.0 -> obese", () => {
    expect(bmiCategory(25.0)).toBe("obese");
  });

  it("NaN -> normal (safe no-op default)", () => {
    expect(bmiCategory(NaN)).toBe("normal");
  });
});

describe("validators — inclusive bounds", () => {
  it("accepts height at the inclusive bounds", () => {
    expect(isValidHeight(HEIGHT_MIN_CM)).toBe(true); // 100
    expect(isValidHeight(HEIGHT_MAX_CM)).toBe(true); // 250
  });

  it("rejects height just outside the bounds", () => {
    expect(isValidHeight(HEIGHT_MIN_CM - 1)).toBe(false); // 99
    expect(isValidHeight(HEIGHT_MAX_CM + 1)).toBe(false); // 251
    expect(isValidHeight(NaN)).toBe(false);
  });

  it("accepts weight at the inclusive bounds", () => {
    expect(isValidWeight(WEIGHT_MIN_KG)).toBe(true); // 30
    expect(isValidWeight(WEIGHT_MAX_KG)).toBe(true); // 300
  });

  it("rejects weight just outside the bounds", () => {
    expect(isValidWeight(WEIGHT_MIN_KG - 1)).toBe(false); // 29
    expect(isValidWeight(WEIGHT_MAX_KG + 1)).toBe(false); // 301
    expect(isValidWeight(NaN)).toBe(false);
  });

  it("isValidBmiInput requires both height and weight valid", () => {
    expect(isValidBmiInput(170, 65)).toBe(true);
    expect(isValidBmiInput(99, 65)).toBe(false);
    expect(isValidBmiInput(170, 29)).toBe(false);
    expect(isValidBmiInput(99, 301)).toBe(false);
  });
});
