import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const key = process.env.RENTCAST_API_KEY;
  if (!key) return NextResponse.json({ error: "RENTCAST_API_KEY not configured" }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

  const url = `https://api.rentcast.io/v1/avm/rental/long-term?address=${encodeURIComponent(address)}`;

  const res = await fetch(url, {
    headers: { "X-Api-Key": key, Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ error: `RentCast error: ${res.status}`, detail: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
