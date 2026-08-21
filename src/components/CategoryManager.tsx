"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { PlusIcon, TrashIcon } from "@/components/icons";

type Props = {
  categories: Category[];
};

export default function CategoryManager({ categories }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [color, setColor] = useState("#6366f1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [editColor, setEditColor] = useState("#6366f1");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  async function create(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!name.trim()) {
      showToast("error", "Enter a category name");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, color }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      showToast("error", data.error ?? "Failed to create category");
      return;
    }
    showToast("success", "Category created");
    setName("");
    setType("EXPENSE");
    setColor("#6366f1");
    router.refresh();
  }

  async function rename(id: string) {
    if (!editName.trim()) {
      showToast("error", "Name is required");
      return;
    }
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, type: editType, color: editColor }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error ?? "Update failed");
      return;
    }
    showToast("success", "Category updated");
    setEditingId(null);
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error ?? "Delete failed");
      return;
    }
    showToast("success", "Category deleted");
    router.refresh();
  }

  const inputClass =
    "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Categories</h2>

      <form onSubmit={create} className="mt-4 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Groceries"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")}
            className={inputClass}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-300"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add
        </button>
      </form>

      <ul className="mt-4 divide-y divide-zinc-100">
        {categories.map((c) =>
          editingId === c.id ? (
            <li key={c.id} className="flex flex-wrap items-center gap-2 py-2.5">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClass + " w-40"}
              />
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as "INCOME" | "EXPENSE")}
                className={inputClass}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-300"
              />
              <button
                onClick={() => rename(c.id)}
                className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="rounded border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
            </li>
          ) : (
            <li key={c.id} className="flex items-center gap-2 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="flex-1 text-sm text-zinc-800">{c.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.type === "INCOME" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {c.type === "INCOME" ? "Income" : "Expense"}
              </span>
              {c.budget && (
                <span className="text-xs text-zinc-500">budget set</span>
              )}
              <button
                onClick={() => {
                  setEditingId(c.id);
                  setEditName(c.name);
                  setEditType(c.type);
                  setEditColor(c.color);
                }}
                className="rounded px-2 py-1 text-xs text-indigo-600 transition hover:bg-indigo-50"
              >
                Edit
              </button>
              <button
                onClick={() => remove(c.id)}
                className="rounded px-2 py-1 text-xs text-red-600 transition hover:bg-red-50"
                aria-label={`Delete ${c.name}`}
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}