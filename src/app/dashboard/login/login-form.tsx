"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-8 flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-semibold">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="rounded-lg border border-pine/25 bg-sage/60 px-4 py-3 focus:border-pine focus:outline-none focus:ring-4 focus:ring-sunrise/20"
      />
      {error && <p role="alert" className="text-sm text-[#b4532f]">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-pine px-5 py-3 font-semibold text-white hover:bg-[#264d42] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
