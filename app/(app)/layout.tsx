import { AppShell } from "@/components/app-shell";
import { CurrencyProvider } from "@/lib/use-currency";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <AppShell>{children}</AppShell>
    </CurrencyProvider>
  );
}
