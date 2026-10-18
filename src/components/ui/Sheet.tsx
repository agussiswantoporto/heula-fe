"use client";

/**
 * Sheet (design Section 3). iOS-style bottom sheet with a motion slide-up and a
 * tap-to-dismiss scrim. Used for pickers and confirmations.
 */
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
            className={cn(
              "safe-bottom relative z-10 w-full max-w-[480px] rounded-t-[1.5rem] bg-surface px-4 pt-3 shadow-sheet",
              className,
            )}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-pill bg-border" />
            {title && (
              <h2 className="mb-3 text-lg font-semibold text-content">{title}</h2>
            )}
            <div className="pb-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
