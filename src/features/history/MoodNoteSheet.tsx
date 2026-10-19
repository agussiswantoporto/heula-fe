"use client";

/**
 * MoodNoteSheet (FEAT-004).
 *
 * A skippable, non-blocking capture sheet shown after a fast is saved and reused
 * for editing an existing History row. It writes the optional mood/note onto the
 * session via sessions.setMoodNote(sessionId, ...). Both fields are optional:
 * closing without a choice (Lewati or tapping the scrim) simply dismisses and
 * never blocks the stop/complete flow.
 *
 * Icons go through the Icon choke point; all copy is emoji-free from copy.ts.
 * Client-only (imports @/db via sessions helpers).
 */
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { copy, MOOD_LABELS } from "@/lib/copy";
import * as sessions from "@/db/sessions";
import type { IconKey, Mood } from "@/types";

export interface MoodNoteSheetProps {
  open: boolean;
  sessionId: number | null;
  initialMood?: Mood;
  initialNote?: string;
  onClose: () => void;
}

/** Mood options rendered as chips, ordered best -> hardest. */
const MOOD_OPTIONS: { value: Mood; icon: IconKey }[] = [
  { value: "energik", icon: "mood_energik" },
  { value: "biasa", icon: "mood_biasa" },
  { value: "lemes", icon: "mood_lemes" },
  { value: "lapar", icon: "mood_lapar" },
];

export function MoodNoteSheet({
  open,
  sessionId,
  initialMood,
  initialNote,
  onClose,
}: MoodNoteSheetProps) {
  const [mood, setMood] = useState<Mood | undefined>(initialMood);
  const [note, setNote] = useState(initialNote ?? "");

  // Re-seed the fields whenever the sheet (re)opens for a given session.
  useEffect(() => {
    if (open) {
      setMood(initialMood);
      setNote(initialNote ?? "");
    }
  }, [open, initialMood, initialNote]);

  async function handleSave() {
    if (sessionId !== null) {
      const trimmed = note.trim();
      await sessions.setMoodNote(sessionId, {
        mood,
        note: trimmed === "" ? undefined : trimmed,
      });
    }
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={copy.mood.sheetTitle}>
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-content-muted">
          {copy.mood.sheetIntro}
        </p>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-content">
            {copy.mood.moodLabel}
          </span>
          <div
            role="radiogroup"
            aria-label={copy.mood.moodLabel}
            className="grid grid-cols-2 gap-2"
          >
            {MOOD_OPTIONS.map((opt) => {
              const active = mood === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMood(active ? undefined : opt.value)}
                  className={cn(
                    "flex min-h-12 items-center justify-center gap-2 rounded-control border px-3 text-sm font-medium active:opacity-80",
                    active
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border bg-surface-2 text-content-muted",
                  )}
                >
                  <Icon name={opt.icon} size={20} />
                  {MOOD_LABELS[opt.value]}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-content">
            {copy.mood.noteLabel}
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={copy.mood.notePlaceholder}
            rows={3}
            className="resize-none rounded-control border border-border bg-surface-2 px-4 py-3 text-base text-content"
          />
        </label>

        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={onClose}>
            {copy.mood.skip}
          </Button>
          <Button variant="primary" fullWidth onClick={handleSave}>
            {copy.mood.save}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
