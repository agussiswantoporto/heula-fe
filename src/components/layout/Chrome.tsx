"use client";

/**
 * Chrome (app shell + floating tab bar) with route-aware visibility.
 *
 * The BottomTabBar and the shell's reserved bottom space only belong on the
 * four main tab routes (Home / History / Stats / Profile). Full-screen flows
 * like /onboarding and /offline render edge-to-edge with no tab bar, otherwise
 * the floating pill overlaps their content and controls.
 *
 * Thin client wrapper so the root layout stays a server component.
 */
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BottomTabBar } from "@/components/layout/BottomTabBar";

/** Routes that are part of the tabbed app surface (show the tab bar). */
const TAB_ROUTES = ["/", "/history", "/stats", "/profile"];

function isTabRoute(pathname: string): boolean {
  return TAB_ROUTES.some((href) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`),
  );
}

export function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const showTabBar = isTabRoute(pathname);

  return (
    <>
      <AppShell withTabBar={showTabBar}>{children}</AppShell>
      {showTabBar && <BottomTabBar />}
    </>
  );
}
