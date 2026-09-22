import { toast } from "sonner";
import { TOAST_DURATION } from "./constants";

/**
 * Toast helpers (P1.3) — mutations call these instead of raw sonner so the
 * whole app gets consistent durations, titles, and styling.
 * Brand styling is applied globally via `toastOptions.classNames` in
 * app/providers.tsx.
 */

export const toastSuccess = (message: string, description?: string) =>
  toast.success(message, { description, duration: TOAST_DURATION });

export const toastError = (message: string, description?: string) =>
  toast.error(message, { description, duration: TOAST_DURATION });

export const toastInfo = (message: string, description?: string) =>
  toast.info(message, { description, duration: TOAST_DURATION });

export const toastWarning = (message: string, description?: string) =>
  toast.warning(message, { description, duration: TOAST_DURATION });

interface ToastPromiseMessages<T> {
  /** Fires when the promise resolves; receives the resolved value. */
  success?: string | ((data: T) => string);
  /** Fires when the promise rejects; receives the error. */
  error?: string | ((error: unknown) => string);
  loading?: string;
}

/**
 * Wrap a mutation promise with loading/success/error toasts.
 * Usage: `toastPromise(mutation.mutateAsync(data), { success: '...' })`
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: ToastPromiseMessages<T>,
): Promise<T> {
  return toast.promise(promise, {
    loading: messages.loading ?? "...",
    success: (data: T) =>
      (typeof messages.success === "function"
        ? messages.success(data)
        : messages.success) ?? "OK",
    error: (err: unknown) =>
      (typeof messages.error === "function"
        ? messages.error(err)
        : messages.error) ?? "Error",
  }) as unknown as Promise<T>;
}
