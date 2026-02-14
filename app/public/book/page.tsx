"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PublicBooking() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("Consultation");
  const [startAt, setStartAt] = useState("");
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

  async function book() {
    setStatus("Booking...");

    const wid = searchParams.get("wid") || undefined;
    const ws = searchParams.get("ws") || undefined;
    const fallbackWid = await resolveWorkspaceId();
    const workspaceRef = wid || fallbackWid || undefined;
    if (!workspaceRef && !ws) {
      setStatus("Workspace not found. Use the booking link from dashboard.");
      return;
    }

    const res = await fetch("/api/public/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wid: workspaceRef,
        ws,
        name,
        email,
        service,
        startAt,
      }),
    });
    const out = (await res.json()) as {
      ok: boolean;
      bookingId?: string;
      error?: string;
    };
    if (!out.ok) return setStatus(out.error || "Unable to complete booking.");

    await fetch("/api/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "booking_created",
        bookingId: out.bookingId,
        workspace_id: workspaceRef,
      }),
    });

    setStatus("Booked. Confirmation and intake-form reminder sent.");
    setName("");
    setEmail("");
    setStartAt("");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-slate-900 rounded-xl p-6 border border-slate-800">
        <h1 className="text-2xl font-semibold">Book a Service</h1>
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
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="w-full p-3 rounded bg-slate-800 border border-slate-700"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option>Consultation</option>
            <option>In-person Meeting</option>
            <option>Demo Call</option>
          </select>
          <input
            className="w-full p-3 rounded bg-slate-800 border border-slate-700"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
          <button
            onClick={book}
            className="w-full p-3 rounded bg-blue-600 hover:bg-blue-500"
          >
            Confirm Booking
          </button>
          {status && <p className="text-sm text-slate-200">{status}</p>}
        </div>
      </div>
    </div>
  );
}
