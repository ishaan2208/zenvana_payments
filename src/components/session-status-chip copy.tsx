"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Coins, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = {
  className: string;
  Icon: React.ComponentType<{ className?: string }>;
};

function toneFor(status: string): Tone {
  const s = status.toUpperCase();
  if (s.includes("CAPTUR") || s.includes("PAID") || s.includes("SUCCESS"))
    return { className: "text-success bg-success/12 border-success/25", Icon: CheckCircle2 };
  if (s.includes("APPLIED") || s.includes("SETTLED"))
    return { className: "text-chart-3 bg-chart-3/12 border-chart-3/25", Icon: Coins };
  if (s.includes("FAIL") || s.includes("CANCEL") || s.includes("EXPIRED"))
    return { className: "text-destructive bg-destructive/12 border-destructive/25", Icon: XCircle };
  return { className: "text-amber-500 bg-amber-500/12 border-amber-500/25", Icon: Clock };
}

export function SessionStatusChip({ status }: { status: string }) {
  const { className, Icon } = toneFor(status);
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]",
        className
      )}
    >
      <Icon className="size-3.5" />
      {status}
    </motion.span>
  );
}

export default SessionStatusChip;
