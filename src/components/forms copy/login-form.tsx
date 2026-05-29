"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Lock, User, Eye, EyeOff } from "lucide-react";
import { type LoginInput } from "@/lib/schemas";

/**
 * Emits { username, password } matching LoginInput.
 * Uses local state only (no react-hook-form dependency) so it drops in cleanly.
 */
export default function LoginForm({
  onSubmit,
}: {
  onSubmit: (input: LoginInput) => void | Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const valid = username.trim().length > 0 && password.length > 0;

  const submit = async () => {
    setTouched(true);
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ username: username.trim(), password } as LoginInput);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5 text-left">
      <div>
        <label className="field-label mb-1.5 block">Username</label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-muted-foreground" />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            autoComplete="username"
            placeholder="front.desk"
            className="h-12 w-full rounded-2xl border border-input bg-card/70 pl-11 pr-4 text-[15px] text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/20"
          />
        </div>
      </div>

      <div>
        <label className="field-label mb-1.5 block">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-muted-foreground" />
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-12 w-full rounded-2xl border border-input bg-card/70 pl-11 pr-11 text-[15px] text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/20"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {touched && !valid ? (
        <p className="text-xs text-destructive">Enter both username and password.</p>
      ) : null}

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => void submit()}
        disabled={submitting}
        className="mt-2 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[15px] font-semibold text-accent-foreground shadow-[0_14px_30px_-14px_var(--accent)] transition hover:brightness-105 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="size-[18px] animate-spin" /> Signing in…
          </>
        ) : (
          <>
            Sign in <ArrowRight className="size-[18px]" />
          </>
        )}
      </motion.button>
    </div>
  );
}
