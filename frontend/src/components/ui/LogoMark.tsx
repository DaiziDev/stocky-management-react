import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: "sm" | "md";
  letter?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 rounded-[9px] text-[15px]",
  md: "h-[38px] w-[38px] rounded-[11px] text-lg",
} as const;

/**
 * SGS brand mark — gold gradient rounded square with serif letter.
 * Mockup `.logo-mark`: 38px, r-11, linear-gradient(150deg, gold-400 → gold-600),
 * ink-950 letter in Fraunces 700. Identical in both themes.
 */
export function LogoMark({
  size = "md",
  letter = "S",
  className,
}: LogoMarkProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 select-none items-center justify-center",
        "bg-gradient-to-br from-accent-400 to-accent-600 font-display font-bold text-primary-950",
        "shadow-[0_2px_8px_rgba(201,146,46,0.35)]",
        sizeClasses[size],
        className,
      )}
    >
      {letter}
    </div>
  );
}
