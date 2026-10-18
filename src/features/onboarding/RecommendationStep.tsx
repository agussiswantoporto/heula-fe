"use client";

/**
 * RecommendationStep (design Section 14, step 4).
 *
 * Calls `recommendMethod(answers)`, highlights the recommended method with its
 * rationale (and a warning banner for heavy exercisers), then renders the
 * selectable method list. Default selection = the recommended method; any
 * listed method is tappable; "Mulai sekarang" confirms.
 *
 * RESOLVES design-review Finding 2 (onboarding half): the onboarding list is
 * `METHOD_ORDER.filter(id => id !== "custom")` — custom is NOT selectable here
 * (its hours are undefined at this point; custom is reachable only from the
 * PlanPicker, which owns the hours input). The 5:2 card is informational only.
 */
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { METHOD_ORDER, METHODS } from "@/lib/methods";
import { recommendMethod } from "@/lib/recommendation";
import type { MethodId, ProfilingAnswers } from "@/types";

export interface RecommendationStepProps {
  answers: ProfilingAnswers;
  onConfirm: (method: MethodId) => void;
  onBack: () => void;
}

/** Finding 2: custom is never selectable in onboarding. */
const ONBOARDING_METHODS: MethodId[] = METHOD_ORDER.filter(
  (id) => id !== "custom",
);

export function RecommendationStep({
  answers,
  onConfirm,
  onBack,
}: RecommendationStepProps) {
  const recommendation = useMemo(() => recommendMethod(answers), [answers]);
  const [selected, setSelected] = useState<MethodId>(recommendation.method);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-xl font-bold text-content">
        {copy.onboarding.recommendationTitle}
      </h1>
      <p className="mt-2 text-sm text-content-muted">
        {copy.onboarding.recommendationHint}
      </p>

      <div className="mt-5 flex flex-1 flex-col gap-4 overflow-y-auto">
        {/* Recommended highlight */}
        <Card className="border-brand bg-surface-2">
          <div className="flex items-center gap-2">
            <Icon name="goal" size={18} className="text-brand" />
            <span className="text-xs font-semibold uppercase tracking-wide text-brand">
              {copy.onboarding.recommendedBadge}
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-content">
            {METHODS[recommendation.method].label}
          </p>
          <p className="mt-1 text-sm text-content-muted">
            {recommendation.rationale}
          </p>
          {recommendation.warning && (
            <div className="mt-3 flex items-start gap-2 rounded-card bg-surface px-3 py-2">
              <Icon
                name="about"
                size={18}
                className="mt-0.5 shrink-0 text-danger"
              />
              <p className="text-sm text-content">{recommendation.warning}</p>
            </div>
          )}
        </Card>

        <div>
          <p className="mb-2 text-sm font-medium text-content">
            {copy.onboarding.methodListTitle}
          </p>
          <div className="flex flex-col gap-2">
            {ONBOARDING_METHODS.map((id) => {
              const method = METHODS[id];
              const active = id === selected;
              const recommended = id === recommendation.method;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(id)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-card border px-4 py-3 text-left transition-colors",
                    active
                      ? "border-brand bg-surface-2"
                      : "border-border bg-surface",
                  )}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-content">
                        {method.label}
                      </span>
                      {recommended && (
                        <span className="rounded-pill bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-fg">
                          {copy.onboarding.recommendedBadge}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-content-muted">
                      {method.tagline}
                    </span>
                  </span>
                  {active && (
                    <Icon
                      name="check"
                      size={22}
                      className="shrink-0 text-brand"
                    />
                  )}
                </button>
              );
            })}

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
                    {copy.onboarding.fiveTwoTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {copy.onboarding.fiveTwoDesc}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" onClick={onBack}>
          {copy.onboarding.back}
        </Button>
        <Button
          variant="primary"
          fullWidth
          onClick={() => onConfirm(selected)}
        >
          {copy.onboarding.confirm}
        </Button>
      </div>
    </div>
  );
}
