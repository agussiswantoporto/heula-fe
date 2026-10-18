/**
 * AppShell (design Section 13).
 *
 * Centers content to a phone-width column on larger viewports and fills the
 * dynamic viewport height. On tabbed routes it reserves bottom space for the
 * FLOATING BottomTabBar pill: the pill height (~56px) plus the pill's bottom
 * gap (0.75rem) plus a little breathing room, all on top of the safe-area
 * inset, so bottom-scrolled content and Home's `mt-auto pb-4` Start/Stop
 * controls are never hidden behind the detached pill. On full-screen routes
 * (onboarding, offline) the tab bar is hidden, so no bottom space is reserved
 * and content can use the full height. Pure presentational wrapper.
 */
import { cn } from "@/lib/cn";

export function AppShell({
  children,
  withTabBar = true,
}: {
  children: React.ReactNode;
  withTabBar?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <main
        className={cn(
          "safe-x flex-1",
          withTabBar && "pb-[calc(56px+1.5rem+env(safe-area-inset-bottom))]",
        )}
      >
        {children}
      </main>
    </div>
  );
}
