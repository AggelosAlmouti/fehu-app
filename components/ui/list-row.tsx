import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/button";

// Dividers come from the list (divide-y), so no row needs to know if it's last.
export function RowList({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <ul className={`flex flex-col divide-y-2 divide-border ${className}`}>
      {children}
    </ul>
  );
}

// Title (+ optional subtitle and right-aligned value) with edit/delete buttons.
export function ListRow({
  title,
  subtitle,
  value,
  gain = false,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  /** Gold value, for income. */
  gain?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-body text-foreground">{title}</div>
        {subtitle && <div className="text-caption">{subtitle}</div>}
      </div>
      {value && (
        <div
          className={`shrink-0 text-strong ${gain ? "text-accent" : "text-foreground"}`}
        >
          {value}
        </div>
      )}
      <IconButton icon={Pencil} label={`Edit ${title}`} onClick={onEdit} />
      <IconButton
        icon={Trash2}
        tone="danger"
        label={`Delete ${title}`}
        onClick={onDelete}
      />
    </li>
  );
}
