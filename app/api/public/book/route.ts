import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Body = {
  wid?: string;
  ws?: string;
  name?: string;
  email?: string;
  service?: string;
  startAt?: string;
};

async function resolveWorkspaceId(wid?: string, ws?: string) {
  if (wid) return wid;
  if (!ws) return null;
  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .select("id")
    .eq("slug", ws)
    .single();
  if (error || !data?.id) return null;
  return data.id as string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const workspace_id = await resolveWorkspaceId(body.wid, body.ws);
    if (!workspace_id) {
      return NextResponse.json(
        { ok: false, error: "Workspace not found for this booking link." },
        { status: 400 },
      );
    }

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const service = (body.service || "").trim() || "Consultation";
    const startAt = body.startAt || "";
    if (!name || !email || !startAt) {
      return NextResponse.json(
        { ok: false, error: "Name, email, and booking date/time are required." },
        { status: 400 },
      );
    }

    const { data: contact, error: cErr } = await supabaseAdmin
      .from("contacts")
      .insert([{ workspace_id, name, email }])
      .select("id")
      .single();
    if (cErr) {
      return NextResponse.json({ ok: false, error: cErr.message }, { status: 400 });
    }

    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      .insert([
        {
          workspace_id,
          contact_id: contact.id,
          service_name: service,
          start_at: new Date(startAt).toISOString(),
        },
      ])
      .select("id")
      .single();
    if (bErr) {
      return NextResponse.json({ ok: false, error: bErr.message }, { status: 400 });
    }

    let { data: convo, error: convErr } = await supabaseAdmin
      .from("conversations")
      .insert([{ workspace_id, contact_id: contact.id }])
      .select("id")
      .single();

    if (convErr?.message?.includes("workspace_id")) {
      const retry = await supabaseAdmin
        .from("conversations")
        .insert([{ contact_id: contact.id }])
        .select("id")
        .single();
      convo = retry.data;
      convErr = retry.error;
    }
    if (convErr) {
      return NextResponse.json(
        { ok: false, error: convErr.message },
        { status: 400 },
      );
    }

    let { error: mErr } = await supabaseAdmin.from("messages").insert([
      {
        conversation_id: convo.id,
        direction: "out",
        channel: "email",
        body: `Booking confirmed for ${service} at ${new Date(startAt).toLocaleString()}.`,
      },
      {
        conversation_id: convo.id,
        direction: "out",
        channel: "email",
        body: "Please complete the intake form before your visit.",
      },
    ]);
    if (mErr?.message?.includes("channel")) {
      const retry = await supabaseAdmin.from("messages").insert([
        {
          conversation_id: convo.id,
          direction: "out",
          body: `Booking confirmed for ${service} at ${new Date(startAt).toLocaleString()}.`,
        },
        {
          conversation_id: convo.id,
          direction: "out",
          body: "Please complete the intake form before your visit.",
        },
      ]);
      mErr = retry.error;
    }
    if (mErr?.message?.includes("direction")) {
      const retry = await supabaseAdmin.from("messages").insert([
        {
          conversation_id: convo.id,
          body: `Booking confirmed for ${service} at ${new Date(startAt).toLocaleString()}.`,
        },
        {
          conversation_id: convo.id,
          body: "Please complete the intake form before your visit.",
        },
      ]);
      mErr = retry.error;
    }
    if (mErr) {
      return NextResponse.json({ ok: false, error: mErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, bookingId: booking.id });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request payload." },
      { status: 400 },
    );
  }
}
