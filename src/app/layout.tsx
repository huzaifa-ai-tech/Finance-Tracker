import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { getSessionUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import { LogoIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Track your income, expenses and budgets in Pakistani Rupees.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-indigo-50 text-zinc-900 antialiased">
        <ToastProvider>
          <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <LogoIcon className="h-5 w-5" />
                </span>
                <span>Finance Tracker</span>
              </Link>
              <nav className="flex items-center gap-4">
                {user ? (
                  <>
                    <Link
                      href="/transactions"
                      className="text-sm text-zinc-600 transition hover:text-zinc-900"
                    >
                      Transactions
                    </Link>
                    <Link
                      href="/settings"
                      className="text-sm text-zinc-600 transition hover:text-zinc-900"
                    >
                      Settings
                    </Link>
                    <LogoutButton />
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                  >
                    Sign in
                  </Link>
                )}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}