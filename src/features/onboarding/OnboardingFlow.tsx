"use client";

/**
 * OnboardingFlow (design Section 14).
 *
 * Orchestrates the four stepped cards (Welcome -> Goal -> Exercise ->
 * Recommendation) with a local step index and a motion horizontal spring slide
 * between steps. Draft answers live here until confirm.
 *
 * Rerun mode (`?rerun=1`): on confirm it calls `rerunProfiling` (keeps history,
 * updates profiling + method) and returns to Profile instead of Home.
 */
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Stepper } from "@/components/ui/Stepper";
import { useAppStore } from "@/store/useAppStore";
import { WelcomeStep } from "@/features/onboarding/WelcomeStep";
import { GoalStep } from "@/features/onboarding/GoalStep";
import { ExerciseStep } from "@/features/onboarding/ExerciseStep";
import { RecommendationStep } from "@/features/onboarding/RecommendationStep";
import type { Goal, Intensity, MethodId, ProfilingAnswers } from "@/types";

const TOTAL_STEPS = 4;

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRerun = searchParams.get("rerun") === "1";

  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const rerunProfiling = useAppStore((s) => s.rerunProfiling);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 forward, -1 back
  const [goal, setGoal] = useState<Goal | null>(null);
  const [exercises, setExercises] = useState<boolean | null>(null);
  const [intensity, setIntensity] = useState<Intensity | null>(null);

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleExercisesChange(value: boolean) {
    setExercises(value);
    // Selecting "tidak" forces intensity to null (design Section 14 step 3).
    if (!value) setIntensity(null);
  }

  function handleConfirm(method: MethodId) {
    // goal/exercises are guaranteed set by the step gates before step 4.
    const answers: ProfilingAnswers = {
      goal: goal as Goal,
      exercises: exercises as boolean,
      intensity: exercises ? intensity : null,
    };

    if (isRerun) {
      rerunProfiling(answers, method);
      router.replace("/profile");
      return;
    }

    completeOnboarding(answers, method);
    router.replace("/");
  }

  const steps = [
    <WelcomeStep key="welcome" onNext={goNext} />,
    <GoalStep
      key="goal"
      value={goal}
      onChange={setGoal}
      onNext={goNext}
      onBack={goBack}
    />,
    <ExerciseStep
      key="exercise"
      exercises={exercises}
      intensity={intensity}
      onExercisesChange={handleExercisesChange}
      onIntensityChange={setIntensity}
      onNext={goNext}
      onBack={goBack}
    />,
    <RecommendationStep
      key="recommendation"
      answers={{
        goal: goal as Goal,
        exercises: exercises as boolean,
        intensity: exercises ? intensity : null,
      }}
      onConfirm={handleConfirm}
      onBack={goBack}
    />,
  ];

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-6 pt-6">
      <div className="pb-6">
        <Stepper total={TOTAL_STEPS} current={step} />
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ x: direction * 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -48, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="flex min-h-full w-full flex-col"
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
