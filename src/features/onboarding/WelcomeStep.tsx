"use client";

/**
 * WelcomeStep (design Section 14, step 1).
 *
 * Friendly, emoji-free intro that explains what Heula does and hands off to the
 * next step. All copy comes from copy.ts.
 */
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/lib/copy";

export interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-brand text-brand-fg">
          <Icon name="goal" size={38} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-content">
            {copy.onboarding.welcomeTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm text-content-muted">
            {copy.onboarding.welcomeBody}
          </p>
        </div>
      </div>
      <Button variant="primary" fullWidth onClick={onNext}>
        {copy.onboarding.welcomeCta}
      </Button>
    </div>
  );
}
