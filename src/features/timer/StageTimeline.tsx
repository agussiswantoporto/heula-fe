"use client";

/**
 * StageTimeline (FEAT-005, Feature 4).
 *
 * An expandable, educational timeline of the five fasting stages built from the
 * pure `timelineForElapsed(elapsedMs)` derivation. Each node shows the stage
 * icon (via the Icon choke point, reusing the existing stage_* keys), label,
 * the hour threshold it starts at, and — once expanded — the whatHappens +
 * tip copy. The current stage is highlighted; passed and upcoming nodes are
 * styled distinctly. Visuals are plain divs + motion (no charting lib), iOS
 * tokens for light + dark. The caller feeds in the same elapsedMs it already
 * computed for the timer, so this stays presentational.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/lib/copy";
import { timelineForElapsed, type TimelineEntry } from "@/lib/stages";

export interface StageTimelineProps {
  elapsedMs: number;
}

/** Format a stage's start threshold like "0j" / "16j". */
function thresholdLabel(hours: number): string {
  return `${hours}${copy.stats.hourUnit.charAt(0)}`;
}

export function StageTimeline({ elapsedMs }: StageTimelineProps) {
  const entries = timelineForElapsed(elapsedMs);

  return (
    <Card>
      <p className="mb-4 text-base font-semibold text-content">
        {copy.timer.timelineTitle}
      </p>
      <ol className="flex flex-col">
        {entries.map((entry, i) => (
          <TimelineNode
            key={entry.stage.key}
            entry={entry}
            isLast={i === entries.length - 1}
          />
        ))}
      </ol>
    </Card>
  );
}

interface TimelineNodeProps {
  entry: TimelineEntry;
  isLast: boolean;
}

function TimelineNode({ entry, isLast }: TimelineNodeProps) {
  const { stage, state } = entry;
  // Current stage opens by default so the live detail is visible at a glance.
  const [open, setOpen] = useState(state === "current");

  const isCurrent = state === "current";
  const isPassed = state === "passed";

  const dotClass = isCurrent
    ? "bg-brand text-brand-fg"
    : isPassed
      ? "bg-brand-soft text-brand"
      : "bg-surface-2 text-content-muted";

  const labelClass = isCurrent
    ? "text-content"
    : isPassed
      ? "text-content"
      : "text-content-muted";

  return (
    <li className="flex gap-3">
      {/* Rail: dot + connector line */}
      <div className="flex flex-col items-center">
        <motion.span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-pill ${dotClass}`}
          initial={false}
          animate={{ scale: isCurrent ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 24 }}
        >
          <Icon name={stage.iconKey} size={20} />
        </motion.span>
        {!isLast && (
          <span
            className={`w-0.5 flex-1 ${isPassed ? "bg-brand-soft" : "bg-border"}`}
            aria-hidden
          />
        )}
      </div>

      {/* Content */}
      <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 text-left active:opacity-80"
        >
          <span className={`text-sm font-semibold ${labelClass}`}>
            {stage.label}
          </span>
          {isCurrent && (
            <span className="rounded-pill bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
              {copy.timer.timelineNow}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-xs tabular-nums text-content-muted">
            {thresholdLabel(stage.minHours)}
            <motion.span
              initial={false}
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <Icon name="chevron" size={16} />
            </motion.span>
          </span>
        </button>

        <p className="mt-0.5 text-xs text-content-muted">{stage.description}</p>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-sm leading-relaxed text-content">
                  {stage.whatHappens}
                </p>
                <div className="flex items-start gap-2 rounded-control bg-surface-2 p-3">
                  <span className="shrink-0 text-brand">
                    <Icon name="suggestion" size={16} />
                  </span>
                  <p className="text-xs leading-relaxed text-content-muted">
                    {stage.tip}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}
