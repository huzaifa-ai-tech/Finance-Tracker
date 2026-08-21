"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, Transaction } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import TransactionForm from "@/components/TransactionForm";
import { DownloadIcon, PlusIcon, TrashIcon, XIcon } from "@/components/icons";

type Props = {
  categories: Category[];
};

export default function TransactionsView({ categories }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(50);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.set("categoryId", categoryId);
      if (type) params.set("type", type);
      if (q) params.set("q", q);
      params.set("limit", String(limit));
      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to load transactions");
        return;
      }
      setTransactions(data.transactions);
      setError(null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [categoryId, type, q, limit]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const params = new URLSearchParams();
        if (categoryId) params.set("categoryId", categoryId);
        if (type) params.set("type", type);
        if (q) params.set("q", q);
        params.set("limit", String(limit));
        const res = await fetch(`/api/transactions?${params}`);
        const data = await res.json().catch(() => ({}));
        if (ignore) return;
        if (!res.ok) {
          setError(data.error ?? "Failed to load transactions");
          return;
        }
        setTransactions(data.transactions);
        setError(null);
      } catch {
        if (!ignore) setError("Network error. Please try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [categoryId, type, q, limit]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === transactions.length ? new Set() : new Set(transactions.map((t) => t.id)),
    );
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    const res = await fetch("/api/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error ?? "Delete failed");
      return;
    }
    showToast("success", `Deleted ${data.deleted} transaction${data.deleted === 1 ? "" : "s"}`);
    setSelected(new Set());
    setEditing(null);
    setShowForm(false);
    load();
  }

  async function deleteOne(id: string) {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error ?? "Delete failed");
      return;
    }
    showToast("success", "Transaction deleted");
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    load();
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (exportFrom) params.set("from", `${exportFrom}T00:00:00.000Z`);
    if (exportTo) params.set("to", `${exportTo}T00:00:00.000Z`);
    const qs = params.toString();
    const anchor = document.createElement("a");
    anchor.href = `/api/export${qs ? `?${qs}` : ""}`;
    anchor.click();
  }

  const selectClass =
    "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Transactions</h1>
          <p className="text-sm text-zinc-500">Add, edit, filter and export your money movements.</p>
        </div>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setEditing(null);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add transaction
        </button>
      </div>

      {showForm && (
        <TransactionForm
          categories={categories}
          editing={editing}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
          onCancelEdit={() => {
            setEditing(null);
            setShowForm(false);
          }}
        />
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Category</label>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSelected(new Set());
              setLoading(true);
            }}
            className={selectClass}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Type</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setSelected(new Set());
              setLoading(true);
            }}
            className={selectClass}
          >
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Search note</label>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSelected(new Set());
              setLoading(true);
            }}
            placeholder="e.g. salary"
            className={selectClass + " w-44"}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Show</label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setLoading(true);
            }}
            className={selectClass}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
        </div>
        <div className="ml-auto flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">From</label>
            <input
              type="date"
              value={exportFrom}
              onChange={(e) => setExportFrom(e.target.value)}
              className={selectClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">To</label>
            <input
              type="date"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              className={selectClass}
            />
          </div>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            <DownloadIcon className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <span className="text-sm font-medium text-indigo-800">
            {selected.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm text-indigo-700 transition hover:bg-indigo-100"
            >
              <XIcon className="h-3.5 w-3.5" />
              Clear
            </button>
            <button
              onClick={bulkDelete}
              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Delete selected
            </button>
          </div>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            No transactions match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === transactions.length && transactions.length > 0}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-zinc-300 accent-indigo-600"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const isIncome = t.category.type === "INCOME";
                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-zinc-100 transition hover:bg-zinc-50 ${
                        selected.has(t.id) ? "bg-indigo-50/60" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggle(t.id)}
                          className="h-4 w-4 rounded border-zinc-300 accent-indigo-600"
                          aria-label={`Select ${t.id}`}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                        {formatDate(t.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: t.category.color }}
                          />
                          <span className="text-zinc-800">{t.category.name}</span>
                        </span>
                      </td>
                      <td className="max-w-[12rem] truncate px-4 py-3 text-zinc-500">{t.note ?? "—"}</td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                          isIncome ? "text-emerald-600" : "text-zinc-900"
                        }`}
                      >
                        {isIncome ? "+" : "−"}
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setEditing(t);
                            setShowForm(true);
                          }}
                          className="rounded px-2 py-1 text-xs text-indigo-600 transition hover:bg-indigo-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteOne(t.id)}
                          className="ml-1 rounded px-2 py-1 text-xs text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}