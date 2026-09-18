"use client";

import { IconButton } from "@/components/icon-button";
import { X } from "lucide-react";

export function SheetHeader({
  title,
  onClose,
  capitalize = false,
}: {
  title: string;
  onClose: () => void;
  capitalize?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className={`text-base font-medium${capitalize ? " capitalize" : ""}`}>
        {title}
      </h2>
      <IconButton icon={X} label="Close" onClick={onClose} />
    </div>
  );
}
