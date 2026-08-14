import type { RemainingSeries } from "@/lib/data";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function barTone(pct: number) {
  if (pct < 25) return "var(--expense)";
  if (pct < 50) return "#d97706";
  return "var(--income)";
}

export function RemainingChart({ series }: { series: RemainingSeries }) {
  const { days, income, lastDay, todayDay, isCurrentMonth, currentPct } = series;
  const shownPct = clamp(Math.round(currentPct), 0, 100);
  const fill = barTone(currentPct);
  const pctLow = currentPct < 10;

  const W = 240;
  const H = 128;
  const padL = 6;
  const padR = 10;
  const padT = 10;
  const padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const bottom = padT + innerH;

  const xAt = (day: number) => padL + ((day - 1) / Math.max(1, lastDay - 1)) * innerW;
  const yAt = (pct: number) => padT + (1 - clamp(pct, 0, 100) / 100) * innerH;

  const solidDays = days.filter((d) => d.day <= todayDay);
  const line = solidDays
    .map((d, i) => `${i === 0 ? "M" : "L"}${xAt(d.day).toFixed(1)},${yAt(d.pct).toFixed(1)}`)
    .join(" ");

  const first = solidDays[0];
  const lastSolid = solidDays[solidDays.length - 1];
  const area =
    first && lastSolid
      ? `${line} L ${xAt(lastSolid.day).toFixed(1)},${bottom} L ${xAt(first.day).toFixed(1)},${bottom} Z`
      : "";

  const future =
    isCurrentMonth && lastSolid && todayDay < lastDay
      ? `M ${xAt(todayDay).toFixed(1)},${yAt(lastSolid.pct).toFixed(1)} L ${xAt(lastDay).toFixed(1)},${yAt(lastSolid.pct).toFixed(1)}`
      : "";

  const tickDays = [1, isCurrentMonth ? todayDay : null, lastDay].filter(
    (d, i, arr): d is number => d != null && arr.indexOf(d) === i,
  );

  if (income <= 0) {
    return (
      <div className="mt-3 rounded-2xl bg-[var(--card)] px-4 py-8 text-center text-sm text-[var(--muted-fg)]">
        Add income this month to see remaining as a graph.
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl bg-[var(--card)] p-4">
      <p className="mb-3 text-xs font-medium text-[var(--muted-fg)]">Left of this month&apos;s income</p>

      <div className="flex items-stretch gap-4">
        <div className="min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-[128px] w-full"
            role="img"
            aria-label={`${shownPct} percent of this month's income remaining`}
          >
            {[100, 50, 0].map((mark) => (
              <line
                key={mark}
                x1={padL}
                x2={W - padR}
                y1={yAt(mark)}
                y2={yAt(mark)}
                stroke="var(--border)"
                strokeWidth="1"
              />
            ))}
            {area ? <path d={area} fill={fill} opacity="0.18" /> : null}
            {line ? (
              <path d={line} fill="none" stroke={fill} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            ) : null}
            {future ? (
              <path
                d={future}
                fill="none"
                stroke={fill}
                strokeWidth="2"
                strokeDasharray="5 5"
                opacity="0.55"
              />
            ) : null}
            {lastSolid ? (
              <circle
                cx={xAt(Math.min(todayDay, lastDay))}
                cy={yAt(lastSolid.pct)}
                r="4"
                fill={fill}
              />
            ) : null}
            {tickDays.map((day) => (
              <text
                key={day}
                x={xAt(day)}
                y={H - 6}
                textAnchor={day === 1 ? "start" : day === lastDay ? "end" : "middle"}
                fill="var(--muted-fg)"
                fontSize="10"
              >
                {isCurrentMonth && day === todayDay && day !== 1 && day !== lastDay ? "today" : day}
              </text>
            ))}
          </svg>
        </div>

        <div className="flex w-14 shrink-0 flex-col items-center justify-between">
          <div className="relative h-[108px] w-3 overflow-hidden rounded-full bg-[var(--muted)]">
            <div
              className="absolute bottom-0 left-0 w-full rounded-full"
              style={{ height: `${shownPct}%`, background: fill }}
            />
          </div>
          <p
            className={`mt-2 text-sm font-semibold tabular-nums ${
              pctLow ? "text-red-600 dark:text-red-400" : ""
            }`}
            style={pctLow ? undefined : { color: fill }}
          >
            {shownPct}%
          </p>
        </div>
      </div>
    </div>
  );
}
