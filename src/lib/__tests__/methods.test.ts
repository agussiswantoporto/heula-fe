import { describe, expect, it } from "vitest";
import { METHOD_ORDER, METHODS } from "@/lib/methods";
import type { MethodId } from "@/types";

describe("METHODS catalog", () => {
  it("has the exact display order including custom", () => {
    expect(METHOD_ORDER).toEqual([
      "14:10",
      "16:8",
      "18:6",
      "20:4",
      "omad",
      "custom",
    ]);
  });

  it("does not include 5:2", () => {
    expect(METHOD_ORDER as string[]).not.toContain("5:2");
  });

  it("computes fasting hours per method", () => {
    expect(METHODS["14:10"].fastingHours).toBe(14);
    expect(METHODS["16:8"].fastingHours).toBe(16);
    expect(METHODS["18:6"].fastingHours).toBe(18);
    expect(METHODS["20:4"].fastingHours).toBe(20);
    expect(METHODS.omad.fastingHours).toBe(23);
    expect(METHODS.custom.fastingHours).toBe(16);
  });

  it("computes eating hours as 24 - fastingHours", () => {
    for (const id of METHOD_ORDER) {
      const m = METHODS[id as MethodId];
      expect(m.eatingHours).toBe(24 - m.fastingHours);
    }
  });

  it("marks 20:4 and omad as advanced, others not", () => {
    expect(METHODS["20:4"].advanced).toBe(true);
    expect(METHODS.omad.advanced).toBe(true);
    expect(METHODS["14:10"].advanced).toBe(false);
    expect(METHODS["16:8"].advanced).toBe(false);
    expect(METHODS["18:6"].advanced).toBe(false);
    expect(METHODS.custom.advanced).toBe(false);
  });

  it("gives every method a non-empty tagline", () => {
    for (const id of METHOD_ORDER) {
      expect(METHODS[id as MethodId].tagline.length).toBeGreaterThan(0);
    }
  });
});
