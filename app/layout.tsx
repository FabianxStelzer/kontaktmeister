import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
        {children}
      </body>
    </html>
  );
}
