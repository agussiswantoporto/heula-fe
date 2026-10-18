"use client";

/**
 * ReminderSettings (design Sections 8, 11).
 *
 * Toggles the best-effort end/start reminders and handles the Notifications
 * permission flow. Denied/unsupported paths render friendly, emoji-free copy
 * and never block the UI: the toggles still store the user's preference, but a
 * note explains that delivery depends on permission. Permission is requested
 * lazily when the user enables a reminder while it is still "default".
 *
 * Client-only: reads the browser Notification permission after mount so SSR and
 * the first client render agree (no permission read during render).
 */
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/lib/copy";
import {
  getPermission,
  isSupported,
  requestPermission,
  type PermissionStatus,
} from "@/lib/notifications";
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

export function ReminderSettings() {
  const reminders = useAppStore((s) => s.reminders);
  const setReminders = useAppStore((s) => s.setReminders);

  // Resolve permission after mount only (avoids SSR/client mismatch).
  const [permission, setPermission] = useState<PermissionStatus>("default");

  useEffect(() => {
    setPermission(getPermission());
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

  const note =
    !supported
      ? copy.settings.reminderUnsupported
      : permission === "denied"
        ? copy.settings.reminderDenied
        : null;

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

      {note && <p className="mt-1 text-xs text-content-muted">{note}</p>}
    </div>
  );
}
