"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mx-auto mt-24 w-full max-w-sm rounded-2xl border border-line bg-card p-8">
      <h1 className="font-serif text-[30px] leading-tight">Admin</h1>
      <p className="mt-1 text-[14px] text-ink-soft">Sign in to manage sponsor lists.</p>
      <label htmlFor="password" className="label mt-6">Password</label>
      <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className="field" />
      {state?.error && <p role="alert" className="mt-3 text-[13.5px] text-[#a33a2b]">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary mt-6 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
