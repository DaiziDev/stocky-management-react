import { useTranslation } from "react-i18next";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

/**
 * ConfirmDialog (P1.2) — danger-intent confirmation for deletes and other
 * irreversible actions. Shows a pending state while the async action runs.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={!!deleting} onClose={() => setDeleting(null)}
 *     entityName={deleting?.designation}
 *     onConfirm={() => deleteCategory.mutateAsync(deleting.id)}
 *   />
 */
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /** Human-readable name shown in the message; falls back to generic wording. */
  entityName?: string;
  /** Async action to run on confirm; close is skipped if it throws. */
  onConfirm: () => Promise<unknown> | unknown;
  /** Override title (default: common.deleteTitle). */
  title?: string;
  /** Override description. */
  description?: string;
  /** Confirm label (default: common.delete). */
  confirmLabel?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  entityName,
  onConfirm,
  title,
  description,
  confirmLabel,
}: ConfirmDialogProps) {
  const { t } = useTranslation("common");

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch {
      // Global MutationCache already toasted the error; keep the dialog open
      // so the user can retry or cancel.
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? undefined : onClose())}
      title={title ?? t("deleteTitle")}
      description={
        description ?? t("deleteDescription", { entity: entityName ?? "—" })
      }
    >
      <div className="mt-6 flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button type="button" variant="danger" onClick={handleConfirm}>
          {confirmLabel ?? t("delete")}
        </Button>
      </div>
    </Dialog>
  );
}
