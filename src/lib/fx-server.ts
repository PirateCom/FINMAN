import {
  BNR_XML_URL,
  DEFAULT_FX_URL,
  isCursBnrUrl,
  parseFxText,
  type FxSnapshot,
} from "@/lib/fx";

const FETCH_HEADERS = {
  Accept: "text/html, application/xml, application/json;q=0.9, */*;q=0.8",
  "User-Agent": "FamilyFinances/1.0",
};

async function fetchRatesText(url: string) {
  const response = await fetch(url, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(15000),
    headers: FETCH_HEADERS,
  });
  if (!response.ok) {
    throw new Error(`Rates link returned ${response.status}.`);
  }
  return response.text();
}

export async function loadFxSnapshot(url = DEFAULT_FX_URL): Promise<FxSnapshot> {
  let text = await fetchRatesText(url);
  let snapshot = parseFxText(text);
  if (!snapshot && isCursBnrUrl(url)) {
    text = await fetchRatesText(BNR_XML_URL);
    snapshot = parseFxText(text);
  }
  if (!snapshot) {
    throw new Error("Could not read BNR rates from that link.");
  }
  return snapshot;
}
