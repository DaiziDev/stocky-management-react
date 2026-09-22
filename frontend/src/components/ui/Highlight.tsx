import { Fragment } from "react";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface HighlightProps {
  text: string;
  /** Query to highlight — matches case-insensitively; empty query renders plain text. */
  query: string;
}

/**
 * Renders `text` with case-insensitive occurrences of `query` wrapped in a
 * brand-gold <mark> (accent-100/accent-700 light · accent wash dark).
 * Splitting on a capture group puts matches in odd-index parts.
 */
export function Highlight({ text, query }: HighlightProps) {
  const needle = query.trim();
  if (!needle) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark
            key={index}
            className="rounded-[3px] bg-accent-100 px-px text-accent-700 dark:bg-accent-500/25 dark:text-accent-400"
          >
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
