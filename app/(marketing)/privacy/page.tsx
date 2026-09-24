import type { Metadata } from "next";
import type { ReactNode } from "react";
import { OWNER } from "@/components/marketing/owner";
import { TextLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy policy · Fehu",
};

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-strong text-foreground">{title}</h2>
      <div className="flex flex-col gap-3 text-body text-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 pb-16 pt-16 md:pt-32">
      <h1 className="text-hero text-foreground">Privacy policy</h1>
      <p className="mt-2 text-caption">
        Last updated September 24, 2026. This date changes whenever the policy does.
      </p>

      <Part title="Who's responsible">
        <p>
          {OWNER.name} runs Fehu and is responsible for your data under the
          GDPR. For any privacy question or request, use the details on the{" "}
          <TextLink href="/contact">contact page</TextLink>.
        </p>
      </Part>

      <Part title="What Fehu stores">
        <p>
          Your basic Google profile (name, email address, profile picture and
          account ID) when you sign in, and whatever you enter yourself: budgets,
          income sources, transactions and your currency setting. Fehu never sees
          your Google password, bank details or card details. This data is
          processed to provide the app to you (Art. 6(1)(b) GDPR); you can&apos;t
          use Fehu without it.
        </p>
      </Part>

      <Part title="Where it's stored and who can see it">
        <p>
          Your data is stored with Google Firebase and encrypted in transit and
          at rest; Google may process it outside the EU, including in the United
          States, under the EU–US Data Privacy Framework and standard contractual
          clauses. The server that delivers the app may briefly log technical
          details such as your IP address, to keep it secure (legitimate
          interest, Art. 6(1)(f) GDPR).
        </p>
        <p>
          No other user can see your data. As the operator, I can technically
          access it to keep the service running. It&apos;s never sold, and Fehu has
          no ads, no analytics and no tracking cookies.
        </p>
      </Part>

      <Part title="On your device">
        <p>
          Your browser keeps your session, an offline copy of your data and the
          last signed-in account, and Google&apos;s sign-in may set its own cookies.
          Clearing your browser&apos;s site data removes all of it.
        </p>
      </Part>

      <Part title="Deletion and your rights">
        <p>
          Your data is kept until you delete your account in Settings, which
          permanently removes it. You can also revoke Fehu&apos;s access from your
          Google Account settings.
        </p>
        <p>
          Under the GDPR you can request access to your data, a portable copy,
          its correction or deletion, and you can restrict or object to its
          processing. You can also complain to your data protection authority.
        </p>
      </Part>
    </article>
  );
}
