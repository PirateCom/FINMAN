export const DEFAULT_FX_URL = "https://www.cursbnr.ro/";
export const BNR_XML_URL = "https://curs.bnr.ro/nbrfxrates.xml";

export function isCursBnrUrl(raw: string): boolean {
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return host === "cursbnr.ro" || host === "www.cursbnr.ro";
  } catch {
    return false;
  }
}

export type FxSnapshot = {
  base: string;
  date: string | null;
  rates: Record<string, number>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function isAllowedFxUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return false;
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (
      a === 10 ||
      a === 127 ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 169 && b === 254) ||
      a === 0
    ) {
      return false;
    }
  }

  return true;
}

export function parseFxPayload(data: unknown): FxSnapshot | null {
  if (Array.isArray(data) && data.length > 0 && isRecord(data[0])) {
    const rows = data.filter(isRecord);
    const base = String(rows[0].base ?? "").toUpperCase();
    if (!base) return null;
    const rates: Record<string, number> = { [base]: 1 };
    let date: string | null = typeof rows[0].date === "string" ? rows[0].date : null;
    for (const row of rows) {
      const quote = String(row.quote ?? "").toUpperCase();
      const rate = positiveNumber(row.rate);
      if (quote && rate) rates[quote] = rate;
      if (!date && typeof row.date === "string") date = row.date;
    }
    return { base, date, rates };
  }

  if (!isRecord(data)) return null;

  const base = String(data.base ?? data.base_code ?? data.baseCode ?? "").toUpperCase();
  const date =
    (typeof data.date === "string" && data.date) ||
    (typeof data.time_last_update_utc === "string" && data.time_last_update_utc) ||
    null;

  const ratesSource =
    (isRecord(data.rates) && data.rates) ||
    (isRecord(data.conversion_rates) && data.conversion_rates) ||
    (isRecord(data.quotes) && data.quotes) ||
    null;

  if (base && ratesSource) {
    const rates: Record<string, number> = { [base]: 1 };
    for (const [key, value] of Object.entries(ratesSource)) {
      const quote = key.toUpperCase();
      const rate = positiveNumber(value);
      if (!rate) continue;
      if (quote.length === 6 && quote.startsWith(base)) rates[quote.slice(3)] = rate;
      else if (quote.length === 3) rates[quote] = rate;
    }
    return { base, date, rates };
  }

  const quote = String(data.quote ?? "").toUpperCase();
  const rate = positiveNumber(data.rate);
  if (base && quote && rate) {
    return { base, date, rates: { [base]: 1, [quote]: rate } };
  }

  return null;
}

function snapshotFromRonPerForeign(
  ronPerForeign: Record<string, number>,
  date: string | null,
): FxSnapshot | null {
  const rates: Record<string, number> = { RON: 1 };
  for (const [code, ron] of Object.entries(ronPerForeign)) {
    if (code === "RON" || !Number.isFinite(ron) || ron <= 0) continue;
    rates[code] = 1 / ron;
  }
  if (!rates.EUR && !rates.SEK) return null;
  return { base: "RON", date, rates };
}

export function parseBnrXml(xml: string): FxSnapshot | null {
  const cubeDate = xml.match(/<Cube[^>]*\bdate="([^"]+)"/i)?.[1] ?? null;
  const ronPerForeign: Record<string, number> = {};
  const rateRe =
    /<Rate\s+currency="([A-Z]{3})"(?:\s+multiplier="(\d+)")?>([0-9.]+)<\/Rate>/gi;
  for (const match of xml.matchAll(rateRe)) {
    const code = match[1];
    const multiplier = match[2] ? Number(match[2]) : 1;
    const value = Number(match[3]);
    if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(multiplier) || multiplier <= 0) {
      continue;
    }
    ronPerForeign[code] = value / multiplier;
  }
  return snapshotFromRonPerForeign(ronPerForeign, cubeDate);
}

export function parseCursBnrHtml(html: string): FxSnapshot | null {
  const ronPerForeign: Record<string, number> = {};
  const optionRe = /<option\s+value="([0-9.]+)"[^>]*>\s*([A-Z]{3})\s*</gi;
  for (const match of html.matchAll(optionRe)) {
    const value = Number(match[1]);
    const code = match[2];
    if (!Number.isFinite(value) || value <= 0) continue;
    ronPerForeign[code] = value;
  }
  const dateRaw = html.match(/cursul BNR din\s+(\d{2}\.\d{2}\.\d{4})/i)?.[1];
  let date: string | null = null;
  if (dateRaw) {
    const [day, month, year] = dateRaw.split(".");
    date = `${year}-${month}-${day}`;
  }
  return snapshotFromRonPerForeign(ronPerForeign, date);
}

export function parseFxText(text: string): FxSnapshot | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return parseFxPayload(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (/<Rate\s+currency="/i.test(trimmed)) {
    return parseBnrXml(trimmed);
  }

  return parseCursBnrHtml(trimmed);
}

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  snapshot: FxSnapshot,
): number | null {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();
  if (fromCode === toCode) return amount;

  const fromPerBase =
    fromCode === snapshot.base ? 1 : snapshot.rates[fromCode];
  const toPerBase = toCode === snapshot.base ? 1 : snapshot.rates[toCode];
  if (!fromPerBase || !toPerBase) return null;

  return (amount / fromPerBase) * toPerBase;
}

export function convertBani(
  bani: number,
  from: string,
  to: string,
  snapshot: FxSnapshot | null,
): number | null {
  if (from.toUpperCase() === to.toUpperCase()) return bani;
  if (!snapshot) return null;
  const converted = convertAmount(bani / 100, from, to, snapshot);
  if (converted == null || !Number.isFinite(converted)) return null;
  return Math.round(converted * 100);
}
