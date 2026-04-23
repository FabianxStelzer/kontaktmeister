import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportWizard } from "./import-wizard";

export const metadata = { title: "CSV-Import" };

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Kontakte per CSV importieren</CardTitle>
          <CardDescription>
            Lade eine CSV-Datei hoch und ordne die Spalten den Feldern zu. Duplikate (nach E-Mail)
            werden automatisch uebersprungen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportWizard />
        </CardContent>
      </Card>
    </div>
  );
}
