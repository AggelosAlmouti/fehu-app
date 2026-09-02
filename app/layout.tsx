import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/use-auth";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fehu",
  },
  icons: {
    apple: "/icons/launchericon-192x192.png",
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
        <ServiceWorkerRegistration />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
