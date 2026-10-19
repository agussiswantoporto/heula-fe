"use client";

/**
 * ShareCard (FEAT-006, Feature 7).
 *
 * Draws an on-brand PORTRAIT progress card to an offscreen <canvas> (1080x1920,
 * no external assets, no charting lib), exports it to a PNG blob, and shares it
 * via the Web Share API with files when supported. When file-share is missing
 * it falls back to a PNG download; when neither works it degrades to a friendly
 * emoji-free message.
 *
 * Fully SSR-guarded + feature-detected: every window/document/navigator/canvas
 * access happens inside the click handler (never during render), so the module
 * imports and renders safely on the server and never throws there. All drawn
 * text comes from the pure, emoji-free `formatShareStats` + copy.share.
 */
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/lib/copy";
import { formatShareStats, type ShareStatsInput } from "@/lib/share";

/** Brand emerald (globals.css --brand) used for accents on the card. */
const BRAND = "#0e9f6e";
const BRAND_DARK = "#0b7d57";
const CARD_W = 1080;
const CARD_H = 1920;
const FONT_STACK =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface ShareCardProps extends ShareStatsInput {
  /** Optional extra classes for the trigger wrapper. */
  className?: string;
}

/** Draw the portrait card onto a fresh canvas; emoji-free, brand emerald. */
function drawCard(canvas: HTMLCanvasElement, stats: string[]): void {
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background.
  ctx.fillStyle = "#0a0f0d";
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Top brand band + bottom accent bar (simple shapes only).
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, CARD_W, 220);
  ctx.fillStyle = BRAND_DARK;
  ctx.fillRect(0, CARD_H - 24, CARD_W, 24);

  // Brand title in the band.
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 108px ${FONT_STACK}`;
  ctx.fillText(copy.share.cardTitle, CARD_W / 2, 150);

  // Heading.
  ctx.fillStyle = "#e8f5ef";
  ctx.font = `600 72px ${FONT_STACK}`;
  ctx.fillText(copy.share.cardHeading, CARD_W / 2, 420);

  // Stat lines, left-aligned block centered horizontally.
  ctx.textAlign = "left";
  const blockX = 150;
  let y = 640;
  for (const line of stats) {
    // Accent dot before each stat line.
    ctx.fillStyle = BRAND;
    ctx.beginPath();
    ctx.arc(blockX - 36, y - 20, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = `500 60px ${FONT_STACK}`;
    ctx.fillText(line, blockX, y);
    y += 150;
  }

  // Footer.
  ctx.textAlign = "center";
  ctx.fillStyle = "#9bbdb0";
  ctx.font = `400 48px ${FONT_STACK}`;
  ctx.fillText(copy.share.cardFooter, CARD_W / 2, CARD_H - 120);
}

/** Render the card to a PNG blob, or null if canvas/export is unavailable. */
async function renderBlob(stats: string[]): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  if (typeof canvas.getContext !== "function") return null;
  drawCard(canvas, stats);
  if (typeof canvas.toBlob !== "function") return null;
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export function ShareCard({ className, ...stats }: ShareCardProps) {
  const [busy, setBusy] = useState(false);
  const [fallbackMsg, setFallbackMsg] = useState<string | null>(null);

  async function handleShare(): Promise<void> {
    if (busy) return;
    setBusy(true);
    setFallbackMsg(null);
    try {
      // SSR / unsupported-environment guards (never run on the server).
      if (
        typeof window === "undefined" ||
        typeof document === "undefined" ||
        typeof navigator === "undefined"
      ) {
        return;
      }

      const lines = formatShareStats(stats);
      const blob = await renderBlob(lines);
      if (!blob) {
        setFallbackMsg(copy.share.fallback);
        return;
      }

      const file = new File([blob], copy.share.downloadFileName, {
        type: "image/png",
      });

      // Preferred path: Web Share API with files.
      const canShareFiles =
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] }) &&
        typeof navigator.share === "function";
      if (canShareFiles) {
        try {
          await navigator.share({
            files: [file],
            title: copy.share.shareTitle,
            text: copy.share.shareText,
          });
          return;
        } catch (err) {
          // User-cancelled share: do nothing, do not fall back noisily.
          if (err instanceof DOMException && err.name === "AbortError") return;
          // Any other share failure degrades to the download path below.
        }
      }

      // Fallback: trigger a PNG download via an object URL.
      if (typeof URL.createObjectURL === "function") {
        const url = URL.createObjectURL(blob);
        try {
          const a = document.createElement("a");
          a.href = url;
          a.download = copy.share.downloadFileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } finally {
          URL.revokeObjectURL(url);
        }
        return;
      }

      // Neither share nor download available: friendly degrade.
      setFallbackMsg(copy.share.fallback);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <Button
        variant="secondary"
        fullWidth
        onClick={handleShare}
        disabled={busy}
        aria-label={copy.share.shareButton}
      >
        <Icon name="share_social" size={20} />
        {copy.share.shareButton}
      </Button>
      {fallbackMsg && (
        <p className="mt-2 text-center text-xs text-content-muted">
          {fallbackMsg}
        </p>
      )}
    </div>
  );
}
