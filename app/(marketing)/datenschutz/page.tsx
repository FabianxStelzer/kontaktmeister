export default function DatenschutzPage() {
  return (
    <main className="container max-w-3xl py-16">
      <h1 className="text-3xl font-bold">Datenschutzerklaerung</h1>
      <p className="mt-4 text-muted-foreground">
        Diese Datenschutzerklaerung informiert Sie ueber Art, Umfang und Zweck der Verarbeitung
        personenbezogener Daten auf dieser Plattform.
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">1. Verantwortlicher</h2>
          <p>Siehe Impressum.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">2. Hosting</h2>
          <p>
            Die Plattform wird auf Servern der Hetzner Online GmbH in Deutschland gehostet.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">3. Tracking auf Landingpages</h2>
          <p>
            Wir setzen keine Third-Party-Tracker ein. Fuer die Messung des Erfolgs unserer
            Kampagnen verwenden wir ausschliesslich selbst-gehostete, pseudonymisierte
            Tracking-Mechanismen (Tracking-Pixel, Click-Redirect). Gespeichert werden dabei
            anonymisierte IP-Adresse, User-Agent und Zeitstempel.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">4. E-Mails</h2>
          <p>
            Jede versandte Mail enthaelt einen Unsubscribe-Link sowie einen
            List-Unsubscribe-Header. Nach Widerspruch werden keine weiteren Mails versendet.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">5. Auftragsverarbeitung</h2>
          <p>
            Wenn Sie Kontaktmeister als Kunde nutzen und personenbezogene Daten Ihrer
            Kontakte verarbeiten lassen, schliessen wir mit Ihnen einen
            Auftragsverarbeitungsvertrag nach Art. 28 DSGVO ab.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">6. Ihre Rechte</h2>
          <p>
            Sie haben das Recht auf Auskunft, Berichtigung, Loeschung, Einschraenkung der
            Verarbeitung, Datenuebertragbarkeit und Widerspruch.
          </p>
        </section>
      </div>
    </main>
  );
}
