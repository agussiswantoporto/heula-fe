"use client";

/**
 * ConfirmDialog (design Section 3). Confirmation modal for destructive actions
 * (reset, delete) built on the Sheet. Emoji-free copy supplied by the caller.
 */
import { Sheet } from "@/components/ui/Sheet";
import { Button, type ButtonVariant } from "@/components/ui/Button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      {description && (
        <p className="mb-5 text-sm text-content-muted">{description}</p>
      )}
      <div className="flex flex-col gap-2">
        <Button variant={confirmVariant} fullWidth onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" fullWidth onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </Sheet>
  );
}
