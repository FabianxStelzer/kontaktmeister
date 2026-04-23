import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Check,
  Mail,
  PlayCircle,
  FileDown,
  Users,
  BarChart3,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              K
            </div>
            <span className="text-lg font-semibold">Kontaktmeister</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground">
              Features
            </a>
            <a href="#workflow" className="text-muted-foreground hover:text-foreground">
              So funktioniert&apos;s
            </a>
            <a href="#dsgvo" className="text-muted-foreground hover:text-foreground">
              DSGVO
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Kostenlos testen</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container py-24 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          B2B-Outreach, der wirklich persoenlich wirkt
        </div>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Personalisierte Videos fuer jeden Kontakt.{" "}
          <span className="text-primary">Vollautomatisch.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Kontaktmeister erstellt fuer jede Person in deiner Kampagne ein individuelles HeyGen-Video
          samt eigener Landingpage und versendet alles per Mail oder personalisiertem Brief mit
          QR-Code.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/register">
              Jetzt starten <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#workflow">So funktioniert&apos;s</Link>
          </Button>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-600" />
            DSGVO-konform
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-600" />
            Server in Deutschland
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-600" />
            Multi-Tenant
          </div>
        </div>
      </section>

      <section id="features" className="container py-16">
        <h2 className="text-center text-3xl font-bold">Alles, was du fuer modernen Outreach brauchst</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Von der Kontakt-Liste bis zum Tracking der Conversion. Ein Tool, ein Workflow.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Kontakte & CSV-Import",
              desc: "Firmen und Ansprechpartner zentral verwalten, per CSV importieren oder manuell anlegen.",
            },
            {
              icon: PlayCircle,
              title: "HeyGen-Videos automatisch",
              desc: "Fuer jeden Kontakt ein individuelles Video mit personalisiertem Script.",
            },
            {
              icon: Sparkles,
              title: "Personalisierte Landingpages",
              desc: "Jeder Kontakt bekommt seine eigene Seite mit Video, Text und Buchungs-CTA.",
            },
            {
              icon: Mail,
              title: "E-Mail mit Tracking",
              desc: "Open-Rate, Klicks und Landingpage-Visits in Echtzeit sehen.",
            },
            {
              icon: FileDown,
              title: "PDF-Brief mit QR-Code",
              desc: "Lieber per Post? Ein Klick erzeugt einen personalisierten Brief mit QR-Code zur Landingpage.",
            },
            {
              icon: BarChart3,
              title: "Dashboard & KPIs",
              desc: "Alle Kampagnen, alle Metriken, alle Aktivitaeten auf einen Blick.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="bg-muted/40 py-16">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">In 4 Schritten zur Kampagne</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              { num: "1", title: "Kontakte importieren", desc: "CSV hochladen oder manuell anlegen." },
              { num: "2", title: "Kampagne anlegen", desc: "Video-Template, Script, Landingpage-Text." },
              { num: "3", title: "Automatisch erstellen", desc: "HeyGen rendert Videos, wir generieren Seiten." },
              { num: "4", title: "Versenden & Tracken", desc: "Per Mail oder Brief - mit vollem Tracking." },
            ].map((s) => (
              <div key={s.num} className="rounded-xl border bg-background p-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  {s.num}
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="dsgvo" className="container py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-green-600" />
            <h2 className="text-2xl font-bold">DSGVO von Anfang an mitgedacht</h2>
          </div>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-green-600" /> Hosting in Deutschland (Hetzner)
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-green-600" /> Jede Mail mit Opt-Out-Link +
              List-Unsubscribe-Header
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-green-600" /> AV-Vertrag verfuegbar
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-green-600" /> Keine Third-Party-Tracker auf
              Landingpages
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-green-600" /> Pro Workspace verschluesselte
              API-Keys (AES-256)
            </li>
          </ul>
        </div>
      </section>

      <section className="container py-16 text-center">
        <h2 className="text-3xl font-bold">Bereit, persoenlicher zu werden?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Lege deinen Workspace in zwei Minuten an und starte die erste Kampagne noch heute.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/register">
            Workspace anlegen <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div>&copy; {new Date().getFullYear()} Kontaktmeister</div>
          <nav className="flex gap-6">
            <Link href="/impressum">Impressum</Link>
            <Link href="/datenschutz">Datenschutz</Link>
            <Link href="/agb">AGB</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
