"use client";

/**
 * InstallPrompt (FEAT-006, Feature 3 — Android/desktop A2HS).
 *
 * Listens for the Chromium `beforeinstallprompt` event, prevents the default
 * mini-infobar, and stashes the event so a dismissible 'Pasang Heula' button
 * can trigger the native install dialog at a good moment. Because iOS Safari
 * never fires this event, the button is Android/desktop-only and never shows on
 * iOS — so it cannot nag alongside the existing iOS install hint, which lives
 * in ReminderSettings and targets the disjoint iOS platform.
 *
 * Client-only + SSR-safe: the listener is wired in an effect after mount, the
 * button starts hidden (SSR and first client render agree), and it only renders
 * once the event has actually fired AND the app is not already standalone.
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/lib/copy";
import { isStandalone, type BeforeInstallPromptEvent } from "@/lib/pwa";

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Already installed: nothing to prompt.
    if (isStandalone()) return;

    function onBeforeInstallPrompt(event: Event) {
      // Stop the browser's default mini-infobar; keep the event to fire later.
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    // Once installed, drop the stashed prompt so the button hides.
    function onAppInstalled() {
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstall(): Promise<void> {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    // Whether accepted or dismissed, the event can only be used once.
    setPromptEvent(null);
  }

  if (!promptEvent || dismissed) return null;

  return (
    <Card className="flex flex-col gap-2 border-brand bg-surface-2">
      <div className="flex items-center gap-2">
        <Icon name="install" size={18} className="text-brand" />
        <p className="text-sm font-semibold text-content">
          {copy.install.title}
        </p>
      </div>
      <p className="text-xs text-content-muted">{copy.install.body}</p>
      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-pill bg-brand px-4 py-2 text-xs font-semibold text-white"
        >
          {copy.install.button}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs font-semibold text-content-muted"
        >
          {copy.install.dismiss}
        </button>
      </div>
    </Card>
  );
}
