/* Skeleton placeholders mirroring each chart card's real layout, so the
   panel doesn't collapse/shift while /dashboard/charts resolves. */

export const SalesChartSkeleton = () => (
  <div aria-hidden="true">
    <div className="h-[260px] w-full animate-pulse overflow-hidden rounded-[11px] bg-surface-secondary p-4">
      <svg
        viewBox="0 0 400 160"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <path
          d="M0,122 C40,112 62,82 100,86 C138,90 160,52 200,56 C240,60 262,92 300,72 C338,52 372,42 400,32 L400,160 L0,160 Z"
          fill="var(--color-surface-tertiary)"
        />
      </svg>
    </div>
    <div className="mt-3 flex justify-between px-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <span
          key={index}
          className="h-2 w-8 animate-pulse rounded bg-surface-secondary"
        />
      ))}
    </div>
  </div>
);

const LEGEND_ROWS = 5;

export const DonutChartSkeleton = () => (
  <div
    aria-hidden="true"
    className="flex flex-col items-center gap-5 lg:flex-row"
  >
    {/* Donut ring placeholder */}
    <div className="h-[220px] w-[220px] shrink-0 animate-pulse rounded-full border-[30px] border-surface-secondary" />

    {/* Legend rows */}
    <ul className="w-full min-w-0 space-y-3">
      {Array.from({ length: LEGEND_ROWS }).map((_, index) => (
        <li key={index} className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-[3px] bg-surface-secondary" />
          <span
            className="h-3 flex-1 animate-pulse rounded bg-surface-secondary"
            style={{ maxWidth: `${72 - index * 9}%` }}
          />
          <span className="h-3 w-14 shrink-0 animate-pulse rounded bg-surface-secondary" />
          <span className="h-3 w-8 shrink-0 animate-pulse rounded bg-surface-secondary" />
        </li>
      ))}
    </ul>
  </div>
);
