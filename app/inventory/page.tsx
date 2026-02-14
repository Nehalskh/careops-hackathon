"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  low_threshold: number;
};

export default function Inventory() {
  const [workspaceId] = useState<string | null>(
    () =>
      (typeof window !== "undefined" && localStorage.getItem("workspace_id")) ||
      null,
  );
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(10);
  const [th, setTh] = useState(5);

  async function load(id: string) {
    const { data } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("workspace_id", id);
    setItems(data || []);
  }

  async function add() {
    if (!workspaceId) return;
    await supabase.from("inventory_items").insert([
      {
        workspace_id: workspaceId,
        name,
        quantity: qty,
        low_threshold: th,
      },
    ]);
    setName("");
    setQty(10);
    setTh(5);
    load(workspaceId);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (workspaceId) load(workspaceId);
  }, [workspaceId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold">Inventory</h1>

        <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="font-semibold">Add item</h2>
          <div className="grid md:grid-cols-4 gap-2 mt-3">
            <input
              className="p-3 rounded bg-slate-800 border border-slate-700"
              placeholder="Item name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="p-3 rounded bg-slate-800 border border-slate-700"
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
            <input
              className="p-3 rounded bg-slate-800 border border-slate-700"
              type="number"
              value={th}
              onChange={(e) => setTh(Number(e.target.value))}
            />
            <button
              onClick={add}
              className="rounded bg-blue-600 hover:bg-blue-500"
            >
              Add
            </button>
          </div>
        </div>

        <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="font-semibold">Items</h2>
          <div className="mt-3 space-y-2">
            {items.map((i) => {
              const low = i.quantity <= i.low_threshold;
              return (
                <div
                  key={i.id}
                  className={`p-3 rounded border ${low ? "border-red-500" : "border-slate-800"} bg-slate-950`}
                >
                  <div className="font-medium">{i.name}</div>
                  <div className="text-sm text-slate-300">
                    Qty: {i.quantity} | Threshold: {i.low_threshold}{" "}
                    {low ? "- LOW STOCK" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          Low stock items appear as alerts on the dashboard.
        </p>
      </div>
    </div>
  );
}
