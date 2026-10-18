import { describe, expect, it } from "vitest";
import { stageForElapsed } from "@/lib/stages";

const H = 3_600_000;

describe("stageForElapsed — half-open boundaries", () => {
  it("3.99h -> Pencernaan", () => {
    expect(stageForElapsed(3.99 * H).key).toBe("pencernaan");
  });

  it("4h -> Mulai bakar lemak", () => {
    expect(stageForElapsed(4 * H).key).toBe("bakar_lemak");
  });

  it("11.99h -> Mulai bakar lemak", () => {
    expect(stageForElapsed(11.99 * H).key).toBe("bakar_lemak");
  });

  it("12h -> Ketosis mulai", () => {
    expect(stageForElapsed(12 * H).key).toBe("ketosis");
  });

  it("15.99h -> Ketosis mulai", () => {
    expect(stageForElapsed(15.99 * H).key).toBe("ketosis");
  });

  it("16h -> Autophagy", () => {
    expect(stageForElapsed(16 * H).key).toBe("autophagy");
  });

  it("23.99h -> Autophagy", () => {
    expect(stageForElapsed(23.99 * H).key).toBe("autophagy");
  });

  it("24h -> Deep fast", () => {
    expect(stageForElapsed(24 * H).key).toBe("deep_fast");
  });

  it("start of fast -> Pencernaan", () => {
    expect(stageForElapsed(0).key).toBe("pencernaan");
  });

  it("deep into overfast -> Deep fast", () => {
    expect(stageForElapsed(48 * H).key).toBe("deep_fast");
  });
});
