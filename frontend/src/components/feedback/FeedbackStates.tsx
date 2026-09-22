import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface LoadingStateProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export const LoadingState = ({
  size = "md",
  text = "Chargement...",
  className,
}: LoadingStateProps) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-8",
        className,
      )}
    >
      <Loader2
        className={cn(sizes[size], "animate-spin text-primary")}
        aria-hidden="true"
      />
      <p className={cn(textSizes[size], "text-content-muted")}>{text}</p>
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className,
      )}
    >
      {icon && <div className="mb-4 text-content-disabled">{icon}</div>}
      <h3 className="mb-1 text-lg font-medium text-content">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-content-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState = ({
  title = "Une erreur est survenue",
  message,
  onRetry,
  retryLabel = "Réessayer",
  className,
}: ErrorStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className,
      )}
    >
      <AlertCircle
        className="mb-4 h-12 w-12 text-danger-500"
        aria-hidden="true"
      />
      <h3 className="mb-1 text-lg font-medium text-content">{title}</h3>
      <p className="mb-4 max-w-sm text-content-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-[9px] bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-hover"
        >
          <Loader2 className="h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  );
};

interface SuccessStateProps {
  title: string;
  message?: string;
  className?: string;
}

export const SuccessState = ({
  title,
  message,
  className,
}: SuccessStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className,
      )}
    >
      <CheckCircle
        className="mb-4 h-12 w-12 text-success-500"
        aria-hidden="true"
      />
      <h3 className="mb-1 text-lg font-medium text-content">{title}</h3>
      {message && <p className="max-w-sm text-content-muted">{message}</p>}
    </div>
  );
};

export const TableSkeleton = ({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="h-12 px-4 text-left">
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-secondary" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="p-4">
                  <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const CardSkeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "space-y-4 rounded-lg border border-border bg-surface p-6",
        className,
      )}
    >
      <div className="h-6 w-1/4 animate-pulse rounded bg-surface-secondary" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-surface-secondary" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-surface-secondary" />
    </div>
  );
};
