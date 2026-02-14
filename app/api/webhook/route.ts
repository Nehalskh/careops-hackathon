import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  // Prototype: just echo back. In real: forward to configured webhook url
  console.log("Webhook event received:", body);

  return NextResponse.json({ ok: true, received: body });
}
