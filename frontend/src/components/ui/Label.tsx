import { forwardRef, LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "mb-1.5 block text-sm font-medium text-content-secondary",
          className,
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-1 text-danger-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  },
);

Label.displayName = "Label";
