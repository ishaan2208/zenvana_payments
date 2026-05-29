"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "@/lib/schemas";

type LoginFormProps = {
  onSubmit: (data: LoginInput) => Promise<void>;
};

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <form
      className="mt-5 flex w-full flex-col gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="field-label">Username</span>
        <Input aria-label="Username" {...form.register("username")} className="h-10 rounded-xl" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="field-label">Password</span>
        <Input
          aria-label="Password"
          type="password"
          {...form.register("password")}
          className="h-10 rounded-xl"
        />
      </label>
      <Button type="submit" className="mt-1 h-11 rounded-xl text-sm">
        Login
      </Button>
    </form>
  );
}
