import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  // Prototype: simulate email send
  console.log("Email send requested:", body);
  return NextResponse.json({ ok: true });
}
