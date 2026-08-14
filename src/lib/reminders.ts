import { todayISO } from "@/lib/money";
import type { RepeatMonths } from "@/lib/types";

export const REPEAT_OPTIONS: { value: RepeatMonths; label: string }[] = [
  { value: 0, label: "Once" },
  { value: 1, label: "Monthly" },
  { value: 6, label: "Every 6 months" },
  { value: 12, label: "Yearly" },
];

export const REMINDER_PRESETS = [
  { id: "custom", label: "Custom", title: "", categoryName: null, repeat: 0 as RepeatMonths },
  { id: "rovinieta", label: "Rovinieta", title: "Rovinieta", categoryName: "Transport", repeat: 12 as RepeatMonths },
  { id: "rca", label: "Car insurance (RCA)", title: "Car insurance (RCA)", categoryName: "Transport", repeat: 12 as RepeatMonths },
  { id: "itp", label: "ITP", title: "ITP", categoryName: "Transport", repeat: 12 as RepeatMonths },
  { id: "service", label: "Service", title: "Service", categoryName: "Transport", repeat: 12 as RepeatMonths },
  { id: "life", label: "Life insurance", title: "Life insurance", categoryName: "Health", repeat: 12 as RepeatMonths },
] as const;

export function addCalendarMonths(iso: string, months: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const targetMonthIndex = month - 1 + months;
  const lastDay = new Date(year, targetMonthIndex + 1, 0).getDate();
  const clamped = Math.min(day, lastDay);
  const result = new Date(year, targetMonthIndex, clamped);
  return [
    result.getFullYear(),
    String(result.getMonth() + 1).padStart(2, "0"),
    String(result.getDate()).padStart(2, "0"),
  ].join("-");
}

export function addDaysISO(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const result = new Date(year, month - 1, day + days);
  return [
    result.getFullYear(),
    String(result.getMonth() + 1).padStart(2, "0"),
    String(result.getDate()).padStart(2, "0"),
  ].join("-");
}

export function dueSoonUntilISO(today = todayISO()) {
  return addDaysISO(today, 30);
}

export function nextDueAfterPaid(due: string, repeatMonths: number, today = todayISO()): string {
  if (repeatMonths <= 0) return due;
  let next = addCalendarMonths(due, repeatMonths);
  while (next <= today) {
    next = addCalendarMonths(next, repeatMonths);
  }
  return next;
}

export function dueLabel(due: string, today = todayISO()): string {
  if (due < today) return "Overdue";
  if (due === today) return "Due today";
  const [year, month, day] = due.split("-").map(Number);
  const formatted = new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  return `Due ${formatted}`;
}

export function repeatLabel(months: RepeatMonths): string {
  return REPEAT_OPTIONS.find((option) => option.value === months)?.label ?? "Once";
}
