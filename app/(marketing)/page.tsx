"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Smartphone,
  Sparkles,
  MonitorSmartphone,
  CloudOff,
  Zap,
  ChartLine,
  type LucideIcon,
} from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { RowList } from "@/components/ui/list-row";

// Device mockups — the phone frame is part of each image.
const SCREENSHOTS = [
  { src: "/screenshots/dashboard.png", caption: "Your month at a glance" },
  { src: "/screenshots/input.png", caption: "Log it in seconds" },
  { src: "/screenshots/insights.png", caption: "See where it all goes" },
];

// Ordered from most to least important.
const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Sparkles,
    title: "Simplicity",
    description: "Just your budgets and your numbers. Nothing else on screen.",
  },
  {
    icon: MonitorSmartphone,
    title: "Sync in real time",
    description: "Log from your phone or your desktop. Everything syncs instantly.",
  },
  {
    icon: Zap,
    title: "Fast to log",
    description: "From pocket to entry in seconds.",
  },
  {
    icon: ChartLine,
    title: "Real insights",
    description: "Spending, income, and your biggest budgets over time.",
  },
  {
    icon: CloudOff,
    title: "Works offline",
    description: "Log without a connection. Syncs when you're back online.",
  },
  {
    icon: Smartphone,
    title: "Install it like an app",
    description: "Installs from your browser. No app store needed.",
  },
];

const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "Does it connect to my bank?",
    a: "No. Fehu never asks for your bank login or card details; you enter everything yourself. It only takes a few seconds per expense, and typing it in is part of the point: you notice what you spend.",
  },
  {
    q: "Who can see my data?",
    a: "Your data is tied to your own account, and no other user can see it. If you delete your account from Settings, all of your data goes with it.",
  },
  {
    q: "Do I need to create an account?",
    a: "No new one. You sign in with your existing Google account, so there's no password to create or remember.",
  },
  {
    q: "Do I have to install it?",
    a: "No. Fehu works in any browser, on your phone or your computer. If you use it often, you can install it from the browser: it gets its own icon and opens in its own window like a regular app, with no app store involved.",
  },
  {
    q: "Will I need Fehu forever?",
    a: "Hopefully not. Think of it as training wheels. Log your spending for a while, see where your money actually goes, and the habits start to stick. Once they do, you won't need an app to tell you.",
  },
  {
    q: 'Why "Fehu"?',
    a: "Fehu (ᚠ) is the first rune of the Norse alphabet, and it means cattle. For the old Norse and Germanic peoples, cattle were wealth: you counted what you owned in livestock, and the same word came to mean both. The Old English rune poem adds a warning: wealth is a comfort to everyone, but it's meant to be shared freely, not hoarded.",
  },
];

const FREE_PLAN = [
  "Unlimited budgets and transactions",
  "Income tracking and insights",
  "Sync across all your devices",
  "Works offline",
];

// Fades and slides its content in the first time it scrolls into view.
function Reveal({
  delay = 0,
  className = "",
  children,
}: {
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition duration-(--motion-reveal) ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function Section({
  id,
  title,
  width = "max-w-3xl",
  children,
}: {
  id: string;
  title: string;
  width?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`mx-auto ${width} scroll-mt-20 px-5 py-16 md:scroll-mt-8`}>
      <Reveal>
        <h2 className="mb-8 text-center text-hero text-foreground">{title}</h2>
      </Reveal>
      {children}
    </section>
  );
}

export default function LandingPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <section className="mx-auto flex max-w-2xl flex-col items-center px-5 pb-16 pt-16 text-center md:pt-32">
        <h1 className="text-balance text-4xl font-medium tracking-tight text-foreground md:text-5xl">
          Just a budget app.
        </h1>
        <p className="mt-4 max-w-md text-pretty text-caption">
          Fehu is a clutter-free budget tracker. Just add your budgets and log
          your expenses. <br />
          That's it.
        </p>
        <Link
          href="/dashboard"
          className={buttonClass({ variant: "solid", className: "mt-8" })}
        >
          Get started
        </Link>
      </section>

      <Section id="preview" title="Take a look" width="max-w-3xl">
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {SCREENSHOTS.map(({ src, caption }, i) => (
            <Reveal key={src} delay={i * 100} className="w-1/2 shrink-0 snap-center sm:w-auto">
              <figure>
                <img
                  src={src}
                  alt={caption}
                  width={450}
                  height={920}
                  loading="lazy"
                  className="h-auto w-full"
                />
                <figcaption className="mt-3 text-center text-caption">{caption}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="features" title="Features">
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title} delay={(i % 2) * 100} className="card-box p-5">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-card">
                <Icon className="size-5 text-accent" aria-hidden="true" />
              </div>
              <h3 className="mb-1 text-strong text-foreground">{title}</h3>
              <p className="text-caption">{description}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="faq" title="Frequently asked questions" width="max-w-2xl">
        <Reveal>
          <RowList>
            {QUESTIONS.map(({ q, a }, i) => {
              const open = openIndex === i;
              return (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 py-4 text-left"
                  >
                    <span className="text-strong text-foreground">{q}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-detail transition-transform ${open ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {open && <p className="pb-4 text-caption">{a}</p>}
                </li>
              );
            })}
          </RowList>
        </Reveal>
      </Section>

      <Section id="pricing" title="Pricing">
        <div className="grid gap-4 sm:grid-cols-3">
          <Reveal className="card-box p-5">
            <h3 className="mb-1 text-strong text-foreground">Free Beta</h3>
            <p className="mb-4 text-caption">Available now</p>
            <ul className="flex flex-col gap-2">
              {FREE_PLAN.map((item) => (
                <li key={item} className="flex gap-2 text-caption">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          {["Monthly", "One-time"].map((plan, i) => (
            <Reveal key={plan} delay={(i + 1) * 100} className="card-box p-5">
              <h3 className="mb-1 text-strong text-foreground">{plan}</h3>
              <p className="text-caption">Coming soon</p>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
