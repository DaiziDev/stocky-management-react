import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** Focusable elements, in DOM order, for the focus trap. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Dialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Body scroll lock + Escape + focus management while open.
  useEffect(() => {
    if (!open) return;

    // Focus trap: Tab cycles inside the dialog.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !contentRef.current) return;
      const focusable = Array.from(
        contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!contentRef.current.contains(active)) {
        // Focus escaped (e.g. browser quirk) — pull it back in.
        e.preventDefault();
        first.focus();
      }
    };

    // Escape must not close dialogs nested inside another open dialog —
    // handled naturally since both listeners fire; last-registered wins.
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    // Initial focus: first focusable element, else the dialog itself.
    requestAnimationFrame(() => {
      const target =
        contentRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      target?.focus();
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
      // Restore focus to where the dialog was opened from.
      previouslyFocused.current?.focus?.();
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-lg rounded-lg bg-surface dark:bg-[color:var(--dark-surface)] shadow-xl animate-slide-up",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        aria-describedby={description ? "dialog-description" : undefined}
      >
        {(title || description) && (
          <div className="flex items-start gap-4 border-b border-border p-6">
            <div className="flex-1">
              {title && (
                <h2
                  id="dialog-title"
                  className="text-lg font-semibold text-content"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="dialog-description"
                  className="mt-1 text-sm text-content-muted"
                >
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 text-content-disabled hover:bg-surface-hover hover:text-content"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
