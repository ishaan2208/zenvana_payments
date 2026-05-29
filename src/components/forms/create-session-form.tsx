"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type QuoteData = {
  bookingId: number;
  anchorOrderId: number | null;
  bookingDue: number;
  ordersDueTotal: number;
  totalDue: number;
};

const modeEnum = z.enum(["BOOKING_ONLY", "ORDERS_ONLY", "BOTH"]);
const collectionEnum = z.enum(["PAYMENT_LINK", "CHECKOUT_REDIRECT"]);

type CreateSessionInput = {
  bookingId?: number;
  orderId?: number;
  modeSelection: "BOOKING_ONLY" | "ORDERS_ONLY" | "BOTH";
  collectionType: "PAYMENT_LINK" | "CHECKOUT_REDIRECT";
  amountRequested: number;
};

export default function CreateSessionForm({
  quote,
  onSubmit,
}: {
  quote: QuoteData;
  onSubmit: (input: CreateSessionInput) => Promise<void>;
}) {
  const schema = z
    .object({
      modeSelection: modeEnum,
      collectionType: collectionEnum,
      amountRequested: z.number().positive(),
    })
    .superRefine((val, ctx) => {
      if (
        val.modeSelection === "BOTH" &&
        Number(val.amountRequested) !== Number(quote.totalDue)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amountRequested"],
          message: "Amount must equal exact due for BOTH mode",
        });
      }
    });

  type FormInput = z.infer<typeof schema>;

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      modeSelection: "BOTH",
      collectionType: "CHECKOUT_REDIRECT",
      amountRequested: quote.totalDue,
    },
  });

  const mode = form.watch("modeSelection");

  return (
    <form
      className="mt-4 flex flex-col gap-4 rounded-md border p-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          bookingId: quote.bookingId,
          orderId: quote.anchorOrderId ?? undefined,
          modeSelection: values.modeSelection,
          collectionType: values.collectionType,
          amountRequested: Number(values.amountRequested),
        });
      })}
    >
      <label className="flex flex-col gap-1 text-sm">
        Mode Selection
        <select
          aria-label="Mode Selection"
          className="h-9 rounded-md border px-3 text-sm"
          {...form.register("modeSelection")}
        >
          <option value="BOOKING_ONLY">BOOKING_ONLY</option>
          <option value="ORDERS_ONLY">ORDERS_ONLY</option>
          <option value="BOTH">BOTH</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Collection Type
        <select
          aria-label="Collection Type"
          className="h-9 rounded-md border px-3 text-sm"
          {...form.register("collectionType")}
        >
          <option value="CHECKOUT_REDIRECT">CHECKOUT_REDIRECT</option>
          <option value="PAYMENT_LINK">PAYMENT_LINK</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Amount
        <Input
          aria-label="Amount"
          type="number"
          step="0.01"
          {...form.register("amountRequested", { valueAsNumber: true })}
        />
      </label>

      <p className="text-xs text-muted-foreground">
        Due summary: booking ₹{quote.bookingDue}, orders ₹{quote.ordersDueTotal}, total
        ₹{quote.totalDue}.{" "}
        {mode === "BOTH" ? "BOTH requires exact total amount." : "Partial is allowed."}
      </p>

      <Button type="submit">Create Session</Button>
    </form>
  );
}
