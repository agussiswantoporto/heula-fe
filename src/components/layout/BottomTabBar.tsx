"use client";

/**
 * BottomTabBar (design Section 13).
 *
 * Floating iOS-style tab bar: a detached, fully-rounded, frosted pill that
 * hovers above the home indicator and is centered within the phone-width
 * column. The ACTIVE tab expands into a solid brand (emerald) pill showing its
 * icon AND label side by side in white; inactive tabs collapse to an icon only
 * in a muted tone. A motion `layoutId` highlight slides and reflows the active
 * pill between tabs with a spring. Active state is derived from usePathname().
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
        className="pointer-events-auto flex items-center gap-1 rounded-pill border border-border bg-[var(--frost-surface)] p-1.5 shadow-card backdrop-blur-xl backdrop-saturate-150"
      >
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              aria-label={tab.label}
              className={cn(
                "relative flex min-h-[44px] items-center justify-center gap-1.5 rounded-pill px-3 outline-none transition-[flex-grow] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--frost-surface)]",
                active ? "flex-[2]" : "flex-1",
              )}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-pill bg-brand"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              )}
              <Icon
                name={tab.icon}
                size={22}
                className={cn(
                  "relative z-10 shrink-0",
                  active ? "text-brand-fg" : "text-content-muted",
                )}
              />
              {active && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="relative z-10 overflow-hidden whitespace-nowrap text-[13px] font-semibold text-brand-fg"
                >
                  {tab.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
