"use client";

/**
 * WeightTrendChart (FEAT-002).
 *
 * Presentational trend chart built from an inline SVG polyline + plain divs and
 * a motion entrance animation — NO charting library (mirrors the div-only
 * approach of WeeklyBarChart.tsx). Points are scaled against the min/max of the
 * supplied weight values so the trend fills the plot area; a flat series falls
 * back to a mid-line. The parent passes the computed points so this component
 * stays pure/presentational.
 */
import { motion } from "motion/react";
import { copy } from "@/lib/copy";

export interface WeightTrendChartProps {
  points: { recordedAt: number; weightKg: number }[];
}

const VIEW_W = 300;
const VIEW_H = 120;
const PAD = 10;

export function WeightTrendChart({ points }: WeightTrendChartProps) {
  const weights = points.map((p) => p.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min;

  // X positions evenly spaced; a single point sits centered.
  const stepX =
    points.length > 1 ? (VIEW_W - PAD * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = points.length > 1 ? PAD + i * stepX : VIEW_W / 2;
    // Flat series -> mid-line; otherwise invert so heavier weights sit higher.
    const ratio = span === 0 ? 0.5 : (p.weightKg - min) / span;
    const y = VIEW_H - PAD - ratio * (VIEW_H - PAD * 2);
    return { x, y };
  });

  const linePath = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <div>
      <p className="mb-4 text-base font-semibold text-content">
        {copy.weight.trendTitle}
      </p>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-32 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={copy.weight.trendTitle}
      >
        {coords.length > 1 && (
          <motion.polyline
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={linePath}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {coords.map((c, i) => (
          <motion.circle
            key={points[i].recordedAt}
            cx={c.x}
            cy={c.y}
            r={3}
            fill="var(--color-brand)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 400, damping: 24 }}
          />
        ))}
      </svg>
    </div>
  );
}
