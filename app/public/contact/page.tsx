"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PublicContactPage() {
  return (
    <Suspense fallback={null}>
      <PublicContact />
    </Suspense>
  );
}

function PublicContact() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  async function resolveWorkspaceId() {
    const wid = searchParams.get("wid");
    if (wid) return wid;

    const slug = searchParams.get("ws");
    if (slug) {
      const { data, error } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", slug)
        .single();
      if (error || !data?.id) return null;
      return data.id as string;
    }
    return localStorage.getItem("workspace_id");
  }

  async function submit() {
    setStatus("Submitting...");

    const wid = searchParams.get("wid") || undefined;
    const ws = searchParams.get("ws") || undefined;
    const fallbackWid = await resolveWorkspaceId();
    const workspaceRef = wid || fallbackWid || undefined;
    if (!workspaceRef && !ws) {
      setStatus("Workspace not found. Use the contact link from dashboard.");
      return;
    }

    const res = await fetch("/api/public/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wid: workspaceRef,
        ws,
        name,
        emailOrPhone,
        message,
      }),
    });
    const out = (await res.json()) as { ok: boolean; error?: string };
    if (!out.ok) return setStatus(out.error || "Unable to submit contact form.");

    setStatus("Done. Lead created and welcome message sent.");
    setName("");
    setEmailOrPhone("");
    setMessage("");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-slate-900 rounded-xl p-6 border border-slate-800">
        <h1 className="text-2xl font-semibold">Contact the Business</h1>
        <p className="text-slate-300 text-sm mt-1">No login required</p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full p-3 rounded bg-slate-800 border border-slate-700"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full p-3 rounded bg-slate-800 border border-slate-700"
            placeholder="Email or phone"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
          />
          <textarea
            className="w-full p-3 rounded bg-slate-800 border border-slate-700"
            placeholder="Message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={submit}
            className="w-full p-3 rounded bg-blue-600 hover:bg-blue-500"
          >
            Submit
          </button>
          {status && <p className="text-sm text-slate-200">{status}</p>}
        </div>
      </div>
    </div>
  );
}
