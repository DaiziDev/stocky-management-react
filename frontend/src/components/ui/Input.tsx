import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  /** Decorative icon rendered inside the field's leading edge (adds left padding). */
  leadingIcon?: ReactNode;
  /** Interactive element rendered inside the field's trailing edge (adds right padding) — e.g. a password reveal button. */
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leadingIcon,
      trailing,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-content-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-content-disabled [&_svg]:h-[17px] [&_svg]:w-[17px]"
            >
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-sm border bg-surface px-3 py-2 text-content dark:bg-[color:var(--dark-input)] dark:text-[color:var(--dark-text-primary)]",
              "placeholder:text-content-disabled",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "disabled:cursor-not-allowed disabled:bg-surface-alt",
              leadingIcon && "pl-[38px]",
              trailing && "pr-[42px]",
              error
                ? "border-danger-500 focus:ring-danger-500/20"
                : "border-border-strong dark:border-[color:var(--dark-border)]",
              className,
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />
          {trailing && (
            <div className="absolute right-[7px] top-1/2 -translate-y-1/2">
              {trailing}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-danger-600 dark:text-danger-500"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-content-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-content-secondary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-sm border bg-surface px-3 py-2 text-content dark:bg-[color:var(--dark-input)] dark:text-[color:var(--dark-text-primary)]",
            "placeholder:text-content-disabled",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "disabled:cursor-not-allowed disabled:bg-surface-alt",
            error
              ? "border-danger-500 focus:ring-danger-500/20"
              : "border-border-strong dark:border-[color:var(--dark-border)]",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-danger-600 dark:text-danger-500"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-content-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, helperText, id, options, placeholder, ...props },
    ref,
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-content-secondary"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full px-3 py-2 rounded-sm border bg-surface dark:bg-[color:var(--dark-input)] text-content dark:text-[color:var(--dark-text-primary)]",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "disabled:cursor-not-allowed disabled:bg-surface-alt",
            error
              ? "border-danger-500 focus:ring-danger-500/20"
              : "border-border-strong dark:border-[color:var(--dark-border)]",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error
              ? `${selectId}-error`
              : helperText
                ? `${selectId}-helper`
                : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p
            id={`${selectId}-error`}
            className="mt-1.5 text-sm text-danger-600 dark:text-danger-500"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${selectId}-helper`}
            className="mt-1.5 text-sm text-content-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
