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
      phone: "",
      password: "",
    },
  });

  return (
    <form
      className="flex w-full max-w-md flex-col gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <label className="flex flex-col gap-1 text-sm">
        Phone
        <Input aria-label="Phone" {...form.register("phone")} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <Input aria-label="Password" type="password" {...form.register("password")} />
      </label>
      <Button type="submit">Login</Button>
    </form>
  );
}
