"use client";

import { useState, type FormEvent } from "react";
import type { Category, Transaction } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

type Props = {
  categories: Category[];
  editing: Transaction | null;
  onSaved: () => void;
  onCancelEdit: () => void;
};

export default function TransactionForm({ categories, editing, onSaved, onCancelEdit }: Props) {
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [amount, setAmount] = useState(editing ? (editing.amount / 100).toFixed(2) : "");
  const [date, setDate] = useState(
    editing ? editing.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState(editing?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const paise = Math.round(parseFloat(amount) * 100);
    if (!categoryId) {
      setError("Choose a category");
      return;
    }
    if (!amount || Number.isNaN(paise) || paise <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!date) {
      setError("Choose a date");
      return;
    }

    setLoading(true);
    try {
      const body = {
        categoryId,
        amount: paise,
        date: `${date}T12:00:00.000Z`,
        note: note.trim() || null,
      };
      const res = await fetch(editing ? `/api/transactions/${editing.id}` : "/api/transactions", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      showToast("success", editing ? "Transaction updated" : "Transaction added");
      onSaved();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">
          {editing ? "Edit transaction" : "Add transaction"}
        </h3>
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-sm text-zinc-500 transition hover:text-zinc-700"
          >
            Cancel edit
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="tx-category" className="mb-1 block text-sm font-medium text-zinc-700">
            Category
          </label>
          <select
            id="tx-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={selectClass}
          >
            <option value="">Select a category</option>
            {expenseCategories.length > 0 && (
              <optgroup label="Expenses">
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            )}
            {incomeCategories.length > 0 && (
              <optgroup label="Income">
                {incomeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div>
          <label htmlFor="tx-amount" className="mb-1 block text-sm font-medium text-zinc-700">
            Amount (PKR)
          </label>
          <input
            id="tx-amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={selectClass}
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="tx-date" className="mb-1 block text-sm font-medium text-zinc-700">
            Date
          </label>
          <input
            id="tx-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={selectClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="tx-note" className="mb-1 block text-sm font-medium text-zinc-700">
            Note <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <input
            id="tx-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            className={selectClass}
            placeholder="e.g. Monthly salary"
          />
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : editing ? "Save changes" : "Add transaction"}
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setNote("");
            setAmount("");
            setCategoryId("");
          }}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
        >
          Clear
        </button>
      </div>
    </form>
  );
}