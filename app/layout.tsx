import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/session-provider";

export const metadata: Metadata = {
  title: {
    default: "Kontaktmeister",
    template: "%s | Kontaktmeister",
  },
  description:
    "Automatisiertes B2B-Outreach mit personalisierten Videos fuer Agenturen und Dienstleister.",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
