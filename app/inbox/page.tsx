"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ContactRef = {
  name: string | null;
  email: string | null;
};

type Conversation = {
  id: string;
  automation_paused: boolean;
  contacts: ContactRef | ContactRef[] | null;
};

type Message = {
  id: string;
  direction: "in" | "out";
  body: string;
};

export default function Inbox() {
  const [workspaceId] = useState<string | null>(
    () =>
      (typeof window !== "undefined" && localStorage.getItem("workspace_id")) ||
      null,
  );
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [reply, setReply] = useState("");

  async function loadConvos(id: string) {
    const { data } = await supabase
      .from("conversations")
      .select("id, automation_paused, contacts(name,email)")
      .eq("workspace_id", id)
      .order("last_message_at", { ascending: false });

    setConvos((data as Conversation[]) || []);
  }

  async function openConvo(c: Conversation) {
    setActive(c);
    const { data } = await supabase
      .from("messages")
      .select("id, direction, body")
      .eq("conversation_id", c.id)
      .order("created_at", { ascending: true });
    setMsgs((data as Message[]) || []);
  }

  async function sendReply() {
    if (!active || !reply) return;
    await supabase.from("messages").insert([
      {
        conversation_id: active.id,
        direction: "out",
        channel: "email",
        body: reply,
      },
    ]);

    await supabase
      .from("conversations")
      .update({ automation_paused: true })
      .eq("id", active.id);

    setReply("");
    openConvo(active);
    if (workspaceId) loadConvos(workspaceId);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (workspaceId) loadConvos(workspaceId);
  }, [workspaceId]);

  function readContact(c: Conversation) {
    const raw = c.contacts;
    if (Array.isArray(raw)) return raw[0] || null;
    return raw || null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="font-semibold">Conversations</h2>
          <div className="mt-3 space-y-2">
            {convos.map((c) => {
              const contact = readContact(c);
              return (
                <button
                  key={c.id}
                  onClick={() => openConvo(c)}
                  className="w-full text-left p-3 rounded bg-slate-800 hover:bg-slate-700"
                >
                  <div className="font-medium">{contact?.name || "Lead"}</div>
                  <div className="text-xs text-slate-300">
                    {contact?.email || ""}
                  </div>
                  <div className="text-xs mt-1">
                    Automation: {c.automation_paused ? "Paused" : "Active"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="font-semibold">Chat</h2>
          {!active ? (
            <p className="text-slate-300 mt-3">Select a conversation</p>
          ) : (
            <>
              <div className="mt-3 h-[420px] overflow-auto bg-slate-950 rounded p-3 border border-slate-800">
                {msgs.map((m) => (
                  <div
                    key={m.id}
                    className={`mb-2 ${m.direction === "out" ? "text-right" : "text-left"}`}
                  >
                    <span className="inline-block px-3 py-2 rounded bg-slate-800">
                      {m.body}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  className="flex-1 p-3 rounded bg-slate-800 border border-slate-700"
                  placeholder="Reply as staff..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <button
                  onClick={sendReply}
                  className="px-4 rounded bg-blue-600 hover:bg-blue-500"
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Staff reply pauses automation for this conversation.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
