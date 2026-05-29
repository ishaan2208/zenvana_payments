"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import LoginForm from "@/components/forms/login-form";
import { apiPost } from "@/lib/api-client";
import { type LoginInput } from "@/lib/schemas";
import { getPortalToken, setPortalProfile, setPortalToken } from "@/lib/auth";

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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4 grain">
      {/* gradient hero + atmospheric orbs */}
      <div className="brand-gradient absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(219,230,76,0.28),transparent_48%)]" />
      <motion.div
        className="absolute -left-16 top-24 size-64 rounded-full bg-[#dbe64c] opacity-40 mix-blend-screen blur-2xl"
        animate={{ y: [0, 24, 0], x: [0, 14, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-24 bottom-16 size-80 rounded-full bg-[#00804c] opacity-40 mix-blend-screen blur-2xl"
        animate={{ y: [0, -28, 0], x: [0, -10, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="quiet-card relative z-10 w-full max-w-md bg-card/92 p-6 sm:p-7"
      >
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 260, damping: 18 }}
          >
            <span className="grid size-16 place-items-center rounded-[20px] brand-gradient text-[#dbe64c] shadow-[0_16px_34px_-14px_rgba(0,31,63,0.7)]">
              <Image
                src="/Zenvana%20logo/icon.svg"
                alt="Zenvana"
                width={36}
                height={36}
                className="size-9 object-contain"
                priority
              />
            </span>
          </motion.div>
        </div>

        <p className="mt-4 text-center eyebrow">Front office</p>
        <h1 className="display mt-2 text-center text-[26px] text-foreground">Staff Login</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Sign in to create and manage payment sessions.
        </p>

        <div className="mt-5">
          <LoginForm onSubmit={handleSubmit} />
        </div>

        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </motion.p>
        ) : null}

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          Secured payments by Zenvana
          <ArrowRight className="size-3" />
        </p>
      </motion.section>
    </main>
  );
}
