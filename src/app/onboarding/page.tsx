"use client";

/**
 * /onboarding route (design Section 14).
 *
 * Hosts the OnboardingFlow. After hydration: if the user is already onboarded
 * and NOT in `?rerun=1` mode, redirect to Home. The hydrated guard prevents a
 * storage-dependent redirect from firing before the persisted store rehydrates
 * (no SSR mismatch). OnboardingFlow uses `useSearchParams`, so it is wrapped in
 * a Suspense boundary as Next 15 requires.
 */
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow";
import { useAppStore } from "@/store/useAppStore";

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner size={28} />
    </div>
  );
}

function OnboardingGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useAppStore((s) => s.hydrated);
  const onboarded = useAppStore((s) => s.onboarded);
  const isRerun = searchParams.get("rerun") === "1";

  useEffect(() => {
    if (hydrated && onboarded && !isRerun) {
      router.replace("/");
    }
  }, [hydrated, onboarded, isRerun, router]);

  if (!hydrated) return <Loading />;
  if (onboarded && !isRerun) return <Loading />;

  return <OnboardingFlow />;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OnboardingGate />
    </Suspense>
  );
}
