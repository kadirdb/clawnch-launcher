import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://clawn.ch";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const auth = req.headers.get("authorization") || "";

  const res = await fetch(`${API_BASE}/api/deploy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({ error: "Invalid response" }));
  return NextResponse.json(data, { status: res.status });
}
