"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Market
        </Link>

        <div className="hidden sm:flex items-center gap-6">
          <Link href="/listings" className="text-sm font-medium hover:text-blue-600">
            Browse
          </Link>
          {session ? (
            <>
              <Link
                href="/listings/new"
                className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Sell
              </Link>
              <Link href="/messages" className="text-sm font-medium hover:text-blue-600">
                Messages
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold">
                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm hover:bg-zinc-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-zinc-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/signin" className="text-sm font-medium hover:text-blue-600">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        <button
          className="sm:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t sm:hidden px-4 py-3 space-y-2">
          <Link href="/listings" className="block py-1 text-sm" onClick={() => setMenuOpen(false)}>
            Browse
          </Link>
          {session ? (
            <>
              <Link href="/listings/new" className="block py-1 text-sm" onClick={() => setMenuOpen(false)}>
                + Sell
              </Link>
              <Link href="/messages" className="block py-1 text-sm" onClick={() => setMenuOpen(false)}>
                Messages
              </Link>
              <Link href="/profile" className="block py-1 text-sm" onClick={() => setMenuOpen(false)}>
                Profile
              </Link>
              <button onClick={() => signOut()} className="block py-1 text-sm text-red-600">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="block py-1 text-sm" onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>
              <Link href="/auth/signup" className="block py-1 text-sm" onClick={() => setMenuOpen(false)}>
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
