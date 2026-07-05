"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      const requested = new URLSearchParams(window.location.search).get("callbackUrl");
      const destination = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/listings";
      router.push(destination);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-sm mt-16 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-emerald-500"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
