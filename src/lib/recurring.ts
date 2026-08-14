import { addCalendarMonths } from "@/lib/reminders";
import type { RecurringInterval } from "@/lib/types";

export const RECURRING_INTERVALS: { value: RecurringInterval; label: string }[] = [
  { value: 1, label: "Every month" },
  { value: 3, label: "Every 3 months" },
  { value: 6, label: "Every 6 months" },
  { value: 12, label: "Every year" },
];

export function recurringIntervalLabel(months: RecurringInterval): string {
  return RECURRING_INTERVALS.find((option) => option.value === months)?.label ?? "Every month";
}

export function parseRecurringInterval(value: string): RecurringInterval | null {
  const n = Number(value);
  if (n === 1 || n === 3 || n === 6 || n === 12) return n;
  return null;
}

export function nextOccurrence(from: string, months: number): string {
  return addCalendarMonths(from, months);
}

export function defaultRecurringTitle(type: "income" | "expense", interval: RecurringInterval): string {
  const when =
    interval === 1 ? "Monthly" : interval === 3 ? "Quarterly" : interval === 6 ? "Twice-yearly" : "Yearly";
  return `${when} ${type}`;
}
