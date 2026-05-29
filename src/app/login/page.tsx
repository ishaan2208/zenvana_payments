"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import LoginForm from "@/components/forms/login-form";
import { apiPost } from "@/lib/api-client";
import { type LoginInput } from "@/lib/schemas";
import { setPortalToken } from "@/lib/auth";

type LoginResponse = {
  token: string;
  profile: {
    subUserId: number;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    propertyId: number | null;
    userId: number;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (input: LoginInput) => {
    setError(null);
    try {
      const data = await apiPost<LoginResponse>("/auth/login", {
        username: input.phone,
        password: input.password,
      });
      setPortalToken(data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center p-6">
      <h1 className="mb-4 text-2xl font-semibold">Front Office Login</h1>
      <LoginForm onSubmit={handleSubmit} />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
