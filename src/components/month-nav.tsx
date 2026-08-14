import Link from "next/link";
import { monthLabel, shiftMonth } from "@/lib/money";

export function MonthNav({
  year,
  month,
  basePath,
  extraQuery = "",
}: {
  year: number;
  month: number;
  basePath: string;
  extraQuery?: string;
}) {
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const suffix = extraQuery ? `&${extraQuery}` : "";

  return (
    <div className="mb-4 flex items-center justify-between">
      <Link
        href={`${basePath}?month=${prev.param}${suffix}`}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card)] text-lg"
        aria-label="Previous month"
      >
        ‹
      </Link>
      <p className="text-sm font-semibold">{monthLabel(year, month)}</p>
      <Link
        href={`${basePath}?month=${next.param}${suffix}`}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card)] text-lg"
        aria-label="Next month"
      >
        ›
      </Link>
    </div>
  );
}
