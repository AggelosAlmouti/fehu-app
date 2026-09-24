import type { Metadata } from "next";
import { OWNER } from "@/components/marketing/owner";

export const metadata: Metadata = {
  title: "Contact · Fehu",
};

export default function ContactPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 pb-16 pt-16 md:pt-32">
      <h1 className="text-hero text-foreground">
        Hi, I&apos;m {OWNER.name.split(" ")[0]} 👋
      </h1>
      <p className="mt-4 text-body text-foreground">
        Fehu is a one-person project, so questions, bug reports and ideas all
        come straight to me. Email is the best way to reach me.
      </p>

      <h2 className="mb-3 mt-10 text-strong text-foreground">Contact information</h2>
      <dl className="flex flex-col gap-3">
        <div>
          <dt className="text-label">Name</dt>
          <dd className="text-body text-foreground">{OWNER.name}</dd>
        </div>
        <div>
          <dt className="text-label">Email</dt>
          <dd className="text-body text-foreground">{OWNER.email}</dd>
        </div>
        <div>
          <dt className="text-label">Location</dt>
          <dd className="text-body text-foreground">{OWNER.location}</dd>
        </div>
      </dl>
    </article>
  );
}
