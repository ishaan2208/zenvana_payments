"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const quoteSchema = z
  .object({
    bookingId: z.string().trim().optional(),
    orderId: z.string().trim().optional(),
  })
  .superRefine((val, ctx) => {
    const hasBooking = Boolean(val.bookingId);
    const hasOrder = Boolean(val.orderId);
    if ((hasBooking && hasOrder) || (!hasBooking && !hasOrder)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter either booking ID or order ID",
      });
    }
  });

type QuoteFormInput = z.infer<typeof quoteSchema>;

export type QuoteSubmitInput = {
  bookingId?: number;
  orderId?: number;
};

export default function QuoteForm({
  onSubmit,
}: {
  onSubmit: (input: QuoteSubmitInput) => Promise<void>;
}) {
  const form = useForm<QuoteFormInput>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { bookingId: "", orderId: "" },
  });

  return (
    <form
      className="quiet-card flex flex-col gap-4 p-4 sm:p-5"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          bookingId: values.bookingId ? Number(values.bookingId) : undefined,
          orderId: values.orderId ? Number(values.orderId) : undefined,
        });
      })}
    >
      <div>
        <p className="field-label">Quote source</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Fetch due amount</h2>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="field-label">Booking ID</span>
        <Input aria-label="Booking ID" {...form.register("bookingId")} className="h-10 rounded-xl" />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="field-label">Order ID</span>
        <Input aria-label="Order ID" {...form.register("orderId")} className="h-10 rounded-xl" />
      </label>

      <Button type="submit" className="h-10 rounded-xl">
        Get Quote
      </Button>
    </form>
  );
}
