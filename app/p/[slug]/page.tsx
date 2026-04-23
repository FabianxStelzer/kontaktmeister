import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import { CookieBanner } from "@/components/public/cookie-banner";
import { VideoPlayer } from "@/components/public/video-player";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cc = await prisma.campaignContact.findUnique({
    where: { slug },
    include: { contact: true, campaign: true },
  });
  if (!cc) return { title: "Kontaktmeister" };

  const firstName = cc.contact.firstName;
  const title = `Persoenlich fuer ${firstName}`;
  const description = cc.landingpageText.slice(0, 160);
  return {
    title,
    description,
    robots: "noindex, nofollow",
    openGraph: {
      title,
      description,
      images: cc.videoThumbnail ? [{ url: cc.videoThumbnail }] : [],
    },
  };
}

export default async function LandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ utm_source?: string }>;
}) {
  const { slug } = await params;
  const { utm_source } = await searchParams;

  const cc = await prisma.campaignContact.findUnique({
    where: { slug },
    include: {
      contact: { include: { company: true } },
      campaign: { include: { workspace: true } },
    },
  });
  if (!cc) notFound();

  // Track Page-View (ohne await um Render nicht zu verzoegern)
  const hdrs = await headers();
  const fakeReq = {
    headers: hdrs,
  } as unknown as Request;
  trackEvent(cc.id, utm_source === "pdf-qr" ? "PDF_SCAN" : "PAGE_VIEW", fakeReq, {
    utm_source: utm_source ?? null,
  }).catch(() => undefined);

  const firstName = cc.contact.firstName;
  const lastName = cc.contact.lastName;
  const company = cc.contact.company?.name;
  const headline =
    cc.campaign.landingpageHeadline?.replace("{{firstName}}", firstName).replace("{{lastName}}", lastName) ??
    `Persoenlich fuer ${firstName}`;

  const workspaceName = cc.campaign.workspace.name;
  const ctaLabel = cc.campaign.ctaLabel ?? "Jetzt Termin buchen";
  const bookingUrl = cc.campaign.bookingUrl;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="text-sm font-medium text-muted-foreground">{workspaceName}</div>
          <div className="text-xs text-muted-foreground">
            Persoenliche Nachricht fuer {firstName} {lastName}
          </div>
        </div>
      </header>

      <section className="container max-w-3xl py-10">
        <h1 className="text-balance text-3xl font-bold md:text-4xl">{headline}</h1>
        {company && (
          <p className="mt-2 text-sm text-muted-foreground">
            Speziell vorbereitet fuer {company}
          </p>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-lg">
          <VideoPlayer
            slug={cc.slug}
            videoUrl={cc.videoUrl ?? undefined}
            thumbnail={cc.videoThumbnail ?? undefined}
            recipientName={firstName}
          />
        </div>

        <div className="mt-8 whitespace-pre-wrap rounded-xl border bg-card p-6 text-base leading-relaxed">
          {cc.landingpageText}
        </div>

        {bookingUrl && (
          <div className="mt-8 text-center">
            <Button size="lg" asChild>
              <a href={`/api/track/click?cc=${cc.id}&type=cta&url=${encodeURIComponent(bookingUrl)}`}>
                {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}

        <footer className="mt-16 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>
            Diese Seite wurde persoenlich fuer {firstName} {lastName} erstellt.
          </p>
          <p className="mt-1">
            <a href="/impressum" className="underline">Impressum</a>
            {" · "}
            <a href="/datenschutz" className="underline">Datenschutz</a>
            {" · "}
            <a href={`/api/unsubscribe/${cc.unsubscribeToken}`} className="underline">Abmelden</a>
          </p>
        </footer>
      </section>

      <CookieBanner />
    </main>
  );
}
