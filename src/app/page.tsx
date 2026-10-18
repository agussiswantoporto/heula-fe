"use client";

/**
 * Home (design Section 15).
 *
 * Gates on the persisted store: after hydration, if the user has not completed
 * onboarding, redirect to `/onboarding`; otherwise render the live FastingTimer.
 * The `hydrated` guard ensures storage-dependent UI never renders before the
 * store rehydrates, avoiding an SSR/client mismatch.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { FastingTimer } from "@/features/timer/FastingTimer";
import { useAppStore } from "@/store/useAppStore";

export default function HomePage() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const onboarded = useAppStore((s) => s.onboarded);

  useEffect(() => {
    if (hydrated && !onboarded) {
      router.replace("/onboarding");
    }
  }, [hydrated, onboarded, router]);

  if (!hydrated || !onboarded) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  return <FastingTimer />;
}
