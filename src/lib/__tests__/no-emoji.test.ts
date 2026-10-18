import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(here, "..", ".."); // -> src/

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css", ".mjs", ".js"]);

/**
 * Emoji / pictographic Unicode ranges. Covers the common emoji blocks plus
 * variation selectors and the zero-width joiner used to compose emoji. Plain
 * Indonesian/Latin text and standard punctuation are unaffected.
 */
const EMOJI_REGEX =
  /[\u{1F000}-\u{1FAFF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{200D}\u{20E3}]/u;

function collectFiles(dir: string, acc: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      collectFiles(full, acc);
    } else if (SCAN_EXTENSIONS.has(extname(entry))) {
      acc.push(full);
    }
  }
}

describe("no-emoji scan over src", () => {
  const files: string[] = [];
  collectFiles(SRC_ROOT, files);

  it("finds source files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`contains no emoji: ${file.slice(SRC_ROOT.length + 1)}`, () => {
      const content = readFileSync(file, "utf8");
      const match = content.match(EMOJI_REGEX);
      expect(match, match ? `emoji found: ${match[0]}` : "").toBeNull();
    });
  }
});
