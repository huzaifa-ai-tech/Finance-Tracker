"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoutIcon } from "@/components/icons";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
    >
      <LogoutIcon className="h-4 w-4" />
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}