"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Category, Stats } from "@/lib/types";
import { currentMonthKey, formatCurrency, monthLabel } from "@/lib/format";
import BudgetsCard from "@/components/BudgetsCard";
import { AlertIcon } from "@/components/icons";

const PIE_COLORS = [
  "#f87171",
  "#fbbf24",
  "#60a5fa",
  "#4ade80",
  "#f472b6",
  "#c084fc",
  "#38bdf8",
  "#fb7185",
  "#a3e635",
  "#34d399",
  "#e879f9",
];

function currencyTooltip(value: unknown) {
  return <span>{formatCurrency(Number(value ?? 0))}</span>;
}

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonthKey());
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [statsRes, catsRes] = await Promise.all([
        fetch(`/api/stats?month=${month}`),
        fetch("/api/categories"),
      ]);
      const statsData = await statsRes.json().catch(() => ({}));
      const catsData = await catsRes.json().catch(() => ({}));
      if (!statsRes.ok) {
        setError(statsData.error ?? "Failed to load stats");
        return;
      }
      setStats(statsData);
      setCategories(catsData.categories ?? []);
      setError(null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const [statsRes, catsRes] = await Promise.all([
          fetch(`/api/stats?month=${month}`),
          fetch("/api/categories"),
        ]);
        const statsData = await statsRes.json().catch(() => ({}));
        const catsData = await catsRes.json().catch(() => ({}));
        if (ignore) return;
        if (!statsRes.ok) {
          setError(statsData.error ?? "Failed to load stats");
          return;
        }
        setStats(statsData);
        setCategories(catsData.categories ?? []);
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
  }, [month]);

  function changeMonth(dir: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + dir, 1));
    setLoading(true);
    setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  function monthPicker() {
    return month;
  }

  function onChangeMonthPicker(value: string) {
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    const [y, m] = value.split("-").map(Number);
    if (!m || !y) return;
    setLoading(true);
    setMonth(`${y}-${String(m).padStart(2, "0")}`);
  }

  if (loading && !stats) {
    return <div className="p-10 text-center text-sm text-zinc-500">Loading dashboard...</div>;
  }

  if (error && !stats) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <AlertIcon className="h-4 w-4" />
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const { totals, monthly, byCategory, budgets } = stats;
  const expenseByCategory = byCategory
    .filter((b) => b.category.type === "EXPENSE")
    .map((b) => ({ name: b.category.name, color: b.category.color, value: b.total }));
  const chartData = monthly.map((m) => ({
    name: m.label,
    income: m.income / 100,
    expense: m.expense / 100,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500">Your money at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50"
            aria-label="Previous month"
          >
            ‹
          </button>
          <input
            type="month"
            value={monthPicker()}
            onChange={(e) => onChangeMonthPicker(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            onClick={() => changeMonth(1)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Income</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {formatCurrency(totals.income)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Expenses</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {formatCurrency(totals.expense)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Net for {monthLabel(month)}</p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              totals.balance >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formatCurrency(totals.balance)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-900">6-month overview</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `Rs ${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={currencyTooltip} cursor={{ fill: "#f4f4f5" }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Spending by category</h2>
          {expenseByCategory.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No expenses this month.</p>
          ) : (
            <>
              <div className="mt-2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      strokeWidth={2}
                    >
                      {expenseByCategory.map((entry, i) => (
                        <Cell key={entry.name} fill={entry.color ?? PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={currencyTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5">
                {expenseByCategory.slice(0, 5).map((b, i) => (
                  <li key={b.name} className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 text-zinc-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: b.color ?? PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      {b.name}
                    </span>
                    <span className="font-medium text-zinc-800">{formatCurrency(b.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <BudgetsCard budgets={budgets} categories={categories} onChanged={load} />
    </div>
  );
}