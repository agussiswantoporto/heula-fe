"use client";

/**
 * BottomTabBar (design Section 13).
 *
 * iOS-style fixed bottom tab navigation within the phone-width column. Four
 * tabs (Home / History / Stats / Profile) with io5 icons, a motion layout
 * highlight behind the active tab, and active state derived from usePathname().
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
    <nav
      aria-label="Navigasi utama"
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] border-t border-border bg-surface/95 backdrop-blur"
    >
      <ul className="flex h-16 items-stretch">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="relative flex h-full flex-col items-center justify-center gap-1"
              >
                {active && (
                  <motion.span
                    layoutId="tab-highlight"
                    className="absolute inset-x-5 top-1 h-1 rounded-pill bg-brand"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon
                  name={tab.icon}
                  size={24}
                  className={cn(
                    active ? "text-brand" : "text-content-muted",
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] font-medium",
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
  );
}
