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
      className="mt-4 flex flex-col gap-4 rounded-md border p-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          bookingId: values.bookingId ? Number(values.bookingId) : undefined,
          orderId: values.orderId ? Number(values.orderId) : undefined,
        });
      })}
    >
      <label className="flex flex-col gap-1 text-sm">
        Booking ID
        <Input aria-label="Booking ID" {...form.register("bookingId")} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Order ID
        <Input aria-label="Order ID" {...form.register("orderId")} />
      </label>

      <Button type="submit">Get Quote</Button>
    </form>
  );
}
