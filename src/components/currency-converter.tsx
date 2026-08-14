"use client";

import { useEffect, useMemo, useState } from "react";
import { convertAmount, DEFAULT_FX_URL, type FxSnapshot } from "@/lib/fx";
import { CURRENCIES, formatMoney } from "@/lib/money";

const URL_STORAGE_KEY = "finman-fx-url";

function parseTypedAmount(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function formatRateDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CurrencyConverter({ currency }: { currency: string }) {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState(currency);
  const [url, setUrl] = useState("");
  const [snapshot, setSnapshot] = useState<(FxSnapshot & { source: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadRates(nextUrl: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/fx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: nextUrl.trim() || undefined }),
      });
      const data = (await response.json()) as
        | (FxSnapshot & { source: string; error?: string })
        | { error?: string };
      if (!response.ok || !("rates" in data)) {
        setSnapshot(null);
        setError(data.error ?? "Could not load rates.");
        return;
      }
      setSnapshot(data);
    } catch {
      setSnapshot(null);
      setError("Could not load rates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(URL_STORAGE_KEY) ?? "";
    const next = saved.includes("open.er-api.com") ? "" : saved;
    if (next !== saved) localStorage.removeItem(URL_STORAGE_KEY);
    setUrl(next);
    void loadRates(next);
  }, []);

  useEffect(() => {
    setFrom(currency);
  }, [currency]);

  const typed = parseTypedAmount(amount);

  const converted = useMemo(() => {
    if (!snapshot || typed == null) return [];
    return CURRENCIES.filter((code) => code !== from).map((code) => ({
      code,
      value: convertAmount(typed, from, code, snapshot),
    }));
  }, [from, snapshot, typed]);

  const unitRates = useMemo(() => {
    if (!snapshot) return [];
    return CURRENCIES.filter((code) => code !== from).map((code) => ({
      code,
      value: convertAmount(1, from, code, snapshot),
    }));
  }, [from, snapshot]);

  function onSaveUrl(formData: FormData) {
    const next = String(formData.get("fx_url") ?? "").trim();
    setUrl(next);
    if (next) localStorage.setItem(URL_STORAGE_KEY, next);
    else localStorage.removeItem(URL_STORAGE_KEY);
    void loadRates(next);
  }

  const sourceHost = snapshot
    ? (() => {
        try {
          return new URL(snapshot.source).hostname;
        } catch {
          return "rates feed";
        }
      })()
    : null;

  return (
    <div className="rounded-2xl bg-[var(--card)] p-4">
      <div className="grid grid-cols-[1fr_7.5rem] gap-2">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="Amount"
          className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 outline-none ring-[var(--accent)] focus:ring-2"
        />
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 outline-none"
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {loading ? (
          <p className="text-sm text-[var(--muted-fg)]">Loading rates…</p>
        ) : error ? (
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        ) : (
          converted.map((row) => (
            <div
              key={row.code}
              className="flex items-baseline justify-between rounded-xl bg-[var(--muted)] px-4 py-3"
            >
              <span className="text-sm text-[var(--muted-fg)]">{row.code}</span>
              <span className="text-lg font-semibold">
                {row.value == null ? "—" : formatMoney(Math.round(row.value * 100), row.code)}
              </span>
            </div>
          ))
        )}
      </div>

      {!loading && !error && unitRates.length > 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-[var(--muted-fg)]">
          {unitRates
            .filter((row) => row.value != null)
            .map((row) => `1 ${from} = ${row.value!.toFixed(4)} ${row.code}`)
            .join(" · ")}
          {snapshot?.date ? ` · ${formatRateDate(snapshot.date)}` : null}
          {sourceHost ? ` · BNR via ${sourceHost}` : null}
        </p>
      ) : null}

      <form action={onSaveUrl} className="mt-4 flex flex-col gap-2">
        <label className="text-xs font-medium text-[var(--muted-fg)]">
          Rates link (optional)
        </label>
        <input
          name="fx_url"
          defaultValue={url}
          key={url}
          placeholder={DEFAULT_FX_URL}
          className="h-11 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none ring-[var(--accent)] focus:ring-2"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="submit"
            className="h-11 rounded-2xl border border-[var(--border)] text-sm font-semibold"
          >
            Use this link
          </button>
          <button
            type="button"
            onClick={() => void loadRates(url)}
            className="h-11 rounded-2xl border border-[var(--border)] text-sm font-semibold"
          >
            Refresh
          </button>
        </div>
        <p className="text-xs leading-relaxed text-[var(--muted-fg)]">
          Uses{" "}
          <a
            href={DEFAULT_FX_URL}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            cursbnr.ro
          </a>{" "}
          (BNR daily rate). Leave blank for that, or paste another https rates link.
        </p>
      </form>
    </div>
  );
}
