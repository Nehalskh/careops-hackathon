"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Dashboard() {
  const workspaceId = useSyncExternalStore(
    () => () => {},
    () => localStorage.getItem("workspace_id"),
    () => null,
  );
  const workspaceSlug = useSyncExternalStore(
    () => () => {},
    () => localStorage.getItem("workspace_slug") || "",
    () => "",
  );
  const [stats, setStats] = useState({
    newInquiries: 0,
    todayBookings: 0,
    upcomingBookings: 0,
    lowStock: 0,
    unanswered: 0,
    criticalAlerts: 0,
  });

  async function load(id: string) {
    const [
      { count: contacts },
      { data: bookingRows },
      { data: inv },
      { data: convos },
    ] = await Promise.all([
      supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", id),
      supabase
        .from("bookings")
        .select("start_at")
        .eq("workspace_id", id),
      supabase
        .from("inventory_items")
        .select("quantity,low_threshold")
        .eq("workspace_id", id),
      supabase.from("conversations").select("id").eq("workspace_id", id),
    ]);

    const lowStock = (inv || []).filter(
      (i) => i.quantity <= i.low_threshold,
    ).length;

    // unanswered = conversations with no "out" message
    let unanswered = 0;
    if (convos?.length) {
      for (const c of convos) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("direction")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (msgs?.[0]?.direction === "in") unanswered++;
      }
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    let todayBookings = 0;
    let upcomingBookings = 0;
    for (const b of bookingRows || []) {
      const d = new Date(b.start_at);
      if (d >= startOfToday && d <= endOfToday) todayBookings++;
      if (d > endOfToday) upcomingBookings++;
    }

    const criticalAlerts = lowStock + unanswered;
    setStats({
      newInquiries: contacts || 0,
      todayBookings,
      upcomingBookings,
      lowStock,
      unanswered,
      criticalAlerts,
    });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (workspaceId) load(workspaceId);
  }, [workspaceId]);

  const contactLink = workspaceId
    ? `/public/contact?wid=${encodeURIComponent(workspaceId)}`
    : "/public/contact";
  const bookingLink = workspaceId
    ? `/public/book?wid=${encodeURIComponent(workspaceId)}`
    : "/public/book";

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Business Dashboard</h1>
          <div className="flex gap-2">
            <Link className="px-3 py-2 rounded bg-slate-800" href="/inbox">
              Inbox
            </Link>
            <Link className="px-3 py-2 rounded bg-slate-800" href="/bookings">
              Bookings
            </Link>
            <Link className="px-3 py-2 rounded bg-slate-800" href="/inventory">
              Inventory
            </Link>
            <Link className="px-3 py-2 rounded bg-slate-800" href="/onboarding">
              Onboarding
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-6">
          <Card title="New Inquiries" value={stats.newInquiries} />
          <Card title="Today's Bookings" value={stats.todayBookings} />
          <Card title="Upcoming Bookings" value={stats.upcomingBookings} />
          <Card title="Unanswered" value={stats.unanswered} />
          <Card title="Low Stock Alerts" value={stats.lowStock} />
          <Card title="Key Alerts" value={stats.criticalAlerts} />
        </div>

        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="font-semibold">Public Links (No customer login)</h2>
          <p className="text-slate-300 text-sm mt-1">
            Use these links in your demo:
          </p>
          <div className="mt-3 text-sm space-y-2">
            <div>
              Contact Form:{" "}
              <span className="text-blue-300">{contactLink}</span>
            </div>
            <div>
              Booking Page: <span className="text-blue-300">{bookingLink}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Workspace: {workspaceId ? "Configured" : "Not set"}{" "}
            {workspaceSlug ? `(${workspaceSlug})` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="text-slate-300 text-sm">{title}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  );
}
