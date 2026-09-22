import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "gold"
    | "edit"
    | "form";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-primary text-white hover:bg-primary-hover",
      secondary: "bg-surface-alt text-content hover:bg-surface-hover",
      outline:
        "border border-border-strong bg-transparent text-content hover:bg-surface-hover",
      ghost: "bg-transparent text-content hover:bg-surface-hover",
      danger: "bg-danger-600 text-white hover:bg-danger-700",
      gold: "bg-gradient-to-br from-accent-400 to-accent-600 text-primary-950 shadow-[0_4px_14px_rgba(201,146,46,0.28)] hover:brightness-105",
      edit: "bg-transparent text-content-secondary hover:bg-accent-100 hover:text-accent-700 dark:hover:bg-accent-500/15 dark:hover:text-accent-400",
      form: "bg-primary-950 text-white hover:bg-primary-900",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2",
      icon: "p-2",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
