"use client";

import { useState, useTransition } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { importContacts, type ImportRow } from "../actions";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

const FIELDS = [
  { key: "firstName", label: "Vorname", required: true },
  { key: "lastName", label: "Nachname", required: true },
  { key: "email", label: "E-Mail", required: false },
  { key: "phone", label: "Telefon", required: false },
  { key: "position", label: "Position", required: false },
  { key: "salutation", label: "Anrede", required: false },
  { key: "companyName", label: "Firmenname", required: false },
  { key: "__skip__", label: "— ignorieren —", required: false },
] as const;

type Mapping = Record<string, string>;

function guessFieldFor(header: string): string {
  const h = header.toLowerCase().replace(/\s|_/g, "");
  if (/(vorname|firstname|first)/.test(h)) return "firstName";
  if (/(nachname|lastname|last|surname)/.test(h)) return "lastName";
  if (/(mail|email)/.test(h)) return "email";
  if (/(phone|tel|mobil)/.test(h)) return "phone";
  if (/(position|title|rolle|role)/.test(h)) return "position";
  if (/(anrede|salutation)/.test(h)) return "salutation";
  if (/(firma|company|unternehm)/.test(h)) return "companyName";
  return "__skip__";
}

export function ImportWizard() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState<"upload" | "map" | "result">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  function onFile(file: File) {
    setError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors.length) {
          setError("Fehler beim Lesen: " + res.errors[0].message);
          return;
        }
        const hdr = res.meta.fields ?? [];
        const initial: Mapping = {};
        for (const h of hdr) initial[h] = guessFieldFor(h);
        setHeaders(hdr);
        setRows(res.data);
        setMapping(initial);
        setStep("map");
      },
      error: (err) => setError(err.message),
    });
  }

  function onImport() {
    const firstNameCol = headers.find((h) => mapping[h] === "firstName");
    const lastNameCol = headers.find((h) => mapping[h] === "lastName");
    if (!firstNameCol || !lastNameCol) {
      setError("Vorname und Nachname muessen zugeordnet werden.");
      return;
    }
    const importRows: ImportRow[] = rows.map((r) => {
      const out: Record<string, string> = {};
      for (const [col, field] of Object.entries(mapping)) {
        if (field === "__skip__") continue;
        const val = (r[col] ?? "").trim();
        if (val) out[field] = val;
      }
      return out as ImportRow;
    });

    start(async () => {
      const res = await importContacts(importRows);
      setResult(res);
      setStep("result");
    });
  }

  if (step === "upload") {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <Upload className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            CSV-Datei auswaehlen - UTF-8, mit Kopfzeile, komma- oder semikolongetrennt.
          </p>
          <Input
            type="file"
            accept=".csv,text/csv"
            className="mx-auto mt-4 max-w-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="rounded-md bg-muted p-4 text-sm">
          <p className="font-medium">Beispiel-Format</p>
          <pre className="mt-2 overflow-x-auto text-xs">{`vorname,nachname,email,firma,position
Anna,Schmidt,anna@firma.de,Musterfirma,Marketing Leitung`}</pre>
        </div>
      </div>
    );
  }

  if (step === "map") {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {rows.length} Datensaetze erkannt. Ordne die Spalten deinen Feldern zu.
        </p>
        <div className="space-y-3">
          {headers.map((h) => (
            <div key={h} className="grid grid-cols-2 items-center gap-4">
              <Label className="truncate">
                <span className="font-medium">{h}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  z.B. {rows[0]?.[h]?.slice(0, 30)}
                </span>
              </Label>
              <Select
                value={mapping[h] ?? "__skip__"}
                onValueChange={(v) => setMapping({ ...mapping, [h]: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELDS.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.label}
                      {f.required && " *"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setStep("upload")}>Zurueck</Button>
          <Button onClick={onImport} disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {rows.length} Kontakte importieren
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-green-50 p-6 text-center dark:bg-green-950">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <p className="mt-4 text-lg font-semibold">Import abgeschlossen</p>
        <p className="text-sm text-muted-foreground">
          {result?.created} neu angelegt &middot; {result?.skipped} Duplikate uebersprungen
        </p>
      </div>
      {result?.errors && result.errors.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <p className="font-medium">Fehler ({result.errors.length}):</p>
          <ul className="mt-2 list-disc pl-5">
            {result.errors.slice(0, 20).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => { setStep("upload"); setResult(null); }}>
          Weitere Datei importieren
        </Button>
        <Button onClick={() => router.push("/app/contacts")}>Zu den Kontakten</Button>
      </div>
    </div>
  );
}
