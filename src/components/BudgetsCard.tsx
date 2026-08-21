"use client";

import { useState, type FormEvent } from "react";
import type { BudgetStatus, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import { PlusIcon, TrashIcon } from "@/components/icons";

type Props = {
  budgets: BudgetStatus[];
  categories: Category[];
  onChanged: () => void;
};

function barColor(percent: number): string {
  if (percent >= 100) return "bg-red-500";
  if (percent >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}

export default function BudgetsCard({ budgets, categories, onChanged }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [addCategoryId, setAddCategoryId] = useState("");
  const { showToast } = useToast();

  const unassigned = categories.filter(
    (c) => c.type === "EXPENSE" && !budgets.some((b) => b.category.id === c.id),
  );

  async function saveBudget(id: string) {
    const monthlyLimit = Math.round(parseFloat(value) * 100);
    if (!value || Number.isNaN(monthlyLimit) || monthlyLimit <= 0) {
      showToast("error", "Enter a valid monthly limit");
      return;
    }
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyLimit }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error ?? "Failed to save budget");
      return;
    }
    showToast("success", "Budget updated");
    setEditingId(null);
    setValue("");
    onChanged();
  }

  async function removeBudget(id: string) {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyLimit: null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error ?? "Failed to remove budget");
      return;
    }
    showToast("success", "Budget removed");
    onChanged();
  }

  async function addBudget(e: FormEvent) {
    e.preventDefault();
    if (!addCategoryId) {
      showToast("error", "Choose a category");
      return;
    }
    const monthlyLimit = Math.round(parseFloat(value) * 100);
    if (!value || Number.isNaN(monthlyLimit) || monthlyLimit <= 0) {
      showToast("error", "Enter a valid monthly limit");
      return;
    }
    const res = await fetch(`/api/categories/${addCategoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyLimit }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error ?? "Failed to add budget");
      return;
    }
    showToast("success", "Budget added");
    setAdding(false);
    setValue("");
    setAddCategoryId("");
    onChanged();
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Monthly budgets</h2>
        {!adding && unassigned.length > 0 && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add budget
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={addBudget} className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={addCategoryId}
            onChange={(e) => setAddCategoryId(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select expense category</option>
            {unassigned.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Monthly limit (PKR)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-40 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setValue("");
              setAddCategoryId("");
            }}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
        </form>
      )}

      {budgets.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          No budgets yet. Add one to keep your spending in check.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {budgets.map((b) => (
            <li key={b.category.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: b.category.color }}
                  />
                  {b.category.name}
                </span>
                {editingId === b.category.id ? (
                  <span className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      autoFocus
                      className="w-28 rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      onClick={() => saveBudget(b.category.id)}
                      className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500">
                      {formatCurrency(b.spent)} of {formatCurrency(b.limit)}
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(b.category.id);
                        setValue((b.limit / 100).toFixed(0));
                      }}
                      className="rounded px-1.5 py-0.5 text-xs text-indigo-600 transition hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeBudget(b.category.id)}
                      className="rounded px-1.5 py-0.5 text-xs text-red-600 transition hover:bg-red-50"
                      aria-label={`Remove budget for ${b.category.name}`}
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full ${barColor(b.percent)}`}
                  style={{ width: `${Math.min(b.percent, 100)}%` }}
                />
              </div>
              <p
                className={`mt-1 text-xs ${
                  b.percent >= 100 ? "font-medium text-red-600" : b.percent >= 80 ? "text-amber-600" : "text-zinc-400"
                }`}
              >
                {b.percent}% used
                {b.percent >= 100 ? " — over budget!" : b.percent >= 80 ? " — getting close" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}