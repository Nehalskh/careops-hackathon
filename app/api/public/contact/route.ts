import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Body = {
  wid?: string;
  ws?: string;
  name?: string;
  emailOrPhone?: string;
  message?: string;
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
        { ok: false, error: "Workspace not found for this public link." },
        { status: 400 },
      );
    }

    const name = (body.name || "").trim();
    const emailOrPhone = (body.emailOrPhone || "").trim();
    const message = (body.message || "").trim();
    if (!name || !emailOrPhone) {
      return NextResponse.json(
        { ok: false, error: "Name and email/phone are required." },
        { status: 400 },
      );
    }

    const isEmail = emailOrPhone.includes("@");
    let { data: contact, error: cErr } = await supabaseAdmin
      .from("contacts")
      .insert([
        {
          workspace_id,
          name,
          email: isEmail ? emailOrPhone : null,
          phone: !isEmail ? emailOrPhone : null,
          message: message || null,
        },
      ])
      .select("id")
      .single();

    if (cErr?.message?.includes("message")) {
      const retry = await supabaseAdmin
        .from("contacts")
        .insert([
          {
            workspace_id,
            name,
            email: isEmail ? emailOrPhone : null,
            phone: !isEmail ? emailOrPhone : null,
          },
        ])
        .select("id")
        .single();
      contact = retry.data;
      cErr = retry.error;
    }
    if (cErr) {
      return NextResponse.json({ ok: false, error: cErr.message }, { status: 400 });
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
        body: "Welcome! Thanks for reaching out. How can we help?",
      },
    ]);
    if (mErr?.message?.includes("channel")) {
      const retry = await supabaseAdmin.from("messages").insert([
        {
          conversation_id: convo.id,
          direction: "out",
          body: "Welcome! Thanks for reaching out. How can we help?",
        },
      ]);
      mErr = retry.error;
    }
    if (mErr?.message?.includes("direction")) {
      const retry = await supabaseAdmin.from("messages").insert([
        {
          conversation_id: convo.id,
          body: "Welcome! Thanks for reaching out. How can we help?",
        },
      ]);
      mErr = retry.error;
    }
    if (mErr) {
      return NextResponse.json({ ok: false, error: mErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request payload." },
      { status: 400 },
    );
  }
}
