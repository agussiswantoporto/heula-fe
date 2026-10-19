import { describe, expect, it } from "vitest";
import { STAGE_LIST, stageForElapsed, timelineForElapsed } from "@/lib/stages";

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

describe("timelineForElapsed — passed/current/upcoming partition", () => {
  it("returns every stage in STAGE_LIST order", () => {
    const timeline = timelineForElapsed(12 * H);
    expect(timeline.map((e) => e.stage.key)).toEqual(
      STAGE_LIST.map((s) => s.key),
    );
  });

  it.each([
    [0, "pencernaan"],
    [4, "bakar_lemak"],
    [12, "ketosis"],
    [16, "autophagy"],
    [24, "deep_fast"],
  ] as const)(
    "at %ih marks exactly one 'current' = stageForElapsed (%s)",
    (hours, expectedKey) => {
      const elapsed = hours * H;
      const timeline = timelineForElapsed(elapsed);

      const current = timeline.filter((e) => e.state === "current");
      expect(current).toHaveLength(1);
      expect(current[0].stage.key).toBe(expectedKey);
      expect(current[0].stage.key).toBe(stageForElapsed(elapsed).key);
    },
  );

  it("partitions passed before current and upcoming after it", () => {
    const timeline = timelineForElapsed(16 * H); // autophagy current
    const currentIndex = timeline.findIndex((e) => e.state === "current");

    timeline.forEach((entry, i) => {
      if (i < currentIndex) expect(entry.state).toBe("passed");
      else if (i > currentIndex) expect(entry.state).toBe("upcoming");
    });
  });

  it("at 0h: nothing passed, rest upcoming", () => {
    const timeline = timelineForElapsed(0);
    expect(timeline.filter((e) => e.state === "passed")).toHaveLength(0);
    expect(timeline[0].state).toBe("current");
    expect(timeline.filter((e) => e.state === "upcoming")).toHaveLength(
      STAGE_LIST.length - 1,
    );
  });

  it("deep into overfast: all but the last are passed", () => {
    const timeline = timelineForElapsed(48 * H);
    expect(timeline[timeline.length - 1].state).toBe("current");
    expect(timeline.filter((e) => e.state === "passed")).toHaveLength(
      STAGE_LIST.length - 1,
    );
    expect(timeline.filter((e) => e.state === "upcoming")).toHaveLength(0);
  });

  it("exposes educational copy on every stage", () => {
    for (const entry of timelineForElapsed(0)) {
      expect(entry.stage.whatHappens.length).toBeGreaterThan(0);
      expect(entry.stage.tip.length).toBeGreaterThan(0);
    }
  });
});
