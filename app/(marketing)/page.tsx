"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Smartphone,
  Sparkles,
  MonitorSmartphone,
  CloudOff,
  Zap,
  ChartLine,
  type LucideIcon,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Smartphone,
    title: "Progressive web app",
    description: "Install it on your home screen like a real app — no app store, no download.",
  },
  {
    icon: Sparkles,
    title: "Simplicity",
    description: "No fixed categories, no clutter — just the budgets and numbers that matter to you.",
  },
  {
    icon: MonitorSmartphone,
    title: "Sync in real time",
    description: "Log an expense on your phone, see it on your desktop a second later.",
  },
  {
    icon: CloudOff,
    title: "Works offline",
    description: "Log expenses with no connection — they sync automatically once you're back online.",
  },
  {
    icon: Zap,
    title: "Low friction",
    description: "Add an expense in seconds — a big number pad and nothing else in your way.",
  },
  {
    icon: ChartLine,
    title: "Real insights",
    description: "See spend versus income over time and which budgets your money actually goes to.",
  },
];

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
    q: "What is a PWA?",
    a: "A Progressive Web App — a website that installs and runs like a real app. It syncs your data in real time between your phone and desktop, without going through an app store.",
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

export default function LandingPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <main className="min-h-dvh">
      <section className="mx-auto flex max-w-2xl flex-col items-center px-5 pb-16 pt-20 text-center md:pt-28">
        <Wordmark className="mb-8 text-2xl" />
        <h1 className="text-balance text-4xl font-medium tracking-tight text-foreground md:text-5xl">
          Finally a budget app that doesn't suck...
        </h1>
        <p className="mt-4 max-w-md text-pretty text-sm text-muted md:text-base">
          Fehu is a clutter-free budget tracker. Just add your budgets and log
          your expenses. Track them. <br />
          That's it.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 rounded-full bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Get the app
        </Link>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="mb-8 text-center text-2xl font-medium tracking-tight text-foreground">
          What can Fehu do for you?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-card">
                <Icon className="size-5 text-accent" aria-hidden="true" />
              </div>
              <h3 className="mb-1 text-sm font-medium text-foreground">{title}</h3>
              <p className="text-sm text-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>

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
    </main>
  );
}
