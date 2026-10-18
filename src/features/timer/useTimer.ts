"use client";

/**
 * useTimer (design Section 15).
 *
 * A 1s wall-clock tick that drives the live fasting UI. The interval only runs
 * while `active` is true (an active fast) and is cleared on unmount or when the
 * fast ends. `nowMs` starts null so the first SSR/client render produces a
 * stable placeholder; the real clock is read inside an effect to avoid a
 * hydration mismatch (no `Date.now()` during render).
 */
import { useEffect, useState } from "react";

/**
 * @param active whether the ticking interval should run (activeFast !== null).
 * @returns the latest wall-clock ms, or null before the first client tick.
 */
export function useTimer(active: boolean): number | null {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    if (!active) {
      setNowMs(null);
      return;
    }

    // Read the clock inside the effect (client-only) to avoid SSR drift.
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  return nowMs;
}
