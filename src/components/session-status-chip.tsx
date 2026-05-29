const stylesByStatus: Record<string, string> = {
  CREATED: "border-amber-400/40 bg-amber-400/15 text-amber-700 dark:text-amber-300",
  PENDING: "border-blue-400/40 bg-blue-400/15 text-blue-700 dark:text-blue-300",
  PAID: "border-emerald-400/40 bg-emerald-400/15 text-emerald-700 dark:text-emerald-300",
  EXPIRED: "border-zinc-400/40 bg-zinc-400/15 text-zinc-700 dark:text-zinc-300",
  FAILED: "border-red-400/40 bg-red-400/15 text-red-700 dark:text-red-300",
};

export function SessionStatusChip({ status }: { status: string }) {
  const value = (status || "UNKNOWN").toUpperCase();
  const style = stylesByStatus[value] ?? "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em]",
        style,
      ].join(" ")}
    >
      {value}
    </span>
  );
}
