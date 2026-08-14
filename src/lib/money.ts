import { convertBani, type FxSnapshot } from "@/lib/fx";

export const CURRENCIES = ["SEK", "EUR", "RON"] as const;

export type MoneyContext = {
  base: string;
  display: string;
  fx: FxSnapshot | null;
};

export function toDisplayBani(
  bani: number,
  money: MoneyContext,
): { bani: number; currency: string } {
  if (money.base === money.display) return { bani, currency: money.display };
  const converted = convertBani(bani, money.base, money.display, money.fx);
  if (converted == null) return { bani, currency: money.base };
  return { bani: converted, currency: money.display };
}

export function toStoredBani(displayBani: number, money: MoneyContext): number | null {
  if (money.base === money.display) return displayBani;
  return convertBani(displayBani, money.display, money.base, money.fx);
}

export function formatStoredMoney(bani: number, money: MoneyContext): string {
  const shown = toDisplayBani(bani, money);
  return formatMoney(shown.bani, shown.currency);
}

export function conversionNote(money: MoneyContext): string | null {
  if (money.base === money.display) return null;
  const shown = toDisplayBani(100, money);
  if (shown.currency !== money.display) return null;
  const date = money.fx?.date
    ? new Date(money.fx.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  return date
    ? `Converted from ${money.base} · BNR ${date}`
    : `Converted from ${money.base}`;
}

export function parseAmountToBani(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function baniToInput(bani: number): string {
  return (bani / 100).toFixed(2);
}

export function formatMoney(bani: number, currency: string): string {
  const locale =
    currency === "SEK" ? "sv-SE" : currency === "EUR" ? "de-DE" : "ro-RO";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(bani / 100);
}

/** Salary day — a pay period runs from this day through the day before the next one. */
export const PAY_CYCLE_DAY = 25;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatISODate(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function addDaysISO(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const result = new Date(year, month - 1, day + days);
  return formatISODate(result.getFullYear(), result.getMonth() + 1, result.getDate());
}

export function datesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  for (let d = start; d <= end; d = addDaysISO(d, 1)) dates.push(d);
  return dates;
}

export function payCycleStartISO(year: number, month: number) {
  return formatISODate(year, month, PAY_CYCLE_DAY);
}

/** Pay period starting on the 25th of `month` (salary in) through the 24th of the next month. */
export function monthBounds(year: number, month: number) {
  const start = payCycleStartISO(year, month);
  const end = addDaysISO(addPayCycles(start, 1), -1);
  return { start, end };
}

/** Which salary-month a calendar date belongs to (the 25th that started this period). */
export function payCycleOf(iso: string): { year: number; month: number } {
  const [year, month, day] = iso.split("-").map(Number);
  if (day >= PAY_CYCLE_DAY) return { year, month };
  const prev = new Date(year, month - 2, 1);
  return { year: prev.getFullYear(), month: prev.getMonth() + 1 };
}

export function addPayCycles(iso: string, cycles: number): string {
  const [year, month] = iso.split("-").map(Number);
  const result = new Date(year, month - 1 + cycles, PAY_CYCLE_DAY);
  return formatISODate(result.getFullYear(), result.getMonth() + 1, PAY_CYCLE_DAY);
}

/** Next salary reset (the 25th) on or after this date. */
export function nextPayResetOnOrAfter(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (day <= PAY_CYCLE_DAY) return formatISODate(year, month, PAY_CYCLE_DAY);
  return addPayCycles(formatISODate(year, month, PAY_CYCLE_DAY), 1);
}

/** Snap a recurring date to the 25th, then skip forward by `interval` months until today or later. */
export function alignRecurringDate(next: string, interval: number, today: string): string {
  let aligned = nextPayResetOnOrAfter(next);
  const step = interval > 0 ? interval : 1;
  while (aligned < today) aligned = addPayCycles(aligned, step);
  return aligned;
}

export function parseMonthParam(value: string | undefined): { year: number; month: number } {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m };
  }
  return payCycleOf(todayISO());
}

export function monthLabel(year: number, month: number) {
  const { start, end } = monthBounds(year, month);
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const startFmt = startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const endFmt = endDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${startFmt} – ${endFmt}`;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    param: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`,
  };
}

export function todayISO() {
  const d = new Date();
  return formatISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
