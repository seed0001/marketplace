import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2 text-zinc-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-base font-bold text-white">
                M
              </span>
              <span className="text-lg font-bold tracking-tight">Marketplace</span>
            </Link>
            <p className="mt-3 text-sm text-muted">
              The marketplace for developers. Buy, sell, and trade dev tools,
              domains, side projects, and more.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Explore
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/listings" className="text-zinc-600 hover:text-emerald-600 transition-colors">
                  Browse listings
                </Link>
              </li>
              <li>
                <Link href="/listings/new" className="text-zinc-600 hover:text-emerald-600 transition-colors">
                  Sell something
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Account
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/auth/signin" className="text-zinc-600 hover:text-emerald-600 transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="text-zinc-600 hover:text-emerald-600 transition-colors">
                  Create account
                </Link>
              </li>
              <li>
                <Link href="/messages" className="text-zinc-600 hover:text-emerald-600 transition-colors">
                  Messages
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              About
            </h3>
            <p className="mt-3 text-sm text-muted">
              A community-run marketplace built by developers, for developers.
              List in minutes, message buyers directly, close the deal.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row">
          <p>&copy; {year} Marketplace. All rights reserved.</p>
          <p>Built for developers.</p>
        </div>
      </div>
    </footer>
  );
}
