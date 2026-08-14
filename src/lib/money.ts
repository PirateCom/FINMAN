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
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(bani / 100);
}

export function monthBounds(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const last = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { start, end };
}

export function parseMonthParam(value: string | undefined): { year: number; month: number } {
  const now = new Date();
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m };
  }
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    param: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
  };
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
