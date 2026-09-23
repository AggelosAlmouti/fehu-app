import { AppShell } from "@/components/layout/app-shell";
import { CurrencyProvider } from "@/lib/use-currency";
import { InstallProvider } from "@/lib/use-install-prompt";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <InstallProvider>
        <AppShell>{children}</AppShell>
      </InstallProvider>
    </CurrencyProvider>
  );
}
