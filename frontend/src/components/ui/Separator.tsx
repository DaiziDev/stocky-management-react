import { cn } from "@/lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export const Separator = ({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorProps) => {
  return (
    <hr
      className={cn(
        "border-border",
        orientation === "horizontal" ? "w-full" : "h-full",
        className,
      )}
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      {...props}
    />
  );
};
