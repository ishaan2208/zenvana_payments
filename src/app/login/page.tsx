"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoginForm from "@/components/forms/login-form";
import { apiPost } from "@/lib/api-client";
import { type LoginInput } from "@/lib/schemas";
import { getPortalToken, setPortalProfile, setPortalToken } from "@/lib/auth";
import { BrandLogo } from "@/components/brand-logo";

type LoginResponse = {
  token: string;
  profile: {
    subUserId: number;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    propertyId: number | null;
    restaurantId: number | null;
    portalScope: "PROPERTY" | "RESTAURANT";
    userId: number;
  };
};

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getPortalToken();
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (input: LoginInput) => {
    setError(null);
    try {
      const data = await apiPost<LoginResponse>("/auth/login", {
        username: input.username,
        password: input.password,
      });
      setPortalToken(data.token);
      setPortalProfile(data.profile);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Login failed"));
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="brand-gradient absolute inset-0 opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(219,230,76,0.2),transparent_45%)]" />

      <section className="quiet-card relative z-10 w-full max-w-md p-5 sm:p-6">
        <BrandLogo className="justify-center" />
        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Front office
        </p>
        <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight text-foreground">
          Staff Login
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Sign in to create and manage payment sessions.
        </p>

        <LoginForm onSubmit={handleSubmit} />
        {error ? (
          <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
