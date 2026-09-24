import { SiteChrome } from "@/components/marketing/site-chrome";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
