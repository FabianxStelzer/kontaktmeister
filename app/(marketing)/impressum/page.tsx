export default function ImpressumPage() {
  return (
    <main className="container max-w-3xl py-16">
      <h1 className="text-3xl font-bold">Impressum</h1>
      <p className="mt-4 text-muted-foreground">
        Angaben gemaess &sect; 5 TMG. Bitte in den Workspace-Einstellungen des Betreibers
        individualisieren.
      </p>
      <div className="mt-8 space-y-4 text-sm">
        <section>
          <h2 className="font-semibold">Anbieter</h2>
          <p>
            Kontaktmeister
            <br />
            Musterstrasse 1<br />
            12345 Musterstadt
            <br />
            Deutschland
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Kontakt</h2>
          <p>
            E-Mail: info@kontaktmeister.de
            <br />
            Telefon: +49 (0)xxx xxxxxx
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Verantwortlich i.S.d. &sect; 55 Abs. 2 RStV</h2>
          <p>Fabian Stelzer</p>
        </section>
      </div>
    </main>
  );
}
