"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_NAME_LENGTH,
  nameTaken,
  type IncomeSource,
  type NewIncomeSource,
} from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";

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
  }, [open, editing]);

  const trimmedName = name.trim();
  const duplicate = nameTaken(sources, trimmedName, editing?.id);
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
    <Sheet open={open} onClose={onClose} title={heading} maxWidth="max-w-sm" initialFocus={nameRef}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field
          label="Name"
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Freelance"
          maxLength={MAX_NAME_LENGTH}
          error={duplicate ? `You already have an income source named "${trimmedName}".` : undefined}
        />

        <Button type="submit" variant="solid" size="block" className="mt-1" disabled={!valid}>
          {editing ? "Save changes" : "Add income source"}
        </Button>
      </form>
    </Sheet>
  );
}
