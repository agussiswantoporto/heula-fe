"use client";

/**
 * ThemeProvider (design Section 13).
 *
 * Reads `theme` from the store and toggles the `dark` class on <html>. For the
 * "system" setting it subscribes to prefers-color-scheme so the UI follows the
 * OS live. The inline anti-flash script in layout.tsx sets the initial class
 * before hydration; this provider takes over afterwards. Hydration-safe: it
 * only mutates the DOM inside effects, never during render.
 */
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

function applyDark(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const resolve = () => {
      const isDark =
        theme === "dark" || (theme === "system" && media.matches);
      applyDark(isDark);
    };

    resolve();

    if (theme === "system") {
      media.addEventListener("change", resolve);
      return () => media.removeEventListener("change", resolve);
    }
  }, [theme]);

  return <>{children}</>;
}
