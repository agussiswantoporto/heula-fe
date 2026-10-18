"use client";

/**
 * Toast (design Section 3). Presentational pill rendered by ToastProvider.
 * No emoji; tone controls accent only.
 */
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export type ToastTone = "info" | "success" | "error";

const TONE_CLASS: Record<ToastTone, string> = {
  info: "bg-content text-bg",
  success: "bg-brand text-brand-fg",
  error: "bg-danger text-white",
};

export function Toast({
  message,
  tone = "info",
}: {
  message: string;
  tone?: ToastTone;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      role="status"
      className={cn(
        "pointer-events-auto w-full rounded-pill px-4 py-3 text-center text-sm font-medium shadow-card",
        TONE_CLASS[tone],
      )}
    >
      {message}
    </motion.div>
  );
}
