"use client"

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { categories, type CategoryId } from "@/lib/data"

export type NewExpense = {
  title: string
  amount: number
  category: CategoryId
}

export function AddExpenseSheet({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (expense: NewExpense) => void
}) {
  const [amount, setAmount] = useState("")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<CategoryId>("food")
  const amountRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setAmount("")
      setTitle("")
      setCategory("food")
      // Focus the amount field after the sheet animates in.
      const t = setTimeout(() => amountRef.current?.focus(), 120)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const parsed = Number.parseFloat(amount)
  const valid = title.trim().length > 0 && Number.isFinite(parsed) && parsed > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    onAdd({ title: title.trim(), amount: parsed, category })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fehu-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add expense"
        className="fehu-slide-up relative w-full max-w-md rounded-t-3xl border border-border bg-surface px-5 pb-8 pt-5 sm:rounded-3xl sm:pb-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong sm:hidden" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-medium">Add expense</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-medium text-detail">&euro;</span>
              <input
                ref={amountRef}
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                }
                aria-label="Amount"
                className="w-40 bg-transparent text-center text-4xl font-medium text-foreground outline-none placeholder:text-border-strong"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="expense-title"
              className="mb-1.5 block text-xs text-detail"
            >
              Description
            </label>
            <input
              id="expense-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Corner cafe"
              className="w-full rounded-[var(--radius-card)] border border-border bg-card px-3.5 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-border-strong"
            />
          </div>

          <div>
            <span className="mb-2 block text-xs text-detail">Category</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = c.id === category
                const Icon = c.icon
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    aria-pressed={active}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      active
                        ? "border-accent bg-accent text-background"
                        : "border-border-strong text-detail hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={!valid}
            className="mt-1 w-full rounded-full bg-accent py-3.5 text-sm font-medium text-background transition-opacity disabled:opacity-40"
          >
            Add expense
          </button>
        </form>
      </div>
    </div>
  )
}
