import { cn } from "@/lib/utils";

interface AvatarProps {
  /** Full name — first letters of the first two words become the initials. */
  name: string;
  size?: "sm" | "md";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-[33px] w-[33px] text-[12.5px]",
} as const;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/**
 * User avatar — gold gradient circle with initials.
 * Mockup `.sb-avatar`: gradient(150deg, gold-400 → gold-600), ink-950 text, bold.
 * Identical in both themes.
 */
export function Avatar({ name, size = "sm", className }: AvatarProps) {
  return (
    <div
      aria-hidden="true"
      title={name}
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full font-bold text-primary-950",
        "bg-gradient-to-br from-accent-400 to-accent-600",
        sizeClasses[size],
        className,
      )}
    >
      {initialsOf(name)}
    </div>
  );
}
