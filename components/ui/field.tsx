import { useId, type ComponentProps, type ReactNode } from "react";

// Labelled text input with an optional error line — the app's one form field.
export function Field({
  label,
  error,
  className = "",
  ...props
}: ComponentProps<"input"> & { label: ReactNode; error?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-label">
        {label}
      </label>
      <input id={id} className={`input-field ${className}`} {...props} />
      {error && <p className="mt-1.5 text-body text-danger">{error}</p>}
    </div>
  );
}
