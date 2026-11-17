"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

interface Labels {
  email: string;
  password: string;
  submit: string;
  submitting: string;
  invalid: string;
  locked: string;
  missing: string;
}

export function LoginForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, undefined);
  return (
    <form action={action} className="stack" noValidate>
      {state?.error && (
        <p className="error" role="alert">
          {labels[state.error]}
        </p>
      )}
      <label className="field">
        <span>{labels.email}</span>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </label>
      <label className="field">
        <span>{labels.password}</span>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </label>
      <button id="login-submit" className="btn pri" type="submit" disabled={pending}>
        {pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
