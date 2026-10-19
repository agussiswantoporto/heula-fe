import { describe, expect, it } from "vitest";
import {
  canPromptInstall,
  isIOS,
  isStandalone,
  shouldShowIOSInstallHint,
} from "@/lib/pwa";

/**
 * The vitest environment is "node" (no window/navigator), which exercises the
 * SSR-safe branch of every helper: all must return false and never throw.
 */
describe("pwa detection — SSR-safe defaults (no window/navigator)", () => {
  it("isStandalone returns false without window", () => {
    expect(isStandalone()).toBe(false);
  });

  it("isIOS returns false without navigator", () => {
    expect(isIOS()).toBe(false);
  });

  it("shouldShowIOSInstallHint returns false without window/navigator", () => {
    expect(shouldShowIOSInstallHint()).toBe(false);
  });

  it("canPromptInstall returns false without window", () => {
    expect(canPromptInstall()).toBe(false);
  });

  it("helpers do not throw in a server-like environment", () => {
    expect(() => {
      isStandalone();
      isIOS();
      shouldShowIOSInstallHint();
      canPromptInstall();
    }).not.toThrow();
  });
});
