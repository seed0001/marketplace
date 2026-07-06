"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-zinc-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-base font-bold text-white shadow-sm">
            V
          </span>
          <span className="text-xl font-bold tracking-tight">VibeMarket</span>
        </Link>

        <div className="hidden sm:flex items-center gap-6">
          {session ? (
            <>
              <Link href="/listings" className="text-sm font-medium text-zinc-400 hover:text-emerald-500 transition-colors">
                Browse
              </Link>
              <Link
                href="/listings/new"
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                + Sell
              </Link>
              <Link href="/seller/studio" className="text-sm font-medium text-violet-300 hover:text-violet-200 transition-colors">
                Seller AI
              </Link>
              <Link href="/messages" className="text-sm font-medium text-zinc-400 hover:text-emerald-500 transition-colors">
                Messages
              </Link>
              <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-sm font-semibold text-emerald-200">
                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
                    {(session.user.role === "STAFF" || session.user.role === "ADMIN") && (
                      <>
                        <Link href="/staff/roster" className="block px-4 py-2 text-sm text-emerald-300 hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>Site roster</Link>
                        <Link href="/staff/content" className="block px-4 py-2 text-sm text-emerald-300 hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>Manage content</Link>
                        <Link href="/staff/issues" className="block px-4 py-2 text-sm text-emerald-300 hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>Issue reports</Link>
                        <Link href="/staff/notifications" className="block px-4 py-2 text-sm text-emerald-300 hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>Broadcasts</Link>
                        {session.user.role === "ADMIN" && <Link href="/staff/discord" className="block px-4 py-2 text-sm text-indigo-300 hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>Discord control</Link>}
                        <Link href="/staff/analytics" className="block px-4 py-2 text-sm text-emerald-300 hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>Intelligence</Link>
                      </>
                    )}
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/signin" className="text-sm font-medium text-zinc-400 hover:text-emerald-500 transition-colors">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        <button
          className="sm:hidden p-2 text-zinc-400"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border sm:hidden px-4 py-3 space-y-2 bg-surface">
          {session ? (
            <>
              <Link href="/listings" className="block py-1 text-sm text-zinc-300" onClick={() => setMenuOpen(false)}>
                Browse
              </Link>
              <Link href="/listings/new" className="block py-1 text-sm text-zinc-300" onClick={() => setMenuOpen(false)}>
                + Sell
              </Link>
              <Link href="/seller/studio" className="block py-1 text-sm text-violet-300" onClick={() => setMenuOpen(false)}>
                Seller AI
              </Link>
              <Link href="/messages" className="block py-1 text-sm text-zinc-300" onClick={() => setMenuOpen(false)}>
                Messages
              </Link>
              <Link href="/notifications" className="block py-1 text-sm text-zinc-300" onClick={() => setMenuOpen(false)}>
                Updates
              </Link>
              <Link href="/profile" className="block py-1 text-sm text-zinc-300" onClick={() => setMenuOpen(false)}>
                Profile
              </Link>
              {(session.user.role === "STAFF" || session.user.role === "ADMIN") && (
                <>
                  <Link href="/staff/roster" className="block py-1 text-sm text-emerald-300" onClick={() => setMenuOpen(false)}>Site roster</Link>
                  <Link href="/staff/content" className="block py-1 text-sm text-emerald-300" onClick={() => setMenuOpen(false)}>Manage content</Link>
                  <Link href="/staff/issues" className="block py-1 text-sm text-emerald-300" onClick={() => setMenuOpen(false)}>Issue reports</Link>
                  <Link href="/staff/notifications" className="block py-1 text-sm text-emerald-300" onClick={() => setMenuOpen(false)}>Broadcasts</Link>
                  {session.user.role === "ADMIN" && <Link href="/staff/discord" className="block py-1 text-sm text-indigo-300" onClick={() => setMenuOpen(false)}>Discord control</Link>}
                  <Link href="/staff/analytics" className="block py-1 text-sm text-emerald-300" onClick={() => setMenuOpen(false)}>Intelligence</Link>
                </>
              )}
              <button onClick={() => signOut()} className="block py-1 text-sm text-red-400">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="block py-1 text-sm text-zinc-300" onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>
              <Link href="/auth/signup" className="block py-1 text-sm text-zinc-300" onClick={() => setMenuOpen(false)}>
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
