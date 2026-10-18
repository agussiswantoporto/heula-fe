"use client";

/**
 * PlanPicker (design Sections 5, 14; design-review Finding 2).
 *
 * Switches the active fasting plan. This is the ONLY place `custom` becomes
 * selectable — it owns the custom fasting-hours input, clamped to 8..23 — which
 * completes Finding 2 (onboarding never exposes custom because its hours are
 * undefined there; the hours live here). Selecting any non-custom method stores
 * it immediately; selecting custom reveals the hours field and applies the
 * clamped value. The 5:2 info card is informational only, never selectable.
 *
 * All copy is emoji-free from copy.ts; icons go through the Icon choke point.
 */
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { METHOD_ORDER, METHODS } from "@/lib/methods";
import { useAppStore } from "@/store/useAppStore";
import type { MethodId } from "@/types";

const CUSTOM_MIN = 8;
const CUSTOM_MAX = 23;

function clampCustom(value: number): number {
  return Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, Math.round(value)));
}

export function PlanPicker() {
  const chosenMethod = useAppStore((s) => s.chosenMethod);
  const customFastingHours = useAppStore((s) => s.customFastingHours);
  const setChosenMethod = useAppStore((s) => s.setChosenMethod);
  const setCustomFastingHours = useAppStore((s) => s.setCustomFastingHours);
  const { show } = useToast();

  // Draft value for the custom-hours field (seeded from the store).
  const [draft, setDraft] = useState<string>(String(customFastingHours));

  const parsed = Number(draft);
  const isValidCustom =
    draft.trim() !== "" &&
    Number.isFinite(parsed) &&
    Number.isInteger(parsed) &&
    parsed >= CUSTOM_MIN &&
    parsed <= CUSTOM_MAX;

  function handleSelect(id: MethodId) {
    setChosenMethod(id);
  }

  function handleApplyCustom() {
    if (!isValidCustom) return;
    const hours = clampCustom(parsed);
    setCustomFastingHours(hours);
    setChosenMethod("custom");
    setDraft(String(hours));
    show(copy.toasts.startTimeUpdated, "info");
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-content">
          {copy.settings.planTitle}
        </p>
        <p className="mt-0.5 text-xs text-content-muted">
          {copy.settings.planSubtitle}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {METHOD_ORDER.map((id) => {
          const method = METHODS[id];
          const active = id === chosenMethod;
          const label =
            id === "custom" && active
              ? `Custom ${customFastingHours}j`
              : method.label;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => handleSelect(id)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-control border px-4 py-3 text-left transition-colors",
                active ? "border-brand bg-surface-2" : "border-border bg-surface",
              )}
            >
              <span className="min-w-0">
                <span className="text-sm font-semibold text-content">
                  {label}
                </span>
                <span className="mt-0.5 block text-xs text-content-muted">
                  {method.tagline}
                </span>
              </span>
              {active && (
                <Icon name="check" size={22} className="shrink-0 text-brand" />
              )}
            </button>
          );
        })}
      </div>

      {/* Custom hours input: the only place custom hours are set (Finding 2). */}
      <Card className="bg-surface-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-content">
            {copy.settings.customTitle}
          </span>
          <span className="text-xs text-content-muted">
            {copy.settings.customHint}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={CUSTOM_MIN}
            max={CUSTOM_MAX}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-12 rounded-control border border-border bg-surface px-4 text-base text-content"
          />
        </label>
        {!isValidCustom && draft.trim() !== "" && (
          <p className="mt-2 text-sm text-danger">
            {copy.settings.customInvalid}
          </p>
        )}
        <Button
          variant="secondary"
          fullWidth
          className="mt-3"
          onClick={handleApplyCustom}
          disabled={!isValidCustom}
        >
          {copy.settings.customApply}
        </Button>
      </Card>

      {/* 5:2 info card — informational, not selectable (design Section 5). */}
      <Card className="bg-surface-2">
        <div className="flex items-start gap-2">
          <Icon
            name="about"
            size={18}
            className="mt-0.5 shrink-0 text-content-muted"
          />
          <div>
            <p className="text-sm font-semibold text-content">
              {copy.settings.fiveTwoTitle}
            </p>
            <p className="mt-0.5 text-xs text-content-muted">
              {copy.settings.fiveTwoDesc}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
