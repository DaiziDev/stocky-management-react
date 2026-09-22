import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "gold"
    | "secondary";
  size?: "sm" | "md" | "lg";
}

export const Badge = ({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) => {
  const variants = {
    default: "bg-surface-alt text-content",
    success:
      "bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-500",
    warning:
      "bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500",
    danger:
      "bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-500",
    info: "bg-info-100 text-info-700 dark:bg-info-500/15 dark:text-info-500",
    gold: "bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-500",
    secondary: "bg-surface-alt text-content-secondary",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
