"use client";

/**
 * ReminderSettings (design Sections 8, 11).
 *
 * Toggles the best-effort end/start reminders, handles the Notifications
 * permission flow, surfaces the current permission status with friendly,
 * emoji-free copy, and (on iOS Safari that is not yet installed) nudges the
 * user to add Heula to the Home Screen.
 *
 * Delivery is SW-first with an in-page fallback (see src/lib/notifications.ts);
 * when notifications are enabled and the app is installed, reminders can fire
 * even when the app is closed (best-effort, depends on the OS keeping the SW
 * alive). The toggles never block: they always store the user's preference and
 * the status row explains what delivery to expect.
 *
 * Client-only + SSR-safe: permission and iOS-install detection are read after
 * mount so SSR and the first client render agree (no window/Notification read
 * during render, no hydration mismatch).
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import type { IconKey } from "@/types";
import { copy } from "@/lib/copy";
import {
  getPermission,
  isSupported,
  requestPermission,
  type PermissionStatus,
} from "@/lib/notifications";
import { shouldShowIOSInstallHint } from "@/lib/pwa";
import { useAppStore } from "@/store/useAppStore";

interface ToggleRowProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({ label, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-content">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-pill transition-colors disabled:opacity-40 ${
          checked ? "bg-brand" : "bg-surface-2"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-pill bg-surface shadow-card transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

/** Visual mapping for each permission state (icon + headline + optional hint). */
const STATUS_META: Record<
  PermissionStatus,
  { icon: IconKey; label: string; hint: string | null; tone: string }
> = {
  granted: {
    icon: "status_granted",
    label: copy.settings.reminderGranted,
    hint: null,
    tone: "text-brand",
  },
  default: {
    icon: "status_default",
    label: copy.settings.reminderDefault,
    hint: null,
    tone: "text-content-muted",
  },
  denied: {
    icon: "status_denied",
    label: copy.settings.reminderDenied,
    hint: copy.settings.reminderDeniedHint,
    tone: "text-content-muted",
  },
  unsupported: {
    icon: "status_unsupported",
    label: copy.settings.reminderUnsupportedHint,
    hint: null,
    tone: "text-content-muted",
  },
};

export function ReminderSettings() {
  const reminders = useAppStore((s) => s.reminders);
  const setReminders = useAppStore((s) => s.setReminders);

  // Resolve permission after mount only (avoids SSR/client mismatch).
  const [permission, setPermission] = useState<PermissionStatus>("default");

  // iOS install hint: starts false so SSR and first client render agree.
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  const [iosDismissed, setIosDismissed] = useState(false);

  useEffect(() => {
    setPermission(getPermission());
    setShowIOSInstall(shouldShowIOSInstallHint());
  }, []);

  const supported = isSupported();

  async function ensurePermission(): Promise<void> {
    if (!supported) return;
    if (permission === "default") {
      const result = await requestPermission();
      setPermission(result);
    }
  }

  async function handleToggle(
    key: "endEnabled" | "startEnabled",
    next: boolean,
  ) {
    // Enabling a reminder lazily requests permission; the toggle never blocks.
    if (next) await ensurePermission();
    setReminders({ [key]: next });
  }

  async function handleAllow(): Promise<void> {
    const result = await requestPermission();
    setPermission(result);
  }

  // Status row reflects the live permission (unsupported overrides anything).
  const status = STATUS_META[supported ? permission : "unsupported"];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Icon name="notifications" size={18} className="text-content-muted" />
        <p className="text-sm font-semibold text-content">
          {copy.settings.reminderTitle}
        </p>
      </div>
      <p className="text-xs text-content-muted">
        {copy.settings.reminderSubtitle}
      </p>

      <div className="mt-2">
        <ToggleRow
          label={copy.settings.reminderEnd}
          checked={reminders.endEnabled}
          disabled={!supported}
          onChange={(next) => handleToggle("endEnabled", next)}
        />
        <ToggleRow
          label={copy.settings.reminderStart}
          checked={reminders.startEnabled}
          disabled={!supported}
          onChange={(next) => handleToggle("startEnabled", next)}
        />
      </div>

      <div className="mt-2 flex flex-col gap-2 rounded-card bg-surface-2 p-3">
        <div className="flex items-center gap-2">
          <Icon name={status.icon} size={18} className={status.tone} />
          <span className="text-xs font-semibold text-content">
            {copy.settings.reminderStatusLabel}
          </span>
        </div>
        <p className="text-xs text-content-muted">{status.label}</p>
        {status.hint && (
          <p className="text-xs text-content-muted">{status.hint}</p>
        )}
        {supported && permission === "default" && (
          <button
            type="button"
            onClick={handleAllow}
            className="mt-1 self-start rounded-pill bg-brand px-4 py-2 text-xs font-semibold text-white"
          >
            {copy.settings.reminderEnable}
          </button>
        )}
      </div>

      {showIOSInstall && !iosDismissed && (
        <Card className="mt-3 flex flex-col gap-2 border-brand bg-surface-2">
          <div className="flex items-center gap-2">
            <Icon name="install" size={18} className="text-brand" />
            <p className="text-sm font-semibold text-content">
              {copy.settings.installIOSTitle}
            </p>
          </div>
          <p className="flex items-start gap-2 text-xs text-content-muted">
            <Icon name="share" size={16} className="mt-0.5 shrink-0" />
            <span>{copy.settings.installIOSBody}</span>
          </p>
          <button
            type="button"
            onClick={() => setIosDismissed(true)}
            className="mt-1 self-start text-xs font-semibold text-content-muted"
          >
            {copy.settings.installIOSDismiss}
          </button>
        </Card>
      )}
    </div>
  );
}
