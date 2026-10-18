"use client";

/**
 * StartTimeSheet (design Section 15).
 *
 * Lets the user move the fast's start time earlier via a native datetime-local
 * input. Validation: the chosen time must be `<= now`; a future time is blocked
 * with inline, emoji-free copy and the save button stays disabled. On save it
 * calls `editStartTime(startMs)` which recomputes the live timer from the new
 * start, then shows a friendly toast.
 */
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy";

export interface StartTimeSheetProps {
  open: boolean;
  startMs: number;
  onClose: () => void;
  onSave: (startMs: number) => void;
}

/** Format an epoch ms into the local `YYYY-MM-DDTHH:mm` datetime-local value. */
function toLocalInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function StartTimeSheet({
  open,
  startMs,
  onClose,
  onSave,
}: StartTimeSheetProps) {
  const [value, setValue] = useState(() => toLocalInputValue(startMs));

  // Re-seed the field whenever the sheet (re)opens for the current start time.
  useEffect(() => {
    if (open) setValue(toLocalInputValue(startMs));
  }, [open, startMs]);

  const parsedMs = value ? new Date(value).getTime() : NaN;
  const isValid = Number.isFinite(parsedMs);
  const isFuture = isValid && parsedMs > Date.now();
  const canSave = isValid && !isFuture;

  function handleSave() {
    if (!canSave) return;
    onSave(parsedMs);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={copy.timer.editStartTitle}>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-content">
            {copy.timer.editStartLabel}
          </span>
          <input
            type="datetime-local"
            value={value}
            max={toLocalInputValue(Date.now())}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-12 rounded-control border border-border bg-surface-2 px-4 text-base text-content"
          />
        </label>

        {isFuture && (
          <p className="text-sm text-danger">{copy.timer.editStartFuture}</p>
        )}

        <Button variant="primary" fullWidth onClick={handleSave} disabled={!canSave}>
          {copy.timer.editStartSave}
        </Button>
      </div>
    </Sheet>
  );
}
