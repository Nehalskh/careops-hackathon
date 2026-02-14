"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ContactRef = {
  name: string | null;
  email: string | null;
};

type Booking = {
  id: string;
  service_name: string | null;
  start_at: string;
  contacts: ContactRef | ContactRef[] | null;
};

export default function BookingsPage() {
  const [workspaceId] = useState<string | null>(
    () =>
      (typeof window !== "undefined" && localStorage.getItem("workspace_id")) ||
      null,
  );
  const [rows, setRows] = useState<Booking[]>([]);
  const [status, setStatus] = useState("");

  async function loadBookings(id: string) {
    setStatus("Loading...");
    const { data, error } = await supabase
      .from("bookings")
      .select("id, service_name, start_at, contacts(name,email)")
      .eq("workspace_id", id)
      .order("start_at", { ascending: true });

    if (error) {
      setStatus(error.message);
      return;
    }
    setRows((data as Booking[]) || []);
    setStatus("");
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (workspaceId) loadBookings(workspaceId);
  }, [workspaceId]);

  function readContact(b: Booking) {
    const raw = b.contacts;
    if (Array.isArray(raw)) return raw[0] || null;
    return raw || null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Bookings</h1>
          <div className="flex gap-2">
            <Link className="px-3 py-2 rounded bg-slate-800" href="/dashboard">
              Dashboard
            </Link>
            <Link className="px-3 py-2 rounded bg-slate-800" href="/inbox">
              Inbox
            </Link>
          </div>
        </div>

        <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs uppercase tracking-wide text-slate-400 border-b border-slate-800">
            <div className="col-span-3">Contact</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Service</div>
            <div className="col-span-3">Start Time</div>
            <div className="col-span-1">ID</div>
          </div>

          {status && <p className="px-4 py-3 text-sm text-slate-300">{status}</p>}

          {!status && rows.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-300">No bookings yet.</p>
          )}

          {!status &&
            rows.map((b) => {
              const c = readContact(b);
              return (
                <div
                  key={b.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-slate-800 text-sm"
                >
                  <div className="col-span-3">{c?.name || "Unknown"}</div>
                  <div className="col-span-3">{c?.email || "-"}</div>
                  <div className="col-span-2">{b.service_name || "-"}</div>
                  <div className="col-span-3">
                    {new Date(b.start_at).toLocaleString()}
                  </div>
                  <div className="col-span-1 text-slate-400">{b.id.slice(0, 6)}</div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
