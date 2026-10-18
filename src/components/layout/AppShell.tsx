/**
 * AppShell (design Section 13).
 *
 * Centers content to a phone-width column on larger viewports, fills the
 * dynamic viewport height, and reserves bottom padding for the fixed tab bar
 * plus the safe-area inset. Pure presentational wrapper, no client state.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      {/* Bottom padding leaves room for the fixed BottomTabBar (64px) + safe area. */}
      <main className="safe-x flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
