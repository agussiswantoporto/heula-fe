"use client";

/**
 * Profile / Settings route (design Sections 8, 13, 14).
 *
 * Composes the settings surface: switch the active plan (PlanPicker owns custom
 * hours), set the daily goal, pick the theme, manage best-effort reminders,
 * read the about card, re-run profiling (navigates to /onboarding?rerun=1), and
 * reset all data behind a ConfirmDialog that clears IndexedDB + the persisted
 * Zustand state.
 *
 * All copy is emoji-free from copy.ts; icons go through the Icon choke point.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { useToast } from "@/components/ui/ToastProvider";
import { copy } from "@/lib/copy";
import { useAppStore } from "@/store/useAppStore";
import type { Theme } from "@/store/types";
import { PlanPicker } from "@/features/settings/PlanPicker";
import { DailyGoalPicker } from "@/features/settings/DailyGoalPicker";
import { ReminderSettings } from "@/features/settings/ReminderSettings";
import { AboutCard } from "@/features/settings/AboutCard";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: copy.settings.themeSystem },
  { value: "light", label: copy.settings.themeLight },
  { value: "dark", label: copy.settings.themeDark },
];

export default function ProfilePage() {
  const router = useRouter();
  const { show } = useToast();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const resetAll = useAppStore((s) => s.resetAll);

  const [resetOpen, setResetOpen] = useState(false);

  function handleReprofiling() {
    router.push("/onboarding?rerun=1");
  }

  async function handleReset() {
    setResetOpen(false);
    await resetAll();
    show(copy.toasts.deleted, "info");
    router.replace("/onboarding");
  }

  return (
    <div className="safe-top px-4 pt-8">
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-content">
        Profil
      </h1>

      <div className="mt-6 flex flex-col gap-4">
        <Card>
          <PlanPicker />
        </Card>

        <Card>
          <DailyGoalPicker />
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Icon name="theme_light" size={18} className="text-content-muted" />
            <p className="text-sm font-semibold text-content">
              {copy.settings.themeTitle}
            </p>
          </div>
          <div className="mt-3">
            <Segmented
              options={THEME_OPTIONS}
              value={theme}
              onChange={setTheme}
              aria-label={copy.settings.themeTitle}
            />
          </div>
        </Card>

        <Card>
          <ReminderSettings />
        </Card>

        <Card>
          <button
            type="button"
            onClick={handleReprofiling}
            className="flex w-full items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-content-muted">
              <Icon name="refresh" size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-content">
                {copy.settings.reprofiling}
              </span>
              <span className="mt-0.5 block text-xs text-content-muted">
                {copy.settings.reprofilingHint}
              </span>
            </span>
            <Icon name="chevron" size={20} className="shrink-0 text-content-muted" />
          </button>
        </Card>

        <Card>
          <AboutCard />
        </Card>

        <div>
          <Button
            variant="destructive"
            fullWidth
            onClick={() => setResetOpen(true)}
          >
            <Icon name="trash" size={20} />
            {copy.settings.reset}
          </Button>
          <p className="mt-2 text-center text-xs text-content-muted">
            {copy.settings.resetHint}
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title={copy.settings.resetConfirmTitle}
        description={copy.settings.resetConfirmBody}
        confirmLabel={copy.settings.resetConfirmYes}
        cancelLabel={copy.settings.resetConfirmNo}
        confirmVariant="destructive"
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}
