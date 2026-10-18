import { describe, expect, it } from "vitest";
import { computeTimer, formatHMS } from "@/lib/timer";

const H = 3_600_000;

describe("computeTimer", () => {
  it("computes elapsed/target/remaining/progress mid-fast", () => {
    const start = 1_000_000;
    const c = computeTimer({ startMs: start, targetHours: 16, nowMs: start + 8 * H });
    expect(c.elapsedMs).toBe(8 * H);
    expect(c.targetMs).toBe(16 * H);
    expect(c.remainingMs).toBe(8 * H);
    expect(c.targetEndMs).toBe(start + 16 * H);
    expect(c.progress).toBeCloseTo(0.5, 10);
    expect(c.isComplete).toBe(false);
  });

  it("clamps negative elapsed to zero when now < start", () => {
    const start = 2_000_000;
    const c = computeTimer({ startMs: start, targetHours: 16, nowMs: start - 5 * H });
    expect(c.elapsedMs).toBe(0);
    expect(c.remainingMs).toBe(16 * H);
    expect(c.progress).toBe(0);
    expect(c.isComplete).toBe(false);
  });

  it("handles overfast: elapsed > target, progress clamped at 1", () => {
    const start = 0;
    const c = computeTimer({ startMs: start, targetHours: 16, nowMs: 26 * H });
    expect(c.elapsedMs).toBe(26 * H);
    expect(c.remainingMs).toBe(0);
    expect(c.progress).toBe(1);
    expect(c.isComplete).toBe(true);
  });

  it("marks complete exactly at the target boundary", () => {
    const c = computeTimer({ startMs: 0, targetHours: 16, nowMs: 16 * H });
    expect(c.isComplete).toBe(true);
    expect(c.progress).toBe(1);
    expect(c.remainingMs).toBe(0);
  });
});

describe("formatHMS", () => {
  it("formats a sub-hour duration", () => {
    expect(formatHMS(0)).toBe("00:00:00");
    expect(formatHMS(61_000)).toBe("00:01:01");
  });

  it("formats hours over 24 without capping", () => {
    const ms = 26 * H + 3 * 60_000 + 11_000;
    expect(formatHMS(ms)).toBe("26:03:11");
  });

  it("clamps negative input to zero", () => {
    expect(formatHMS(-5000)).toBe("00:00:00");
  });
});
