"use client";

import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { useAuth } from "@/lib/use-auth";

export function Hero() {
  const { user } = useAuth();

  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-5 pb-16 pt-20 text-center md:pt-28">
      <Wordmark className="mb-8 text-2xl" />
      <h1 className="text-balance text-4xl font-medium tracking-tight text-foreground md:text-5xl">
        Track spending and budgets, without the noise.
      </h1>
      <p className="mt-4 max-w-md text-pretty text-sm text-muted md:text-base">
        Fehu is a personal finance tracker built around your own budgets — no
        fixed categories, no clutter, just where your money actually goes.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-full bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        {user ? "Open Fehu" : "Get started"}
      </Link>
    </section>
  );
}
