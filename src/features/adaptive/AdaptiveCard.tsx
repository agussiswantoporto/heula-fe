"use client";

/**
 * AdaptiveCard (FEAT-003).
 *
 * An ADDITIVE, dismissible "Saran buat kamu" card that surfaces the pure
 * `suggestAdaptive` output. It live-queries the full session history, reads the
 * chosen method + profiling from the store, and renders nothing when there is
 * no suggestion (or while the live query is still resolving, or after a local
 * dismiss).
 *
 * It does NOT replace the profiling+BMI recommendation and does NOT change the
 * method: for a level_up / ease_down suggestion it only offers a button that
 * navigates to /profile (the Plan Picker), where the user confirms the switch.
 *
 * `now` is read from the client clock here and injected into the pure core, so
 * the library itself stays deterministic (no Date.now() in src/lib).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/lib/copy";
import { suggestAdaptive } from "@/lib/adaptive";
import { db } from "@/db/db";
import { useAppStore } from "@/store/useAppStore";

export function AdaptiveCard() {
  const router = useRouter();
  const chosenMethod = useAppStore((s) => s.chosenMethod);
  const profiling = useAppStore((s) => s.profiling);
  const [dismissed, setDismissed] = useState(false);

  const history = useLiveQuery(() => db.sessions.toArray(), []);

  // Live query still resolving, or the user dismissed the card this session.
  if (history === undefined || dismissed) return null;

  const suggestion = suggestAdaptive({
    history,
    chosenMethod,
    profiling,
    now: Date.now(),
  });
  if (suggestion === null) return null;

  const showCta =
    suggestion.kind === "level_up" || suggestion.kind === "ease_down";

  return (
    <Card className="border-brand bg-surface-2">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand">
          <Icon name="suggestion" size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-content">
            {copy.adaptive.cardTitle}
          </p>
          <p className="mt-1 text-sm text-content-muted">{suggestion.message}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          variant="ghost"
          fullWidth
          onClick={() => setDismissed(true)}
        >
          {copy.adaptive.dismiss}
        </Button>
        {showCta && (
          <Button
            variant="primary"
            fullWidth
            onClick={() => router.push("/profile")}
          >
            {copy.adaptive.cta}
          </Button>
        )}
      </div>
    </Card>
  );
}
