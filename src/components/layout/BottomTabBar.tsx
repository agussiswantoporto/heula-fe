"use client";

/**
 * BottomTabBar (design Section 13).
 *
 * Floating iOS-style tab bar: a detached, fully-rounded, translucent pill that
 * hovers above the home indicator and is centered within the phone-width
 * column. Four tabs (Home / History / Stats / Profile) with io5 icons and a
 * motion layoutId pill/blob highlight that springs behind the active tab;
 * active state is derived from usePathname().
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";
import type { IconKey } from "@/types";
import { cn } from "@/lib/cn";

interface Tab {
  href: string;
  label: string;
  icon: IconKey;
}

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: "tab_home" },
  { href: "/history", label: "Riwayat", icon: "tab_history" },
  { href: "/stats", label: "Statistik", icon: "tab_stats" },
  { href: "/profile", label: "Profil", icon: "tab_profile" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomTabBar() {
  const pathname = usePathname() ?? "/";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <nav
        aria-label="Navigasi utama"
        className="pointer-events-auto rounded-pill border border-hairline bg-[var(--frost-surface)] shadow-card backdrop-blur-xl backdrop-saturate-150"
      >
        <ul className="flex items-stretch p-1.5">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className="relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-pill py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--frost-surface)]"
                >
                  {active && (
                    <motion.span
                      layoutId="tab-highlight"
                      className="absolute inset-0 rounded-pill bg-brand-soft"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon
                    name={tab.icon}
                    size={22}
                    className={cn(
                      "relative z-10",
                      active ? "text-brand" : "text-content-muted",
                    )}
                  />
                  <span
                    className={cn(
                      "relative z-10 text-[11px] font-medium",
                      active ? "text-brand" : "text-content-muted",
                    )}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
