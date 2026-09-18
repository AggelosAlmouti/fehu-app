"use client";

import { useEffect, useRef, useState } from "react";
import type { IncomeSource } from "@/lib/data";
import type { NewIncomeSource } from "@/lib/use-income-sources";
import { Button } from "@/components/button";
import { Sheet } from "@/components/sheet";
import { SheetHeader } from "@/components/sheet-header";

const MAX_NAME_LENGTH = 30;

export function AddIncomeSourceSheet({
  open,
  editing,
  sources,
  onClose,
  onAdd,
  onUpdate,
}: {
  open: boolean;
  /** Income source being edited, or null when adding a new one. */
  editing: IncomeSource | null;
  /** Existing sources, checked against the name field for duplicates. */
  sources: IncomeSource[];
  onClose: () => void;
  onAdd: (source: NewIncomeSource) => void;
  onUpdate: (id: string, patch: NewIncomeSource) => void;
}) {
  const [name, setName] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(editing ? editing.name : "");
    const t = setTimeout(() => nameRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open, editing]);

  const trimmedName = name.trim();
  const duplicate = sources.some(
    (s) =>
      s.id !== editing?.id && s.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  const valid = trimmedName.length > 0 && !duplicate;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const payload: NewIncomeSource = { name: trimmedName };
    if (editing) onUpdate(editing.id, payload);
    else onAdd(payload);
    onClose();
  }

  const heading = editing ? "Edit income source" : "Add income source";

  return (
    <Sheet open={open} onClose={onClose} ariaLabel={heading} maxWidth="max-w-sm">
      <SheetHeader title={heading} onClose={onClose} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="income-source-name"
            className="mb-1.5 block text-label"
          >
            Name
          </label>
          <input
            id="income-source-name"
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Freelance"
            maxLength={MAX_NAME_LENGTH}
            className="input-field"
          />
          {duplicate && (
            <p className="mt-1.5 text-base text-danger">
              You already have an income source named "{trimmedName}".
            </p>
          )}
        </div>

        <Button type="submit" variant="solid" size="block" className="mt-1" disabled={!valid}>
          {editing ? "Save changes" : "Add income source"}
        </Button>
      </form>
    </Sheet>
  );
}
