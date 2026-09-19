import type { InputHTMLAttributes, ReactNode } from "react";

export function Panel({ title, children, aside }: { title: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-lg border border-slatew-700 bg-slatew-900/80 p-4 shadow-[3px_4px_0_rgb(0_0_0/0.35)]">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl leading-none tracking-tight text-kraft-300">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="font-display text-base text-slatew-300">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none placeholder:text-slatew-500 focus:border-kraft-400 transition-colors";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

interface NumberInputProps {
  value?: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  className?: string;
  disabled?: boolean;
  title?: string;
  placeholder?: string;
}

export function NumberInput({ value, onChange, ...rest }: NumberInputProps) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? (value as number) : ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className={inputCls}
      {...rest}
    />
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slatew-200">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-10 rounded-full border transition-colors ${
          checked ? "border-kraft-400 bg-kraft-600/70" : "border-slatew-600 bg-slatew-950"
        }`}
      >
        <span
          className={`absolute top-[3px] size-3.5 rounded-full transition-all ${
            checked ? "left-[22px] bg-kraft-50" : "left-[3px] bg-slatew-400"
          }`}
        />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}

const BTN_TONES: Record<string, string> = {
  primary:
    "border-kraft-500 bg-kraft-600/25 text-kraft-100 hover:bg-kraft-600/40 focus-visible:border-kraft-300",
  warn: "border-slatew-400 bg-slatew-600/25 text-slatew-100 hover:bg-slatew-600/45",
  danger: "border-red-500/70 bg-red-900/30 text-red-200 hover:bg-red-800/50",
  ghost: "border-slatew-600 text-slatew-200 hover:bg-slatew-800/60",
};

export function Btn({
  tone = "primary",
  className = "",
  children,
  onClick,
  disabled,
  type = "button",
  title,
}: {
  tone?: "primary" | "warn" | "danger" | "ghost";
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
}) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`${BTN_TONES[tone]} inline-flex items-center gap-2 rounded-md border-[1.5px] px-3.5 py-1.5 text-sm font-semibold shadow-[2px_2px_0_rgb(0_0_0/0.35)] transition-all hover:-translate-px active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0px_0px_0_rgb(0_0_0/0.35)] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

const BADGE_TONES: Record<string, string> = {
  ok: "border-kraft-400 text-kraft-200 bg-kraft-600/20",
  bad: "border-red-500/70 text-red-300 bg-red-900/30",
  warn: "border-slatew-400 text-slatew-200 bg-slatew-700/40",
  idle: "border-slatew-600 text-slatew-400 bg-slatew-900/60",
};

export function Badge({ tone = "idle", children }: { tone?: "ok" | "bad" | "warn" | "idle"; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border-[1.5px] px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Empty({ label }: { label: string }) {
  return <p className="py-6 text-center text-sm text-slatew-500">— {label} —</p>;
}
