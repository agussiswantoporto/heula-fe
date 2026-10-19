import { describe, expect, it } from "vitest";
import { formatShareStats } from "@/lib/share";

/**
 * Reuse the no-emoji scan's pictographic ranges to assert the drawn stat lines
 * never carry emoji (the Canvas text must stay emoji-free, design hard rule).
 */
const EMOJI_REGEX =
  /[\u{1F000}-\u{1FAFF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{200D}\u{20E3}]/u;

describe("formatShareStats — pure, emoji-free stat lines", () => {
  it("produces four ordered lines for populated stats", () => {
    const lines = formatShareStats({
      currentStreak: 5,
      totalHours: 128.6,
      totalFasts: 12,
      methodLabel: "16:8",
    });
    expect(lines).toEqual([
      "Streak sekarang: 5 hari",
      "Total jam puasa: 129 jam",
      "Total puasa: 12 kali",
      "Metode: 16:8",
    ]);
  });

  it("handles zero stats cleanly", () => {
    const lines = formatShareStats({
      currentStreak: 0,
      totalHours: 0,
      totalFasts: 0,
      methodLabel: "14:10",
    });
    expect(lines).toEqual([
      "Streak sekarang: 0 hari",
      "Total jam puasa: 0 jam",
      "Total puasa: 0 kali",
      "Metode: 14:10",
    ]);
  });

  it("rounds total hours to a whole number", () => {
    const [, hoursLine] = formatShareStats({
      currentStreak: 1,
      totalHours: 17.4,
      totalFasts: 1,
      methodLabel: "18:6",
    });
    expect(hoursLine).toBe("Total jam puasa: 17 jam");
  });

  it("never emits emoji in any line", () => {
    const lines = formatShareStats({
      currentStreak: 7,
      totalHours: 100,
      totalFasts: 9,
      methodLabel: "OMAD",
    });
    for (const line of lines) {
      expect(line).not.toMatch(EMOJI_REGEX);
    }
  });
});
