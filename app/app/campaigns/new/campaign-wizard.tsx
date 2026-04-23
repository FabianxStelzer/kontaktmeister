"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { createCampaign } from "../actions";
import { SendMode } from "@prisma/client";

type ContactOpt = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  companyName: string | null;
  position: string | null;
};

const STEP_LABELS = ["Basics", "Kontakte", "Video", "Landingpage & Mail", "Zusammenfassung"];

export function CampaignWizard({ contacts }: { contacts: ContactOpt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    heygenTemplateId: string;
    heygenAvatarId: string;
    heygenVoiceId: string;
    scriptTemplate: string;
    landingpageHeadline: string;
    landingpageTextTpl: string;
    emailSubjectTpl: string;
    emailBodyTpl: string;
    bookingUrl: string;
    ctaLabel: string;
    sendMode: SendMode;
  }>({
    name: "",
    description: "",
    heygenTemplateId: "",
    heygenAvatarId: "",
    heygenVoiceId: "",
    scriptTemplate:
      "Hallo {{firstName}}, ich hoffe bei {{company}} laeuft alles gut. Ich habe eine Idee fuer dich - schau dir kurz das Video an.",
    landingpageHeadline: "Persoenlich fuer {{firstName}}",
    landingpageTextTpl:
      "Hallo {{firstName}},\n\nschoen dass du hier bist. Schau dir das Video an und lass uns sprechen.",
    emailSubjectTpl: "{{firstName}}, kurze Idee fuer {{company}}",
    emailBodyTpl:
      "Hallo {{firstName}},\n\nich habe ein kurzes Video fuer dich aufgenommen:\n{{landingpageUrl}}\n\nViele Gruesse",
    bookingUrl: "",
    ctaLabel: "Jetzt Termin buchen",
    sendMode: SendMode.EMAIL,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    start(async () => {
      try {
        const id = await createCampaign({ ...form, contactIds: Array.from(selected) });
        router.push(`/app/campaigns/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unbekannter Fehler");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Kampagnen-Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="z.B. Q2-Outreach Agenturen DACH"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Kurzbeschreibung</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Versandart</Label>
            <Select value={form.sendMode} onValueChange={(v) => update("sendMode", v as SendMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SendMode.EMAIL}>Nur E-Mail</SelectItem>
                <SelectItem value={SendMode.PDF}>Nur PDF-Brief (mit QR)</SelectItem>
                <SelectItem value={SendMode.BOTH}>E-Mail + PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selected.size} / {contacts.length} ausgewaehlt
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelected(new Set(contacts.map((c) => c.id)))}>
                Alle
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
                Keine
              </Button>
            </div>
          </div>
          <div className="max-h-[480px] overflow-auto rounded-md border">
            {contacts.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Keine Kontakte vorhanden. Lege zunaechst welche an oder importiere eine CSV.
              </div>
            )}
            {contacts.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 border-b p-3 hover:bg-accent"
              >
                <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} />
                <div className="flex-1">
                  <div className="font-medium">
                    {c.firstName} {c.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.email ?? "keine E-Mail"} &middot; {c.companyName ?? "keine Firma"}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-md border bg-accent/30 p-4 text-sm">
            <p className="font-medium">HeyGen-Konfiguration</p>
            <p className="mt-1 text-muted-foreground">
              Entweder eine Template-ID angeben <em>oder</em> Avatar- + Voice-ID.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="heygenTemplateId">HeyGen Template-ID</Label>
            <Input
              id="heygenTemplateId"
              value={form.heygenTemplateId}
              onChange={(e) => update("heygenTemplateId", e.target.value)}
              placeholder="z.B. 1234567890abcdef"
            />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="heygenAvatarId">Avatar-ID</Label>
              <Input
                id="heygenAvatarId"
                value={form.heygenAvatarId}
                onChange={(e) => update("heygenAvatarId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heygenVoiceId">Voice-ID</Label>
              <Input
                id="heygenVoiceId"
                value={form.heygenVoiceId}
                onChange={(e) => update("heygenVoiceId", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scriptTemplate">Script-Template *</Label>
            <Textarea
              id="scriptTemplate"
              rows={6}
              value={form.scriptTemplate}
              onChange={(e) => update("scriptTemplate", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              <Sparkles className="mr-1 inline h-3 w-3" />
              Platzhalter: &#123;&#123;firstName&#125;&#125;, &#123;&#123;lastName&#125;&#125;,
              &#123;&#123;company&#125;&#125;, &#123;&#123;position&#125;&#125;
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="landingpageHeadline">Landingpage-Headline</Label>
            <Input
              id="landingpageHeadline"
              value={form.landingpageHeadline}
              onChange={(e) => update("landingpageHeadline", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="landingpageTextTpl">Landingpage-Text *</Label>
            <Textarea
              id="landingpageTextTpl"
              rows={5}
              value={form.landingpageTextTpl}
              onChange={(e) => update("landingpageTextTpl", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bookingUrl">Buchungs-URL (CTA)</Label>
              <Input
                id="bookingUrl"
                value={form.bookingUrl}
                onChange={(e) => update("bookingUrl", e.target.value)}
                placeholder="https://cal.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaLabel">CTA-Button-Text</Label>
              <Input
                id="ctaLabel"
                value={form.ctaLabel}
                onChange={(e) => update("ctaLabel", e.target.value)}
              />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="emailSubjectTpl">E-Mail-Betreff *</Label>
            <Input
              id="emailSubjectTpl"
              value={form.emailSubjectTpl}
              onChange={(e) => update("emailSubjectTpl", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailBodyTpl">E-Mail-Body *</Label>
            <Textarea
              id="emailBodyTpl"
              rows={7}
              value={form.emailBodyTpl}
              onChange={(e) => update("emailBodyTpl", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Tipp: &#123;&#123;landingpageUrl&#125;&#125; einfuegen, damit der Empfaenger zur
              persoenlichen Seite gelangt.
            </p>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <div className="rounded-md border p-4">
            <h3 className="font-semibold">{form.name || "(ohne Namen)"}</h3>
            <p className="text-sm text-muted-foreground">{form.description || "—"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">Kontakte</div>
              <div className="font-semibold">{selected.size}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">Versandart</div>
              <div className="font-semibold">{form.sendMode}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">HeyGen-Template</div>
              <div className="font-mono text-xs">{form.heygenTemplateId || "—"}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">CTA</div>
              <div className="text-xs">{form.bookingUrl || "—"}</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Nach dem Anlegen kannst du die Kampagne auf der Detailseite starten. Dann werden die
            Videos per HeyGen erstellt und anschliessend die Mails/PDFs versendet.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || pending}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurueck
        </Button>
        {step < STEP_LABELS.length - 1 ? (
          <Button
            onClick={() => {
              if (step === 0 && !form.name) return setError("Bitte einen Namen angeben");
              if (step === 1 && selected.size === 0) return setError("Bitte mindestens einen Kontakt waehlen");
              setError(null);
              setStep((s) => s + 1);
            }}
          >
            Weiter <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={pending || selected.size === 0}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Kampagne anlegen
          </Button>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`hidden whitespace-nowrap text-sm md:inline ${
              i <= step ? "font-medium" : "text-muted-foreground"
            }`}
          >
            {label}
          </span>
          {i < STEP_LABELS.length - 1 && <div className="h-px flex-1 bg-border" />}
        </div>
      ))}
    </div>
  );
}
