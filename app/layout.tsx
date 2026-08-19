import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/lib/use-auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#141414",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Fehu",
  description: "Personal finance tracker",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fehu",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} bg-background`}>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
