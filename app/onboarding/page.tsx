"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("workspace_address")) ||
      "",
  );
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [email, setEmail] = useState("");
  const [emailChannel, setEmailChannel] = useState(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("channel_email") !== "false") ||
      true,
  );
  const [smsChannel, setSmsChannel] = useState(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("channel_sms") === "true") ||
      false,
  );
  const [hasBookingType, setHasBookingType] = useState(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("setup_booking_type") !== "false") ||
      true,
  );
  const [hasAvailability, setHasAvailability] = useState(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("setup_availability") !== "false") ||
      true,
  );
  const [workspaceId, setWorkspaceId] = useState<string | null>(
    () =>
      (typeof window !== "undefined" && localStorage.getItem("workspace_id")) ||
      null,
  );
  const [workspaceSlug, setWorkspaceSlug] = useState(
    () =>
      (typeof window !== "undefined" && localStorage.getItem("workspace_slug")) ||
      "",
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  async function createWorkspace() {
    setLoading(true);
    setMsg("");

    if (!emailChannel && !smsChannel) {
      setLoading(false);
      setMsg("At least one communication channel is required (email or SMS).");
      return;
    }

    const slug =
      slugify(name || "workspace") + "-" + Math.floor(Math.random() * 1000);

    const { data, error } = await supabase
      .from("workspaces")
      .insert([{ name, slug, timezone, contact_email: email, is_active: false }])
      .select()
      .single();

    if (error) {
      setLoading(false);
      return setMsg(error.message);
    }

    localStorage.setItem("workspace_id", data.id);
    localStorage.setItem("workspace_slug", data.slug);
    localStorage.setItem("workspace_address", address);
    localStorage.setItem("channel_email", String(emailChannel));
    localStorage.setItem("channel_sms", String(smsChannel));
    localStorage.setItem("setup_booking_type", String(hasBookingType));
    localStorage.setItem("setup_availability", String(hasAvailability));
    setWorkspaceId(data.id);
    setWorkspaceSlug(data.slug);
    setLoading(false);
    setMsg("Workspace created. Complete checks below, then activate.");
  }

  async function activateWorkspace() {
    setLoading(true);
    setMsg("");

    if (!workspaceId) {
      setLoading(false);
      setMsg("Create workspace first.");
      return;
    }
    if (!emailChannel && !smsChannel) {
      setLoading(false);
      setMsg("Activation blocked: at least one communication channel is required.");
      return;
    }
    if (!hasBookingType || !hasAvailability) {
      setLoading(false);
      setMsg("Activation blocked: booking type and availability must be configured.");
      return;
    }

    const { error } = await supabase
      .from("workspaces")
      .update({ is_active: true })
      .eq("id", workspaceId);

    setLoading(false);
    if (error) return setMsg(error.message);
    setMsg("Workspace activated.");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-slate-900 rounded-xl p-6 border border-slate-800">
        <h1 className="text-2xl font-semibold">CareOps Onboarding</h1>
        <p className="text-slate-300 mt-1">Business owner setup flow</p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full p-3 rounded bg-slate-800 border border-slate-700"
            placeholder="Business Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full p-3 rounded bg-slate-800 border border-slate-700"
            placeholder="Business Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <input
            className="w-full p-3 rounded bg-slate-800 border border-slate-700"
            placeholder="Contact Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full p-3 rounded bg-slate-800 border border-slate-700"
            placeholder="Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="p-3 rounded bg-slate-800 border border-slate-700 flex items-center gap-2">
              <input
                type="checkbox"
                checked={emailChannel}
                onChange={(e) => setEmailChannel(e.target.checked)}
              />
              Email channel
            </label>
            <label className="p-3 rounded bg-slate-800 border border-slate-700 flex items-center gap-2">
              <input
                type="checkbox"
                checked={smsChannel}
                onChange={(e) => setSmsChannel(e.target.checked)}
              />
              SMS channel
            </label>
            <label className="p-3 rounded bg-slate-800 border border-slate-700 flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasBookingType}
                onChange={(e) => setHasBookingType(e.target.checked)}
              />
              Booking type created
            </label>
            <label className="p-3 rounded bg-slate-800 border border-slate-700 flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasAvailability}
                onChange={(e) => setHasAvailability(e.target.checked)}
              />
              Availability defined
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={createWorkspace}
              disabled={loading || !name || !email}
              className="w-full p-3 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Workspace"}
            </button>
            <button
              onClick={activateWorkspace}
              disabled={loading || !workspaceId}
              className="w-full p-3 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            >
              Activate Workspace
            </button>
          </div>

          {msg && <p className="text-red-400 text-sm">{msg}</p>}

          <p className="text-xs text-slate-400">
            Workspace: {workspaceId ? `${workspaceSlug || "configured"}` : "not created"}
          </p>
        </div>
      </div>
    </div>
  );
}
