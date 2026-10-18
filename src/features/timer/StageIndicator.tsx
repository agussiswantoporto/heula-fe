"use client";

/**
 * StageIndicator (design Section 15).
 *
 * Shows the current fasting stage as a card: its io5 icon (via the Icon choke
 * point), Indonesian label, and emoji-free description. The stage is resolved
 * by the caller with `stageForElapsed(elapsedMs)`.
 */
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import type { Stage } from "@/lib/stages";

export interface StageIndicatorProps {
  stage: Stage;
}

export function StageIndicator({ stage }: StageIndicatorProps) {
  return (
    <Card className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-brand">
        <Icon name={stage.iconKey} size={24} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-content">{stage.label}</p>
        <p className="mt-0.5 text-sm text-content-muted">{stage.description}</p>
      </div>
    </Card>
  );
}
