import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/session-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://app.kontaktmeister.de",
  ),
  title: {
    default: "Kontaktmeister",
    template: "%s | Kontaktmeister",
  },
  description:
    "Automatisiertes B2B-Outreach mit personalisierten Videos fuer Agenturen und Dienstleister.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
