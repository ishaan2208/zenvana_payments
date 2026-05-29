"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type QuoteData = {
  queueItemType?: "BOOKING" | "ORDER";
  queueItemId?: number;
  bookingId: number | null;
  anchorOrderId: number | null;
  bookingDue: number;
  ordersDueTotal: number;
  totalDue: number;
  allowedModes?: Array<"BOOKING_ONLY" | "ORDERS_ONLY" | "BOTH">;
};

const modeEnum = z.enum(["BOOKING_ONLY", "ORDERS_ONLY", "BOTH"]);
const collectionEnum = z.enum(["PAYMENT_LINK", "CHECKOUT_REDIRECT"]);

type CreateSessionInput = {
  queueItemType?: "BOOKING" | "ORDER";
  queueItemId?: number;
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
      modeSelection: quote.allowedModes?.includes("BOTH")
        ? "BOTH"
        : quote.allowedModes?.[0] ?? "BOTH",
      collectionType: "CHECKOUT_REDIRECT",
      amountRequested: quote.totalDue,
    },
  });

  const mode = useWatch({ control: form.control, name: "modeSelection" });
  const isFixedAmountMode = mode === "BOTH" || mode === "ORDERS_ONLY";

  const suggestedAmount =
    mode === "BOOKING_ONLY"
      ? quote.bookingDue
      : mode === "ORDERS_ONLY"
        ? quote.ordersDueTotal
        : quote.totalDue;

  useEffect(() => {
    if (mode === "BOTH" || mode === "ORDERS_ONLY") {
      form.setValue("amountRequested", suggestedAmount, { shouldValidate: true });
      return;
    }
    const current = form.getValues("amountRequested");
    if (!Number.isFinite(current) || current <= 0 || current === quote.totalDue) {
      form.setValue("amountRequested", suggestedAmount, { shouldValidate: true });
    }
  }, [form, mode, quote.totalDue, suggestedAmount]);

  return (
    <form
      className="quiet-card flex flex-col gap-4 p-4 sm:p-5"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          queueItemType: quote.queueItemType,
          queueItemId: quote.queueItemId,
          modeSelection: values.modeSelection,
          collectionType: values.collectionType,
          amountRequested: Number(values.amountRequested),
        });
      })}
    >
      <div>
        <p className="field-label">Session config</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Create payment session</h2>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="field-label">Mode Selection</span>
        <Select
          aria-label="Mode Selection"
          {...form.register("modeSelection")}
        >
          {(quote.allowedModes ?? ["BOOKING_ONLY", "ORDERS_ONLY", "BOTH"]).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="field-label">Collection Type</span>
        <Select
          aria-label="Collection Type"
          {...form.register("collectionType")}
        >
          <option value="CHECKOUT_REDIRECT">CHECKOUT_REDIRECT</option>
          <option value="PAYMENT_LINK">PAYMENT_LINK</option>
        </Select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="field-label">Amount</span>
        <Input
          aria-label="Amount"
          type="number"
          step="0.01"
          className="h-10 rounded-xl"
          disabled={isFixedAmountMode}
          {...form.register("amountRequested", { valueAsNumber: true })}
        />
        <span className="text-xs text-muted-foreground">
          Suggested: ₹{suggestedAmount}
          {isFixedAmountMode ? ` (locked for ${mode} mode)` : ""}
        </span>
      </label>

      <p
        className={[
          "rounded-xl border p-3 text-xs",
          isFixedAmountMode
            ? "border-amber-400/50 bg-amber-400/10 text-amber-800 dark:text-amber-300"
            : "border-border/60 bg-background text-muted-foreground",
        ].join(" ")}
      >
        Due summary: booking ₹{quote.bookingDue}, orders ₹{quote.ordersDueTotal}, total
        ₹{quote.totalDue}.{" "}
        {isFixedAmountMode
          ? `${mode} mode requires exact amount. Partial amount is disabled.`
          : "Partial amount is allowed in this mode."}
      </p>

      <Button type="submit" className="h-10 rounded-xl">
        Create Session
      </Button>
    </form>
  );
}
