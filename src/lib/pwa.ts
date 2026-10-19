/**
 * SSR-safe PWA / platform detection helpers (design Section 11).
 *
 * All functions are client-only and feature-detected: on the server (or any
 * environment without `window`/`navigator`) they return safe defaults and
 * never throw. These power the iOS "install to Home Screen" hint, which only
 * makes sense for iOS Safari that is not already running as an installed PWA.
 */

/** True when the app is running as an installed/standalone PWA. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;

  const mql = typeof window.matchMedia === "function"
    ? window.matchMedia("(display-mode: standalone)")
    : null;
  if (mql?.matches) return true;

  // Legacy iOS Safari exposes `navigator.standalone`.
  const legacy = (window.navigator as Navigator & { standalone?: boolean })
    .standalone;
  return legacy === true;
}

/** True on iOS Safari, including iPadOS reporting as desktop Safari. */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent ?? "";
  if (/iphone|ipad|ipod/i.test(ua)) return true;

  // iPadOS 13+ reports as "MacIntel" but has touch points.
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** True only when we should nudge an iOS user to install to Home Screen. */
export function shouldShowIOSInstallHint(): boolean {
  return isIOS() && !isStandalone();
}

/**
 * The non-standardized `beforeinstallprompt` event (Chromium Android/desktop).
 * Typed locally because it is not in the DOM lib. `prompt()` shows the native
 * install dialog; `userChoice` resolves once the user accepts or dismisses.
 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/**
 * SSR-safe feature detection for the Android/desktop install prompt. iOS Safari
 * never fires `beforeinstallprompt`, so this returns false there (and on the
 * server), which keeps the 'Pasang Heula' button and the iOS hint from ever
 * both nagging. The actual event still has to fire before anything shows; this
 * only gates whether we bother listening.
 */
export function canPromptInstall(): boolean {
  if (typeof window === "undefined") return false;
  return "onbeforeinstallprompt" in window && !isStandalone();
}
