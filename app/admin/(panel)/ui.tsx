import type { ReactNode } from "react";

export function Flash({ msg, err }: { msg?: string; err?: string }) {
  if (!msg && !err) return null;
  return <div className={`ad-flash${err ? " is-err" : ""}`}>{err || msg}</div>;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`ad-badge ${status}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export function F({
  label,
  name,
  defaultValue,
  type = "text",
  hint,
  children,
  ...rest
}: {
  label: string;
  name?: string;
  defaultValue?: string | number | null;
  type?: string;
  hint?: string;
  children?: ReactNode;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string | number;
  max?: string | number;
  inputMode?: "text" | "decimal" | "numeric" | "email" | "tel";
}) {
  return (
    <div className="ad-f">
      <label htmlFor={name}>{label}</label>
      {children ?? (
        <input id={name} name={name} type={type} defaultValue={defaultValue === null || defaultValue === undefined ? "" : String(defaultValue)} {...rest} />
      )}
      {hint && <small>{hint}</small>}
    </div>
  );
}

export const centsToInput = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? "" : (cents / 100).toFixed(2).replace(/\.00$/, "");
