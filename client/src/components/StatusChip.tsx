import type { ReactNode } from "react";

const TONES: Record<string, string> = {
  ok: "border-wasabi-600 text-wasabi-600",
  warn: "border-kraft-600 text-kraft-700",
  bad: "border-red-800/60 text-red-900",
  idle: "border-ink-500/50 text-ink-500",
};

export function StatusChip({
  tone = "idle",
  children,
}: {
  tone?: "ok" | "warn" | "bad" | "idle";
  children: ReactNode;
}) {
  return (
    <span
      className={`stamp uppercase ${TONES[tone]} inline-flex items-center gap-1.5`}
      role="status"
    >
      <span aria-hidden className="inline-block size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}