"use client";

/**
 * PlanPicker (design Sections 5, 14; design-review Finding 2).
 *
 * Switches the active fasting plan. Compact iOS "disclosure" layout to save
 * vertical space on Profile: by default it shows a single summary row with the
 * active method + its tagline and a chevron. Tapping it expands a tidy grid of
 * selectable method chips; the active method's tagline, the custom-hours input
 * (only when custom is chosen), and the 5:2 info line live inside the expanded
 * panel. Collapsed by default so the plan picker is just one row at rest.
 *
 * This is still the ONLY place `custom` becomes selectable — it owns the custom
 * fasting-hours input, clamped to 8..23 (design-review Finding 2). Selecting any
 * non-custom method stores it immediately; selecting custom reveals the hours
 * field and applies the clamped value. The 5:2 line is informational only.
 *
 * All copy is emoji-free from copy.ts; icons go through the Icon choke point.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
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

  const [expanded, setExpanded] = useState(false);
  // Draft value for the custom-hours field (seeded from the store).
  const [draft, setDraft] = useState<string>(String(customFastingHours));

  const parsed = Number(draft);
  const isValidCustom =
    draft.trim() !== "" &&
    Number.isFinite(parsed) &&
    Number.isInteger(parsed) &&
    parsed >= CUSTOM_MIN &&
    parsed <= CUSTOM_MAX;

  const activeMethod = METHODS[chosenMethod];
  const activeLabel =
    chosenMethod === "custom"
      ? `Custom ${customFastingHours}j`
      : activeMethod.label;

  function handleSelect(id: MethodId) {
    // Custom is confirmed via the hours input below, not by tapping the chip.
    if (id === "custom") return;
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

  const customActive = chosenMethod === "custom";

  return (
    <div className="flex flex-col">
      {/* Summary row — the only thing visible when collapsed. */}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="flex min-h-[44px] items-center justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <Icon name="plans" size={18} className="shrink-0 text-content-muted" />
            <span className="text-sm font-semibold text-content">
              {copy.settings.planTitle}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-content-muted">
            {activeLabel} - {activeMethod.tagline}
          </span>
        </span>
        <Icon
          name="chevron"
          size={20}
          className={cn(
            "shrink-0 text-content-muted transition-transform duration-200",
            expanded && "rotate-90",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pt-3">
              {/* Compact chip grid of methods. */}
              <div className="grid grid-cols-3 gap-2">
                {METHOD_ORDER.map((id) => {
                  const active = id === chosenMethod;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleSelect(id)}
                      className={cn(
                        "flex min-h-[44px] items-center justify-center rounded-control border px-2 text-sm font-semibold transition-colors",
                        active
                          ? "border-brand bg-brand text-brand-fg"
                          : "border-border bg-surface text-content",
                      )}
                    >
                      {METHODS[id].label}
                    </button>
                  );
                })}
              </div>

              {/* Tagline of the active method only. */}
              <p className="text-xs text-content-muted">
                {activeMethod.tagline}
              </p>

              {/* Custom hours — shown only when custom is the active method. */}
              {customActive && (
                <label className="flex flex-col gap-2 rounded-control bg-surface-2 p-3">
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
                  {!isValidCustom && draft.trim() !== "" && (
                    <p className="text-sm text-danger">
                      {copy.settings.customInvalid}
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={handleApplyCustom}
                    disabled={!isValidCustom}
                  >
                    {copy.settings.customApply}
                  </Button>
                </label>
              )}

              {/* If custom is NOT active, offer a lightweight way to set it. */}
              {!customActive && (
                <label className="flex items-center gap-2 rounded-control bg-surface-2 p-3">
                  <span className="shrink-0 text-sm font-semibold text-content">
                    {copy.settings.customTitle}
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={CUSTOM_MIN}
                    max={CUSTOM_MAX}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    aria-label={copy.settings.customTitle}
                    className="min-h-11 w-16 rounded-control border border-border bg-surface px-3 text-base text-content"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleApplyCustom}
                    disabled={!isValidCustom}
                  >
                    {copy.settings.customApply}
                  </Button>
                </label>
              )}

              {/* 5:2 info line — informational, not selectable. */}
              <div className="flex items-start gap-2">
                <Icon
                  name="about"
                  size={16}
                  className="mt-0.5 shrink-0 text-content-muted"
                />
                <p className="text-xs text-content-muted">
                  <span className="font-semibold text-content">
                    {copy.settings.fiveTwoTitle}
                  </span>{" "}
                  {copy.settings.fiveTwoDesc}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
