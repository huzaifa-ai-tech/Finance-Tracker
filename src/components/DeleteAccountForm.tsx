"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

export default function DeleteAccountForm() {
  const [password, setPassword] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  async function handleDelete(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      showToast("success", "Account deleted. Sorry to see you go.");
      router.push("/login");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h3 className="text-sm font-semibold text-red-800">Danger zone</h3>
        <p className="mt-1 text-sm text-red-700">
          Deleting your account permanently removes all your categories, budgets and transactions.
        </p>
        <button
          onClick={() => setConfirming(true)}
          className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Delete my account
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-5">
      <h3 className="text-sm font-semibold text-red-800">Are you absolutely sure?</h3>
      <p className="mt-1 text-sm text-red-700">
        This cannot be undone. Enter your password to confirm.
      </p>
      <form onSubmit={handleDelete} className="mt-3 space-y-3">
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Deleting..." : "Yes, delete everything"}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setError(null);
              setPassword("");
            }}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}