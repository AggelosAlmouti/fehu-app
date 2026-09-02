"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "Is Fehu free to use?",
    a: "Yes, Fehu is currently free to use.",
  },
  {
    q: "Is my data private?",
    a: "Your data is stored under your own account and only accessible to you — nothing is shared with other users.",
  },
  {
    q: "Does it work offline?",
    a: "Yes. You can log expenses with no connection; they queue locally and sync automatically once you're back online.",
  },
  {
    q: "Do I need to create a separate account?",
    a: "No — sign in with your existing Google account, nothing new to set up.",
  },
  {
    q: "Do I have to install it?",
    a: "No, Fehu works fine as a regular website. Installing it just gives you a home-screen icon and a faster launch.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-2xl px-5 pb-24 pt-8">
      <h2 className="mb-6 text-center text-2xl font-medium tracking-tight text-foreground">
        Frequently asked questions
      </h2>
      <div className="flex flex-col">
        {QUESTIONS.map(({ q, a }, i) => {
          const open = openIndex === i;
          return (
            <div key={q} className={i === QUESTIONS.length - 1 ? "" : "border-b border-border"}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 py-4 text-left"
              >
                <span className="text-sm font-medium text-foreground">{q}</span>
                <ChevronDown
                  className={`size-4 shrink-0 text-detail transition-transform ${open ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {open && <p className="pb-4 text-sm text-muted">{a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
