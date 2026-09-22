import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = ({ className, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface shadow-xs",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }: CardProps) => {
  return (
    <div
      className={cn("border-b border-border px-6 py-4", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3
      className={cn("text-lg font-semibold text-content", className)}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p className={cn("mt-1 text-sm text-content-muted", className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ className, children, ...props }: CardProps) => {
  return (
    <div className={cn("px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ className, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "flex items-center border-t border-border px-6 py-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
