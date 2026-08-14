import { NextResponse } from "next/server";
import { DEFAULT_FX_URL, isAllowedFxUrl } from "@/lib/fx";
import { loadFxSnapshot } from "@/lib/fx-server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const requested = typeof body?.url === "string" ? body.url.trim() : "";
  const url = requested || DEFAULT_FX_URL;

  if (!isAllowedFxUrl(url)) {
    return NextResponse.json(
      { error: "Use an https:// link to a public rates page or feed." },
      { status: 400 },
    );
  }

  try {
    const snapshot = await loadFxSnapshot(url);
    return NextResponse.json({
      base: snapshot.base,
      date: snapshot.date,
      rates: snapshot.rates,
      source: url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load rates from that link.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
